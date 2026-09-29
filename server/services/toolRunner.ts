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

// In-memory store for validated evidence per traceId to guarantee state isolation
const evidenceStoreByTrace: Map<
  string,
  { traceId: string; endpoint: string; validation: ValidationResult; regression?: any }
> = new Map();

export interface ToolCallParams {
  name: string;
  args: any;
  call_id?: string;
  trace_id?: string;
}

export interface ToolExecutionResponse {
  tool: string;
  status: 'success' | 'error';
  call_id?: string;
  trace_id: string;
  result: any;
  evidence_id?: string;
}

export async function executeTool(params: ToolCallParams): Promise<ToolExecutionResponse> {
  const { name, args, call_id } = params;
  const traceId = params.trace_id || args?.trace_id || `TRACE-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    switch (name) {
      case 'list_api_endpoints':
        return {
          tool: name,
          status: 'success',
          call_id,
          trace_id: traceId,
          result: {
            trace_id: traceId,
            endpoints: [
              { path: '/api/orders/ORD-1042', method: 'GET', description: 'Order ORD-1042 details (Type Bug)' },
              { path: '/api/orders/ORD-1043', method: 'GET', description: 'Order ORD-1043 details (Enum Bug)' },
              { path: '/api/orders/ORD-1044', method: 'GET', description: 'Order ORD-1044 details (Valid Reference)' },
              { path: '/api/users/USR-1001', method: 'GET', description: 'User USR-1001 profile (Missing Email Bug)' },
              { path: '/api/users/USR-1002', method: 'GET', description: 'User USR-1002 profile (Valid Reference)' },
              { path: '/api/products/PROD-001', method: 'GET', description: 'Product PROD-001 details' },
              { path: '/api/login', method: 'POST', description: 'User authentication endpoint' }
            ]
          }
        };

      case 'inspect_contract': {
        const rawEndpoint = args?.endpoint;
        if (!rawEndpoint || typeof rawEndpoint !== 'string') {
          return {
            tool: name,
            status: 'error',
            call_id,
            trace_id: traceId,
            result: { error: 'Target endpoint string is required for contract inspection.' }
          };
        }

        const endpoint = rawEndpoint.trim();
        const spec = getOpenApiSpec();
        return {
          tool: name,
          status: 'success',
          call_id,
          trace_id: traceId,
          result: {
            trace_id: traceId,
            endpoint,
            contract_spec: spec.paths['/api/orders/{id}'] || spec.paths[endpoint] || 'Contract defined'
          }
        };
      }

      case 'run_api_test': {
        const rawEndpoint = args?.endpoint;
        if (!rawEndpoint || typeof rawEndpoint !== 'string' || !rawEndpoint.trim()) {
          return {
            tool: name,
            status: 'error',
            call_id,
            trace_id: traceId,
            result: { error: 'Target endpoint string is required for API diagnostic testing.' }
          };
        }

        const requestedEndpoint = rawEndpoint.trim();
        const method = (args?.method || 'GET').toUpperCase();

        // Security Check 1: Block external domain URLs or protocols
        if (
          requestedEndpoint.startsWith('http://') ||
          requestedEndpoint.startsWith('https://') ||
          requestedEndpoint.startsWith('//')
        ) {
          return {
            tool: name,
            status: 'error',
            call_id,
            trace_id: traceId,
            result: {
              error: 'Security Violation: External URL execution blocked by VoxProbe sandbox rules.',
              allowed_endpoints: '/api/orders/*, /api/users/*, /api/products/*, /api/login'
            }
          };
        }

        // Standardize leading slash
        const executedEndpoint = requestedEndpoint.startsWith('/')
          ? requestedEndpoint
          : `/${requestedEndpoint}`;

        // Security Check 2: Validate against strict sandbox endpoint allowlist
        const isAllowed = ALLOWED_ENDPOINT_PATTERNS.some((pattern) => pattern.test(executedEndpoint));
        if (!isAllowed) {
          return {
            tool: name,
            status: 'error',
            call_id,
            trace_id: traceId,
            result: {
              error: `Security Violation: Endpoint '${executedEndpoint}' is not in the allowed diagnostic sandbox list.`
            }
          };
        }

        // Security Check 3: State Integrity Validation (requested vs executed)
        if (executedEndpoint !== requestedEndpoint && executedEndpoint !== `/${requestedEndpoint}`) {
          return {
            tool: name,
            status: 'error',
            call_id,
            trace_id: traceId,
            result: {
              error: 'Investigation state mismatch. Verification aborted.',
              requested_endpoint: requestedEndpoint,
              executed_endpoint: executedEndpoint
            }
          };
        }

        const startTime = Date.now();
        const evidenceId = `EV-${Math.floor(1000 + Math.random() * 9000)}`;

        // Internal HTTP Request to sandbox API
        const apiResponse = await makeInternalApiRequest(executedEndpoint, method);
        const durationMs = Date.now() - startTime;

        // Auto-run OpenAPI validation
        const validation = validateResponseAgainstContract(
          executedEndpoint,
          method,
          apiResponse.statusCode,
          apiResponse.body,
          evidenceId
        );

        // Store evidence bound strictly to traceId
        evidenceStoreByTrace.set(traceId, {
          traceId,
          endpoint: executedEndpoint,
          validation
        });

        return {
          tool: name,
          status: 'success',
          call_id,
          trace_id: traceId,
          evidence_id: evidenceId,
          result: {
            trace_id: traceId,
            evidence_id: evidenceId,
            requested_endpoint: requestedEndpoint,
            endpoint: executedEndpoint,
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
        const rawEndpoint = args?.endpoint;
        const stored = evidenceStoreByTrace.get(traceId);

        if (stored) {
          // Verify endpoint matches trace stored endpoint
          if (rawEndpoint && stored.endpoint !== rawEndpoint && stored.endpoint !== `/${rawEndpoint}`) {
            return {
              tool: name,
              status: 'error',
              call_id,
              trace_id: traceId,
              result: {
                error: 'Investigation state mismatch. Verification aborted.',
                requested_endpoint: rawEndpoint,
                trace_endpoint: stored.endpoint
              }
            };
          }

          return {
            tool: name,
            status: 'success',
            call_id,
            trace_id: traceId,
            evidence_id: stored.validation.evidence_id,
            result: {
              trace_id: traceId,
              ...stored.validation
            }
          };
        }

        if (!rawEndpoint || typeof rawEndpoint !== 'string') {
          return {
            tool: name,
            status: 'error',
            call_id,
            trace_id: traceId,
            result: { error: 'Target endpoint string is required for contract validation.' }
          };
        }

        // Execute test first if trace evidence not cached
        const testRes = await executeTool({
          name: 'run_api_test',
          args: { endpoint: rawEndpoint },
          call_id,
          trace_id: traceId
        });

        if (testRes.status === 'error') return testRes;

        const freshlyStored = evidenceStoreByTrace.get(traceId);
        return {
          tool: name,
          status: 'success',
          call_id,
          trace_id: traceId,
          evidence_id: freshlyStored?.validation.evidence_id,
          result: {
            trace_id: traceId,
            ...freshlyStored?.validation
          }
        };
      }

      case 'create_regression_test': {
        const rawEndpoint = args?.endpoint;
        let stored = evidenceStoreByTrace.get(traceId);

        if (!stored) {
          if (!rawEndpoint) {
            return {
              tool: name,
              status: 'error',
              call_id,
              trace_id: traceId,
              result: { error: 'Target endpoint string is required to generate regression test.' }
            };
          }
          await executeTool({
            name: 'run_api_test',
            args: { endpoint: rawEndpoint },
            call_id,
            trace_id: traceId
          });
          stored = evidenceStoreByTrace.get(traceId);
        }

        if (!stored || !stored.validation) {
          return {
            tool: name,
            status: 'error',
            call_id,
            trace_id: traceId,
            result: { error: `No contract evidence available for trace ${traceId}` }
          };
        }

        const regression = generateRegressionTest(stored.validation);
        stored.regression = regression;

        return {
          tool: name,
          status: 'success',
          call_id,
          trace_id: traceId,
          evidence_id: stored.validation.evidence_id,
          result: {
            trace_id: traceId,
            ...regression
          }
        };
      }

      case 'create_debug_report': {
        const rawEndpoint = args?.endpoint;
        let stored = evidenceStoreByTrace.get(traceId);

        if (!stored) {
          if (!rawEndpoint) {
            return {
              tool: name,
              status: 'error',
              call_id,
              trace_id: traceId,
              result: { error: 'Target endpoint string is required to generate debug report.' }
            };
          }
          await executeTool({
            name: 'run_api_test',
            args: { endpoint: rawEndpoint },
            call_id,
            trace_id: traceId
          });
          stored = evidenceStoreByTrace.get(traceId);
        }

        if (!stored || !stored.validation) {
          return {
            tool: name,
            status: 'error',
            call_id,
            trace_id: traceId,
            result: { error: `No contract evidence found for trace ${traceId}` }
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
          trace_id: traceId,
          evidence_id: stored.validation.evidence_id,
          result: {
            trace_id: traceId,
            ...debugReport
          }
        };
      }

      default:
        return {
          tool: name,
          status: 'error',
          call_id,
          trace_id: traceId,
          result: { error: `Unknown tool name: ${name}` }
        };
    }
  } catch (err: any) {
    return {
      tool: name,
      status: 'error',
      call_id,
      trace_id: traceId,
      result: { error: err?.message || 'Tool execution failure' }
    };
  }
}

function makeInternalApiRequest(
  endpoint: string,
  method: string
): Promise<{ statusCode: number; body: any }> {
  return new Promise((resolve) => {
    const port = process.env.PORT || 3001;
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path: endpoint,
        method,
        headers: { Accept: 'application/json' },
        timeout: 5000
      },
      (res) => {
        let data = '';
        let dataSize = 0;

        res.on('data', (chunk) => {
          dataSize += chunk.length;
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
          } catch (e) {}
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
