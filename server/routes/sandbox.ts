import { Router, Request, Response } from 'express';

export const sandboxRouter = Router();

// GET /api/orders/:id
sandboxRouter.get('/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  if (id === 'ORD-1042') {
    // Controlled Defect 1: total is string "1499" instead of number 1499
    return res.status(200).json({
      id: 'ORD-1042',
      status: 'shipped',
      total: '1499', // BUG: Should be number 1499
      currency: 'INR'
    });
  }

  if (id === 'ORD-1043') {
    // Controlled Defect 2: status is "in_transit" which is NOT in Enum [pending, processing, shipped, delivered]
    return res.status(200).json({
      id: 'ORD-1043',
      status: 'in_transit', // BUG: Invalid Enum value
      total: 2800,
      currency: 'INR'
    });
  }

  if (id === 'ORD-1044') {
    // Valid Reference Response
    return res.status(200).json({
      id: 'ORD-1044',
      status: 'delivered',
      total: 3499,
      currency: 'INR'
    });
  }

  return res.status(404).json({
    error: 'Order not found',
    requested_id: id
  });
});

// GET /api/users/:id
sandboxRouter.get('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  if (id === 'USR-1001') {
    // Controlled Defect 3: email field missing (required by contract)
    return res.status(200).json({
      id: 'USR-1001',
      name: 'Aarav Sharma',
      role: 'developer'
      // BUG: Missing required property "email"
    });
  }

  if (id === 'USR-1002') {
    // Valid User
    return res.status(200).json({
      id: 'USR-1002',
      name: 'Priya Patel',
      email: 'priya@example.com',
      role: 'admin'
    });
  }

  return res.status(404).json({
    error: 'User not found',
    requested_id: id
  });
});

// GET /api/products/:id
sandboxRouter.get('/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  if (id === 'PROD-001') {
    return res.status(200).json({
      id: 'PROD-001',
      title: 'VoxProbe Neural Audio Dock',
      price: 12999,
      in_stock: true
    });
  }

  return res.status(404).json({
    error: 'Product not found',
    requested_id: id
  });
});

// POST /api/login
sandboxRouter.post('/login', (req: Request, res: Response) => {
  return res.status(200).json({
    token: 'vx_mock_jwt_token_992183182',
    token_type: 'Bearer',
    expires_in: 3600
  });
});
