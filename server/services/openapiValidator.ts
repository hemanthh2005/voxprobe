import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';

const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
addFormats(ajv);

let openApiSpec: any = null;

export interface ValidationResult {
  passed: boolean;
  contract_id: string;
  evidence_id: string;
  endpoint: string;
  method: string;
  status_code: number;
  observed_data: any;
  mismatches: Array<{
    path: string;
    keyword: string;
    message: string;
    expected: string;
    actual: string;
    actual_type: string;
  }>;
  summary: string;
}

function loadSpec() {
  if (!openApiSpec) {
    const specPath = path.join(process.cwd(), 'server', 'contracts', 'openapi.json');
    if (fs.existsSync(specPath)) {
      const raw = fs.readFileSync(specPath, 'utf-8');
      openApiSpec = JSON.parse(raw);
    } else {
      throw new Error(`OpenAPI specification file not found at ${specPath}`);
    }
  }
  return openApiSpec;
}

export function getOpenApiSpec() {
  return loadSpec();
}

/**
 * Validates a response object against the corresponding OpenAPI endpoint response schema
 */
export function validateResponseAgainstContract(
  endpoint: string,
  method: string,
  statusCode: number,
  responseBody: any,
  evidenceId: string = `EV-${Math.floor(1000 + Math.random() * 9000)}`
): ValidationResult {
  const spec = loadSpec();
  const contractId = `CTR-${Math.floor(1000 + Math.random() * 9000)}`;

  // Standardize method
  const httpMethod = method.toLowerCase();

  // Find path match in spec
  const paths = spec.paths || {};
  let pathSchema: any = null;
  let matchedPathPattern = '';

  for (const pattern of Object.keys(paths)) {
    // Convert OpenAPI path template like /api/orders/{id} to regex
    const regexPattern = '^' + pattern.replace(/\{[^}]+\}/g, '[^/]+') + '$';
    if (new RegExp(regexPattern).test(endpoint)) {
      pathSchema = paths[pattern];
      matchedPathPattern = pattern;
      break;
    }
  }

  if (!pathSchema || !pathSchema[httpMethod]) {
    return {
      passed: false,
      contract_id: contractId,
      evidence_id: evidenceId,
      endpoint,
      method,
      status_code: statusCode,
      observed_data: responseBody,
      mismatches: [
        {
          path: 'root',
          keyword: 'path_not_found',
          message: `Endpoint ${endpoint} (${method.toUpperCase()}) is not defined in OpenAPI specification`,
          expected: 'Defined OpenAPI path',
          actual: endpoint,
          actual_type: 'undefined'
        }
      ],
      summary: `Endpoint ${endpoint} is not defined in the OpenAPI contract.`
    };
  }

  const responseSpec = pathSchema[httpMethod]?.responses?.[statusCode.toString()] || pathSchema[httpMethod]?.responses?.['default'];
  const jsonSchema = responseSpec?.content?.['application/json']?.schema;

  if (!jsonSchema) {
    return {
      passed: true,
      contract_id: contractId,
      evidence_id: evidenceId,
      endpoint,
      method,
      status_code: statusCode,
      observed_data: responseBody,
      mismatches: [],
      summary: `No JSON Schema defined for status code ${statusCode} on ${endpoint}.`
    };
  }

  // Validate using AJV
  const validate = ajv.compile(jsonSchema);
  const valid = validate(responseBody);

  if (valid) {
    return {
      passed: true,
      contract_id: contractId,
      evidence_id: evidenceId,
      endpoint,
      method,
      status_code: statusCode,
      observed_data: responseBody,
      mismatches: [],
      summary: `Response for ${method.toUpperCase()} ${endpoint} perfectly matches OpenAPI contract.`
    };
  }

  const mismatches = (validate.errors || []).map((err: ErrorObject) => {
    const dataPath = err.instancePath ? err.instancePath.replace(/^\//, '') : 'root';
    const fieldName = dataPath === 'root' ? '' : dataPath;

    let actualVal = fieldName ? getDeepValue(responseBody, fieldName) : responseBody;
    let actualType: string = typeof actualVal;
    if (actualVal === null) actualType = 'null';
    if (Array.isArray(actualVal)) actualType = 'array';

    let expected = err.message || 'schema match';
    if (err.keyword === 'type') {
      expected = err.params.type;
    } else if (err.keyword === 'enum') {
      expected = `One of: [${err.params.allowedValues.join(', ')}]`;
    } else if (err.keyword === 'required') {
      expected = `Property '${err.params.missingProperty}' required`;
    }

    return {
      path: dataPath || (err.params.missingProperty ? err.params.missingProperty : 'root'),
      keyword: err.keyword,
      message: err.message || 'Validation error',
      expected: String(expected),
      actual: String(JSON.stringify(actualVal ?? 'undefined')),
      actual_type: actualType
    };
  });

  const firstMismatch = mismatches[0];
  const summary = `Contract validation FAILED for ${method.toUpperCase()} ${endpoint}. Mismatch at '${firstMismatch.path}': expected ${firstMismatch.expected}, observed ${firstMismatch.actual} (${firstMismatch.actual_type}).`;

  return {
    passed: false,
    contract_id: contractId,
    evidence_id: evidenceId,
    endpoint,
    method,
    status_code: statusCode,
    observed_data: responseBody,
    mismatches,
    summary
  };
}

function getDeepValue(obj: any, pathStr: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const parts = pathStr.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      return undefined;
    }
  }
  return curr;
}
