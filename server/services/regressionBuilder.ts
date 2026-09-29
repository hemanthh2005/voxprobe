import { ValidationResult } from './openapiValidator';

export interface RegressionTestResult {
  regression_id: string;
  test_name: string;
  endpoint: string;
  method: string;
  expected_behavior: string;
  observed_behavior: string;
  assertion_summary: string;
  generated_code: string;
  timestamp: string;
}

export interface DebugReportResult {
  report_id: string;
  issue_summary: string;
  endpoint: string;
  reproduction_request: string;
  observed_response: string;
  contract_expectation: string;
  verified_mismatch: string;
  likely_cause: string;
  recommended_fix: string;
  regression_test_id: string;
  evidence_ids: string[];
  timestamp: string;
}

/**
 * Builds executable Vitest/Supertest test code from verified evidence
 */
export function generateRegressionTest(validation: ValidationResult): RegressionTestResult {
  const regressionId = `REG-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date().toISOString();
  const endpoint = validation.endpoint;
  const method = validation.method.toUpperCase();

  const firstMismatch = validation.mismatches[0] || {
    path: 'root',
    expected: 'Schema match',
    actual: 'Unknown',
    actual_type: 'unknown'
  };

  const testName = `Contract Regression Test: ${method} ${endpoint} - ${firstMismatch.path} type check`;
  const expectedBehavior = `Response field '${firstMismatch.path}' MUST satisfy contract expectation: ${firstMismatch.expected}`;
  const observedBehavior = `Response field '${firstMismatch.path}' returned invalid value: ${firstMismatch.actual} (type: ${firstMismatch.actual_type})`;
  const assertionSummary = `expect(response.body.${firstMismatch.path}).not.toBeTypeOf('${firstMismatch.actual_type}')`;

  const generatedCode = `/**
 * VoxProbe Automated Regression Test Specification
 * Generated: ${timestamp}
 * Target Endpoint: ${method} ${endpoint}
 * Evidence ID: ${validation.evidence_id}
 * Contract ID: ${validation.contract_id}
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';

describe('API Contract Verification — ${method} ${endpoint}', () => {
  it('should conform to OpenAPI response schema without contract regression', async () => {
    // 1. Execute diagnostic request against sandbox service
    const response = await request('http://localhost:3001')
      .${method.toLowerCase()}('${endpoint}')
      .set('Accept', 'application/json');

    // 2. Verify status code
    expect(response.status).toBe(${validation.status_code});

    // 3. Regression Assertion: Check for identified schema violation
    const targetField = response.body.${firstMismatch.path.replace(/\./g, '?.')};
    
    // Observed bug check: ${firstMismatch.path} was unexpectedly ${firstMismatch.actual_type}
    expect(typeof targetField).not.toBe('${firstMismatch.actual_type}');
    expect(targetField).toBeTypeOf('${firstMismatch.expected === 'number' ? 'number' : 'string'}');
  });
});
`;

  return {
    regression_id: regressionId,
    test_name: testName,
    endpoint,
    method,
    expected_behavior: expectedBehavior,
    observed_behavior: observedBehavior,
    assertion_summary: assertionSummary,
    generated_code: generatedCode,
    timestamp
  };
}

/**
 * Builds structured Debug Report from validation evidence
 */
export function generateDebugReport(
  validation: ValidationResult,
  regression: RegressionTestResult
): DebugReportResult {
  const reportId = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
  const timestamp = new Date().toISOString();
  const firstMismatch = validation.mismatches[0] || { path: 'unknown', expected: '', actual: '' };

  let likelyCause = 'Likely cause: Data serialization type mismatch in backend controller/DTO layer.';
  let recommendedFix = `Ensure '${firstMismatch.path}' is explicitly converted to type '${firstMismatch.expected}' prior to HTTP JSON response serialization.`;

  if (firstMismatch.keyword === 'enum') {
    likelyCause = 'Likely cause: Database state contains unhandled enum state value not permitted in API specification.';
    recommendedFix = `Update backend enum mapper to sanitize value '${firstMismatch.actual}' into valid OpenAPI enum options (${firstMismatch.expected}).`;
  } else if (firstMismatch.keyword === 'required') {
    likelyCause = 'Likely cause: Database query projection omitted required response property.';
    recommendedFix = `Add field '${firstMismatch.path}' to the API response object payload schema.`;
  }

  return {
    report_id: reportId,
    issue_summary: `Verified Contract Violation: ${validation.method.toUpperCase()} ${validation.endpoint}`,
    endpoint: validation.endpoint,
    reproduction_request: `curl -X ${validation.method.toUpperCase()} http://localhost:3001${validation.endpoint}`,
    observed_response: JSON.stringify(validation.observed_data, null, 2),
    contract_expectation: `Field '${firstMismatch.path}' expected: ${firstMismatch.expected}`,
    verified_mismatch: `Field '${firstMismatch.path}' observed: ${firstMismatch.actual} (${firstMismatch.actual_type})`,
    likely_cause: likelyCause,
    recommended_fix: recommendedFix,
    regression_test_id: regression.regression_id,
    evidence_ids: [validation.evidence_id, validation.contract_id],
    timestamp
  };
}
