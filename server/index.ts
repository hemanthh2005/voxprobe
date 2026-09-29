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
const PORT = process.env.PORT || 3001;

// Security & Parsing Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '100kb' }));

// API Routes
app.use('/api', sandboxRouter);
app.use('/api', tokenRouter);
app.use('/api/tools', toolsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VoxProbe Backend Engine',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production
const clientBuildPath = path.join(process.cwd(), 'dist', 'client');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('VoxProbe API Server is running. Frontend dev server active on port 5173.');
  }
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` VoxProbe Backend Engine running on http://localhost:${PORT}`);
  console.log(` Sandbox Microservices API ready at /api/orders, /api/users`);
  console.log(` AssemblyAI Token Endpoint ready at /api/token`);
  console.log(`===================================================`);
});
