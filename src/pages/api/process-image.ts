// src/pages/api/process-image.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import axios from 'axios'; // Se ainda usares axios para chamar o processador-background
import { applyRateLimit, processImageApiRateLimiter } from '@/lib/rate-limit';
// ... outros imports que já tens (NextApiRequest, NextApiResponse, supabaseAdmin, createServerClient, etc.)
// Função auxiliar para fazer o parse manual de um cookie específico
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

type ResponseData = {
  success?: boolean;
  message?: string;
  jobId?: string;
  error?: string;
  detail?: string; // For auth error details
  status?: string; // For processing status
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const endpointName = '[API process-image]';

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
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
      return res.status(401).json({ message: 'Not authenticated. Please log in.', detail: authError?.message });
    }

    const permitted = await applyRateLimit(req, res, processImageApiRateLimiter, user.id);
    if (!permitted) {
      return;
    }

    const { jobId } = req.body;
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ message: 'Missing or invalid jobId in request body.' });
    }

    // Verificar se o job pertence ao utilizador autenticado
    const { data: jobData, error: jobFetchError } = await supabaseAdmin
      .from('transformations')
      .select('id, user_id, status, input_file_path')
      .eq('id', jobId)
      .single();

    if (jobFetchError || !jobData) {
      return res.status(404).json({ success: false, message: `Job not found: ${jobFetchError?.message || 'No data'}` });
    }

    if (jobData.user_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this job.' });
    }
    
    // Verificar se o job está num estado apropriado para iniciar o processamento
    if (jobData.status !== 'awaiting_processing' && jobData.status !== 'created' && jobData.status !== 'paid') {
        return res.status(400).json({ success: false, message: `Job is not ready for processing (status: ${jobData.status}).` });
    }
    
    if (!jobData.input_file_path) {
        await supabaseAdmin.from('transformations').update({ 
          status: 'failed_input_path', 
          error_message: 'Input file path missing at process-image stage.'
        }).eq('id', jobId);
        return res.status(400).json({ success: false, message: 'Input file path missing for job.' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('transformations')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        error_message: null,
        completed_at: null
      })
      .eq('id', jobId);
      
    if (updateError && process.env.NODE_ENV === 'development') {
      console.error(`${endpointName} ❌ Error updating job ${jobId} status to 'processing':`, updateError.message);
    }

    // Chamar a API de processamento em background
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const backgroundProcessorUrl = `${baseUrl}/api/processador-background`;
    const internalApiSecret = process.env.INTERNAL_API_SECRET;

    if (!internalApiSecret) {
        await supabaseAdmin.from('transformations').update({ 
          status: 'failed_config', 
          error_message: 'Internal API secret missing.'
        }).eq('id', jobId);
        return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }
    
    // Chamada assíncrona sem await para não bloquear a resposta
    axios.post(
      backgroundProcessorUrl,
      { jobId },
      {
        headers: { 
          'x-internal-secret': internalApiSecret,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    )
    .then(() => {
      // Success - no need to log in production
    })
    .catch(() => {
      // Error handled silently in production
    });

    return res.status(200).json({ 
      message: 'Background processing initiated successfully',
      jobId: jobId,
      status: 'processing'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Only log critical errors in production
    if (process.env.NODE_ENV === 'development') {
      console.error(`${endpointName} 💥 Unexpected error in handler:`, errorMessage);
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
}
