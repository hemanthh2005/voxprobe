import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { executeTool } from '../server/services/toolRunner';
import { validateResponseAgainstContract } from '../server/services/openapiValidator';
import { sandboxRouter } from '../server/routes/sandbox';

let server: any;

beforeAll(() => {
  return new Promise<void>((resolve) => {
    const app = express();
    app.use('/api', sandboxRouter);
    server = app.listen(0, () => {
      process.env.PORT = String(server.address().port);
      resolve();
    });
  });
});

afterAll(() => {
  if (server && server.close) {
    server.close();
  }
});

describe('VoxProbe Backend Tool Security & State Integrity Engine', () => {
  it('list_api_endpoints should return allowed sandbox endpoints with trace_id', async () => {
    const res = await executeTool({ name: 'list_api_endpoints', args: {}, trace_id: 'TRACE-1001' });
    expect(res.status).toBe('success');
    expect(res.trace_id).toBe('TRACE-1001');
    expect(res.result.endpoints.length).toBeGreaterThan(0);
  });

  it('STATE INTEGRITY TEST 1: ORD-1042 request MUST produce ORD-1042 evidence, NOT USR-1001', async () => {
    const traceId = 'TRACE-ORD-1042';
    const res = await executeTool({
      name: 'run_api_test',
      args: { endpoint: '/api/orders/ORD-1042', method: 'GET' },
      trace_id: traceId
    });

    expect(res.status).toBe('success');
    expect(res.trace_id).toBe(traceId);
    expect(res.result.endpoint).toBe('/api/orders/ORD-1042');
    expect(res.result.response_body.id).toBe('ORD-1042');
    expect(res.result.response_body.id).not.toBe('USR-1001');
    expect(res.result.contract_validation.passed).toBe(false);
    expect(res.result.contract_validation.mismatches[0].path).toBe('total');
  });

  it('STATE INTEGRITY TEST 2: USR-1001 request MUST produce USR-1001 evidence, NOT ORD-1042', async () => {
    const traceId = 'TRACE-USR-1001';
    const res = await executeTool({
      name: 'run_api_test',
      args: { endpoint: '/api/users/USR-1001', method: 'GET' },
      trace_id: traceId
    });

    expect(res.status).toBe('success');
    expect(res.trace_id).toBe(traceId);
    expect(res.result.endpoint).toBe('/api/users/USR-1001');
    expect(res.result.response_body.id).toBe('USR-1001');
    expect(res.result.response_body.id).not.toBe('ORD-1042');
    expect(res.result.contract_validation.passed).toBe(false);
    expect(res.result.contract_validation.mismatches[0].path).toBe('email');
  });

  it('STATE INTEGRITY TEST 3: validate_response MUST reject mismatching endpoint for trace', async () => {
    const traceId = 'TRACE-MISMATCH-TEST';
    // Run test for ORD-1042 under this trace
    await executeTool({
      name: 'run_api_test',
      args: { endpoint: '/api/orders/ORD-1042' },
      trace_id: traceId
    });

    // Attempt to validate response for USR-1001 on the same trace (state mismatch)
    const valRes = await executeTool({
      name: 'validate_response',
      args: { endpoint: '/api/users/USR-1001' },
      trace_id: traceId
    });

    expect(valRes.status).toBe('error');
    expect(valRes.result.error).toContain('Investigation state mismatch');
  });

  it('SECURITY TEST: External URL requests MUST be blocked', async () => {
    const res = await executeTool({
      name: 'run_api_test',
      args: { endpoint: 'https://evil-hacker-site.com/steal-keys' },
      trace_id: 'TRACE-SEC-1'
    });

    expect(res.status).toBe('error');
    expect(res.result.error).toContain('Security Violation');
  });

  it('SECURITY TEST: Unallowed path pattern MUST be blocked', async () => {
    const res = await executeTool({
      name: 'run_api_test',
      args: { endpoint: '/api/admin/drop_database' },
      trace_id: 'TRACE-SEC-2'
    });

    expect(res.status).toBe('error');
    expect(res.result.error).toContain('Security Violation');
  });

  it('create_regression_test should generate executable Vitest code bound to trace', async () => {
    const traceId = 'TRACE-REG-1042';
    const res = await executeTool({
      name: 'create_regression_test',
      args: { endpoint: '/api/orders/ORD-1042' },
      trace_id: traceId
    });

    expect(res.status).toBe('success');
    expect(res.trace_id).toBe(traceId);
    expect(res.result.generated_code).toContain('describe');
    expect(res.result.generated_code).toContain('ORD-1042');
  });

  it('validateResponseAgainstContract should pass for valid ORD-1044', () => {
    const validBody = {
      id: 'ORD-1044',
      status: 'delivered',
      total: 3499,
      currency: 'INR'
    };
    const validation = validateResponseAgainstContract('/api/orders/ORD-1044', 'GET', 200, validBody);
    expect(validation.passed).toBe(true);
    expect(validation.mismatches.length).toBe(0);
  });
});
