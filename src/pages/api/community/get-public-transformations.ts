import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { applyRateLimit, communityViewRateLimiter } from '@/lib/rate-limit';
import { getPublicTransformationsSchema, COMMUNITY_ERROR_MESSAGES } from '@/lib/validations/community';

// =====================================================
// API: GET PUBLIC TRANSFORMATIONS
// Galeria pública da comunidade com sorting e filtros
// =====================================================

type PublicTransformation = {
  id: string;
  public_title?: string;
  public_description?: string;
  output_url: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  published_at: string;
  user_id: string;
  user_full_name?: string;
  user_avatar_url?: string;
  style_name?: string;
  style_requested: string;
};

type ResponseData = {
  success?: boolean;
  transformations?: PublicTransformation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  filters?: {
    sort: string;
    timeframe: string;
  };
  error?: string;
};

// Interface for database response
interface TransformationWithJoins {
  id: string;
  public_title?: string;
  public_description?: string;
  output_url: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  published_at: string;
  user_id: string;
  style_requested: string;
  users: {
    full_name?: string;
    avatar_url?: string;
  }[];
  styles: {
    name: string;
  }[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const endpointName = '[API get-public-transformations]';

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ 
      error: 'Only GET requests are allowed'
    });
  }

  try {
    // 1. RATE LIMITING (sem autenticação para galeria pública)
    // ========================================================
    const permitted = await applyRateLimit(req, res, communityViewRateLimiter);
    if (!permitted) {
      console.warn(`${endpointName} Rate limit exceeded for IP: ${req.socket.remoteAddress}`);
      return;
    }

    // 2. VALIDAÇÃO DE QUERY PARAMETERS
    // =================================
    let validatedQuery;
    try {
      validatedQuery = getPublicTransformationsSchema.parse(req.query);
    } catch (error) {
      return res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Invalid query parameters'
      });
    }

    // 3. CONSTRUIR QUERY BASE USANDO TABELAS DIRETAMENTE
    // ==================================================
    let query = supabaseAdmin
      .from('transformations')
      .select(`
        id,
        public_title,
        public_description,
        output_url,
        like_count,
        comment_count,
        view_count,
        published_at,
        user_id,
        style_requested,
        users!inner(
          full_name,
          avatar_url
        ),
        styles!inner(
          name
        )
      `, { count: 'exact' })
      .eq('community_status', 'approved')
      .eq('status', 'completed');

    // 4. APLICAR FILTROS DE TIMEFRAME
    // ===============================
    if (validatedQuery.timeframe !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (validatedQuery.timeframe) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // Fallback para todos
      }

      query = query.gte('published_at', startDate.toISOString());
    }

    // 5. APLICAR FILTROS DE PESQUISA
    // ===============================
    if (validatedQuery.search && validatedQuery.search.trim()) {
      const searchTerm = validatedQuery.search.trim();
      query = query.or(`public_title.ilike.%${searchTerm}%,public_description.ilike.%${searchTerm}%,style_requested.ilike.%${searchTerm}%`);
    }

    // 6. APLICAR SORTING
    // ==================
    switch (validatedQuery.sort) {
      case 'recent':
        query = query.order('published_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('like_count', { ascending: false })
                    .order('published_at', { ascending: false }); // Tie-breaker
        break;
      case 'trending':
        // Algoritmo simples de trending: peso por likes recentes
        // Para simplificar, vamos usar like_count + comment_count como proxy
        query = query.order('like_count', { ascending: false })
                    .order('comment_count', { ascending: false })
                    .order('published_at', { ascending: false });
        break;
      default:
        query = query.order('published_at', { ascending: false });
    }

    // 7. APLICAR PAGINAÇÃO
    // ====================
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    query = query.range(offset, offset + validatedQuery.limit - 1);

    // 8. EXECUTAR QUERY
    // =================
    const { data: transformations, error: fetchError, count: totalCount } = await query;

    if (fetchError) {
      console.error(`${endpointName} ❌ Fetch error:`, fetchError.message);
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    // 9. FORMATAR RESPOSTA
    // ====================
    const formattedTransformations: PublicTransformation[] = (transformations || []).map((t: TransformationWithJoins) => ({
      id: t.id,
      public_title: t.public_title,
      public_description: t.public_description,
      output_url: t.output_url,
      like_count: t.like_count || 0,
      comment_count: t.comment_count || 0,
      view_count: t.view_count || 0,
      published_at: t.published_at,
      user_id: t.user_id,
      user_full_name: t.users?.[0]?.full_name || null,
      user_avatar_url: t.users?.[0]?.avatar_url || null,
      style_name: t.styles?.[0]?.name || 'Estilo Desconhecido',
      style_requested: t.style_requested,
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

    const filters = {
      sort: validatedQuery.sort,
      timeframe: validatedQuery.timeframe,
    };

    console.log(`${endpointName} ✅ Retrieved ${formattedTransformations.length} public transformations (page ${validatedQuery.page}, sort: ${validatedQuery.sort}, timeframe: ${validatedQuery.timeframe})`);

    return res.status(200).json({
      success: true,
      transformations: formattedTransformations,
      pagination,
      filters
    });

  } catch (error) {
    console.error(`${endpointName} 💥 Unexpected error:`, error);
    return res.status(500).json({ 
      error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
    });
  }
} 