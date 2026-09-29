import { Router, Request, Response } from 'express';
import { executeTool } from '../services/toolRunner';

export const toolsRouter = Router();

// POST /api/tools/execute - Executes deterministic tool with trace_id preservation
toolsRouter.post('/execute', async (req: Request, res: Response) => {
  const { name, args, call_id, trace_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Tool name is required' });
  }

  const result = await executeTool({ name, args, call_id, trace_id });
  return res.status(200).json(result);
});
