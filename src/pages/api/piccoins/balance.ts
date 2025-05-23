import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Create SSR client following existing pattern
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();    if (authError || !user) {      console.log('[Balance API] Authentication failed:', authError?.message || 'No user');      return res.status(401).json({ message: 'Unauthorized' });    }    console.log('[Balance API] User authenticated:', user.id);    const { data, error } = await supabase      .from('users')      .select('piccoin_balance')      .eq('id', user.id)      .single();    if (error) {      console.error('[Balance API] Error fetching balance:', error);      return res.status(500).json({ message: 'Internal Server Error' });    }    console.log('[Balance API] Raw data from DB:', data);    console.log('[Balance API] PicCoin balance:', data?.piccoin_balance);    return res.status(200).json({       balance: data?.piccoin_balance || 0     });

  } catch (error) {
    console.error('Balance API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 