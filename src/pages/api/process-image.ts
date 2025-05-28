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
  error?: string; // Para mensagens de erro mais detalhadas
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const endpointName = '[API process-image]';
  const rawCookieHeaderFromRequest = req.headers.cookie ?? '';

  if (req.method !== 'POST') {
    console.warn(`${endpointName} ❌ Method not allowed: ${req.method}`);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    console.log(`${endpointName} 🔧 Creating Supabase SSR client for auth...`);
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
              console.log(`${endpointName} 🍪 Cookie Getter - Value for "${name}" (manual parse): ${manualValue !== undefined ? 'Found' : 'Not found'}`);
              return manualValue;
            }
            console.log(`${endpointName} 🍪 Cookie Getter - Value for "${name}" (original parse): ${originalValue !== undefined ? 'Found' : 'Not found'}`);
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

    const { data: { user: authenticatedUser }, error: authError } = await supabaseAuthClient.auth.getUser();

    if (authError || !authenticatedUser) {
      console.error(`${endpointName} ❌ Authentication failed:`, authError?.message || 'No user session');
      return res.status(401).json({ message: 'Unauthorized', error: authError?.message || 'User session not found.' });
    }
    
    const permitted = await applyRateLimit(req, res, processImageApiRateLimiter, authenticatedUser.id);
    if (!permitted) {
      console.warn(`${endpointName} Rate limit exceeded for user: ${authenticatedUser.id}`);
      return; // applyRateLimit já enviou a resposta 429
    }

    const { jobId } = req.body;
    if (!jobId || typeof jobId !== 'string') {
      console.error(`${endpointName} ❌ Missing or invalid jobId in request body.`);
      return res.status(400).json({ message: 'jobId is required and must be a string' });
    }

    // Verificar se o job pertence ao utilizador autenticado
    const { data: jobData, error: jobFetchError } = await supabaseAdmin
      .from('transformations')
      .select('id, user_id, status, input_file_path') // Adicionar input_file_path
      .eq('id', jobId)
      .single();

    if (jobFetchError || !jobData) {
      console.error(`${endpointName} ❌ Job ${jobId} not found or error fetching:`, jobFetchError?.message);
      return res.status(404).json({ success: false, message: `Job not found: ${jobFetchError?.message || 'No data'}` });
    }

    if (jobData.user_id !== authenticatedUser.id) {
      console.error(`${endpointName} 🚫 Forbidden: User ${authenticatedUser.id} attempted to trigger job ${jobId} owned by ${jobData.user_id}.`);
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this job.' });
    }
    
    // Verificar se o job está num estado apropriado para iniciar o processamento
    // (ex: 'awaiting_processing' ou 'created' após o pagamento/gasto de PicCoins)
    if (jobData.status !== 'awaiting_processing' && jobData.status !== 'created' && jobData.status !== 'paid') { // 'paid' para compatibilidade com webhook antigo
        console.warn(`${endpointName} ⚠️ Job ${jobId} is not in a state to start processing. Current status: ${jobData.status}`);
        return res.status(400).json({ success: false, message: `Job is not ready for processing (status: ${jobData.status}).` });
    }
    if (!jobData.input_file_path) {
        console.error(`${endpointName} ❌ Input file path missing for job ${jobId}. Cannot process.`);
        // Atualizar status do job para erro
        await supabaseAdmin.from('transformations').update({ status: 'failed_input_path', error_message: 'Input file path missing at process-image stage.'}).eq('id', jobId);
        return res.status(400).json({ success: false, message: 'Input file path missing for job.' });
    }



    const { error: updateError } = await supabaseAdmin
      .from('transformations')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        error_message: null, // Limpar erros anteriores
        completed_at: null
      })
      .eq('id', jobId);
      
    if (updateError) {
      console.error(`${endpointName} ❌ Error updating job ${jobId} status to 'processing':`, updateError.message);
      // Não retorna erro 500 aqui necessariamente, pois o processador de background pode ser chamado mesmo assim
      // ou podemos decidir não chamar. Por agora, logamos e continuamos.
    } else {
      console.log(`${endpointName} ✅ Job ${jobId} status updated to 'processing'.`);
    }

    // Chamar a API de processamento em background (processador-background.ts)
    // Esta chamada deve ser protegida, por exemplo, com um secret interno,
    // pois /api/processador-background não deve ser publicamente acessível.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const backgroundProcessorUrl = `${baseUrl}/api/processador-background`;
    const internalApiSecret = process.env.INTERNAL_API_SECRET;

    if (!internalApiSecret) {
        console.error(`${endpointName} ❌ INTERNAL_API_SECRET is not configured. Cannot call background processor securely.`);
        // Atualizar status do job para erro de configuração
        await supabaseAdmin.from('transformations').update({ status: 'failed_config', error_message: 'Internal API secret missing.'}).eq('id', jobId);
        return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }
    
    
    // Chamada assíncrona sem await para não bloquear a resposta
    axios.post(
      backgroundProcessorUrl,
      { jobId },
      {
        headers: { 
          'x-internal-secret': internalApiSecret, // Envia o secret
          'Content-Type': 'application/json'
        },
        timeout: 30000 
      }
    )
    .then(response => {
      console.log(`${endpointName} ✅ Background processor for job ${jobId} initiated successfully. Status: ${response.status}`);
    })
    .catch(error => {
      const axiosErrorMsg = error.response?.data?.message || error.message || 'Unknown error';
      console.error(`${endpointName} ❌ Error initiating background processing for job ${jobId}:`, axiosErrorMsg);
      // Considerar atualizar o job para um estado de erro se o acionamento falhar criticamente.
      // Ex: await supabaseAdmin.from('transformations').update({ status: 'failed_trigger', error_message: `Failed to trigger background: ${axiosErrorMsg}` }).eq('id', jobId);
    });

    return res.status(202).json({
      success: true,
      message: 'Processing initiated',
      jobId
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    console.error(`${endpointName} 💥 Unexpected error in handler for job ${req.body?.jobId || 'unknown'}:`, errorMessage);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during processing initiation.',
      error: errorMessage
    });
  }
}
