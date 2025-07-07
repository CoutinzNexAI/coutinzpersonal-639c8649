import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Admin client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função auxiliar para fazer o parse manual de um cookie específico
function getManuallyParsedCookie(cookieString: string, cookieName: string): string | undefined {
  if (!cookieString) return undefined;
  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name === cookieName) {
      return parts.slice(1).join('=');
    }
  }
  return undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Configurar cliente Supabase para autenticação
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookieStrToParse = req.headers.cookie ?? '';
            const parsedCookiesObjectOriginal = parseCookieHeader(cookieStrToParse);
            const originalValue = parsedCookiesObjectOriginal[name];

            if (name.startsWith('sb-') && name.includes('-auth-token') && originalValue === undefined) {
              const manualValue = getManuallyParsedCookie(cookieStrToParse, name);
              return manualValue;
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

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[Daily Transformations API] Auth error:', authError?.message);
      return res.status(401).json({ message: 'Unauthorized', detail: authError?.message });
    }

    const userId = user.id;
    const { transformationId } = req.body;

    // Validar parâmetros
    if (!transformationId) {
      return res.status(400).json({ message: 'transformationId é obrigatório' });
    }

    // Usar a função SQL para consumir uma transformação diária
    const { data, error } = await supabaseAdmin.rpc('use_daily_transformation', {
      p_user_id: userId,
      p_transformation_id: transformationId || null,
      p_limit: 10 // Limite diário padrão
    });

    if (error) {
      console.error('[API - use daily transformation] Erro SQL:', error);
      return res.status(500).json({ 
        message: 'Erro interno ao processar transformação diária',
        error: error.message 
      });
    }

    // Verificar se a operação foi bem-sucedida
    if (!data?.success) {
      return res.status(400).json({
        message: data?.message || 'Limite diário excedido',
        error: data?.error || 'daily_limit_exceeded',
        current_usage: data?.current_usage || 0,
        daily_limit: data?.daily_limit || 10
      });
    }

    // Retornar sucesso com informações atualizadas
    return res.status(200).json({
      success: true,
      message: 'Transformação registrada com sucesso',
      current_usage: data.current_usage,
      remaining_count: data.remaining_count,
      daily_limit: data.daily_limit,
      transformation_id: data.transformation_id
    });

  } catch (error) {
    console.error('[API - use daily transformation] Erro inesperado:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 