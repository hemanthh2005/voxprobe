import http from 'http';
import { getOpenApiSpec, validateResponseAgainstContract, ValidationResult } from './openapiValidator';
import { generateRegressionTest, generateDebugReport } from './regressionBuilder';

// Strict internal allowlist of allowed diagnostic endpoint patterns
const ALLOWED_ENDPOINT_PATTERNS = [
  /^\/api\/orders\/[a-zA-Z0-9_-]+$/,
  /^\/api\/users\/[a-zA-Z0-9_-]+$/,
  /^\/api\/products\/[a-zA-Z0-9_-]+$/,
  /^\/api\/login$/
];

// In-memory store for last validated evidence per endpoint to support chained tool calls
const evidenceStore: Map<string, { validation: ValidationResult; regression?: any }> = new Map();

export interface ToolCallParams {
  name: string;
  args: any;
  call_id?: string;
}

export interface ToolExecutionResponse {
  tool: string;
  status: 'success' | 'error';
  call_id?: string;
  result: any;
  evidence_id?: string;
}

export async function executeTool(params: ToolCallParams): Promise<ToolExecutionResponse> {
  const { name, args, call_id } = params;

  try {
    switch (name) {
      case 'list_api_endpoints':
        return {
          tool: name,
          status: 'success',
          call_id,
          result: {
            endpoints: [
              { path: '/api/orders/ORD-1042', method: 'GET', description: 'Order ORD-1042 details' },
              { path: '/api/orders/ORD-1043', method: 'GET', description: 'Order ORD-1043 details' },
              { path: '/api/orders/ORD-1044', method: 'GET', description: 'Order ORD-1044 details' },
              { path: '/api/users/USR-1001', method: 'GET', description: 'User USR-1001 profile' },
              { path: '/api/users/USR-1002', method: 'GET', description: 'User USR-1002 profile' },
              { path: '/api/products/PROD-001', method: 'GET', description: 'Product PROD-001 details' },
              { path: '/api/login', method: 'POST', description: 'User authentication endpoint' }
            ]
          }
        };

      case 'inspect_contract': {
        const endpoint = args?.endpoint || '/api/orders/ORD-1042';
        const spec = getOpenApiSpec();
        return {
          tool: name,
          status: 'success',
          call_id,
          result: {
            endpoint,
            contract_spec: spec.paths['/api/orders/{id}'] || spec.paths[endpoint] || 'Contract defined'
          }
        };
      }

      case 'run_api_test': {
        const rawEndpoint = (args?.endpoint || '/api/orders/ORD-1042').trim();
        const method = (args?.method || 'GET').toUpperCase();

        // Security Check 1: Block external domain URLs or protocols
        if (rawEndpoint.startsWith('http://') || rawEndpoint.startsWith('https://') || rawEndpoint.startsWith('//')) {
          return {
            tool: name,
            status: 'error',
            call_id,
            result: {
              error: 'Security Violation: External URL execution blocked by VoxProbe sandbox rules.',
              allowed_endpoints: '/api/orders/*, /api/users/*, /api/products/*, /api/login'
            }
          };
        }

        // Standardize leading slash
        const endpoint = rawEndpoint.startsWith('/') ? rawEndpoint : `/${rawEndpoint}`;

        // Security Check 2: Validate against strict sandbox endpoint allowlist
        const isAllowed = ALLOWED_ENDPOINT_PATTERNS.some((pattern) => pattern.test(endpoint));
        if (!isAllowed) {
          return {
            tool: name,
            status: 'error',
            call_id,
            result: {
              error: `Security Violation: Endpoint '${endpoint}' is not in the allowed diagnostic sandbox list.`,
              allowed_patterns: ['/api/orders/:id', '/api/users/:id', '/api/products/:id', '/api/login']
            }
          };
        }

        // Security Check 3: Restrict HTTP methods to GET or POST
        if (method !== 'GET' && method !== 'POST') {
          return {
            tool: name,
            status: 'error',
            call_id,
            result: { error: `HTTP method '${method}' is not permitted for safe diagnostics.` }
          };
        }

        const startTime = Date.now();
        const evidenceId = `EV-${Math.floor(1000 + Math.random() * 9000)}`;

        // Internal HTTP Request to sandbox API
        const apiResponse = await makeInternalApiRequest(endpoint, method);
        const durationMs = Date.now() - startTime;

        // Auto-run OpenAPI validation
        const validation = validateResponseAgainstContract(
          endpoint,
          method,
          apiResponse.statusCode,
          apiResponse.body,
          evidenceId
        );

        // Store evidence in session map
        evidenceStore.set(endpoint, { validation });

        return {
          tool: name,
          status: 'success',
          call_id,
          evidence_id: evidenceId,
          result: {
            evidence_id: evidenceId,
            endpoint,
            method,
            status_code: apiResponse.statusCode,
            response_body: apiResponse.body,
            latency_ms: durationMs,
            contract_validation: {
              passed: validation.passed,
              mismatches: validation.mismatches,
              summary: validation.summary
            }
          }
        };
      }

      case 'validate_response': {
        const endpoint = (args?.endpoint || '/api/orders/ORD-1042').trim();
        const stored = evidenceStore.get(endpoint);

        if (stored) {
          return {
            tool: name,
            status: 'success',
            call_id,
            evidence_id: stored.validation.evidence_id,
            result: stored.validation
          };
        }

        // If not cached, execute test first
        const testRes = await executeTool({
          name: 'run_api_test',
          args: { endpoint },
          call_id
        });

        if (testRes.status === 'error') return testRes;

        const freshlyStored = evidenceStore.get(endpoint);
        return {
          tool: name,
          status: 'success',
          call_id,
          evidence_id: freshlyStored?.validation.evidence_id,
          result: freshlyStored?.validation
        };
      }

      case 'create_regression_test': {
        const endpoint = (args?.endpoint || '/api/orders/ORD-1042').trim();
        let stored = evidenceStore.get(endpoint);

        if (!stored) {
          // Execute test first
          await executeTool({ name: 'run_api_test', args: { endpoint }, call_id });
          stored = evidenceStore.get(endpoint);
        }

        if (!stored || !stored.validation) {
          return {
            tool: name,
            status: 'error',
            call_id,
            result: { error: `No contract evidence available for endpoint ${endpoint}` }
          };
        }

        const regression = generateRegressionTest(stored.validation);
        stored.regression = regression;

        return {
          tool: name,
          status: 'success',
          call_id,
          evidence_id: stored.validation.evidence_id,
          result: regression
        };
      }

      case 'create_debug_report': {
        const endpoint = (args?.endpoint || '/api/orders/ORD-1042').trim();
        let stored = evidenceStore.get(endpoint);

        if (!stored) {
          await executeTool({ name: 'run_api_test', args: { endpoint }, call_id });
          stored = evidenceStore.get(endpoint);
        }

        if (!stored || !stored.validation) {
          return {
            tool: name,
            status: 'error',
            call_id,
            result: { error: `No contract evidence found for endpoint ${endpoint}` }
          };
        }

        if (!stored.regression) {
          stored.regression = generateRegressionTest(stored.validation);
        }

        const debugReport = generateDebugReport(stored.validation, stored.regression);
        return {
          tool: name,
          status: 'success',
          call_id,
          evidence_id: stored.validation.evidence_id,
          result: debugReport
        };
      }

      default:
        return {
          tool: name,
          status: 'error',
          call_id,
          result: { error: `Unknown tool name: ${name}` }
        };
    }
  } catch (err: any) {
    return {
      tool: name,
      status: 'error',
      call_id,
      result: { error: err?.message || 'Tool execution failure' }
    };
  }
}

/**
 * Execute safe HTTP request against local sandbox Express port (3001)
 * Enforces 5-second timeout and 50KB response payload limit
 */
function makeInternalApiRequest(
  endpoint: string,
  method: string
): Promise<{ statusCode: number; body: any }> {
  return new Promise((resolve, reject) => {
    const port = process.env.PORT || 3001;
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path: endpoint,
        method,
        headers: {
          Accept: 'application/json'
        },
        timeout: 5000 // 5-second timeout
      },
      (res) => {
        let data = '';
        let dataSize = 0;

        res.on('data', (chunk) => {
          dataSize += chunk.length;
          // Enforce 50KB size cap
          if (dataSize > 50 * 1024) {
            req.destroy();
            return resolve({
              statusCode: 413,
              body: { error: 'Payload Size Limit Exceeded (50KB cap)' }
            });
          }
          data += chunk;
        });

        res.on('end', () => {
          let parsed: any = data;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            // Keep as string if not JSON
          }
          resolve({
            statusCode: res.statusCode || 200,
            body: parsed
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 504,
        body: { error: 'Diagnostic Request Timeout (5000ms exceeded)' }
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 500,
        body: { error: `Sandbox Network Failure: ${err.message}` }
      });
    });

    req.end();
  });
}
