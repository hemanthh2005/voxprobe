import { Router, Request, Response } from 'express';

export const tokenRouter = Router();

// GET /api/token - Mint temporary Voice Agent token from AssemblyAI
tokenRouter.get('/token', async (req: Request, res: Response) => {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey || apiKey === 'your_assemblyai_api_key_here') {
    console.log('[AssemblyAI] ASSEMBLYAI_API_KEY is not set. Simulation mode will be used.');
    return res.status(200).json({
      success: false,
      configured: false,
      error: 'ASSEMBLYAI_API_KEY is not set in server environment variables.',
      message: 'VoxProbe will run in local simulation engine mode.'
    });
  }

  try {
    console.log('[AssemblyAI] Token request started');

    const response = await fetch('https://agents.assemblyai.com/v1/token?expires_in_seconds=300', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AssemblyAI] Token request failed HTTP ${response.status}`);
      return res.status(response.status).json({
        success: false,
        configured: true,
        error: `AssemblyAI Token Error (HTTP ${response.status}): ${errorText}`
      });
    }

    const data = await response.json();
    console.log('[AssemblyAI] Temporary token received');

    return res.status(200).json({
      success: true,
      configured: true,
      token: data.token,
      expires_in: 300
    });
  } catch (err: any) {
    console.error('[AssemblyAI] Exception during token request:', err?.message || err);
    return res.status(500).json({
      success: false,
      configured: true,
      error: `Failed to request temporary token from AssemblyAI: ${err?.message || err}`
    });
  }
});
