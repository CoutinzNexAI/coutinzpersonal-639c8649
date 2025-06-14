import { NextApiRequest, NextApiResponse } from 'next';

interface TestResponse {
  success: boolean;
  method: string;
  timestamp: string;
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  url?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse>
) {
  console.log("🧪 [TEST] Method test endpoint called");
  console.log("🧪 [TEST] Method:", req.method);
  console.log("🧪 [TEST] URL:", req.url);
  console.log("🧪 [TEST] Headers:", JSON.stringify(req.headers, null, 2));
  console.log("🧪 [TEST] Body:", JSON.stringify(req.body, null, 2));

  // Suporte para OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log("🧪 [TEST] OPTIONS preflight request");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  // Aceitar qualquer método para teste
  return res.status(200).json({
    success: true,
    method: req.method || 'UNKNOWN',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body,
    query: req.query,
    url: req.url
  });
} 