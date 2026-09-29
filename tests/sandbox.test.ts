import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { sandboxRouter } from '../server/routes/sandbox';

const app = express();
app.use('/api', sandboxRouter);

describe('VoxProbe Sandbox Microservices API', () => {
  it('should return ORD-1042 with string total (Controlled Type Bug)', async () => {
    const res = await request(app).get('/api/orders/ORD-1042');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('ORD-1042');
    expect(typeof res.body.total).toBe('string'); // The intentional defect
    expect(res.body.total).toBe('1499');
  });

  it('should return ORD-1043 with invalid status enum (Controlled Enum Bug)', async () => {
    const res = await request(app).get('/api/orders/ORD-1043');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_transit');
  });

  it('should return ORD-1044 fully valid reference object', async () => {
    const res = await request(app).get('/api/orders/ORD-1044');
    expect(res.status).toBe(200);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.status).toBe('delivered');
  });

  it('should return USR-1001 missing email property (Controlled Required Field Bug)', async () => {
    const res = await request(app).get('/api/users/USR-1001');
    expect(res.status).toBe(200);
    expect(res.body.email).toBeUndefined();
  });
});
