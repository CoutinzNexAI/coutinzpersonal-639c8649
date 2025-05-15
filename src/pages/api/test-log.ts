import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    const currentTime = new Date().toISOString();
    console.log(`[API Route Test] /api/test-log foi chamada às: ${currentTime}`);
    res.status(200).json({ 
      message: 'API de teste bem-sucedida. Verifica os Runtime Logs da Vercel.',
      timestamp: currentTime
    });
  }