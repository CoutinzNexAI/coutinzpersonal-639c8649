import { createClient } from '@supabase/supabase-js';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. Validate authentication FIRST
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookies = parseCookieHeader(req.headers.cookie ?? '');
            return cookies[name];
          },
          set: (name: string, value: string, options) => {
            const cookie = serializeCookieHeader(name, value, options);
            let setCookieHeader = res.getHeader('Set-Cookie') ?? [];
            if (typeof setCookieHeader === 'string') {
              setCookieHeader = [setCookieHeader];
            } else if (typeof setCookieHeader === 'number') {
              setCookieHeader = [String(setCookieHeader)];
            }
            res.setHeader('Set-Cookie', [...setCookieHeader, cookie]);
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 2. Use user.id from authenticated session (secure)
    const { amount = 1, transformationId } = req.body;

    if (!transformationId) {
      return res.status(400).json({ message: 'Missing transformationId' });
    }

    // 3. Call atomic RPC function
    const { data, error } = await supabaseAdmin.rpc('spend_piccoins', {
      p_user_id: user.id, // Secure - comes from auth
      p_amount: amount,
      p_reference_id: transformationId,
      p_description: `Spent ${amount} PicCoin(s) for image transformation`
    });

    if (error) {
      console.error('RPC error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (!data.success) {
      return res.status(400).json({ 
        message: data.error,
        currentBalance: data.currentBalance,
        required: data.required
      });
    }

    return res.status(200).json({ 
      success: true,
      newBalance: data.newBalance
    });

  } catch (error) {
    console.error('Spend API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 