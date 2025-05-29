import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { applyRateLimit, communitySubmitRateLimiter } from '@/lib/rate-limit';
import { 
  submitPublicationSchema, 
  COMMUNITY_ERROR_MESSAGES,
  validateContentSafety,
  ANTI_GAMING_LIMITS,
  getWeekStart 
} from '@/lib/validations/community';

// =====================================================
// API: SUBMIT FOR PUBLICATION
// Submeter transformação para moderação na comunidade
// =====================================================

type ResponseData = {
  success?: boolean;
  transformation_id?: string;
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

    // 6. VERIFICAR LIMITES ANTI-GAMING
    // =================================
    const weekStart = getWeekStart(new Date());
    
    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const { count: todaySubmissions } = await supabaseAdmin
      .from('transformations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('community_status', ['pending_approval', 'approved'])
      .gte('updated_at', `${today}T00:00:00.000Z`)
      .lte('updated_at', `${today}T23:59:59.999Z`);

    if (todaySubmissions && todaySubmissions >= ANTI_GAMING_LIMITS.MAX_PUBLICATIONS_PER_DAY) {
      return res.status(429).json({ 
        error: COMMUNITY_ERROR_MESSAGES.DAILY_LIMIT_REACHED
      });
    }

    // Check weekly bonus limit
    const { data: weeklyLimits } = await supabaseAdmin
      .from('user_weekly_limits')
      .select('publications_this_week')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStart)
      .single();

    const publicationsThisWeek = weeklyLimits?.publications_this_week || 0;
    const canEarnBonus = publicationsThisWeek < ANTI_GAMING_LIMITS.MAX_PUBLICATIONS_BONUS_PER_WEEK;

    console.log(`${endpointName} 📊 Weekly limits check:`, {
      user_id: user.id,
      week_start_date: weekStart,
      publications_this_week: publicationsThisWeek,
      max_allowed: ANTI_GAMING_LIMITS.MAX_PUBLICATIONS_BONUS_PER_WEEK,
      can_earn_bonus: canEarnBonus
    });

    // 7. ATUALIZAR TRANSFORMAÇÃO PARA PENDING_APPROVAL
    // =================================================
    const { error: updateError } = await supabaseAdmin
      .from('transformations')
      .update({
        community_status: 'pending_approval',
        public_title: validatedData.public_title?.trim() || null,
        public_description: validatedData.public_description?.trim() || null,
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

    // 8. CONCEDER PICCOIN SE ELEGÍVEL
    // ===============================
    let earnedPiccoin = false;
    console.log(`${endpointName} 🪙 PicCoin check: canEarnBonus = ${canEarnBonus}`);
    
    if (canEarnBonus) {
      try {
        console.log(`${endpointName} 🔄 Attempting to grant PicCoin to user ${user.id}...`);
        
        const { error: rewardError } = await supabaseAdmin
          .rpc('earn_piccoins', {
            p_user_id: user.id,
            p_amount: 1,
            p_type: 'earned',
            p_reference_id: validatedData.transformationId,
            p_description: 'Publicação submetida para aprovação'
          });

        if (rewardError) {
          console.warn(`${endpointName} ⚠️ Failed to grant PicCoin:`, rewardError.message);
        } else {
          earnedPiccoin = true;
          console.log(`${endpointName} 🪙 Granted 1 PicCoin to user ${user.id} for publication submission`);
        }
      } catch (incentiveError) {
        console.warn(`${endpointName} ⚠️ Incentive error:`, incentiveError);
        // Don't fail the submission for this
      }
    } else {
      console.log(`${endpointName} ⏸️ Cannot grant PicCoin - user already has ${publicationsThisWeek} publications this week`);
    }

    // 9. ATUALIZAR WEEKLY LIMITS
    // ===========================
    try {
      await supabaseAdmin
        .from('user_weekly_limits')
        .upsert({
          user_id: user.id,
          week_start_date: weekStart,
          publications_this_week: publicationsThisWeek + 1,
          last_action_at: new Date().toISOString(),
        }, { 
          onConflict: 'user_id,week_start_date',
          ignoreDuplicates: false 
        });
    } catch (limitsError) {
      console.warn(`${endpointName} ⚠️ Failed to update weekly limits:`, limitsError);
      // Don't fail the submission for this
    }

    console.log(`${endpointName} ✅ Transformation ${validatedData.transformationId} submitted for publication by user ${user.id}. Earned PicCoin: ${earnedPiccoin}`);

    return res.status(200).json({
      success: true,
      transformation_id: validatedData.transformationId,
      earned_piccoin: earnedPiccoin,
      message: earnedPiccoin 
        ? 'Transformação submetida para aprovação e 1 PicCoin ganho!' 
        : 'Transformação submetida para aprovação. Aguarda moderação.'
    });

  } catch (error) {
    console.error(`${endpointName} 💥 Unexpected error:`, error);
    return res.status(500).json({ 
      error: COMMUNITY_ERROR_MESSAGES.SERVER_ERROR
    });
  }
} 