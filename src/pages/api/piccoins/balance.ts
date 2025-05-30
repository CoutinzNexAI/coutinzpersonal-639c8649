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
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }


  try {    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookieStrToParse = req.headers.cookie ?? '';
            
            // Tentar primeiro com o parseCookieHeader original para logging
            const parsedCookiesObjectOriginal = parseCookieHeader(cookieStrToParse);
            const originalValue = parsedCookiesObjectOriginal[name];

            // Se for um cookie de autenticação do Supabase e o parse original falhou, tentar parse manual
            if (name.startsWith('sb-') && name.includes('-auth-token') && originalValue === undefined) {
              const manualValue = getManuallyParsedCookie(cookieStrToParse, name);
              return manualValue;
            }
            
            return originalValue; // Retorna o valor do parse original se não for um token Supabase ou se foi encontrado
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
          remove: (name: string, options) => {
            const cookieHeader = serializeCookieHeader(name, '', { ...options, maxAge: 0 });
            let existingSetCookie = res.getHeader('Set-Cookie') ?? [];
            if (typeof existingSetCookie === 'string') existingSetCookie = [existingSetCookie];
            else if (typeof existingSetCookie === 'number') existingSetCookie = [String(existingSetCookie)];
            res.setHeader('Set-Cookie', [...existingSetCookie, cookieHeader]);
          },
        },
      }
    );


    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized', detail: authError?.message });
    }

    const { data, error } = await supabase
      .from('users')
      .select('piccoin_balance, id, email, created_at')
      .eq('id', user.id)
      .single();

    if (error) {
      return res.status(500).json({ message: 'Internal Server Error fetching balance' });
    }

    if (!data) {
      return res.status(404).json({ message: 'User profile not found in database' });
    }

    const balance = data.piccoin_balance;
    
    const finalBalance = balance ?? 0;

    return res.status(200).json({
      balance: finalBalance
    });

  } catch (error) {
    console.error('[Balance API] ❌ Unexpected error in main try/catch block:', error);
    return res.status(500).json({ message: 'Internal Server Error in handler' });
  }
}
