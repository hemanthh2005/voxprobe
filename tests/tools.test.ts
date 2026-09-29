import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { executeTool } from '../server/services/toolRunner';
import { validateResponseAgainstContract } from '../server/services/openapiValidator';
import { sandboxRouter } from '../server/routes/sandbox';

let server: any;

beforeAll(() => {
  const app = express();
  app.use('/api', sandboxRouter);
  server = app.listen(3001);
});

afterAll(() => {
  if (server) server.close();
});

describe('VoxProbe Backend Tool Security & Verification Engine', () => {
  it('list_api_endpoints should return allowed sandbox endpoints', async () => {
    const res = await executeTool({ name: 'list_api_endpoints', args: {} });
    expect(res.status).toBe('success');
    expect(res.result.endpoints.length).toBeGreaterThan(0);
  });

  it('run_api_test on ORD-1042 should detect string total mismatch via AJV', async () => {
    const res = await executeTool({
      name: 'run_api_test',
      args: { endpoint: '/api/orders/ORD-1042', method: 'GET' }
    });

    expect(res.status).toBe('success');
    expect(res.result.status_code).toBe(200);
    expect(res.result.contract_validation.passed).toBe(false);
    expect(res.result.contract_validation.mismatches[0].path).toBe('total');
    expect(res.result.contract_validation.mismatches[0].actual_type).toBe('string');
  });

  it('SECURITY TEST: External URL requests MUST be blocked', async () => {
    const res = await executeTool({
      name: 'run_api_test',
      args: { endpoint: 'https://evil-hacker-site.com/steal-keys' }
    });

    expect(res.status).toBe('error');
    expect(res.result.error).toContain('Security Violation');
  });

  it('SECURITY TEST: Unallowed path pattern MUST be blocked', async () => {
    const res = await executeTool({
      name: 'run_api_test',
      args: { endpoint: '/api/admin/drop_database' }
    });

    expect(res.status).toBe('error');
    expect(res.result.error).toContain('Security Violation');
  });

  it('create_regression_test should generate executable Vitest code', async () => {
    const res = await executeTool({
      name: 'create_regression_test',
      args: { endpoint: '/api/orders/ORD-1042' }
    });

    expect(res.status).toBe('success');
    expect(res.result.generated_code).toContain('describe');
    expect(res.result.generated_code).toContain('expect');
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
