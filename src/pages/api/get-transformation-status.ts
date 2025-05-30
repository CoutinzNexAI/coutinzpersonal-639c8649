import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { applyRateLimit, getStatusApiRateLimiter } from '@/lib/rate-limit';


type ResponseData = {
  status?: string;
  output_url?: string | null;
  error_message?: string | null;
  message?: string; // For general errors or specific error messages not tied to job fields
  detail?: string; 
  debug_db_read_at?: string; // Para logar quando a DB foi lida
  debug_self_heal_triggered?: string; // Para logar qual self-heal foi acionado
};

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

// CONFIGURÁVEL: Atraso em milissegundos antes de ler da DB com supabaseAdmin
const DB_READ_DELAY_MS = 3000; // 3 segundos

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const endpointName = '[API get-transformation-status]';
  const requestStartTime = Date.now();
  const rawCookieHeaderFromRequest = req.headers.cookie ?? '';
  // console.log(`${endpointName} RAW COOKIE HEADER:`, rawCookieHeaderFromRequest); // Log muito verboso, comentado

  if (req.method !== 'GET') {
    console.warn(`${endpointName} ❌ Method not allowed: ${req.method}`);
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { jobId, userId: userIdFromQuery } = req.query; 
  if (!jobId || typeof jobId !== 'string') {
    console.error(`${endpointName} ❌ Missing or invalid jobId query parameter.`);
    return res.status(400).json({ message: 'Missing or invalid jobId query parameter' });
  }
  
  const successPageFlow = req.headers['x-from-success-page'] === 'true';
  const explicitUserId = typeof userIdFromQuery === 'string' ? userIdFromQuery : null;
  
  let authenticatedUserIdFromSession: string | null = null;
  let usingExplicitUserIdAsFallback = false;


  try {
    // console.log(`${endpointName} 🔧 Creating Supabase SSR client...`); // Log menos crítico
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookieStrToParse = req.headers.cookie ?? '';
            const parsedCookiesObjectOriginal = parseCookieHeader(cookieStrToParse);
            // console.log(`${endpointName} 🍪 Cookie Getter - Attempting to get (original parse): "${name}"`);
            // console.log(`${endpointName} 🍪 Cookie Getter - Result of parseCookieHeader (keys found):`, Object.keys(parsedCookiesObjectOriginal).join(', ') || 'No keys parsed');
            const originalValue = parsedCookiesObjectOriginal[name];
            // console.log(`${endpointName} 🍪 Cookie Getter - Value for "${name}" (original parse): ${originalValue !== undefined ? `Found` : 'Not found (undefined)'}`);

            if (name.startsWith('sb-') && name.includes('-auth-token') && originalValue === undefined) {
              // console.log(`${endpointName} 🍪 Cookie Getter - Original parse failed for Supabase token "${name}". Attempting manual parse.`);
              const manualValue = getManuallyParsedCookie(cookieStrToParse, name);
              // console.log(`${endpointName} 🍪 Cookie Getter - Value for "${name}" (manual parse): ${manualValue !== undefined ? `Found (length: ${String(manualValue).length})` : 'Not found (undefined)'}`);
              return manualValue;
            }
            return originalValue;
          },
          set: (name: string, value: string, options) => {
            // console.log(`${endpointName} 🍪 Setting cookie:`, name);
            const cookie = serializeCookieHeader(name, value, options);
            let setCookieHeader = res.getHeader('Set-Cookie') ?? [];
            if (typeof setCookieHeader === 'string') setCookieHeader = [setCookieHeader];
            else if (typeof setCookieHeader === 'number') setCookieHeader = [String(setCookieHeader)];
            res.setHeader('Set-Cookie', [...setCookieHeader, cookie]);
          },
          remove: (name: string, options) => {
            // console.log(`${endpointName} 🍪 Removing cookie:`, name);
            const cookieHeader = serializeCookieHeader(name, '', { ...options, maxAge: 0 });
            let existingSetCookie = res.getHeader('Set-Cookie') ?? [];
            if (typeof existingSetCookie === 'string') existingSetCookie = [existingSetCookie];
            else if (typeof existingSetCookie === 'number') existingSetCookie = [String(existingSetCookie)];
            res.setHeader('Set-Cookie', [...existingSetCookie, cookieHeader]);
          },
        },
      }
    );
    // console.log(`${endpointName} ✅ Supabase client created successfully`);
    // console.log(`${endpointName} 🔐 Getting user authentication...`);

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (user) {
      authenticatedUserIdFromSession = user.id;
    } else {
      console.warn(`${endpointName} Primary authentication failed:`, userError?.message || 'No user from session');
      if (successPageFlow && explicitUserId) {
        authenticatedUserIdFromSession = explicitUserId;
        usingExplicitUserIdAsFallback = true;
      } else {
        return res.status(401).json({ message: 'Not authenticated. Please log in.', detail: userError?.message });
      }
    }
  } catch (authCatchError) {
    const errorMsg = authCatchError instanceof Error ? authCatchError.message : 'Unknown auth block error';
    console.error(`${endpointName} 💥 Catch block during authentication: ${errorMsg}`);
    if (successPageFlow && explicitUserId) {
      authenticatedUserIdFromSession = explicitUserId;
      usingExplicitUserIdAsFallback = true;
    } else {
      return res.status(500).json({ message: 'Authentication error occurred.', detail: errorMsg });
    }
  }

  if (!authenticatedUserIdFromSession) {
      console.error(`${endpointName} ❌ CRITICAL: authenticatedUserIdFromSession is null after auth block. This should not happen.`);
      return res.status(500).json({ message: 'Internal authentication error.' });
  }

  console.log(`${endpointName} User identified: ${authenticatedUserIdFromSession}. Applying rate limit...`);
const permitted = await applyRateLimit(req, res, getStatusApiRateLimiter, authenticatedUserIdFromSession);
if (!permitted) {
  console.warn(`${endpointName} Rate limit exceeded for user: ${authenticatedUserIdFromSession}`);
  return; // applyRateLimit já enviou a resposta 429
}
console.log(`${endpointName} Rate limit check passed for user: ${authenticatedUserIdFromSession}`);

  try {
    
    if (DB_READ_DELAY_MS > 0) {
        await new Promise(resolve => setTimeout(resolve, DB_READ_DELAY_MS));
    } 
    
    const dbQueryTime = new Date().toISOString();
    
    const { data: jobDetails, error: fetchError } = await supabaseAdmin
      .from('transformations')
      .select('status, output_url, error_message, user_id, processing_started_at, created_at, completed_at') // Adicionado mais campos para debug
      .eq('id', jobId)
      .single();


    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // "Not found"
        console.warn(`${endpointName} JobId: ${jobId}. Job not found in database (PGRST116).`);
        return res.status(404).json({ message: 'Job not found', debug_db_read_at: dbQueryTime });
      }
      console.error(`${endpointName} JobId: ${jobId}. Supabase error fetching job:`, fetchError.message, fetchError);
      return res.status(500).json({ message: 'Error fetching job details.', detail: fetchError.message, debug_db_read_at: dbQueryTime });
    }

    if (!jobDetails) {
      console.warn(`${endpointName} JobId: ${jobId}. Job data unexpectedly null (after fetch without error).`);
      return res.status(404).json({ message: 'Job not found (null data)', debug_db_read_at: dbQueryTime });
    }

    if (jobDetails.user_id !== authenticatedUserIdFromSession) {
      console.error(`${endpointName} JobId: ${jobId}. 🚫 Forbidden: User ${authenticatedUserIdFromSession} (auth source: ${usingExplicitUserIdAsFallback ? 'explicit query param' : 'session'}) attempted to access job owned by ${jobDetails.user_id}.`);
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this job.', debug_db_read_at: dbQueryTime });
    }
    

    // --- Início da Lógica de Self-Healing ---
    let selfHealActionTaken = "None";

    // Self-heal NOVO: Job 'processing' por >5min 20s (stuck due to Vercel Pro timeout)
    const JOB_STUCK_THRESHOLD_MS = 320 * 1000; // 5min 20s (300s Vercel Pro + buffer)

    if (jobDetails.status === 'processing' && 
        jobDetails.processing_started_at && 
        (Date.now() - new Date(jobDetails.processing_started_at as string).getTime() > JOB_STUCK_THRESHOLD_MS)) {
          
      console.warn(`${endpointName} JobId: ${jobId}. 🔍 SELF-HEAL (STUCK >5min 20s): Job status is 'processing' for too long. Assuming timeout.`);
      
      // Tenta verificar no storage uma última vez, caso o processador tenha conseguido guardar antes de morrer
      let foundInStorage = false;
      let storageUrl = null;
      try {
        const storagePath = `public/${jobDetails.user_id}/${jobId}`;
        const { data: files } = await supabaseAdmin.storage.from('results').list(storagePath, { limit: 1 });
        if (files && files.length > 0) {
          const { data: urlData } = await supabaseAdmin.storage.from('results').getPublicUrl(`${storagePath}/${files[0].name}`);
          if (urlData?.publicUrl) {
            foundInStorage = true;
            storageUrl = urlData.publicUrl;
            await supabaseAdmin.from('transformations').update({ 
                status: 'completed', 
                output_url: storageUrl, 
                output_file_path: `${storagePath}/${files[0].name}`,
                completed_at: new Date().toISOString(),
                error_message: 'Recovered by self-heal (was stuck processing, found in storage)' 
            }).eq('id', jobId);
            // Retorna 'completed' para o cliente
            return res.status(200).json({ status: 'completed', output_url: storageUrl, debug_db_read_at: dbQueryTime, debug_self_heal_triggered: "Recovered stuck >5min 20s job (found in storage)" });
          }
        }
      } catch (e) {
        console.error(`${endpointName} JobId: ${jobId}. SELF-HEAL (STUCK >5min 20s): Error checking storage.`, e);
      }

      if (!foundInStorage) {
        console.warn(`${endpointName} JobId: ${jobId}. SELF-HEAL (STUCK >5min 20s): Updating DB to 'failed_timeout'.`);
        const failureMessage = 'O processamento da imagem excedeu o tempo limite no servidor.';
        await supabaseAdmin.from('transformations').update({ 
            status: 'failed_timeout_server', // ou outro status de erro que definas
            error_message: failureMessage,
            completed_at: new Date().toISOString() 
        }).eq('id', jobId);
        // Retorna o erro para o cliente
        return res.status(200).json({ status: 'failed_timeout_server', error_message: failureMessage, debug_db_read_at: dbQueryTime, debug_self_heal_triggered: "Marked stuck >5min 20s job as failed_timeout_server" });
      }
    }

    // Self-heal 1: Job 'processing' por >30s, mas imagem existe no storage
    if (jobDetails.status === 'processing' && jobDetails.processing_started_at && 
        (Date.now() - new Date(jobDetails.processing_started_at as string).getTime() > 30 * 1000)) {
      console.warn(`${endpointName} JobId: ${jobId}. 🔍 SELF-HEAL CHECK 1: Job is 'processing' for >30s. Checking storage...`);
      selfHealActionTaken = "Checked processing >30s";
      try {
        const { data: files } = await supabaseAdmin.storage.from('results').list(`public/${jobDetails.user_id}/${jobId}`, { limit: 1, sortBy: { column: 'name', order: 'desc' } });
        if (files && files.length > 0) {
          const fileName = files[0].name;
          const { data: urlData } = await supabaseAdmin.storage.from('results').getPublicUrl(`public/${jobDetails.user_id}/${jobId}/${fileName}`);
          if (urlData?.publicUrl) {
            selfHealActionTaken = "Updated DB from processing>30s to completed (found in storage)";
            const updatePayload = { 
              status: 'completed',
              output_url: urlData.publicUrl,
              output_file_path: `public/${jobDetails.user_id}/${jobId}/${fileName}`,
              completed_at: new Date().toISOString()
            };
            const {error: updateError} = await supabaseAdmin.from('transformations').update(updatePayload).eq('id', jobId);
            if(updateError){
                 console.error(`${endpointName} JobId: ${jobId}. 🎯 SELF-HEAL 1: FAILED to update DB:`, updateError.message);
                 selfHealActionTaken += " - DB Update FAILED";
            } else {
                 console.log(`${endpointName} JobId: ${jobId}. 🎯 SELF-HEAL 1: DB Update SUCCESSFUL.`);
            }
            return res.status(200).json({ status: 'completed', output_url: urlData.publicUrl, error_message: null, debug_db_read_at: dbQueryTime, debug_self_heal_triggered: selfHealActionTaken });
          }
        } else {
            console.log(`${endpointName} JobId: ${jobId}. 🔍 SELF-HEAL CHECK 1: No files found in storage for 'processing' >30s job.`);
        }
      } catch (storageError) {
        console.error(`${endpointName} JobId: ${jobId}. SELF-HEAL 1: Error checking storage:`, storageError instanceof Error ? storageError.message : storageError);
        selfHealActionTaken += ` - Storage check error: ${storageError instanceof Error ? storageError.message : "Unknown"}`;
      }
    }

    // Self-heal 2: Job 'completed' mas output_url está em falta
    if (jobDetails.status === 'completed' && (!jobDetails.output_url || jobDetails.output_url === '')) {
      console.warn(`${endpointName} JobId: ${jobId}. 🔍 SELF-HEAL CHECK 2: Job is 'completed' but output_url is missing. Attempting to fix...`);
      selfHealActionTaken = "Checked completed no_url";
      try {
        const { data: files } = await supabaseAdmin.storage.from('results').list(`public/${jobDetails.user_id}/${jobId}`, { limit: 1, sortBy: { column: 'name', order: 'desc' } });
        if (files && files.length > 0) {
          const fileName = files[0].name;
          console.log(`${endpointName} JobId: ${jobId}. 🎯 SELF-HEAL 2: Found image in storage: ${fileName}.`);
          const { data: urlData } = await supabaseAdmin.storage.from('results').getPublicUrl(`public/${jobDetails.user_id}/${jobId}/${fileName}`);
          if (urlData?.publicUrl) {
            console.log(`${endpointName} JobId: ${jobId}. 🎯 SELF-HEAL 2: Generated URL: ${urlData.publicUrl}. Updating DB.`);
            selfHealActionTaken = "Updated DB from completed no_url (found in storage)";
            const updatePayload = { 
              output_url: urlData.publicUrl,
              output_file_path: `public/${jobDetails.user_id}/${jobId}/${fileName}`
              // Não mexer no 'completed_at' ou 'status' aqui, já está 'completed'
            };
            const {error: updateError} = await supabaseAdmin.from('transformations').update(updatePayload).eq('id', jobId);
            if(updateError){
                console.error(`${endpointName} JobId: ${jobId}. 🎯 SELF-HEAL 2: FAILED to update DB with URL:`, updateError.message);
                selfHealActionTaken += " - DB Update FAILED";
            } else {
                 console.log(`${endpointName} JobId: ${jobId}. 🎯 SELF-HEAL 2: DB Update SUCCESSFUL with URL.`);
            }
            return res.status(200).json({ status: 'completed', output_url: urlData.publicUrl, error_message: null, debug_db_read_at: dbQueryTime, debug_self_heal_triggered: selfHealActionTaken });
          }
        } else {
             console.log(`${endpointName} JobId: ${jobId}. 🔍 SELF-HEAL CHECK 2: No files found in storage for 'completed' no_url job.`);
        }
        // Se o self-heal não encontrar ficheiro, o job está 'completed' mas sem imagem. Retornar erro.
        console.error(`${endpointName} JobId: ${jobId}. 🎯 SELF-HEAL 2: Job is 'completed' but no image found in storage. Returning error.`);
        selfHealActionTaken += " - No image in storage";
        return res.status(200).json({ status: 'error', error_message: 'Transformação marcada como concluída, mas o ficheiro de resultado não foi encontrado.', output_url: null, debug_db_read_at: dbQueryTime, debug_self_heal_triggered: selfHealActionTaken });
      } catch (storageError) {
        console.error(`${endpointName} JobId: ${jobId}. SELF-HEAL 2: Error checking storage:`, storageError instanceof Error ? storageError.message : storageError);
        selfHealActionTaken += ` - Storage check error: ${storageError instanceof Error ? storageError.message : "Unknown"}`;
        // Retornar o estado original da BD se o self-heal falhar por exceção
         return res.status(200).json({ status: jobDetails.status, output_url: jobDetails.output_url, error_message: jobDetails.error_message || "Erro durante self-heal.", debug_db_read_at: dbQueryTime, debug_self_heal_triggered: selfHealActionTaken });
      }
    }
    
    // Self-heal 3: Job 'stuck' (processing, paid, pending_payment) por >10 mins  
    const STUCK_JOB_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutos - mais generoso para Vercel Pro
    if (['processing', 'paid', 'pending_payment'].includes(jobDetails.status || '') && 
        jobDetails.created_at && // Usar created_at como fallback se processing_started_at não existir
        (Date.now() - new Date(jobDetails.processing_started_at || jobDetails.created_at as string).getTime() > STUCK_JOB_THRESHOLD_MS)) {
      console.warn(`${endpointName} JobId: ${jobId}. 🔍 SELF-HEAL CHECK 3: Job is '${jobDetails.status}' for >10 mins. Attempting to fix...`);
      selfHealActionTaken = `Checked stuck job >10min (status: ${jobDetails.status})`;
      try {
        const { data: files } = await supabaseAdmin.storage.from('results').list(`public/${jobDetails.user_id}/${jobId}`, { limit: 1, sortBy: { column: 'name', order: 'desc' } });
        if (files && files.length > 0) {
          const fileName = files[0].name;
          const { data: urlData } = await supabaseAdmin.storage.from('results').getPublicUrl(`public/${jobDetails.user_id}/${jobId}/${fileName}`);
          if (urlData?.publicUrl) {
            selfHealActionTaken = `Updated DB from stuck job (status: ${jobDetails.status}) to completed (found in storage)`;
            const updatePayload = { 
              status: 'completed',
              output_url: urlData.publicUrl,
              output_file_path: `public/${jobDetails.user_id}/${jobId}/${fileName}`,
              completed_at: new Date().toISOString(),
              error_message: jobDetails.error_message ? `${jobDetails.error_message} (Recovered by self-heal from stuck state)` : `Recovered by self-heal from stuck state (${jobDetails.status})`
            };
            const {error: updateError} = await supabaseAdmin.from('transformations').update(updatePayload).eq('id', jobId);
             if(updateError){
                console.error(`${endpointName} JobId: ${jobId}. 🎯 SELF-HEAL 3: FAILED to update DB:`, updateError.message);
                selfHealActionTaken += " - DB Update FAILED";
            } else {
                 console.log(`${endpointName} JobId: ${jobId}. 🎯 SELF-HEAL 3: DB Update SUCCESSFUL.`);
          }
            return res.status(200).json({ status: 'completed', output_url: urlData.publicUrl, error_message: null, debug_db_read_at: dbQueryTime, debug_self_heal_triggered: selfHealActionTaken });
          }
        } else {
            console.log(`${endpointName} JobId: ${jobId}. 🔍 SELF-HEAL CHECK 3: No files found in storage for stuck job.`);
        }
      } catch (storageError) {
        console.error(`${endpointName} JobId: ${jobId}. SELF-HEAL 3 (stuck job): Error checking storage:`, storageError instanceof Error ? storageError.message : storageError);
        selfHealActionTaken += ` - Storage check error: ${storageError instanceof Error ? storageError.message : "Unknown"}`;
      }
    }
    // --- Fim da Lógica de Self-Healing ---
    
    const timeTaken = Date.now() - requestStartTime;
    console.log(`${endpointName} JobId: ${jobId}. ✅ NO SELF-HEAL TRIGGERED or self-heal did not return. Returning original DB status: ${jobDetails.status}. Total time: ${timeTaken}ms.`);
    return res.status(200).json({
      status: jobDetails.status,
      output_url: jobDetails.output_url,
      error_message: jobDetails.error_message,
      debug_db_read_at: dbQueryTime,
      debug_self_heal_triggered: selfHealActionTaken === "None" ? (jobDetails.status === "completed" && jobDetails.output_url ? "None (already completed)" : "None (no condition met)") : selfHealActionTaken + " (but did not return early)"
    });

  } catch (error) {
    const genericErrorMessage = error instanceof Error ? error.message : 'Unknown server error.';
    console.error(`${endpointName} JobId: ${jobId}. 💥 Critical error in main try-catch:`, genericErrorMessage, error);
    const timeTaken = Date.now() - requestStartTime;
    return res.status(500).json({ message: 'Failed to get transformation status due to a server error.', detail: genericErrorMessage, debug_self_heal_triggered: `Exception: ${genericErrorMessage.substring(0,100)}`, debug_db_read_at: new Date(requestStartTime).toISOString() });
  }
}