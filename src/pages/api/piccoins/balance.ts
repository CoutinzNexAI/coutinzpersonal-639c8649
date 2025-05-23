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

    const { data: { user }, error: authError } = await supabase.auth.getUser();    if (authError || !user) {      console.log('[Balance API] Authentication failed:', authError?.message || 'No user');      return res.status(401).json({ message: 'Unauthorized' });    }    console.log('[Balance API] ✅ User authenticated:', user.id);    console.log('[Balance API] User email:', user.email);    const { data, error } = await supabase      .from('users')      .select('piccoin_balance, id, email, created_at')      .eq('id', user.id)      .single();    console.log('[Balance API] Query executed - Error:', error);    console.log('[Balance API] Query executed - Data:', JSON.stringify(data, null, 2));    if (error) {      console.error('[Balance API] ❌ Error fetching balance:', error);      console.error('[Balance API] Error code:', error.code);      console.error('[Balance API] Error message:', error.message);      console.error('[Balance API] Error details:', error.details);      return res.status(500).json({ message: 'Internal Server Error' });    }    if (!data) {      console.error('[Balance API] ❌ No data returned from query');      return res.status(404).json({ message: 'User not found in database' });    }    const balance = data.piccoin_balance;    console.log('[Balance API] 💰 Raw piccoin_balance from DB:', balance);    console.log('[Balance API] 💰 Type of balance:', typeof balance);    console.log('[Balance API] 💰 Is balance null?', balance === null);    console.log('[Balance API] 💰 Is balance undefined?', balance === undefined);        const finalBalance = balance ?? 0;    console.log('[Balance API] 💰 Final balance to return:', finalBalance);    return res.status(200).json({       balance: finalBalance    });

  } catch (error) {
    console.error('Balance API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 