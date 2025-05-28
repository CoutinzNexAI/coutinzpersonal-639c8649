import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { applyRateLimit, communityLikeRateLimiter } from '@/lib/rate-limit';
import { toggleLikeSchema, COMMUNITY_ERROR_MESSAGES } from '@/lib/validations/community';

// =====================================================
// API: TOGGLE LIKE
// Dar/tirar like numa transformação da comunidade
// =====================================================

type ResponseData = {
  success?: boolean;
  is_liked?: boolean;
  like_count?: number;
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
  const endpointName = '[API toggle-like]';

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
    const permitted = await applyRateLimit(req, res, communityLikeRateLimiter, user.id);
    if (!permitted) {
      console.warn(`${endpointName} Rate limit exceeded for user: ${user.id}`);
      return;
    }

    // 3. VALIDAÇÃO DO INPUT
    // =====================
    let validatedData;
    try {
      validatedData = toggleLikeSchema.parse(req.body);
    } catch (error) {
      return res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Invalid input data'
      });
    }

    // 4. VERIFICAR SE A TRANSFORMAÇÃO EXISTE E ESTÁ PÚBLICA
    // ====================================================
    const { data: transformation, error: transformationError } = await supabaseAdmin
      .from('transformations')
      .select('id, community_status, like_count')
      .eq('id', validatedData.transformation_id)
      .eq('community_status', 'approved')
      .single();

    if (transformationError || !transformation) {
      return res.status(404).json({ 
        error: COMMUNITY_ERROR_MESSAGES.TRANSFORMATION_NOT_PUBLIC
      });
    }

    // 5. CHAMAR RPC FUNCTION PARA TOGGLE LIKE
    // ========================================
    const { data: result, error: rpcError } = await supabaseAdmin
      .rpc('toggle_transformation_like', {
        p_transformation_id: validatedData.transformation_id,
        p_user_id: user.id
      });

    if (rpcError) {
      console.error(`${endpointName} ❌ RPC error:`, rpcError.message);
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    // 6. BUSCAR CONTAGEM ATUALIZADA
    // ==============================
    const { data: updatedTransformation, error: fetchError } = await supabaseAdmin
      .from('transformations')
      .select('like_count')
      .eq('id', validatedData.transformation_id)
      .single();

    if (fetchError) {
      console.error(`${endpointName} ❌ Fetch updated count error:`, fetchError.message);
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    // 7. VERIFICAR SE O UTILIZADOR TEM LIKE ATIVO
    // ============================================
    const { data: currentLike, error: likeCheckError } = await supabaseAdmin
      .from('transformation_likes')
      .select('id')
      .eq('transformation_id', validatedData.transformation_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (likeCheckError) {
      console.error(`${endpointName} ❌ Like check error:`, likeCheckError.message);
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    const isLiked = !!currentLike;
    const finalLikeCount = updatedTransformation.like_count || 0;

    console.log(`${endpointName} ✅ Toggle like successful for user ${user.id} on transformation ${validatedData.transformation_id}. Now liked: ${isLiked}, count: ${finalLikeCount}`);

    return res.status(200).json({
      success: true,
      is_liked: isLiked,
      like_count: finalLikeCount,
      message: isLiked ? 'Like adicionado' : 'Like removido'
    });

  } catch (error) {
    console.error(`${endpointName} 💥 Unexpected error:`, error);
    return res.status(500).json({ 
      error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
    });
  }
} 