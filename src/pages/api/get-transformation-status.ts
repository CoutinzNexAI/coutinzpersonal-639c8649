// pages/api/get-transformation-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

type ResponseData = {
  status?: string;
  output_url?: string | null;
  error_message?: string | null;
  message?: string; // For general errors or specific error messages not tied to job fields
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Log da requisição recebida
  console.log('[API get-transformation-status] Received request');

  // 1. Validar o método HTTP
  if (req.method !== 'GET') {
    console.warn('[API get-transformation-status] Method not allowed:', req.method);
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Validar o parâmetro 'jobId'
  const { jobId, userId } = req.query; // Accept userId from success.tsx
  if (!jobId || typeof jobId !== 'string') {
    console.error('[API get-transformation-status] Missing or invalid jobId query parameter.');
    return res.status(400).json({ message: 'Missing or invalid jobId query parameter' });
  }
  console.log(`[API get-transformation-status] Fetching status for jobId: ${jobId}`);
  
  // Special flow flag from success.tsx
  const successPageFlow = req.headers['x-from-success-page'] === 'true';
  const explicitUserId = typeof userId === 'string' ? userId : null;
  
  let authenticatedUserId: string | null = null;
  let isAdminFallback = false;

  // 3. Verificação de Segurança: Obter o utilizador autenticado
  // Primeiro tenta com cookies normais
  try {
    // Cria um cliente Supabase server-side para ler os cookies da requisição
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // A função `get` lê um cookie da requisição HTTP
          get: (name: string) => {
            const cookies = parseCookieHeader(req.headers.cookie ?? '');
            return cookies[name];
          },
          // A função `set` define um cookie na resposta HTTP, caso a sessão seja atualizada
          set: (name: string, value: string, options) => {
            const cookie = serializeCookieHeader(name, value, options);
            // Adiciona o cabeçalho Set-Cookie. Pode ser chamado múltiplas vezes.
            let setCookieHeader = res.getHeader('Set-Cookie') ?? [];
            if (typeof setCookieHeader === 'string') {
              setCookieHeader = [setCookieHeader];
            } else if (typeof setCookieHeader === 'number') {
              // Este caso não deve acontecer para Set-Cookie, mas para segurança:
              setCookieHeader = [String(setCookieHeader)];
            }
            res.setHeader('Set-Cookie', [...setCookieHeader, cookie]);
          },
          // A função `remove` é opcional aqui se não estiveres a modificar e remover cookies ativamente
          // remove: (name: string, options) => {
          //   const cookie = serializeCookieHeader(name, '', { ...options, maxAge: 0 });
          //   // Adiciona o cabeçalho Set-Cookie para remover.
          //   // (Lógica similar ao 'set' para adicionar à lista de Set-Cookie)
          // },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      // If normal authentication fails, we'll check for alternative credentials
      console.warn('[API get-transformation-status] Normal authentication failed:', userError?.message || 'No user');
      
      // Only check for alternative authentication if from success page with userId
      if (successPageFlow && explicitUserId) {
        console.log(`[API get-transformation-status] Using admin fallback with explicit userId: ${explicitUserId}`);
        authenticatedUserId = explicitUserId;
        isAdminFallback = true;
      } else {
        console.error('[API get-transformation-status] Not authenticated or error fetching user.', userError?.message);
        return res.status(401).json({ message: 'Not authenticated. Please log in.' });
      }
    } else {
      // Normal authentication succeeded
      authenticatedUserId = user.id;
      console.log(`[API get-transformation-status] Authenticated user: ${authenticatedUserId}`);
    }
  } catch (authError) {
    console.error('[API get-transformation-status] Error during authentication:', authError);
    
    // Only check for alternative authentication if from success page with userId
    if (successPageFlow && explicitUserId) {
      console.log(`[API get-transformation-status] Using admin fallback after auth error with explicit userId: ${explicitUserId}`);
      authenticatedUserId = explicitUserId;
      isAdminFallback = true;
    } else {
      return res.status(500).json({ message: 'Authentication error occurred.' });
    }
  }

  // 4. Buscar os dados da transformação e verificar a propriedade
  try {
    const { data: jobDetails, error: fetchError } = await supabaseAdmin
      .from('transformations')
      .select('status, output_url, error_message, user_id, processing_started_at') // Adicionado processing_started_at à query
      .eq('id', jobId)
      .single(); // Espera um único resultado

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Código Supabase para "Not found"
        console.warn(`[API get-transformation-status] Job not found in database: ${jobId}`);
        return res.status(404).json({ message: 'Job not found' });
      }
      // Para outros erros de base de dados, loga o erro detalhado no servidor
      console.error(`[API get-transformation-status] Supabase error fetching job ${jobId}:`, fetchError.message);
      // Não exponhas o erro Supabase completo ao cliente por segurança
      return res.status(500).json({ message: 'Error fetching job details.' });
    }

    if (!jobDetails) { // Fallback, embora PGRST116 deva apanhar isto
      console.warn(`[API get-transformation-status] Job data unexpectedly null for ${jobId} (after fetch without error).`);
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verificação de Propriedade CRUCIAL
    if (jobDetails.user_id !== authenticatedUserId) {
      console.error(`[API get-transformation-status] Forbidden: User ${authenticatedUserId} attempted to access job ${jobId} owned by ${jobDetails.user_id}.`);
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this job.' });
    }
    
    if (isAdminFallback) {
      console.log(`[API get-transformation-status] Admin fallback succeeded! Ownership verified for job ${jobId}. User: ${authenticatedUserId}`);
    } else {
      console.log(`[API get-transformation-status] Ownership verified for job ${jobId}. User: ${authenticatedUserId}`);
    }

    // 5. Retornar os dados do job
    console.log(`[API get-transformation-status] Status for job ${jobId}: ${jobDetails.status}, URL: ${jobDetails.output_url}, Error: ${jobDetails.error_message}`);
    
    // Validação adicional da URL da imagem
    if (jobDetails.status === 'completed' && (!jobDetails.output_url || jobDetails.output_url === '')) {
      console.error(`[API get-transformation-status] Job ${jobId} marked as completed but has no output URL`);
      
      // Verificar diretamente no storage se há imagem
      try {
        const { data: files } = await supabaseAdmin
          .storage
          .from('results')
          .list(`public/${jobDetails.user_id}/${jobId}`, {
            limit: 1,
            sortBy: { column: 'name', order: 'desc' },
          });
          
        if (files && files.length > 0) {
          // Encontrou imagem no storage
          const fileName = files[0].name;
          console.log(`[API get-transformation-status] Found image in storage: ${fileName}`);
          
          // Obter URL público
          const { data: urlData } = await supabaseAdmin
            .storage
            .from('results')
            .getPublicUrl(`public/${jobDetails.user_id}/${jobId}/${fileName}`);
            
          if (urlData?.publicUrl) {
            console.log(`[API get-transformation-status] Generated URL: ${urlData.publicUrl}`);
            
            // Atualiza no banco de dados para futuras consultas
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
        console.error('[API get-transformation-status] Error checking storage:', storageError);
      }
      
      return res.status(200).json({
        status: 'failed',
        error_message: 'Transformação concluída, mas nenhuma URL de saída foi fornecida',
      });
    }
    
    // Verificar diretamente no storage se o status é 'processing' mas já tem muito tempo
    if ((jobDetails.status === 'processing' || jobDetails.status === 'paid' || jobDetails.status === 'pending') && 
        jobDetails.processing_started_at && 
        new Date().getTime() - new Date(jobDetails.processing_started_at as string).getTime() > 2 * 60 * 1000) { // 2 minutos
      
      console.log(`[API get-transformation-status] Job ${jobId} in processing for long time, checking storage directly`);
      
      try {
        const { data: files } = await supabaseAdmin
          .storage
          .from('results')
          .list(`public/${jobDetails.user_id}/${jobId}`, {
            limit: 1,
            sortBy: { column: 'name', order: 'desc' },
          });
          
        if (files && files.length > 0) {
          // Encontrou imagem no storage
          const fileName = files[0].name;
          console.log(`[API get-transformation-status] Found image in storage despite job status: ${fileName}`);
          
          // Obter URL público
          const { data: urlData } = await supabaseAdmin
            .storage
            .from('results')
            .getPublicUrl(`public/${jobDetails.user_id}/${jobId}/${fileName}`);
            
          if (urlData?.publicUrl) {
            console.log(`[API get-transformation-status] Generated URL: ${urlData.publicUrl}`);
            
            // Atualiza no banco de dados para futuras consultas
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
        console.error('[API get-transformation-status] Error checking storage for processing job:', storageError);
      }
    }
    
    return res.status(200).json({
      status: jobDetails.status,
      output_url: jobDetails.output_url,
      error_message: jobDetails.error_message,
    });

  } catch (error) { // Catch para erros inesperados não tratados acima
    const genericErrorMessage = error instanceof Error ? error.message : 'Unknown server error during processing.';
    console.error(`[API get-transformation-status] Critical error for job ${jobId}:`, genericErrorMessage);
    return res.status(500).json({ message: 'Failed to get transformation status due to a server error.' });
  }
}
