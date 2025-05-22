import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    const currentTime = new Date().toISOString();
    res.status(200).json({ 
      message: 'API de teste bem-sucedida. Verifica os Runtime Logs da Vercel.',
      timestamp: currentTime
    });
  }