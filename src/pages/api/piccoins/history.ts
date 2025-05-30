import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { NextApiRequest, NextApiResponse } from 'next';

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
            const parsedCookiesObjectOriginal = parseCookieHeader(cookieStrToParse);
            const originalValue = parsedCookiesObjectOriginal[name];
            
            // Se for um cookie de autenticação do Supabase e o parse original falhou, tentar parse manual
            if (name.startsWith('sb-') && name.includes('-auth-token') && originalValue === undefined) {
              return getManuallyParsedCookie(cookieStrToParse, name);
            }
            
            return originalValue;
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
      return res.status(401).json({ message: 'Unauthorized', detail: authError?.message });
    }

    const { data, error } = await supabase
      .from('piccoin_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    return res.status(200).json({ transactions: data || [] });

  } catch (error) {
    console.error('History API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 