import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[Balance API] 🚀 Handler started');
  
  if (req.method !== 'GET') {
    console.log('[Balance API] ❌ Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  console.log('[Balance API] ✅ Method is GET');
  console.log('[Balance API] Cookies from request:', req.headers.cookie ? 'Present' : 'Missing');
  console.log('[Balance API] Environment vars - URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing');
  console.log('[Balance API] Environment vars - ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

  try {
    console.log('[Balance API] 🔧 Creating Supabase SSR client...');
    
    // Create SSR client following existing pattern
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookies = parseCookieHeader(req.headers.cookie ?? '');
            console.log('[Balance API] 🍪 Getting cookie:', name, cookies[name] ? 'Found' : 'Not found');
            return cookies[name];
          },
          set: (name: string, value: string, options) => {
            console.log('[Balance API] 🍪 Setting cookie:', name);
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

    console.log('[Balance API] ✅ Supabase client created successfully');
    console.log('[Balance API] 🔐 Getting user authentication...');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('[Balance API] Auth result - Error:', authError?.message || 'None');
    console.log('[Balance API] Auth result - User:', user ? `${user.id} (${user.email})` : 'null');
    
    if (authError || !user) {
      console.log('[Balance API] ❌ Authentication failed:', authError?.message || 'No user');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('[Balance API] ✅ User authenticated:', user.id);
    console.log('[Balance API] User email:', user.email);

    console.log('[Balance API] 📊 Querying database for user balance...');
    const { data, error } = await supabase
      .from('users')
      .select('piccoin_balance, id, email, created_at')
      .eq('id', user.id)
      .single();

    console.log('[Balance API] Query executed - Error:', error);
    console.log('[Balance API] Query executed - Data:', JSON.stringify(data, null, 2));

    if (error) {
      console.error('[Balance API] ❌ Error fetching balance:', error);
      console.error('[Balance API] Error code:', error.code);
      console.error('[Balance API] Error message:', error.message);
      console.error('[Balance API] Error details:', error.details);
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (!data) {
      console.error('[Balance API] ❌ No data returned from query');
      return res.status(404).json({ message: 'User not found in database' });
    }

    const balance = data.piccoin_balance;
    console.log('[Balance API] 💰 Raw piccoin_balance from DB:', balance);
    console.log('[Balance API] 💰 Type of balance:', typeof balance);
    console.log('[Balance API] 💰 Is balance null?', balance === null);
    console.log('[Balance API] 💰 Is balance undefined?', balance === undefined);
    
    const finalBalance = balance ?? 0;
    console.log('[Balance API] 💰 Final balance to return:', finalBalance);

    return res.status(200).json({
      balance: finalBalance
    });

  } catch (error) {
    console.error('[Balance API] ❌ Unexpected error in try/catch:', error);
    console.error('[Balance API] Error type:', typeof error);
    console.error('[Balance API] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Balance API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 