import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { applyRateLimit, communityPrivateListRateLimiter } from '@/lib/rate-limit';
import { getMyPrivateTransformationsSchema, COMMUNITY_ERROR_MESSAGES } from '@/lib/validations/community';

// =====================================================
// API: GET MY PRIVATE TRANSFORMATIONS
// Buscar transformações privadas do utilizador para submeter
// =====================================================

type PrivateTransformation = {
  id: string;
  input_url: string;
  output_url: string;
  style_name?: string;
  created_at: string;
  public_title?: string;
  public_description?: string;
};

type ResponseData = {
  success?: boolean;
  transformations?: PrivateTransformation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
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
  const endpointName = '[API get-my-private-transformations]';

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ 
      error: 'Only GET requests are allowed'
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
    const permitted = await applyRateLimit(req, res, communityPrivateListRateLimiter, user.id);
    if (!permitted) {
      console.warn(`${endpointName} Rate limit exceeded for user: ${user.id}`);
      return;
    }

    // 3. VALIDAÇÃO DE QUERY PARAMETERS
    // =================================
    let validatedQuery;
    try {
      validatedQuery = getMyPrivateTransformationsSchema.parse(req.query);
    } catch (error) {
      return res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Invalid query parameters'
      });
    }

    // 4. BUSCAR TRANSFORMAÇÕES PRIVADAS
    // =================================
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    // Count total private transformations
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('transformations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('community_status', 'private');

    if (countError) {
      console.error(`${endpointName} ❌ Count error:`, countError.message);
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    // Fetch transformations with style data
    const { data: transformations, error: fetchError } = await supabaseAdmin
      .from('transformations')
      .select(`
        id,
        input_url,
        output_url,
        created_at,
        public_title,
        public_description,
        styles!inner(
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('community_status', 'private')
      .order('created_at', { ascending: false })
      .range(offset, offset + validatedQuery.limit - 1);

    if (fetchError) {
      console.error(`${endpointName} ❌ Fetch error:`, fetchError.message);
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    // 5. FORMATAR RESPOSTA
    // ====================
    const formattedTransformations: PrivateTransformation[] = (transformations || []).map(t => ({
      id: t.id,
      input_url: t.input_url,
      output_url: t.output_url,
      style_name: (t.styles as any)?.name || 'Estilo Desconhecido',
      created_at: t.created_at,
      public_title: t.public_title,
      public_description: t.public_description,
    }));

    const totalPages = Math.ceil((totalCount || 0) / validatedQuery.limit);

    const pagination = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      total: totalCount || 0,
      total_pages: totalPages,
      has_next_page: validatedQuery.page < totalPages,
      has_prev_page: validatedQuery.page > 1,
    };

    console.log(`${endpointName} ✅ Retrieved ${formattedTransformations.length} private transformations for user ${user.id}`);

    return res.status(200).json({
      success: true,
      transformations: formattedTransformations,
      pagination
    });

  } catch (error) {
    console.error(`${endpointName} 💥 Unexpected error:`, error);
    return res.status(500).json({ 
      error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
    });
  }
} 