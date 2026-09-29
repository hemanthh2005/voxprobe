import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { sandboxRouter } from './routes/sandbox';
import { tokenRouter } from './routes/token';
import { toolsRouter } from './routes/tools';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Security & Parsing Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '100kb' }));

// Health Check Endpoint (Render Production Specification)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'voxprobe'
  });
});

// Detailed API Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VoxProbe Backend Engine',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', sandboxRouter);
app.use('/api', tokenRouter);
app.use('/api/tools', toolsRouter);

// Serve Production React Frontend
const clientBuildPath = path.join(process.cwd(), 'dist', 'client');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('VoxProbe API Server is running. Frontend dev server active on port 5173.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(` VoxProbe Backend Engine running on http://0.0.0.0:${PORT}`);
  console.log(` Sandbox Microservices API ready at /api/orders, /api/users`);
  console.log(` AssemblyAI Token Endpoint ready at /api/token`);
  console.log(` Health Endpoint ready at /health`);
  console.log(`===================================================`);
});
