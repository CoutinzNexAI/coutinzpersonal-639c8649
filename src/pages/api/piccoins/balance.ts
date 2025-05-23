// src/pages/api/piccoins/balance.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

// Função auxiliar para fazer o parse manual de um cookie específico
function getManuallyParsedCookie(cookieString: string, cookieName: string): string | undefined {
  if (!cookieString) return undefined;
  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name === cookieName) {
      return parts.slice(1).join('='); // Lida com valores de cookie que podem ter '='
    }
  }
  return undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[Balance API] 🚀 Handler started');
  
  const rawCookieHeaderFromRequest = req.headers.cookie ?? '';
  console.log('[Balance API] RAW COOKIE HEADER FROM REQUEST (at handler start):', rawCookieHeaderFromRequest);

  if (req.method !== 'GET') {
    console.log('[Balance API] ❌ Method not allowed:', req.method);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  console.log('[Balance API] ✅ Method is GET');
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
            const cookieStrToParse = req.headers.cookie ?? '';
            
            // Tentar primeiro com o parseCookieHeader original para logging
            const parsedCookiesObjectOriginal = parseCookieHeader(cookieStrToParse);
            console.log(`[Balance API] 🍪 Cookie Getter - Attempting to get (original parse): "${name}"`);
            console.log('[Balance API] 🍪 Cookie Getter - Result of parseCookieHeader (keys found):', Object.keys(parsedCookiesObjectOriginal).join(', ') || 'No keys parsed');
            const originalValue = parsedCookiesObjectOriginal[name];
            console.log(`[Balance API] 🍪 Cookie Getter - Value for "${name}" (original parse): ${originalValue !== undefined ? `Found` : 'Not found (undefined)'}`);

            // Se for um cookie de autenticação do Supabase e o parse original falhou, tentar parse manual
            if (name.startsWith('sb-') && name.includes('-auth-token') && originalValue === undefined) {
              console.log(`[Balance API] 🍪 Cookie Getter - Original parse failed for Supabase token "${name}". Attempting manual parse.`);
              const manualValue = getManuallyParsedCookie(cookieStrToParse, name);
              console.log(`[Balance API] 🍪 Cookie Getter - Value for "${name}" (manual parse): ${manualValue !== undefined ? `Found (length: ${String(manualValue).length})` : 'Not found (undefined)'}`);
              return manualValue;
            }
            
            return originalValue; // Retorna o valor do parse original se não for um token Supabase ou se foi encontrado
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
      .select('piccoin_balance, id, email, created_at')
      .eq('id', user.id)
      .single();

    console.log('[Balance API] Query executed - DB Error:', error?.message || 'None');
    console.log('[Balance API] Query executed - DB Data:', data ? JSON.stringify(data, null, 2) : 'null');

    if (error) {
      console.error('[Balance API] ❌ Error fetching balance from DB:', error);
      return res.status(500).json({ message: 'Internal Server Error fetching balance' });
    }

    if (!data) {
      console.error('[Balance API] ❌ No data returned from users query for user ID:', user.id);
      return res.status(404).json({ message: 'User profile not found in database' });
    }

    const balance = data.piccoin_balance;
    console.log('[Balance API] 💰 Raw piccoin_balance from DB:', balance);
    
    const finalBalance = balance ?? 0;
    console.log('[Balance API] 💰 Final balance to return:', finalBalance);

    return res.status(200).json({
      balance: finalBalance
    });

  } catch (error) {
    console.error('[Balance API] ❌ Unexpected error in main try/catch block:', error);
    return res.status(500).json({ message: 'Internal Server Error in handler' });
  }
}
