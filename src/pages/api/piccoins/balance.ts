// src/pages/api/piccoins/balance.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[Balance API] 🚀 Handler started');
  
  const rawCookieHeaderFromRequest = req.headers.cookie ?? ''; // Guardar para log no início
  console.log('[Balance API] RAW COOKIE HEADER FROM REQUEST (at handler start):', rawCookieHeaderFromRequest);

  if (req.method !== 'GET') {
    console.log('[Balance API] ❌ Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  console.log('[Balance API] ✅ Method is GET');
  // O log do rawCookieHeader já foi feito acima.
  console.log('[Balance API] Cookies from request (simple check):', rawCookieHeaderFromRequest ? 'Present' : 'Missing');
  console.log('[Balance API] Environment vars - URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing');
  console.log('[Balance API] Environment vars - ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

  try {
    console.log('[Balance API] 🔧 Creating Supabase SSR client...');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookieStrToParse = req.headers.cookie ?? ''; // Re-ler para ter a string original
            const parsedCookiesObject = parseCookieHeader(cookieStrToParse);
            
            console.log(`[Balance API] 🍪 Cookie Getter - Attempting to get: "${name}"`);
            // Não é necessário logar a string completa aqui novamente se já foi logada no início do handler.
            // console.log(`[Balance API] 🍪 Cookie Getter - Full cookie string being parsed: "${cookieStrToParse}"`); 
            console.log('[Balance API] 🍪 Cookie Getter - Result of parseCookieHeader (keys found):', Object.keys(parsedCookiesObject).join(', ') || 'No keys parsed');
            // Se quiseres ver o objeto completo (pode ser grande com tokens):
            // console.log('[Balance API] 🍪 Cookie Getter - Full parsedCookiesObject:', JSON.stringify(parsedCookiesObject));


            const cookieValue = parsedCookiesObject[name];
            console.log(`[Balance API] 🍪 Cookie Getter - Value for "${name}": ${cookieValue !== undefined ? `Found (length: ${String(cookieValue).length})` : 'Not found (undefined)'}`);
            return cookieValue;
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
          // A função remove pode ser útil se o Supabase precisar limpar cookies durante o refresh
          remove: (name: string, options) => {
            console.log('[Balance API] 🍪 Removing cookie:', name);
            const cookieHeader = serializeCookieHeader(name, '', { ...options, maxAge: 0 });
            let existingSetCookie = res.getHeader('Set-Cookie') ?? [];
            if (typeof existingSetCookie === 'string') existingSetCookie = [existingSetCookie];
            else if (typeof existingSetCookie === 'number') existingSetCookie = [String(existingSetCookie)];
            res.setHeader('Set-Cookie', [...existingSetCookie, cookieHeader]);
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
      return res.status(401).json({ message: 'Unauthorized', detail: authError?.message });
    }

    console.log('[Balance API] ✅ User authenticated:', user.id);
    console.log('[Balance API] User email:', user.email);

    console.log('[Balance API] 📊 Querying database for user balance...');
    const { data, error } = await supabase
      .from('users')
      .select('piccoin_balance, id, email, created_at') // Seleciona os campos que precisas
      .eq('id', user.id)
      .single();

    console.log('[Balance API] Query executed - DB Error:', error?.message || 'None');
    console.log('[Balance API] Query executed - DB Data:', data ? JSON.stringify(data, null, 2) : 'null');

    if (error) {
      console.error('[Balance API] ❌ Error fetching balance from DB:', error);
      console.error('[Balance API] DB Error code:', error.code);
      console.error('[Balance API] DB Error message:', error.message);
      console.error('[Balance API] DB Error details:', error.details);
      return res.status(500).json({ message: 'Internal Server Error fetching balance' });
    }

    if (!data) {
      console.error('[Balance API] ❌ No data returned from users query for user ID:', user.id);
      // Isto pode acontecer se o utilizador existir no auth.users mas não na tua tabela public.users
      // O AuthProvider deveria ter criado o registo em public.users.
      return res.status(404).json({ message: 'User profile not found in database' });
    }

    const balance = data.piccoin_balance;
    console.log('[Balance API] 💰 Raw piccoin_balance from DB:', balance);
    console.log('[Balance API] 💰 Type of balance from DB:', typeof balance);
    console.log('[Balance API] 💰 Is balance from DB null?', balance === null);
    console.log('[Balance API] 💰 Is balance from DB undefined?', balance === undefined);
    
    const finalBalance = balance ?? 0; // Garante que é um número, mesmo que seja null/undefined da DB
    console.log('[Balance API] 💰 Final balance to return:', finalBalance);

    return res.status(200).json({
      balance: finalBalance
    });

  } catch (error) {
    console.error('[Balance API] ❌ Unexpected error in main try/catch block:', error);
    console.error('[Balance API] Error type:', typeof error);
    console.error('[Balance API] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Balance API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return res.status(500).json({ message: 'Internal Server Error in handler' });
  }
}