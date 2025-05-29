import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { applyRateLimit, communityViewRateLimiter } from '@/lib/rate-limit';
import { getPublicTransformationsSchema, COMMUNITY_ERROR_MESSAGES } from '@/lib/validations/community';

// =====================================================
// API: GET PUBLIC TRANSFORMATIONS
// Buscar transformações públicas com filtros e paginação
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
  error?: string;
};

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
    // 1. RATE LIMITING (Optional - for anonymous users)
    // =================================================
    try {
      const permitted = await applyRateLimit(req, res, communityViewRateLimiter);
      if (!permitted) {
        console.warn(`${endpointName} Rate limit exceeded for IP: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
        return;
      }
    } catch (rateLimitError) {
      // If rate limiting fails, continue (for now)
      console.warn(`${endpointName} Rate limit check failed:`, rateLimitError);
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

    // 3. CONSTRUIR QUERY BASE
    // =======================
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    // Count total aprovadas
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('transformations')
      .select('id', { count: 'exact', head: true })
      .eq('community_status', 'approved');

    if (countError) {
      console.error(`${endpointName} ❌ Count error:`, countError.message);
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    // 4. BUSCAR TRANSFORMAÇÕES COM DADOS RELACIONADOS
    // ===============================================
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
        submitted_for_publication_at,
        updated_at,
        created_at,
        user_id,
        style_requested,
        users!left(
          full_name,
          avatar_url
        ),
        styles!left(
          name
        )
      `)
      .eq('community_status', 'approved')
      .not('output_url', 'is', null);

    // 5. APLICAR FILTROS DE TIMEFRAME
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
          startDate = new Date(0); // All time
      }
      
      query = query.or(`submitted_for_publication_at.gte.${startDate.toISOString()},and(submitted_for_publication_at.is.null,updated_at.gte.${startDate.toISOString()})`);
    }

    // 6. APLICAR ORDENAÇÃO - FIXED to use the correct date logic
    // ==========================================================
    switch (validatedQuery.sort) {
      case 'recent':
        // Order by submitted_for_publication_at desc, fallback to updated_at desc
        query = query.order('submitted_for_publication_at', { ascending: false, nullsFirst: false })
                     .order('updated_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('like_count', { ascending: false })
                     .order('submitted_for_publication_at', { ascending: false, nullsFirst: false })
                     .order('updated_at', { ascending: false }); // Secondary sort
        break;
      case 'trending':
        // For trending, we'll use a combination of recent likes and recency
        query = query.order('like_count', { ascending: false })
                     .order('submitted_for_publication_at', { ascending: false, nullsFirst: false })
                     .order('updated_at', { ascending: false });
        break;
    }

    // 7. APLICAR PAGINAÇÃO
    // ====================
    const { data: transformations, error: fetchError } = await query
      .range(offset, offset + validatedQuery.limit - 1);

    if (fetchError) {
      console.error(`${endpointName} ❌ Fetch error:`, fetchError.message);
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    // 8. FORMATAR RESPOSTA
    // ====================
    const formattedTransformations: PublicTransformation[] = (transformations || []).map((t) => {
      const publicationDate = t.submitted_for_publication_at || t.updated_at || t.created_at;
      
      return {
        id: t.id,
        public_title: t.public_title,
        public_description: t.public_description,
        output_url: t.output_url,
        like_count: t.like_count || 0,
        comment_count: t.comment_count || 0,
        view_count: t.view_count || 0,
        published_at: publicationDate,
        user_id: t.user_id,
        user_full_name: t.users?.[0]?.full_name || null,
        user_avatar_url: t.users?.[0]?.avatar_url || null,
        style_name: t.styles?.[0]?.name || null,
        style_requested: t.style_requested,
      };
    });

    const totalPages = Math.ceil((totalCount || 0) / validatedQuery.limit);

    const pagination = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      total: totalCount || 0,
      total_pages: totalPages,
      has_next_page: validatedQuery.page < totalPages,
      has_prev_page: validatedQuery.page > 1,
    };

    console.log(`${endpointName} ✅ Retrieved ${formattedTransformations.length} public transformations`);

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