// src/pages/api/get-transformation-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

type ResponseData = {
  status?: string;
  output_url?: string | null;
  error_message?: string | null;
  message?: string; // For general errors or specific error messages not tied to job fields
  detail?: string; // <<< NOVO: Adicionado para mensagens de erro detalhadas
};

// Função auxiliar para fazer o parse manual de um cookie específico
function getManuallyParsedCookie(cookieString: string, cookieName: string): string | undefined {
  if (!cookieString) return undefined;
  const cookiesArray = cookieString.split(';');
  for (const cookie of cookiesArray) {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name === cookieName) {
      // Lida com valores de cookie que podem ter '=' no valor, juntando as partes restantes
      return parts.slice(1).join('=');
    }
  }
  return undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const endpointName = '[API get-transformation-status]';
  console.log(`${endpointName} 🚀 Handler started. Method: ${req.method}`);
  const rawCookieHeaderFromRequest = req.headers.cookie ?? '';
  console.log(`${endpointName} RAW COOKIE HEADER:`, rawCookieHeaderFromRequest);

  if (req.method !== 'GET') {
    console.warn(`${endpointName} ❌ Method not allowed: ${req.method}`);
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { jobId, userId: userIdFromQuery } = req.query; // Renomeado para evitar conflito com user.id
  if (!jobId || typeof jobId !== 'string') {
    console.error(`${endpointName} ❌ Missing or invalid jobId query parameter.`);
    return res.status(400).json({ message: 'Missing or invalid jobId query parameter' });
  }
  console.log(`${endpointName} Fetching status for jobId: ${jobId}`);
  
  const successPageFlow = req.headers['x-from-success-page'] === 'true';
  const explicitUserId = typeof userIdFromQuery === 'string' ? userIdFromQuery : null;
  
  let authenticatedUserIdFromSession: string | null = null;
  let usingExplicitUserIdAsFallback = false;

  console.log(`${endpointName} Environment vars - URL:`, process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing');
  console.log(`${endpointName} Environment vars - ANON_KEY:`, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

  try {
    console.log(`${endpointName} 🔧 Creating Supabase SSR client...`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookieStrToParse = req.headers.cookie ?? '';
            const parsedCookiesObjectOriginal = parseCookieHeader(cookieStrToParse);
            // console.log(`${endpointName} 🍪 Cookie Getter - Full cookie string: "${cookieStrToParse}"`);
            console.log(`${endpointName} 🍪 Cookie Getter - Attempting to get (original parse): "${name}"`);
            console.log(`${endpointName} 🍪 Cookie Getter - Result of parseCookieHeader (keys found):`, Object.keys(parsedCookiesObjectOriginal).join(', ') || 'No keys parsed');
            const originalValue = parsedCookiesObjectOriginal[name];
            console.log(`${endpointName} 🍪 Cookie Getter - Value for "${name}" (original parse): ${originalValue !== undefined ? `Found` : 'Not found (undefined)'}`);

            if (name.startsWith('sb-') && name.includes('-auth-token') && originalValue === undefined) {
              console.log(`${endpointName} 🍪 Cookie Getter - Original parse failed for Supabase token "${name}". Attempting manual parse.`);
              const manualValue = getManuallyParsedCookie(cookieStrToParse, name);
              console.log(`${endpointName} 🍪 Cookie Getter - Value for "${name}" (manual parse): ${manualValue !== undefined ? `Found (length: ${String(manualValue).length})` : 'Not found (undefined)'}`);
              return manualValue;
            }
            return originalValue;
          },
          set: (name: string, value: string, options) => {
            console.log(`${endpointName} 🍪 Setting cookie:`, name);
            const cookie = serializeCookieHeader(name, value, options);
            let setCookieHeader = res.getHeader('Set-Cookie') ?? [];
            if (typeof setCookieHeader === 'string') setCookieHeader = [setCookieHeader];
            else if (typeof setCookieHeader === 'number') setCookieHeader = [String(setCookieHeader)];
            res.setHeader('Set-Cookie', [...setCookieHeader, cookie]);
          },
          remove: (name: string, options) => {
            console.log(`${endpointName} 🍪 Removing cookie:`, name);
            const cookieHeader = serializeCookieHeader(name, '', { ...options, maxAge: 0 });
            let existingSetCookie = res.getHeader('Set-Cookie') ?? [];
            if (typeof existingSetCookie === 'string') existingSetCookie = [existingSetCookie];
            else if (typeof existingSetCookie === 'number') existingSetCookie = [String(existingSetCookie)];
            res.setHeader('Set-Cookie', [...existingSetCookie, cookieHeader]);
          },
        },
      }
    );
    console.log(`${endpointName} ✅ Supabase client created successfully`);
    console.log(`${endpointName} 🔐 Getting user authentication...`);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log(`${endpointName} Auth result - Error:`, userError?.message || 'None');
    console.log(`${endpointName} Auth result - User:`, user ? `${user.id} (${user.email})` : 'null');

    if (user) {
      authenticatedUserIdFromSession = user.id;
      console.log(`${endpointName} ✅ Primary authentication successful: ${authenticatedUserIdFromSession}`);
    } else {
      console.warn(`${endpointName} Primary authentication failed:`, userError?.message || 'No user from session');
      if (successPageFlow && explicitUserId) {
        console.log(`${endpointName} ⚠️ Using explicitUserId as fallback: ${explicitUserId}`);
        authenticatedUserIdFromSession = explicitUserId;
        usingExplicitUserIdAsFallback = true;
      } else {
        console.error(`${endpointName} ❌ Authentication failed and no valid fallback. UserError:`, userError?.message);
        return res.status(401).json({ message: 'Not authenticated. Please log in.', detail: userError?.message });
      }
    }
  } catch (authCatchError) {
    const errorMsg = authCatchError instanceof Error ? authCatchError.message : 'Unknown auth block error';
    console.error(`${endpointName} 💥 Catch block during authentication: ${errorMsg}`);
    if (successPageFlow && explicitUserId) {
      console.log(`${endpointName} ⚠️ Using explicitUserId as fallback after auth catch block: ${explicitUserId}`);
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

  try {
    console.log(`${endpointName} 📊 Querying 'transformations' table for jobId: ${jobId} (as supabaseAdmin)`);
    const { data: jobDetails, error: fetchError } = await supabaseAdmin
      .from('transformations')
      .select('status, output_url, error_message, user_id, processing_started_at')
      .eq('id', jobId)
      .single();

    console.log(`${endpointName} DB Query - Error:`, fetchError?.message || 'None');
    console.log(`${endpointName} DB Query - Data:`, jobDetails ? 'Data received' : 'No data');
    console.log(`${endpointName} DB Query - JOB DETAILS READ FROM DB:`, JSON.stringify(jobDetails, null, 2));


    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.warn(`${endpointName} Job not found in database: ${jobId}`);
        return res.status(404).json({ message: 'Job not found' });
      }
      console.error(`${endpointName} Supabase error fetching job ${jobId}:`, fetchError.message);
      return res.status(500).json({ message: 'Error fetching job details.', detail: fetchError.message });
    }

    if (!jobDetails) {
      console.warn(`${endpointName} Job data unexpectedly null for ${jobId} (after fetch without error).`);
      return res.status(404).json({ message: 'Job not found' });
    }

    if (jobDetails.user_id !== authenticatedUserIdFromSession) {
      console.error(`${endpointName} 🚫 Forbidden: User ${authenticatedUserIdFromSession} (auth source: ${usingExplicitUserIdAsFallback ? 'explicit query param' : 'session'}) attempted to access job ${jobId} owned by ${jobDetails.user_id}.`);
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this job.' });
    }
    
    console.log(`${endpointName} ✅ Ownership verified for job ${jobId}. User: ${authenticatedUserIdFromSession} (Source: ${usingExplicitUserIdAsFallback ? 'explicit' : 'session'}).`);

    // Lógica de self-healing (mantida)
    if (jobDetails.status === 'completed' && (!jobDetails.output_url || jobDetails.output_url === '')) {
      console.warn(`${endpointName} Job ${jobId} is 'completed' but output_url is missing. Attempting self-heal.`);
      try {
        const { data: files } = await supabaseAdmin
          .storage
          .from('results')
          .list(`public/${jobDetails.user_id}/${jobId}`, {
            limit: 1,
            sortBy: { column: 'name', order: 'desc' },
          });
        
        if (files && files.length > 0) {
          const fileName = files[0].name;
          console.log(`${endpointName} Self-heal: Found image in storage: ${fileName}`);
          const { data: urlData } = await supabaseAdmin
            .storage
            .from('results')
            .getPublicUrl(`public/${jobDetails.user_id}/${jobId}/${fileName}`);
            
          if (urlData?.publicUrl) {
            console.log(`${endpointName} Self-heal: Generated URL: ${urlData.publicUrl}`);
            await supabaseAdmin
              .from('transformations')
              .update({ 
                output_url: urlData.publicUrl,
                output_file_path: `public/${jobDetails.user_id}/${jobId}/${fileName}`
              })
              .eq('id', jobId);
              
            return res.status(200).json({
              status: 'completed',
              output_url: urlData.publicUrl,
              error_message: null,
            });
          }
        }
      } catch (storageError) {
        console.error(`${endpointName} Self-heal: Error checking storage:`, storageError instanceof Error ? storageError.message : storageError);
      }
      // Se o self-heal falhar ou não encontrar, continua para retornar o status 'failed' abaixo
      return res.status(200).json({
        status: 'failed', // Ou 'error' se preferir, já que está completo mas sem URL
        error_message: 'Transformação concluída, mas ocorreu um problema ao obter a URL de saída.',
      });
    }
    
    if ((jobDetails.status === 'processing' || jobDetails.status === 'paid' || jobDetails.status === 'pending_payment') && 
        jobDetails.processing_started_at && 
        new Date().getTime() - new Date(jobDetails.processing_started_at as string).getTime() > 2 * 60 * 1000) { // 2 minutos
      console.warn(`${endpointName} Job ${jobId} is '${jobDetails.status}' for >2 mins. Attempting self-heal for stuck job.`);
      try {
        const { data: files } = await supabaseAdmin
          .storage
          .from('results')
          .list(`public/${jobDetails.user_id}/${jobId}`, {
            limit: 1,
            sortBy: { column: 'name', order: 'desc' },
          });
        if (files && files.length > 0) {
          const fileName = files[0].name;
          console.log(`${endpointName} Self-heal (stuck job): Found image in storage: ${fileName}`);
          const { data: urlData } = await supabaseAdmin
            .storage
            .from('results')
            .getPublicUrl(`public/${jobDetails.user_id}/${jobId}/${fileName}`);
          if (urlData?.publicUrl) {
            console.log(`${endpointName} Self-heal (stuck job): Generated URL: ${urlData.publicUrl}`);
            await supabaseAdmin
              .from('transformations')
              .update({ 
                status: 'completed',
                output_url: urlData.publicUrl,
                output_file_path: `public/${jobDetails.user_id}/${jobId}/${fileName}`,
                completed_at: new Date().toISOString()
              })
              .eq('id', jobId);
            return res.status(200).json({
              status: 'completed',
              output_url: urlData.publicUrl,
              error_message: null,
            });
          }
        }
      } catch (storageError) {
        console.error(`${endpointName} Self-heal (stuck job): Error checking storage:`, storageError instanceof Error ? storageError.message : storageError);
      }
    }
    
    console.log(`${endpointName} ✅ Returning status for job ${jobId}: ${jobDetails.status}`);
    return res.status(200).json({
      status: jobDetails.status,
      output_url: jobDetails.output_url,
      error_message: jobDetails.error_message,
    });

  } catch (error) {
    const genericErrorMessage = error instanceof Error ? error.message : 'Unknown server error.';
    console.error(`${endpointName} 💥 Critical error for job ${jobId}:`, genericErrorMessage);
    return res.status(500).json({ message: 'Failed to get transformation status due to a server error.', detail: genericErrorMessage });
  }
}
