import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin'; // Assumindo que supabaseAdmin é inicializado aqui
import { Buffer } from 'buffer';
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Timeout para a Vercel (máximo de 60s no plano hobby)
export const config = { maxDuration: 59 };

// Tipos
type JobData = {
  id: string;
  status: string;
  input_file_path: string | null;
  style_requested: string;
  user_id: string;
}

type ResponseData = {
  success?: boolean;
  message?: string;
  jobId?: string;
}

/**
 * Atualiza o status de um job no banco de dados
 */
async function updateJobStatus(
  jobId: string,
  status: string,
  outputFilePath: string | null = null,
  errorMessage: string | null = null,
  metadata: Record<string, unknown> | null = null
) {
  if (!supabaseAdmin) {
    console.error(`[updateJobStatus] CRITICAL: supabaseAdmin is not defined or null for job ${jobId} at the beginning of updateJobStatus.`);
    throw new Error(`[updateJobStatus] supabaseAdmin is not available for job ${jobId}`);
  } else {
    console.log(`[updateJobStatus: ${jobId}] supabaseAdmin client appears to be available.`);
  }

  const updateData: Record<string, unknown> = { status };

  if (status === 'processing') {
    updateData.processing_started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed' || status === 'error' || status.startsWith('failed_')) {
    updateData.completed_at = new Date().toISOString();
  }

  if (outputFilePath) {
    updateData.output_file_path = outputFilePath;
    console.log(`[updateJobStatus: ${jobId}] Attempting to generate public URL for outputFilePath: ${outputFilePath}`);
    try {
      const { data: publicUrlData } = await supabaseAdmin
        .storage
        .from('results')
        .getPublicUrl(outputFilePath);

      if (publicUrlData?.publicUrl) {
        console.log(`[updateJobStatus: ${jobId}] Generated public URL: ${publicUrlData.publicUrl}`);
        updateData.output_url = publicUrlData.publicUrl;
      } else {
        console.warn(`[updateJobStatus: ${jobId}] getPublicUrl for ${outputFilePath} did not return a publicUrl in data. Data: ${JSON.stringify(publicUrlData)}. Attempting fallback.`);
        const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        if (storageUrl) {
          const fallbackUrl = `${storageUrl}/storage/v1/object/public/results/${outputFilePath}`;
          console.warn(`[updateJobStatus: ${jobId}] Using fallback URL construction: ${fallbackUrl}`);
          updateData.output_url = fallbackUrl;
        } else {
          console.error(`[updateJobStatus: ${jobId}] Failed to generate URL - no storage URL available for fallback`);
        }
      }
    } catch (urlException) {
      console.error(`[updateJobStatus: ${jobId}] Exception during public URL generation for ${outputFilePath}:`, urlException);
    }
  }

  if (errorMessage) {
    updateData.error_message = errorMessage.substring(0, 500);
  }
  if (metadata) {
    updateData.output_metadata = metadata;
  }
  if (status === 'completed' && !updateData.output_url) {
    console.error(`[updateJobStatus: ${jobId}] Warning: Job marked as completed but has NO output URL. Data:`, JSON.stringify(updateData));
  }

  if (status.startsWith('failed_')) {
    console.log(`[updateJobStatus: ${jobId}] Converting detailed status ${status} to 'error'.`);
    updateData.output_metadata = updateData.output_metadata || {};
    Object.assign(updateData.output_metadata, { originalStatus: status });
    updateData.status = 'error'; 
  } else {
    updateData.status = status; 
  }

  console.log(`[updateJobStatus: ${jobId}] Preparing to update job. Target Status: ${updateData.status}. Full update data:`, JSON.stringify(updateData, null, 2));

  try {
    const { error } = await supabaseAdmin
      .from('transformations')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error(`[updateJobStatus: ${jobId}] Error updating job in Supabase:`, error);
      throw new Error(`Falha ao atualizar status no Supabase para job ${jobId}: ${error.message} (Code: ${error.code}, Details: ${error.details}, Hint: ${error.hint})`);
    } else {
      console.log(`[updateJobStatus: ${jobId}] Successfully updated job to status: ${updateData.status}`);
    }
  } catch (e) {
    const castError = e as Error;
    console.error(`[updateJobStatus: ${jobId}] CRITICAL EXCEPTION during Supabase update. Status being set: ${updateData.status}. Error: ${castError.message}`, {
        errorObject: castError, stack: castError.stack, jobId: jobId, updatePayload: updateData
    });
    throw e;
  }
}

async function getPromptFromDB(styleId: string, jobIdForLogging: string): Promise<string> {
  if (!supabaseAdmin) {
    console.error(`[getPromptFromDB: ${jobIdForLogging}] CRITICAL: supabaseAdmin is not defined when trying to fetch prompt for style ${styleId}.`);
    return `Transform this image using the ${styleId} style. (Error: DB connection not available)`;
  }
  try {
    console.log(`[getPromptFromDB: ${jobIdForLogging}] Querying style: ${styleId}`);
    const { data: styleResult, error } = await supabaseAdmin
      .from('styles')
      .select('name, prompt_template')
      .or(`id.eq.${styleId},name.ilike.%${styleId}%`) 
      .limit(1)
      .single();
    
    if (error) {
      console.error(`[getPromptFromDB: ${jobIdForLogging}] Erro ao buscar estilo ${styleId}:`, error);
      return `Transform this image using the ${styleId} style. Apply artistic interpretation. (DB query error)`;
    }
    if (styleResult) {
      console.log(`[getPromptFromDB: ${jobIdForLogging}] Found style: ${styleResult.name} for styleId ${styleId}`);
      return styleResult.prompt_template || `Transform this image using the ${styleResult.name} style. Apply artistic interpretation.`;
    }
    console.warn(`[getPromptFromDB: ${jobIdForLogging}] Style ${styleId} not found in DB. Using fallback prompt.`);
    return `Transform this image using the ${styleId} style. Apply artistic interpretation.`;
  } catch (error) {
    const castError = error as Error;
    console.error(`[getPromptFromDB: ${jobIdForLogging}] Exception while fetching prompt for style ${styleId}: ${castError.message}`, { stack: castError.stack });
    return `Transform this image using the ${styleId} style. Apply artistic interpretation. (Exception during DB query)`;
  }
}

async function processImage(jobId: string, jobData: JobData) {
  let finalStatus = 'failed'; 
  let errorMessage: string | null = null;
  let outputFilePath: string | null = null;
  let outputMetadata: Record<string, unknown> | null = {}; 
  let tempFilePath: string | null = null;

  console.log(`[processImage: ${jobId}] Starting full processing. Style: ${jobData.style_requested}`);

  try {
    if (!supabaseAdmin) {
        console.error(`[processImage: ${jobId}] PRE-CHECK FAIL: supabaseAdmin is not defined.`);
        throw new Error("supabaseAdmin client is not available at the start of processImage.");
    }
    // DEEPER-DIVE: Log supabaseAdmin properties (be careful with sensitive data if any)
    console.log(`[processImage: ${jobId}] DEEPER-DIVE: supabaseAdmin object type: ${typeof supabaseAdmin}`);
    if (supabaseAdmin && typeof supabaseAdmin === 'object') {
        console.log(`[processImage: ${jobId}] DEEPER-DIVE: supabaseAdmin keys: ${Object.keys(supabaseAdmin).join(', ')}`);
        // Avoid logging the whole object if it might contain sensitive details like the full URL or service key.
        // console.log(`[processImage: ${jobId}] DEEPER-DIVE: supabaseAdmin.supabaseUrl (if exists): ${('supabaseUrl' in supabaseAdmin ? (supabaseAdmin as any).supabaseUrl : 'N/A')}`);
    }


    console.log(`[processImage: ${jobId}] Attempting Supabase connectivity test...`);
    
    console.log(`[processImage: ${jobId}] IMMEDIATE-PRE-TEST: About to call supabaseAdmin.from('styles').select('id').limit(1)`);
    
    // DEEPER-DIVE: Break down the Supabase call
    console.log(`[processImage: ${jobId}] DEEPER-DIVE STEP 1: Calling supabaseAdmin.from('styles')`);
    const queryBuilder = supabaseAdmin.from('styles');
    console.log(`[processImage: ${jobId}] DEEPER-DIVE STEP 2: queryBuilder type: ${typeof queryBuilder}. Calling .select('id')`);
    const selectBuilder = queryBuilder.select('id');
    console.log(`[processImage: ${jobId}] DEEPER-DIVE STEP 3: selectBuilder type: ${typeof selectBuilder}. Calling .limit(1)`);
    const limitedQueryBuilder = selectBuilder.limit(1);
    console.log(`[processImage: ${jobId}] DEEPER-DIVE STEP 4: limitedQueryBuilder type: ${typeof limitedQueryBuilder}. About to await the query.`);

    const { data: testData, error: testError } = await limitedQueryBuilder;
    
    console.log(`[processImage: ${jobId}] IMMEDIATE-POST-TEST: Call to supabaseAdmin.from('styles').select('id').limit(1) has returned/completed.`);

    if (testError) {
      console.error(`[processImage: ${jobId}] Supabase connectivity test FAILED:`, testError);
      errorMessage = `Supabase connectivity test failed: ${testError.message}`;
      finalStatus = 'failed_connectivity_test'; 
      throw new Error(errorMessage); 
    } else {
      console.log(`[processImage: ${jobId}] Supabase connectivity test SUCCEEDED. Found ${testData?.length || 0} records.`);
    }
  } catch (connectivityException) {
    const castError = connectivityException as Error;
    console.error(`[processImage: ${jobId}] IMMEDIATE-EXCEPTION-TEST: Exception caught from Supabase connectivity test block. Error: ${castError.message}`);
    console.error(`[processImage: ${jobId}] CRITICAL EXCEPTION during Supabase connectivity test: ${castError.message}`, {
        errorObject: castError, stack: castError.stack });
    errorMessage = castError.message.includes("connectivity test failed") ? castError.message : `Critical exception during Supabase connectivity test: ${castError.message}`;
    finalStatus = castError.message.includes("connectivity test failed") ? 'failed_connectivity_test' : 'failed_connectivity_exception';
    try {
        await updateJobStatus(jobId, finalStatus, null, errorMessage, outputMetadata);
    } catch (updateErr) {
        console.error(`[processImage: ${jobId}] CRITICAL: Failed to update status after connectivity test failure. Error: ${ (updateErr as Error).message }`);
    }
    return; 
  }

  try {
    console.log(`[processImage: ${jobId}] Step 1: Attempting to ensure job status is 'processing'.`);
    await updateJobStatus(jobId, 'processing'); 
    console.log(`[processImage: ${jobId}] Job status confirmed/set to 'processing'.`);

    if (!jobData.input_file_path) {
      throw new Error('Caminho do arquivo de entrada ausente (input_file_path)');
    }
    console.log(`[processImage: ${jobId}] Step 2: Input file path: ${jobData.input_file_path}`);

    console.log(`[processImage: ${jobId}] Step 3: Downloading original image: ${jobData.input_file_path}`);
    const { data: downloadData, error: downloadError } = await supabaseAdmin
      .storage.from('images').download(jobData.input_file_path);
    if (downloadError || !downloadData) {
      console.error(`[processImage: ${jobId}] Failed to download image:`, downloadError);
      throw new Error(`Falha ao baixar imagem: ${downloadError?.message || 'Sem dados'}`);
    }
    console.log(`[processImage: ${jobId}] Image downloaded successfully.`);
    const imageInputBuffer = Buffer.from(await downloadData.arrayBuffer());

    console.log(`[processImage: ${jobId}] Step 4: Getting prompt for style: ${jobData.style_requested}`);
    const promptText = await getPromptFromDB(jobData.style_requested, jobId);
    console.log(`[processImage: ${jobId}] Prompt: "${promptText}"`);
    outputMetadata = { ...outputMetadata, promptUsed: promptText, aiModelUsed: 'dall-e-2' };

    const tempDir = os.tmpdir();
    const tempFileName = `input_${jobId}_${Date.now()}.png`;
    tempFilePath = path.join(tempDir, tempFileName);
    fs.writeFileSync(tempFilePath, imageInputBuffer); 
    console.log(`[processImage: ${jobId}] Step 5: Saved temp file: ${tempFilePath}`);

    const formData = new FormData();
    formData.append('model', 'dall-e-2'); 
    formData.append('prompt', promptText);
    formData.append('image', fs.createReadStream(tempFilePath));
    formData.append('n', '1');
    formData.append('size', '1024x1024');
    formData.append('response_format', 'b64_json'); 

    console.log(`[processImage: ${jobId}] Step 6: Calling OpenAI API.`);
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/images/edits',
      formData,
      { headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`}, timeout: 55000 }
    );

    if (tempFilePath) { 
      try { fs.unlinkSync(tempFilePath); console.log(`[processImage: ${jobId}] Deleted temp file: ${tempFilePath}`); tempFilePath = null; }
      catch (unlinkErr) { console.warn(`[processImage: ${jobId}] Could not delete temp file ${tempFilePath} immediately: ${(unlinkErr as Error).message}`); }
    }

    console.log(`[processImage: ${jobId}] Step 7: OpenAI response status: ${openaiResponse.status}.`);
    if (openaiResponse.status !== 200 || !openaiResponse.data?.data || openaiResponse.data.data.length === 0) {
      console.error(`[processImage: ${jobId}] Invalid OpenAI API response. Status: ${openaiResponse.status}. Data:`, openaiResponse.data);
      throw new Error(`Resposta inválida da API OpenAI: Status ${openaiResponse.status}. Data: ${JSON.stringify(openaiResponse.data)}`);
    }
    const resultItem = openaiResponse.data.data[0];
    const b64Image = resultItem.b64_json;

    if (!b64Image) { 
      console.error(`[processImage: ${jobId}] b64_json missing in OpenAI response:`, resultItem);
      throw new Error('b64_json ausente na resposta da OpenAI');
    }
    const outputImageBuffer = Buffer.from(b64Image, 'base64');
    console.log(`[processImage: ${jobId}] Step 8: Received b64_json from OpenAI. Buffer length: ${outputImageBuffer.length}`);
    
    const timestamp = Date.now();
    const safeUserId = String(jobData.user_id || 'unknown_user').replace(/[^a-zA-Z0-9-_]/g, '');
    const safeJobId = String(jobId || 'unknown_job').replace(/[^a-zA-Z0-9-_]/g, '');
    outputFilePath = `public/${safeUserId}/${safeJobId}/result_${timestamp}.png`;
    
    console.log(`[processImage: ${jobId}] Step 9: Uploading result to Supabase: ${outputFilePath}. Buffer size: ${outputImageBuffer.length}`);
    const { error: uploadError } = await supabaseAdmin
      .storage.from('results').upload(outputFilePath, outputImageBuffer, {
        contentType: 'image/png', cacheControl: 'public, max-age=31536000', upsert: false,
      });
    if (uploadError) {
      console.error(`[processImage: ${jobId}] Failed to upload result:`, uploadError);
      throw new Error(`Falha ao fazer upload do resultado: ${uploadError.message}`);
    }
    console.log(`[processImage: ${jobId}] Result uploaded to ${outputFilePath}`);

    finalStatus = 'completed';
    outputMetadata = { ...outputMetadata, processedAt: new Date().toISOString(), openAIResponseTimestamp: openaiResponse.data.created, imageSizeBytes: outputImageBuffer.length };
    console.log(`[processImage: ${jobId}] Successfully processed image.`);

  } catch (error) {
    const castError = error as Error; 
    errorMessage = castError.message;
    console.error(`[processImage: ${jobId}] Error during processing (main try block): ${errorMessage}`, { errorObject: castError, stack: castError.stack });

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      errorMessage = `Erro de API/Rede: ${axiosError.message}${axiosError.response ? ` (Status: ${axiosError.response.status})` : ''}`;
      console.error(`[processImage: ${jobId}] Axios error details:`, { status: axiosError.response?.status, data: axiosError.response?.data, url: axiosError.config?.url, code: axiosError.code });
      finalStatus = axiosError.config?.url?.includes('openai.com') ? 'failed_api' : 'failed_network_other';
    } else if (errorMessage.includes('Falha ao baixar imagem')) finalStatus = 'failed_download';
    else if (errorMessage.includes('Falha ao fazer upload do resultado')) finalStatus = 'failed_upload';
    else if (errorMessage.includes('Caminho do arquivo de entrada ausente')) finalStatus = 'failed_input_path';
    else if (errorMessage.includes('OpenAI')) finalStatus = 'failed_api_logic';
    else if (finalStatus !== 'failed_connectivity_test' && finalStatus !== 'failed_connectivity_exception') {
        finalStatus = 'failed'; 
    }
  } finally {
    if (tempFilePath) { 
      try { console.warn(`[processImage: ${jobId}] Temp file ${tempFilePath} still exists in finally. Cleaning up.`); fs.unlinkSync(tempFilePath); }
      catch (unlinkErr) { console.error(`[processImage: ${jobId}] Failed to clean up temp file ${tempFilePath} in finally: ${(unlinkErr as Error).message}`);}
    }

    console.log(`[processImage: ${jobId}] Entering 'finally' block. Final Status: ${finalStatus}. Error: ${errorMessage}`);
    if (finalStatus.startsWith('failed_')) {
      if (!outputMetadata) outputMetadata = {};
      outputMetadata.originalErrorType = finalStatus;
      finalStatus = 'error'; 
      console.log(`[processImage: ${jobId}] Normalizing status to 'error'. Original: ${outputMetadata.originalErrorType}`);
    }
    
    try {
      console.log(`[processImage: ${jobId}] Attempting final status update. Status: ${finalStatus}, OutputPath: ${outputFilePath}, ErrorMsg: ${errorMessage}`);
      await updateJobStatus(jobId, finalStatus, outputFilePath, errorMessage, outputMetadata);
      console.log(`[processImage: ${jobId}] Final status update to ${finalStatus} successful.`);
    } catch (updateError) {
      const castUpdateError = updateError as Error;
      console.error(`[processImage: ${jobId}] CRITICAL: Failed to update final status in 'finally'. Error: ${castUpdateError.message}`, { stack: castUpdateError.stack });
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (!supabaseAdmin) {
    console.error('[Background API Handler] CRITICAL: supabaseAdmin is not defined or null at handler start.');
  } else {
    console.log('[Background API Handler] supabaseAdmin client appears to be available at handler start.');
  }

  if (req.method !== 'POST') {
    console.log('[Background API Handler] Método não permitido:', req.method);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const internalSecret = req.headers['x-internal-secret'];
  if (!internalSecret || internalSecret !== process.env.INTERNAL_API_SECRET) {
    console.warn('[Background API Handler] Tentativa de acesso não autorizado. Segredo fornecido:', internalSecret ? "presente mas inválido" : "ausente");
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { jobId } = req.body;
  if (!jobId || typeof jobId !== 'string') {
    console.log('[Background API Handler] jobId não fornecido ou tipo inválido:', jobId);
    return res.status(400).json({ message: 'jobId é obrigatório e deve ser uma string' });
  }

  console.log(`[Background API Handler] Recebido pedido para job: ${jobId}`);

  try {
    console.log(`[Background API Handler] Buscando dados do job ${jobId} no Supabase.`);
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('transformations')
      .select('id, status, input_file_path, style_requested, user_id')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      console.error(`[Background API Handler] Job ${jobId} não encontrado ou erro ao buscar:`, jobError);
      return res.status(200).json({ 
        success: false, 
        message: `Job não encontrado ou erro ao buscar: ${jobError?.message || 'Nenhum dado retornado'}`
      });
    }

    console.log(`[Background API Handler] Job ${jobId} carregado: status atual '${jobData.status}', user: ${jobData.user_id}, input: ${jobData.input_file_path}, style: ${jobData.style_requested}`);

    if (!jobData.input_file_path || !jobData.style_requested || !jobData.user_id) {
      const errorMsg = `Dados de job incompletos para ${jobId}. Input: ${jobData.input_file_path}, Style: ${jobData.style_requested}, User: ${jobData.user_id}`;
      console.error(`[Background API Handler] ${errorMsg}`);
      try {
        await updateJobStatus(jobId, 'error', null, errorMsg.substring(0,500));
      } catch (updateErr) {
          console.error(`[Background API Handler] Falha ao atualizar status para erro (dados incompletos) para job ${jobId}: ${(updateErr as Error).message}`);
      }
      return res.status(200).json({ success: false, message: errorMsg });
    }

    if (jobData.status === 'completed' || jobData.status === 'error' ) {
        console.warn(`[Background API Handler] Job ${jobId} já está no estado terminal '${jobData.status}'. Não será reprocessado.`);
        return res.status(200).json({ 
            success: true, 
            message: `Job ${jobId} já está no estado '${jobData.status}'. Não foi reprocessado.`,
            jobId
        });
    }
    
    console.log(`[Background API Handler] Respondendo 202 Accepted para job ${jobId} e iniciando processamento real.`);
    res.status(202).json({
      success: true,
      message: 'Processamento em background agendado',
      jobId
    });

    processImage(jobId, jobData as JobData).catch(_error => {
      const castError = _error as Error;
      console.error(`[Background API Handler] ERRO NÃO CAPTURADO NO TOPO DO PROCESSAMENTO para job ${jobId}: ${castError.message}`, {
          errorObject: castError, stack: castError.stack, jobId: jobId
      });
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no handler';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`[Background API Handler] Erro GERAL no handler para job ${jobId}: ${errorMessage}`, { errorObject: error, stack: errorStack, jobId: jobId });
    if (!res.writableEnded) {
        return res.status(500).json({ success: false, message: `Erro interno no servidor: ${errorMessage}` });
    } else {
        console.error(`[Background API Handler] Resposta já enviada, não foi possível enviar erro 500 para job ${jobId}.`);
    }
  }
}
