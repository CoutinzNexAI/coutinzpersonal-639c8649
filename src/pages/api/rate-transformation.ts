import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/admin';

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  rating?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transformationId, rating } = req.body;

  // Validação básica
  if (!transformationId || typeof rating !== 'number' || ![1, -1, 0].includes(rating)) {
    return res.status(400).json({ error: 'Invalid transformationId or rating' });
  }

  try {
    // Autenticação do utilizador usando a interface correta
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return parseCookieHeader(req.headers.cookie ?? '').map(cookie => ({
              name: cookie.name,
              value: cookie.value || ''
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.appendHeader('Set-Cookie', serializeCookieHeader(name, value, options))
            );
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verificar se a transformação pertence ao utilizador
    const { data: transformation, error: fetchError } = await supabaseAdmin
      .from('transformations')
      .select('id, user_id, user_rating')
      .eq('id', transformationId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !transformation) {
      return res.status(404).json({ error: 'Transformation not found or access denied' });
    }

    // Atualizar o rating
    const { error: updateError } = await supabaseAdmin
      .from('transformations')
      .update({ user_rating: rating })
      .eq('id', transformationId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating rating:', updateError);
      return res.status(500).json({ error: 'Failed to update rating' });
    }

    const message = rating === 1 ? 'Like registado!' : rating === -1 ? 'Dislike registado!' : 'Rating removido!';

    return res.status(200).json({
      success: true,
      message,
      rating
    });

  } catch (error) {
    console.error('Error in rate-transformation API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 