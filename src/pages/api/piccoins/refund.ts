import { createClient } from '@supabase/supabase-js';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { NextApiRequest, NextApiResponse } from 'next';

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
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. Validate authentication
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

    // 2. Get parameters
    const { transformationId, amount = 1 } = req.body;

    if (!transformationId) {
      return res.status(400).json({ message: 'Missing transformationId' });
    }

    // 3. Verify the transformation belongs to the user and is eligible for refund
    const { data: transformation, error: transformationError } = await supabaseAdmin
      .from('transformations')
      .select('id, user_id, status, created_at')
      .eq('id', transformationId)
      .eq('user_id', user.id)
      .single();

    if (transformationError || !transformation) {
      return res.status(404).json({ message: 'Transformation not found or access denied' });
    }

    // 4. Check if transformation is in a failed state
    const failedStatuses = ['error', 'failed_system', 'failed_upload', 'failed_checkout_redirect', 'failed_db_update', 'failed_payment', 'failed_trigger', 'failed_timeout_server'];
    
    if (!failedStatuses.includes(transformation.status)) {
      return res.status(400).json({ message: 'Transformation is not in a failed state eligible for refund' });
    }

    // 5. Check if refund already exists for this transformation
    const { data: existingRefund, error: refundCheckError } = await supabaseAdmin
      .from('piccoin_transactions')
      .select('id')
      .eq('reference_id', transformationId)
      .eq('type', 'refund')
      .eq('user_id', user.id)
      .single();

    if (refundCheckError && refundCheckError.code !== 'PGRST116') {
      console.error('Error checking existing refund:', refundCheckError);
      return res.status(500).json({ message: 'Error checking refund status' });
    }

    if (existingRefund) {
      return res.status(400).json({ message: 'Refund already processed for this transformation' });
    }

    // 6. Process refund using atomic RPC function
    const { data: refundResult, error: refundError } = await supabaseAdmin.rpc('earn_piccoins', {
      p_user_id: user.id,
      p_amount: amount,
      p_type: 'refund',
      p_reference_id: transformationId,
      p_description: `Reembolso de ${amount} PicCoin(s) por falha na transformação`
    });

    if (refundError) {
      console.error('RPC refund error:', refundError);
      return res.status(500).json({ message: 'Error processing refund' });
    }

    if (!refundResult?.success) {
      return res.status(400).json({ 
        message: refundResult?.error || 'Failed to process refund'
      });
    }

    return res.status(200).json({ 
      success: true,
      newBalance: refundResult.newBalance,
      refundedAmount: amount,
      message: `${amount} PicCoin(s) reembolsado(s) com sucesso`
    });

  } catch (error) {
    console.error('Refund API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 