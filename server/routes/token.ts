import { Router, Request, Response } from 'express';

export const tokenRouter = Router();

// GET /api/token - Returns temporary token for AssemblyAI Voice Agent API
tokenRouter.get('/token', async (req: Request, res: Response) => {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey || apiKey === 'your_assemblyai_api_key_here') {
    return res.status(200).json({
      success: false,
      configured: false,
      error: 'ASSEMBLYAI_API_KEY is not set in server environment variables.',
      message: 'VoxProbe will run in local simulation mode. Set ASSEMBLYAI_API_KEY in .env to use live AssemblyAI Voice Agent API.'
    });
  }

  try {
    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expires_in: 480 }) // 8 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        configured: true,
        error: `AssemblyAI API Error (${response.status}): ${errorText}`
      });
    }

    const data = await response.json();
    return res.status(200).json({
      success: true,
      configured: true,
      token: data.token,
      expires_in: 480
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      configured: true,
      error: `Failed to request temporary token from AssemblyAI: ${err?.message || err}`
    });
  }
});
