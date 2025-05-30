import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { applyRateLimit, communityCommentRateLimiter } from '@/lib/rate-limit';
import { 
  getCommentsSchema, 
  commentSchema,
  COMMUNITY_ERROR_MESSAGES,
  validateContentSafety,
} from '@/lib/validations/community';

// =====================================================
// API: COMMUNITY COMMENTS
// GET: Buscar comentários | POST: Adicionar comentário
// =====================================================

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_full_name?: string;
  user_avatar_url?: string;
  parent_comment_id?: string;
  replies?: Comment[];
};

type GetResponseData = {
  success?: boolean;
  comments?: Comment[];
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

type PostResponseData = {
  success?: boolean;
  comment?: Comment;
  earned_piccoin?: boolean;
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
  res: NextApiResponse<GetResponseData | PostResponseData>
) {
  const endpointName = '[API comments]';

  if (req.method === 'GET') {
    return handleGetComments(req, res);
  } else if (req.method === 'POST') {
    return handlePostComment(req, res);
  } else {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ 
      error: 'Only GET and POST requests are allowed'
    });
  }
}

// GET COMMENTS
// ============
async function handleGetComments(
  req: NextApiRequest,
  res: NextApiResponse<GetResponseData>
) {
  const endpointName = '[API comments GET]';

  try {
    // 1. VALIDAÇÃO DE QUERY PARAMETERS
    // =================================
    let validatedQuery;
    try {
      validatedQuery = getCommentsSchema.parse(req.query);
    } catch (error) {
      return res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Invalid query parameters'
      });
    }

    // 2. VERIFICAR SE A TRANSFORMAÇÃO EXISTE E ESTÁ PÚBLICA
    // ====================================================
    const { data: transformation, error: transformationError } = await supabaseAdmin
      .from('transformations')
      .select('id, community_status')
      .eq('id', validatedQuery.transformation_id)
      .eq('community_status', 'approved')
      .single();

    if (transformationError || !transformation) {
      return res.status(404).json({ 
        error: COMMUNITY_ERROR_MESSAGES.TRANSFORMATION_NOT_PUBLIC
      });
    }

    // 3. BUSCAR COMENTÁRIOS COM PAGINAÇÃO E DADOS DO UTILIZADOR
    // ========================================================
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    // Count total
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('community_comments')
      .select('id', { count: 'exact', head: true })
      .eq('transformation_id', validatedQuery.transformation_id)
      .is('parent_comment_id', null)
      .eq('is_hidden_by_admin', false); // Only show non-hidden comments

    if (countError) {
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    // FIXED: Use simpler select without complex JOIN to avoid TS issues
    let query = supabaseAdmin
      .from('community_comments')
      .select(`
        id,
        comment_text,
        created_at,
        user_id,
        parent_comment_id
      `)
      .eq('transformation_id', validatedQuery.transformation_id)
      .is('parent_comment_id', null)
      .eq('is_hidden_by_admin', false);

    // Apply sorting
    switch (validatedQuery.sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'popular':
        // For now, just use newest as we don't have comment likes yet
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data: comments, error: fetchError } = await query
      .range(offset, offset + validatedQuery.limit - 1);

    if (fetchError) {
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    // 4. BUSCAR DADOS DOS UTILIZADORES SEPARADAMENTE
    // ==============================================
    const userIds = [...new Set((comments || []).map(c => c.user_id))];
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (usersError) {
      console.warn(`${endpointName} ⚠️ Failed to fetch users data:`, usersError.message);
    }

    // Create a user lookup map
    const userMap = new Map((users || []).map(u => [u.id, u]));

    // 5. FORMATAR RESPOSTA - FIXED mapping
    // ====================================
    const formattedComments: Comment[] = (comments || []).map((c) => {
      const user = userMap.get(c.user_id);
      return {
        id: c.id,
        content: c.comment_text, // Map comment_text to content for frontend
        created_at: c.created_at,
        user_id: c.user_id,
        user_full_name: user?.full_name || null,
        user_avatar_url: user?.avatar_url || null,
        parent_comment_id: c.parent_comment_id,
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

    console.log(`${endpointName} ✅ Retrieved ${formattedComments.length} comments for transformation ${validatedQuery.transformation_id}`);

    return res.status(200).json({
      success: true,
      comments: formattedComments,
      pagination
    });

  } catch (error) {
    console.error(`${endpointName} 💥 Unexpected error:`, error);
    return res.status(500).json({ 
      error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
    });
  }
}

// POST COMMENT
// ============
async function handlePostComment(
  req: NextApiRequest,
  res: NextApiResponse<PostResponseData>
) {
  const endpointName = '[API comments POST]';

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
    const permitted = await applyRateLimit(req, res, communityCommentRateLimiter, user.id);
    if (!permitted) {
      console.warn(`${endpointName} Rate limit exceeded for user: ${user.id}`);
      return;
    }

    // 3. VALIDAÇÃO DO INPUT - FIXED to handle both content and comment_text
    // =============================================
    let validatedData;
    try {
      // Accept both 'content' (from frontend) and 'comment_text' (from schema)
      const normalizedBody = {
        ...req.body,
        comment_text: req.body.content || req.body.comment_text
      };
      validatedData = commentSchema.parse(normalizedBody);
    } catch (error) {
      return res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Invalid input data'
      });
    }

    // 4. VERIFICAR SE A TRANSFORMAÇÃO EXISTE E ESTÁ PÚBLICA
    // ====================================================
    const { data: transformation, error: transformationError } = await supabaseAdmin
      .from('transformations')
      .select('id, community_status')
      .eq('id', validatedData.transformation_id)
      .eq('community_status', 'approved')
      .single();

    if (transformationError || !transformation) {
      return res.status(404).json({ 
        error: COMMUNITY_ERROR_MESSAGES.TRANSFORMATION_NOT_PUBLIC
      });
    }

    // 5. VALIDAÇÃO DE CONTEÚDO
    // =========================
    const contentSafety = validateContentSafety(validatedData.comment_text);
    if (!contentSafety.isValid) {
      return res.status(400).json({ 
        error: contentSafety.reason || COMMUNITY_ERROR_MESSAGES.CONTENT_VALIDATION_FAILED
      });
    }

    // 6. INSERIR COMENTÁRIO - FIXED to use correct column name
    // =======================================================
    const { data: newComment, error: insertError } = await supabaseAdmin
      .from('community_comments')
      .insert({
        transformation_id: validatedData.transformation_id,
        user_id: user.id,
        comment_text: validatedData.comment_text.trim(), // Use comment_text column
        parent_comment_id: validatedData.parent_comment_id || null,
      })
      .select(`
        id,
        comment_text,
        created_at,
        user_id,
        parent_comment_id
      `)
      .single();

    if (insertError) {
      console.error(`${endpointName} ❌ Insert error:`, insertError.message);
      return res.status(500).json({ 
        error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
      });
    }

    // 7. BUSCAR DADOS DO UTILIZADOR SEPARADAMENTE PARA RESPOSTA
    // ========================================================
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.warn(`${endpointName} ⚠️ Failed to fetch user data:`, userError.message);
    }

    // 8. LÓGICA DE INCENTIVOS (PRIMEIRO COMENTÁRIO DA SEMANA)
    // ======================================================
    let earnedPiccoin = false;
    try {
      // Check user's comments for this week
      const weekStart = new Date();
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
      const weekStartDate = new Date(weekStart.setDate(diff));
      weekStartDate.setHours(0, 0, 0, 0);
      const weekStartStr = weekStartDate.toISOString().split('T')[0];

      // Get or create weekly limits record
      const { data: weeklyLimits } = await supabaseAdmin
        .from('user_weekly_limits')
        .select('comments_for_bonus_count')
        .eq('user_id', user.id)
        .eq('week_start_date', weekStartStr)
        .single();

      const commentsThisWeek = weeklyLimits?.comments_for_bonus_count || 0;

      // Grant PicCoin for first comment of the week
      if (commentsThisWeek === 0) {
        const { error: rewardError } = await supabaseAdmin
          .rpc('earn_piccoins', {
            p_user_id: user.id,
            p_amount: 1,
            p_type: 'earned',
            p_reference_id: newComment.id,
            p_description: 'Primeiro comentário da semana'
          });

        if (rewardError) {
          console.warn(`${endpointName} ⚠️ Failed to grant PicCoin:`, rewardError.message);
        } else {
          earnedPiccoin = true;
          console.log(`${endpointName} 🪙 Granted 1 PicCoin to user ${user.id} for first comment of the week`);
        }
      }

      // Update weekly limits counter
      await supabaseAdmin
        .from('user_weekly_limits')
        .upsert({
          user_id: user.id,
          week_start_date: weekStartStr,
          comments_for_bonus_count: commentsThisWeek + 1,
          last_action_at: new Date().toISOString(),
        }, { 
          onConflict: 'user_id,week_start_date',
          ignoreDuplicates: false 
        });

    } catch (incentiveError) {
      console.warn(`${endpointName} ⚠️ Incentive logic error:`, incentiveError);
      // Don't fail the comment creation for this
    }

    // 9. FORMATAR RESPOSTA - FIXED mapping
    // ====================================
    const formattedComment: Comment = {
      id: newComment.id,
      content: newComment.comment_text, // Map comment_text to content for frontend
      created_at: newComment.created_at,
      user_id: newComment.user_id,
      user_full_name: userData?.full_name || null,
      user_avatar_url: userData?.avatar_url || null,
      parent_comment_id: newComment.parent_comment_id,
    };

    console.log(`${endpointName} ✅ Comment created successfully by user ${user.id} on transformation ${validatedData.transformation_id}`);

    return res.status(201).json({
      success: true,
      comment: formattedComment,
      earned_piccoin: earnedPiccoin,
      message: earnedPiccoin ? 'Comentário adicionado e 1 PicCoin ganho! 🪙' : 'Comentário adicionado'
    });

  } catch (error) {
    console.error(`${endpointName} 💥 Unexpected error:`, error);
    return res.status(500).json({ 
      error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
    });
  }
} 