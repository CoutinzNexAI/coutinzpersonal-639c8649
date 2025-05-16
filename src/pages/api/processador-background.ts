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
  // DEBUGGING: Verificar se supabaseAdmin está definido no início da função
  if (!supabaseAdmin) {
    console.error(`[updateJobStatus] CRITICAL: supabaseAdmin is not defined or null for job ${jobId} at the beginning of updateJobStatus.`);
    // Considerar lançar um erro aqui ou ter uma estratégia de fallback,
    // mas para depuração, o log é o mais importante.
    // Se supabaseAdmin não estiver definido, a função irá falhar na próxima chamada.
  } else {
    console.log(`[updateJobStatus] supabaseAdmin client appears to be available for job ${jobId}.`);
  }

  const updateData: Record<string, unknown> = { status };

  // Campos de timestamp
  if (status === 'processing') {
    updateData.processing_started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed' || status === 'error' || status.startsWith('failed_')) {
    updateData.completed_at = new Date().toISOString();
  }

  // Caminho e URL de saída
  if (outputFilePath) {
    updateData.output_file_path = outputFilePath;
    console.log(`[updateJobStatus] Attempting to generate public URL for outputFilePath: ${outputFilePath}`);
    
    try {
      const { data: publicUrlData } = await supabaseAdmin
        .storage
        .from('results')
        .getPublicUrl(outputFilePath);

      if (publicUrlData?.publicUrl) {
        console.log(`[updateJobStatus] Generated public URL for job ${jobId}: ${publicUrlData.publicUrl}`);
        updateData.output_url = publicUrlData.publicUrl;
      } else {
        console.warn(`[updateJobStatus] getPublicUrl for ${outputFilePath} did not return a publicUrl (publicUrlData: ${JSON.stringify(publicUrlData)}). Attempting fallback.`);
        const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        if (storageUrl) {
          const fallbackUrl = `${storageUrl}/storage/v1/object/public/results/${outputFilePath}`;
          console.warn(`[updateJobStatus] Using fallback URL construction for job ${jobId}: ${fallbackUrl}`);
          updateData.output_url = fallbackUrl;
        } else {
          console.error(`[updateJobStatus] Failed to generate URL for job ${jobId} - no storage URL available for fallback`);
        }
      }
    } catch (urlException) {
      console.error(`[updateJobStatus] Exception during public URL generation for ${outputFilePath}:`, urlException);
      // Log the error, but proceed to update the job status without the URL if necessary
    }
  }

  // Mensagem de erro (limitada para evitar problemas no banco)
  if (errorMessage) {
    updateData.error_message = errorMessage.substring(0, 500);
  }

  // Metadados
  if (metadata) {
    updateData.output_metadata = metadata;
  }

  // Verificar se temos uma URL válida ao completar com sucesso
  if (status === 'completed' && !updateData.output_url) {
    console.error(`[updateJobStatus] Warning: Job ${jobId} marked as completed but has no output URL`);
  }

  // Converter status detalhados para 'completed' ou 'error' conforme schema
  if (status.startsWith('failed_')) {
    console.log(`[updateJobStatus] Converting detailed status ${status} to 'error' per schema`);
    updateData.output_metadata = updateData.output_metadata || {};
    Object.assign(updateData.output_metadata, { originalStatus: status });
    updateData.status = 'error'; // Atualiza o status no objeto updateData
  } else {
    updateData.status = status; // Garante que o status correto está no updateData
  }

  // DEBUGGING: Logar os dados que serão enviados para o Supabase ANTES da tentativa de update
  console.log(`[updateJobStatus] Preparing to update job ${jobId}. Status: ${updateData.status}. Full update data:`, JSON.stringify(updateData, null, 2));

  try {
    // Enviar atualização para o Supabase
    const { error } = await supabaseAdmin
      .from('transformations')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error(`[updateJobStatus] Error updating job ${jobId} in Supabase:`, error);
      // DEBUGGING: Lançar o erro para ser apanhado pelo catch em processImage ou no handler
      throw new Error(`Falha ao atualizar status no Supabase: ${error.message} (Code: ${error.code}, Details: ${error.details}, Hint: ${error.hint})`);
    } else {
      console.log(`[updateJobStatus] Successfully updated job ${jobId} to status: ${updateData.status}`);
    }
  } catch (e) {
    // DEBUGGING: Capturar qualquer exceção que ocorra durante a operação de update
    // Esta é a captura crucial se a biblioteca Supabase lançar uma exceção direta
    const castError = e as Error;
    console.error(`[updateJobStatus] CRITICAL EXCEPTION during Supabase update for job ${jobId}. Status being set: ${updateData.status}. Error: ${castError.message}`, {
        errorObject: castError,
        stack: castError.stack, // Incluir o stack trace
        jobId: jobId,
        updatePayload: updateData
    });
    // Re-lançar o erro para que a função chamadora (processImage) saiba que falhou.
    throw e;
  }
}

/**
 * Busca o prompt para o estilo solicitado diretamente do banco de dados
 */
async function getPromptFromDB(styleId: string): Promise<string> {
  // DEBUGGING: Verificar supabaseAdmin antes de usar
  if (!supabaseAdmin) {
    console.error(`[getPromptFromDB] CRITICAL: supabaseAdmin is not defined or null when trying to fetch prompt for style ${styleId}.`);
    return `Transform this image using the ${styleId} style. (Error: DB connection not available)`;
  }
  try {
    console.log(`[getPromptFromDB] Querying style: ${styleId}`);
    const { data: styleResult, error } = await supabaseAdmin
      .from('styles')
      .select('name, prompt_template')
      .or(`id.eq.${styleId},name.ilike.%${styleId}%`) // Corrigido ilike para sintaxe SQL
      .limit(1)
      .single();
    
    if (error) {
      console.error(`[getPromptFromDB] Erro ao buscar estilo ${styleId}:`, error);
      return `Transform this image using the ${styleId} style. Apply artistic interpretation while maintaining the composition and key elements of the original image. (DB query error)`;
    }
    
    if (styleResult) {
      console.log(`[getPromptFromDB] Found style: ${styleResult.name}`);
      if (styleResult.prompt_template) {
        return styleResult.prompt_template;
      } else {
        console.warn(`[getPromptFromDB] Style ${styleResult.name} found, but no prompt_template. Using fallback.`);
        return `Transform this image using the ${styleResult.name} style. Apply artistic interpretation while maintaining the composition and key elements of the original image.`;
      }
    }
    
    console.warn(`[getPromptFromDB] Style ${styleId} not found in DB. Using fallback.`);
    return `Transform this image using the ${styleId} style. Apply artistic interpretation while maintaining the composition and key elements of the original image.`;
    
  } catch (error) {
    const castError = error as Error;
    console.error(`[getPromptFromDB] Exception while fetching prompt for style ${styleId}: ${castError.message}`, { stack: castError.stack });
    return `Transform this image using the ${styleId} style. Apply artistic interpretation while maintaining the composition and key elements of the original image. (Exception during DB query)`;
  }
}

/**
 * Processa a imagem - função principal que executa em background
 */
async function processImage(jobId: string, jobData: JobData) {
  let finalStatus = 'failed'; // Default para failed
  let errorMessage: string | null = null;
  let outputFilePath: string | null = null;
  let outputMetadata: Record<string, unknown> | null = {}; // Inicializar como objeto
  let tempFilePath: string | null = null;

  console.log(`[processImage] Starting processing for job ${jobId}, style: ${jobData.style_requested}`);

  // DEBUGGING: Teste de conectividade com Supabase no início de processImage
  try {
    if (!supabaseAdmin) {
        console.error(`[processImage] PRE-CHECK FAIL: supabaseAdmin is not defined or null for job ${jobId} at the start of processImage.`);
        // Se o supabaseAdmin não estiver aqui, não faz sentido continuar.
        // A função updateJobStatus irá falhar de qualquer maneira.
        // Pode ser útil lançar um erro aqui para parar mais cedo.
        throw new Error("supabaseAdmin client is not available at the start of processImage.");
    }
    console.log(`[processImage] Attempting Supabase connectivity test for job ${jobId}...`);
    const { data: testData, error: testError } = await supabaseAdmin
      .from('styles') // Usar uma tabela que se espera que exista e tenha poucos dados
      .select('id')
      .limit(1);

    if (testError) {
      console.error(`[processImage] Supabase connectivity test FAILED for job ${jobId}:`, testError);
      // Não lançar erro aqui necessariamente, pois updateJobStatus tentará e logará o seu próprio erro.
      // Mas este log é um forte indicador de problemas.
      errorMessage = `Supabase connectivity test failed: ${testError.message}`;
      finalStatus = 'failed_connectivity_test'; // Status mais específico
    } else {
      console.log(`[processImage] Supabase connectivity test SUCCEEDED for job ${jobId}. Found ${testData?.length || 0} records.`);
    }
  } catch (connectivityException) {
    const castError = connectivityException as Error;
    console.error(`[processImage] CRITICAL EXCEPTION during Supabase connectivity test for job ${jobId}: ${castError.message}`, {
        errorObject: castError,
        stack: castError.stack
    });
    errorMessage = `Critical exception during Supabase connectivity test: ${castError.message}`;
    finalStatus = 'failed_connectivity_exception'; // Status mais específico
    // Neste ponto, é provável que a próxima chamada a updateJobStatus falhe,
    // então vamos atualizar o status e sair.
    try {
        await updateJobStatus(jobId, finalStatus, null, errorMessage, outputMetadata);
    } catch (updateErr) {
        console.error(`[processImage] CRITICAL: Failed to update status after connectivity test failure for job ${jobId}. Error: ${ (updateErr as Error).message }`);
    }
    return; // Sair da função processImage
  }


  try {
    // 1. Atualizar status para 'processing'
    // Este é o ponto onde o relatório original indicava a paragem dos logs.
    // A função updateJobStatus agora tem um try/catch interno mais robusto.
    console.log(`[processImage] Attempting to set job ${jobId} to 'processing' status.`);
    await updateJobStatus(jobId, 'processing');
    console.log(`[processImage] Successfully set job ${jobId} to 'processing'.`);

    // 2. Verificar caminho do arquivo de entrada
    if (!jobData.input_file_path) {
      throw new Error('Caminho do arquivo de entrada ausente');
    }
    console.log(`[processImage] Input file path for job ${jobId}: ${jobData.input_file_path}`);

    // 3. Download da imagem original
    console.log(`[processImage] Downloading original image for job ${jobId}: ${jobData.input_file_path}`);
    const { data: downloadData, error: downloadError } = await supabaseAdmin
      .storage
      .from('images')
      .download(jobData.input_file_path);

    if (downloadError || !downloadData) {
      console.error(`[processImage] Failed to download image for job ${jobId}:`, downloadError);
      throw new Error(`Falha ao baixar imagem: ${downloadError?.message || 'Sem dados'}`);
    }

    console.log(`[processImage] Successfully downloaded image for job ${jobId}`);
    const imageArrayBuffer = await downloadData.arrayBuffer();
    const imageInputBuffer = Buffer.from(imageArrayBuffer);

    // 4. Gerar prompt
    console.log(`[processImage] Getting prompt for job ${jobId}, style: ${jobData.style_requested}`);
    const promptText = await getPromptFromDB(jobData.style_requested);
    console.log(`[processImage] Generated prompt for job ${jobId}: "${promptText}"`);
    outputMetadata = { ...outputMetadata, promptUsed: promptText, aiModel: 'gpt-image-1' }; // Adicionar prompt aos metadados

    // 5. Preparar para chamar a API da OpenAI
    const tempDir = os.tmpdir();
    const tempFileName = `input_${jobId}_${Date.now()}.png`; // Usar .png como default, ou detetar tipo
    tempFilePath = path.join(tempDir, tempFileName);
    
    fs.writeFileSync(tempFilePath, new Uint8Array(imageInputBuffer)); // imageInputBuffer já é Buffer
    console.log(`[processImage] Saved temp file for job ${jobId}: ${tempFilePath}`);

    // 6. Preparar FormData para a API da OpenAI
    const formData = new FormData();
    formData.append('model', 'dall-e-2'); // Ou o modelo que estiver a usar, ex: dall-e-3. 'gpt-image-1' não é um modelo de edição de imagem conhecido.
    formData.append('prompt', promptText);
    formData.append('image', fs.createReadStream(tempFilePath));
    formData.append('n', '1');
    formData.append('size', '1024x1024'); // Verificar se este tamanho é suportado pelo modelo e API
    // formData.append('response_format', 'b64_json'); // Se preferir b64_json consistentemente

    // 7. Chamar a API da OpenAI
    console.log(`[processImage] Calling OpenAI API for job ${jobId}`);
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/images/edits', // Endpoint para edições
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        timeout: 55000 // Reduzido para dar margem dentro dos 59s da Vercel
      }
    );

    // 8. Limpar arquivo temporário IMEDIATAMENTE APÓS USO (se possível)
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`[processImage] Deleted temp file for job ${jobId}: ${tempFilePath}`);
        tempFilePath = null;
      } catch (unlinkErr) {
        console.warn(`[processImage] Could not delete temp file ${tempFilePath} immediately: ${(unlinkErr as Error).message}`);
      }
    }

    console.log(`[processImage] OpenAI response status for job ${jobId}: ${openaiResponse.status}`);
    // DEBUGGING: Logar uma porção menor da resposta se for muito grande
    // console.log(`[processImage] OpenAI response data for job ${jobId}:`, JSON.stringify(openaiResponse.data, null, 2).substring(0, 1000));


    // 9. Validar resposta da OpenAI
    if (openaiResponse.status !== 200 || !openaiResponse.data?.data || openaiResponse.data.data.length === 0) {
      console.error(`[processImage] Invalid OpenAI API response for job ${jobId}. Status: ${openaiResponse.status}. Data:`, openaiResponse.data);
      throw new Error(`Resposta inválida da API OpenAI: Status ${openaiResponse.status}. Data: ${JSON.stringify(openaiResponse.data)}`);
    }

    console.log(`[processImage] Received valid OpenAI response for job ${jobId}`);

    // 10. Processar resultado (b64_json ou url)
    const resultItem = openaiResponse.data.data[0];
    const b64Image = resultItem.b64_json;
    const imageUrl = resultItem.url;

    if (!b64Image && !imageUrl) {
      console.error(`[processImage] Image data missing in OpenAI response for job ${jobId}:`, resultItem);
      throw new Error('Dados de imagem ausentes na resposta da OpenAI');
    }

    // 11. Criar buffer a partir do resultado
    let outputImageBuffer: Buffer;
    if (b64Image) {
      outputImageBuffer = Buffer.from(b64Image, 'base64');
      console.log(`[processImage] Using b64_json for job ${jobId}. Buffer length: ${outputImageBuffer.length}`);
    } else if (imageUrl) { // Adicionado 'else if' para clareza
      console.log(`[processImage] Downloading image from OpenAI URL for job ${jobId}: ${imageUrl}`);
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
      outputImageBuffer = Buffer.from(imageResponse.data);
      console.log(`[processImage] Image downloaded from URL. Buffer length: ${outputImageBuffer.length}`);
    } else {
        // Este caso não deveria acontecer devido à verificação anterior, mas é uma salvaguarda.
        throw new Error('Nenhum b64_json ou imageUrl encontrado na resposta da OpenAI.');
    }

    // 12. Upload do resultado para o Supabase
    const timestamp = Date.now();
    // Garantir que jobData.user_id e jobId são strings válidas para caminhos
    const safeUserId = String(jobData.user_id || 'unknown_user').replace(/[^a-zA-Z0-9-_]/g, '');
    const safeJobId = String(jobId || 'unknown_job').replace(/[^a-zA-Z0-9-_]/g, '');

    outputFilePath = `public/${safeUserId}/${safeJobId}/result_${timestamp}.png`;
    
    console.log(`[processImage] Uploading result to Supabase for job ${jobId}: ${outputFilePath}. Buffer size: ${outputImageBuffer.length}`);
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('results')
      .upload(outputFilePath, outputImageBuffer, {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000', // Cache público por 1 ano
        upsert: false, // Não sobrescrever se já existir (improvável com timestamp)
        // duplex: 'half' não é uma opção padrão para .upload, verificar documentação se necessário
      });

    if (uploadError) {
      console.error(`[processImage] Failed to upload result for job ${jobId}:`, uploadError);
      throw new Error(`Falha ao fazer upload do resultado: ${uploadError.message}`);
    }
    console.log(`[processImage] Successfully uploaded result for job ${jobId} to ${outputFilePath}`);

    // 13. Definir status final de sucesso
    finalStatus = 'completed';
    // Adicionar mais metadados se necessário
    outputMetadata = {
      ...outputMetadata,
      processedAt: new Date().toISOString(),
      style: jobData.style_requested, // Já está em outputMetadata se promptUsed foi adicionado
      openAIResponseTimestamp: openaiResponse.data.created, // Se disponível
      imageSizeBytes: outputImageBuffer.length,
    };

    console.log(`[processImage] Successfully processed image for job ${jobId}`);

  } catch (error) {
    const castError = error as Error; // Tipo mais genérico para o erro
    errorMessage = castError.message;
    
    console.error(`[processImage] Error processing job ${jobId}: ${errorMessage}`, {
        errorObject: castError,
        stack: castError.stack, // Logar o stack trace do erro
        jobId: jobId
    });

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      errorMessage = `Erro de API/Rede: ${axiosError.message}`;
      if (axiosError.response) {
        errorMessage += ` (Status: ${axiosError.response.status})`;
        console.error(`[processImage] Axios error details for job ${jobId}:`, {
          status: axiosError.response.status,
          data: axiosError.response.data,
          url: axiosError.config?.url,
        });
      } else {
         console.error(`[processImage] Axios error (no response) for job ${jobId}:`, {
          url: axiosError.config?.url,
          code: axiosError.code,
        });
      }
      
      if (axiosError.config?.url?.includes('openai.com')) {
        finalStatus = 'failed_api';
      } else if (axiosError.config?.url?.includes(process.env.NEXT_PUBLIC_SUPABASE_URL || 'supabase.io')) { // Verifica se é erro de download do Supabase
        finalStatus = 'failed_download_supabase';
      } else {
        finalStatus = 'failed_network_other'; // Outro erro de rede
      }
    } else if (castError.message.includes('Falha ao baixar imagem')) {
      finalStatus = 'failed_download';
    } else if (castError.message.includes('Falha ao fazer upload do resultado')) {
      finalStatus = 'failed_upload';
    } else if (castError.message.includes('Caminho do arquivo de entrada ausente')) {
      finalStatus = 'failed_input_path';
    } else if (castError.message.includes('OpenAI') || castError.message.includes('API OpenAI')) {
        finalStatus = 'failed_api_logic'; // Erro lógico ou de validação da resposta da OpenAI
    } else {
      // Se já definimos um status mais específico (ex: connectivity test), não sobrescrever com 'failed' genérico
      if (finalStatus !== 'failed_connectivity_test' && finalStatus !== 'failed_connectivity_exception') {
         finalStatus = 'failed'; // Erro genérico no processamento
      }
    }
  } finally {
    // Limpeza de arquivo temporário remanescente, caso não tenha sido limpo antes
    if (tempFilePath) {
      try {
        console.warn(`[processImage] Temp file ${tempFilePath} still exists in finally block for job ${jobId}. Attempting cleanup.`);
        fs.unlinkSync(tempFilePath);
        console.log(`[processImage] Cleaned up temp file in finally block for job ${jobId}: ${tempFilePath}`);
      } catch (unlinkErr) {
        console.error(`[processImage] Failed to clean up temp file ${tempFilePath} in finally block for job ${jobId}: ${(unlinkErr as Error).message}`);
      }
    }

    // Atualização final do status
    try {
      console.log(`[processImage] Entering 'finally' block for job ${jobId}. Current finalStatus: ${finalStatus}, errorMessage: ${errorMessage}`);
      
      // Tentar obter outputFilePath mesmo em caso de falha, se foi definido
      // A lógica de recuperação de imagem existente no teu código original foi removida para simplificar,
      // pois o foco é a falha inicial. Pode ser readicionada se necessário.

      // Garantir que o status final está de acordo com o schema e adicionar originalErrorType se necessário
      if (finalStatus.startsWith('failed_')) {
        console.log(`[processImage] Converting detailed status ${finalStatus} to 'error' per schema for job ${jobId} in finally block.`);
        if (!outputMetadata) outputMetadata = {};
        outputMetadata.originalErrorType = finalStatus;
        finalStatus = 'error';
      }
      
      console.log(`[processImage] Attempting final status update for job ${jobId}. Status: ${finalStatus}, OutputPath: ${outputFilePath}, ErrorMsg: ${errorMessage}`);
      await updateJobStatus(jobId, finalStatus, outputFilePath, errorMessage, outputMetadata);
      console.log(`[processImage] Final status update successful for job ${jobId} to ${finalStatus}.`);
    } catch (updateError) {
      const castUpdateError = updateError as Error;
      console.error(`[processImage] CRITICAL: Failed to update final status for job ${jobId} in 'finally' block. Error: ${castUpdateError.message}`, {
          errorObject: castUpdateError,
          stack: castUpdateError.stack
      });
      // Se esta atualização falhar, é um problema sério, mas a função Vercel terminará de qualquer forma.
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // DEBUGGING: Verificar se supabaseAdmin está disponível no início do handler
  if (!supabaseAdmin) {
    console.error('[Background API Handler] CRITICAL: supabaseAdmin is not defined or null at the start of the handler.');
    // Isto pode indicar um problema na importação ou inicialização de '@/lib/supabase/admin'
    // A função provavelmente falhará mais tarde.
  } else {
    console.log('[Background API Handler] supabaseAdmin client appears to be available at handler start.');
  }

  // 1. Validação da requisição
  if (req.method !== 'POST') {
    console.log('[Background API Handler] Método não permitido:', req.method);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Verificação de segurança
  const internalSecret = req.headers['x-internal-secret'];
  if (!internalSecret || internalSecret !== process.env.INTERNAL_API_SECRET) {
    console.warn('[Background API Handler] Tentativa de acesso não autorizado. Secret recebido:', internalSecret ? "presente mas inválido" : "ausente");
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // 3. Extração e validação do jobId
  const { jobId } = req.body;
  if (!jobId || typeof jobId !== 'string') { // Adicionada verificação de tipo
    console.log('[Background API Handler] jobId não fornecido ou tipo inválido:', jobId);
    return res.status(400).json({ message: 'jobId é obrigatório e deve ser uma string' });
  }

  console.log(`[Background API Handler] Recebido pedido para job: ${jobId}`);

  try {
    // 4. Buscar detalhes completos do job
    console.log(`[Background API Handler] Buscando dados do job ${jobId} no Supabase.`);
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('transformations')
      .select('id, status, input_file_path, style_requested, user_id')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      console.error(`[Background API Handler] Dados do job ${jobId} não encontrados ou erro ao buscar:`, jobError);
      // Responder 200 OK mesmo se o job não for encontrado, para evitar que o chamador (process-image) pense que houve um erro de rede.
      // O chamador deve verificar o 'success: false'.
      return res.status(200).json({ 
        success: false, 
        message: `Dados do job não encontrados: ${jobError?.message || 'Nenhum dado retornado'}`
      });
    }

    console.log(`[Background API Handler] Job ${jobId} carregado: status atual ${jobData.status}, user: ${jobData.user_id}, input: ${jobData.input_file_path}, style: ${jobData.style_requested}`);

    // 5. Verificar dados necessários
    if (!jobData.input_file_path || !jobData.style_requested || !jobData.user_id) {
      const errorMsg = `Dados de job incompletos para ${jobId}. Input: ${jobData.input_file_path}, Style: ${jobData.style_requested}, User: ${jobData.user_id}`;
      console.error(`[Background API Handler] ${errorMsg}`);
      
      try {
        await updateJobStatus(jobId, 'error', null, errorMsg.substring(0,500)); // Limitar mensagem de erro
      } catch (updateErr) {
          console.error(`[Background API Handler] Falha ao atualizar status para erro (dados incompletos) para job ${jobId}: ${(updateErr as Error).message}`);
      }
      
      return res.status(200).json({ success: false, message: errorMsg }); // Usar 200 com success: false
    }

    // Validação adicional: Não reprocessar jobs já concluídos ou falhados, a menos que explicitamente permitido
    if (jobData.status === 'completed' || jobData.status === 'error' || jobData.status === 'failed') {
        console.warn(`[Background API Handler] Job ${jobId} já está no estado terminal '${jobData.status}'. Não será reprocessado.`);
        return res.status(200).json({
            success: false, // Ou true, dependendo se considera "não fazer nada" um sucesso
            message: `Job ${jobId} já está no estado '${jobData.status}'. Não foi reprocessado.`,
            jobId
        });
    }
    // Evitar re-entrada se já estiver a processar (embora o webhook deva ser chamado apenas uma vez)
     if (jobData.status === 'processing' && req.body.retry !== true) { // Adicionar uma flag 'retry' se quiser permitir re-tentativas manuais
        console.warn(`[Background API Handler] Job ${jobId} já está em processamento. Evitando re-entrada.`);
        return res.status(202).json({ // 202 para indicar que foi aceite mas pode já estar a ser tratado
            success: true,
            message: `Job ${jobId} já está em processamento.`,
            jobId
        });
    }


    // 6. Responda primeiro, depois inicie o processamento
    console.log(`[Background API Handler] Respondendo 202 Accepted ao cliente para o job ${jobId} e iniciando processamento em background.`);
    res.status(202).json({
      success: true,
      message: 'Processamento em background agendado', // Mensagem mais precisa
      jobId
    });

    // 7. Iniciar processamento em background após responder
    // Não usar await aqui, pois queremos que a resposta HTTP seja enviada imediatamente.
    processImage(jobId, jobData as JobData).catch(_error => {
      // Este catch é um último recurso se algo muito inesperado acontecer
      // e não for tratado dentro de processImage ou updateJobStatus.
      const castError = _error as Error;
      console.error(`[Background API Handler] ERRO NÃO CAPTURADO NO TOPO DO PROCESSAMENTO para job ${jobId}: ${castError.message}`, {
          errorObject: castError,
          stack: castError.stack,
          jobId: jobId
      });
      // Tentar atualizar o status para erro se possível, mas pode não ser seguro/possível
      // dependendo do estado da aplicação.
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no handler';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`[Background API Handler] Erro geral no handler para job ${jobId}: ${errorMessage}`, {
        errorObject: error,
        stack: errorStack,
        jobId: jobId
    });
    // Não enviar res.status(500) aqui se a resposta já foi enviada (res.writableEnded)
    if (!res.writableEnded) {
        return res.status(500).json({ success: false, message: `Erro interno no servidor: ${errorMessage}` });
    } else {
        console.error(`[Background API Handler] Resposta já enviada, não foi possível enviar erro 500 para job ${jobId}.`);
    }
  }
}
