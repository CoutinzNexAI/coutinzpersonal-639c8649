import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { applyRateLimit, communitySubmitRateLimiter } from '@/lib/rate-limit';
import { 
  submitPublicationSchema, 
  COMMUNITY_ERROR_MESSAGES,
  validateContentSafety
} from '@/lib/validations/community';

// =====================================================
// API: SUBMIT FOR PUBLICATION
// Submeter transformação para moderação na comunidade
// =====================================================

type ResponseData = {
  success?: boolean;
  transformation_id?: string;
  message?: string;
  error?: string;
};

// Função auxiliar para parse manual de cookies
function getManuallyParsedCookie(cookieString: string, cookieName: string): string | undefined {
  if (!cookieString) return undefined;
  const cookiesArray = cookieString.split(';');
  for (const cookie of cookiesArray) {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name === cookieName) {
      return parts.slice(1).join('=');
    }
  }
  return undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const endpointName = '[API submit-for-publication]';

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ 
      error: 'Only POST requests are allowed'
    });
  }

  try {
    // 1. AUTENTICAÇÃO
    // ===============
    const supabaseAuthClient = createServerClient(
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
            if (typeof setCookieHeader === 'string') setCookieHeader = [setCookieHeader];
            else if (typeof setCookieHeader === 'number') setCookieHeader = [String(setCookieHeader)];
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

    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ 
        error: COMMUNITY_ERROR_MESSAGES.UNAUTHORIZED
      });
    }

    // 2. RATE LIMITING
    // ================
    const permitted = await applyRateLimit(req, res, communitySubmitRateLimiter, user.id);
    if (!permitted) {
      console.warn(`${endpointName} Rate limit exceeded for user: ${user.id}`);
      return;
    }

    // 3. VALIDAÇÃO DO INPUT
    // =====================
    let validatedData;
    try {
      validatedData = submitPublicationSchema.parse(req.body);
    } catch (error) {
      return res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Invalid input data'
      });
    }

    // 4. VERIFICAR OWNERSHIP E STATUS DA TRANSFORMAÇÃO
    // ================================================
    const { data: transformation, error: transformationError } = await supabaseAdmin
      .from('transformations')
      .select('id, user_id, status, community_status, output_url')
      .eq('id', validatedData.transformationId)
      .eq('user_id', user.id) // Ownership check
      .single();

    if (transformationError || !transformation) {
      return res.status(404).json({ 
        error: 'Transformação não encontrada ou não te pertence'
      });
    }

    // Verificar se está completa
    if (transformation.status !== 'completed') {
      return res.status(400).json({ 
        error: COMMUNITY_ERROR_MESSAGES.TRANSFORMATION_NOT_COMPLETED
      });
    }

    // Verificar se já foi submetida
    if (transformation.community_status !== 'private') {
      return res.status(400).json({ 
        error: COMMUNITY_ERROR_MESSAGES.TRANSFORMATION_ALREADY_SUBMITTED
      });
    }

    // 5. VALIDAÇÃO DE CONTEÚDO SEGURO
    // ================================
    if (validatedData.public_title) {
      const titleSafety = validateContentSafety(validatedData.public_title);
      if (!titleSafety.isValid) {
        return res.status(400).json({ 
          error: `Título: ${titleSafety.reason}`
        });
      }
    }

    if (validatedData.public_description) {
      const descSafety = validateContentSafety(validatedData.public_description);
      if (!descSafety.isValid) {
        return res.status(400).json({ 
          error: `Descrição: ${descSafety.reason}`
        });
      }
    }

    // 6. VERIFICAR LIMITES ANTI-GAMING (Simplified)
    // ==============================================
    
    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const { count: todaySubmissions } = await supabaseAdmin
      .from('transformations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('community_status', ['pending_approval', 'approved'])
      .gte('updated_at', `${today}T00:00:00.000Z`)
      .lte('updated_at', `${today}T23:59:59.999Z`);

    if (todaySubmissions && todaySubmissions >= 10) { // Simple daily limit
      return res.status(429).json({ 
        error: COMMUNITY_ERROR_MESSAGES.DAILY_LIMIT_REACHED
      });
    }

    // Weekly limits removed since piccoin rewards no longer exist

    // 7. ATUALIZAR TRANSFORMAÇÃO PARA APPROVED (DIRETO NA COMUNIDADE)
    // ===============================================================
    const { error: updateError } = await supabaseAdmin
      .from('transformations')
      .update({
        community_status: 'approved', // 🎉 Direto na comunidade!
        public_title: validatedData.public_title?.trim() || null,
        public_description: validatedData.public_description?.trim() || null,
        published_at: new Date().toISOString(), // 📅 Data de publicação
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.transformationId)
      .eq('user_id', user.id); // Double-check ownership

    if (updateError) {
      console.error(`${endpointName} ❌ Update error:`, updateError.message);
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    // 8. WEEKLY LIMITS UPDATE (Removed piccoin rewards)
    // =================================================

    // Weekly limits update removed since piccoin rewards no longer exist


    return res.status(200).json({
      success: true,
      transformation_id: validatedData.transformationId,
      message: 'Transformação publicada na comunidade com sucesso!'
    });

  } catch (error) {
    console.error(`${endpointName} 💥 Unexpected error:`, error);
    return res.status(500).json({ 
      error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
    });
  }
} 