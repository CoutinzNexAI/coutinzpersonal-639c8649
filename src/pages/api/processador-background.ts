import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
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
    // Armazenar status original nos metadados
    updateData.output_metadata = updateData.output_metadata || {};
    Object.assign(updateData.output_metadata, { originalStatus: status });
    updateData.status = 'error';
  } else {
    updateData.status = status;
  }

  // Enviar atualização para o Supabase
  console.log(`[updateJobStatus] Updating job ${jobId} with status: ${updateData.status}`);
  const { error } = await supabaseAdmin
    .from('transformations')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    console.error(`[updateJobStatus] Error updating job ${jobId}:`, error);
    throw new Error(`Falha ao atualizar status: ${error.message}`);
  } else {
    console.log(`[updateJobStatus] Successfully updated job ${jobId} to status: ${updateData.status}`);
  }
}

/**
 * Busca o prompt para o estilo solicitado diretamente do banco de dados
 */
async function getPromptFromDB(styleId: string): Promise<string> {
  try {
    // Consulta o banco de dados para obter informações do estilo usando supabaseAdmin
    const { data: styleResult, error } = await supabaseAdmin
      .from('styles')
      .select('name, prompt_template')
      .or(`id.eq.${styleId},name.ilike.${styleId}`)
      .limit(1)
      .single();
    
    if (error) {
      console.error(`[Style Query] Erro ao buscar estilo ${styleId}:`, error);
      // Fallback em caso de erro na consulta
      return `Transform this image using the ${styleId} style. Apply artistic interpretation while maintaining the composition and key elements of the original image.`;
    }
    
    // Se encontrou o estilo no banco, use o prompt_template
    if (styleResult) {
      if (styleResult.prompt_template) {
        return styleResult.prompt_template;
      } else {
        // Fallback para o caso de não ter prompt_template
        return `Transform this image using the ${styleResult.name} style. Apply artistic interpretation while maintaining the composition and key elements of the original image.`;
      }
    }
    
    // Fallback para o caso de não encontrar o estilo no banco
    return `Transform this image using the ${styleId} style. Apply artistic interpretation while maintaining the composition and key elements of the original image.`;
    
  } catch (error) {
    console.error(`[Style Query] Erro ao buscar prompt para estilo ${styleId}:`, error);
    // Fallback em caso de erro na consulta
    return `Transform this image using the ${styleId} style. Apply artistic interpretation while maintaining the composition and key elements of the original image.`;
  }
}

/**
 * Processa a imagem - função principal que executa em background
 */
async function processImage(jobId: string, jobData: JobData) {
  let finalStatus = 'failed';
  let errorMessage = null;
  let outputFilePath = null;
  let outputMetadata = null;
  let tempFilePath: string | null = null;

  console.log(`[processImage] Starting processing for job ${jobId}, style: ${jobData.style_requested}`);

  try {
    // 1. Atualizar status para 'processing'
    await updateJobStatus(jobId, 'processing');

    // 2. Verificar caminho do arquivo de entrada
    if (!jobData.input_file_path) {
      throw new Error('Caminho do arquivo de entrada ausente');
    }

    // 3. Download da imagem original
    console.log(`[processImage] Downloading original image for job ${jobId}: ${jobData.input_file_path}`);
    const { data: downloadData, error: downloadError } = await supabaseAdmin
      .storage
      .from('images')
      .download(jobData.input_file_path);

    if (downloadError || !downloadData) {
      throw new Error(`Falha ao baixar imagem: ${downloadError?.message || 'Sem dados'}`);
    }

    console.log(`[processImage] Successfully downloaded image for job ${jobId}`);
    const imageArrayBuffer = await downloadData.arrayBuffer();
    const imageInputBuffer = Buffer.from(imageArrayBuffer);

    // 4. Gerar prompt - AGORA CONSULTANDO O BANCO DE DADOS
    const promptText = await getPromptFromDB(jobData.style_requested);
    console.log(`[processImage] Generated prompt for style ${jobData.style_requested}`);

    // 5. Preparar para chamar a API da OpenAI
    const tempDir = os.tmpdir();
    const tempFileName = `input_${jobId}_${Date.now()}.png`;
    tempFilePath = path.join(tempDir, tempFileName);
    
    fs.writeFileSync(tempFilePath, new Uint8Array(imageInputBuffer.buffer));
    console.log(`[processImage] Saved temp file for job ${jobId}: ${tempFilePath}`);

    // 6. Preparar FormData para a API da OpenAI
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', promptText);
    formData.append('image', fs.createReadStream(tempFilePath));
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    // 7. Chamar a API da OpenAI
    console.log(`[processImage] Calling OpenAI API for job ${jobId}`);
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/images/edits',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        timeout: 59000 // 50 segundos
      }
    );

    // 8. Limpar arquivo temporário
    if (tempFilePath) {
      fs.unlinkSync(tempFilePath);
      tempFilePath = null;
      console.log(`[processImage] Deleted temp file for job ${jobId}`);
    }

    console.log(`[processImage] OpenAI response for job ${jobId}:`, JSON.stringify(openaiResponse.data, null, 2));

    // 9. Validar resposta da OpenAI
    if (openaiResponse.status !== 200 || !openaiResponse.data?.data || openaiResponse.data.data.length === 0) {
      throw new Error(`Resposta inválida da API OpenAI: Status ${openaiResponse.status}`);
    }

    console.log(`[processImage] Received valid OpenAI response for job ${jobId}`);

    // 10. Processar resultado (b64_json ou url)
    const b64Image = openaiResponse.data.data[0].b64_json;
    const imageUrl = openaiResponse.data.data[0].url;

    if (!b64Image && !imageUrl) {
      throw new Error('Dados de imagem ausentes na resposta da OpenAI');
    }

    // 11. Criar buffer a partir do resultado
    let outputImageBuffer: Buffer;
    if (b64Image) {
      outputImageBuffer = Buffer.from(b64Image, 'base64');
      console.log(`[processImage] Using b64_json for job ${jobId}`);
    } else {
      console.log(`[processImage] Using URL for job ${jobId}: ${imageUrl}`);
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      outputImageBuffer = Buffer.from(imageResponse.data);
    }

    // 12. Upload do resultado para o Supabase
    const timestamp = Date.now();
    outputFilePath = `public/${jobData.user_id}/${jobId}/result_${timestamp}.png`;
    
    console.log(`[processImage] Uploading result to Supabase for job ${jobId}: ${outputFilePath}`);
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('results')
      .upload(outputFilePath, outputImageBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000', // 1 year
        upsert: false,
        duplex: 'half',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Cache-Control': 'public, max-age=31536000'
        }
      });

    if (uploadError) {
      throw new Error(`Falha ao fazer upload do resultado: ${uploadError.message}`);
    }
    // 13. Definir status final de sucesso
    finalStatus = 'completed';
    outputMetadata = {
      processedAt: new Date().toISOString(),
      style: jobData.style_requested,
      aiModel: 'gpt-image-1',
      promptUsed: promptText
    };

    console.log(`[processImage] Successfully processed image for job ${jobId}`);

  } catch (error) {
    // Tratamento de erros detalhado
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      errorMessage = `Erro de API/Rede: ${axiosError.message}`;
      
      // Classificar erros por tipo
      if (axiosError.config?.url?.includes('openai.com')) {
        finalStatus = 'failed_api';
      } else {
        finalStatus = 'failed_download';
      }

      // Log mais detalhado para debug
      console.error(`[processImage] Axios error details for job ${jobId}:`, {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        url: axiosError.config?.url,
        message: axiosError.message
      });
    } else if (error instanceof Error) {
      errorMessage = error.message;
      
      // Classificar erros por mensagem
      if (errorMessage.includes('download')) {
        finalStatus = 'failed_download';
      } else if (errorMessage.includes('upload')) {
        finalStatus = 'failed_upload';
      } else if (errorMessage.includes('input_file_path')) {
        finalStatus = 'failed_input_path';
      }
    } else {
      errorMessage = String(error);
    }

    console.error(`[processImage] Error for job ${jobId}: ${errorMessage}`);
  } finally {
    // Atualização final do status e limpeza
    try {
      // Verificar se temos a imagem no storage mesmo com erro
      if (finalStatus.startsWith('failed') && outputFilePath === null) {
        try {
          console.log(`[processImage] Checking for existing results for failed job ${jobId}`);
          // Verifica se, apesar do erro, existe alguma imagem associada a este job
          const { data: results } = await supabaseAdmin
            .storage
            .from('results')
            .list(`public/${jobData.user_id}/${jobId}`, {
              limit: 1,
              sortBy: { column: 'name', order: 'desc' },
            });
            
          if (results && results.length > 0) {
            const fileName = results[0].name;
            console.log(`[processImage] Found existing result despite error for job ${jobId}: ${fileName}`);
            outputFilePath = `public/${jobData.user_id}/${jobId}/${fileName}`;
            finalStatus = 'completed'; // Forçar sucesso se temos a imagem
            
            // Adiciona informação ao metadata
            outputMetadata = outputMetadata || {};
            outputMetadata.recoveryNote = "Recuperado após erro de processamento";
          }
        } catch (_e) {
          console.error(`[processImage] Error checking for existing results for job ${jobId}:`, _e);
        }
      }
      
      // Garantir que o status final está de acordo com o schema
      if (finalStatus.startsWith('failed_')) {
        console.log(`[processImage] Converting detailed status ${finalStatus} to 'error' per schema for job ${jobId}`);
        const originalStatus = finalStatus;
        finalStatus = 'error';
        
        // Adiciona o status original ao metadata para debugging
        outputMetadata = outputMetadata || {};
        outputMetadata.originalErrorType = originalStatus;
      }
      
      await updateJobStatus(jobId, finalStatus, outputFilePath, errorMessage, outputMetadata);
      console.log(`[processImage] Final status update for job ${jobId}: ${finalStatus}`);
    } catch (updateError) {
      console.error(`[processImage] CRITICAL: Failed to update final status for job ${jobId}: ${updateError instanceof Error ? updateError.message : 'Erro desconhecido'}`);
    }

    // Limpeza de arquivo temporário remanescente
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`[processImage] Cleaned up temp file for job ${jobId}: ${tempFilePath}`);
      } catch {
        // Ignorar erros na limpeza final
      }
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // 1. Validação da requisição
  if (req.method !== 'POST') {
    console.log('[Background API] Método não permitido:', req.method);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Verificação de segurança
  const internalSecret = req.headers['x-internal-secret'];
  if (!internalSecret || internalSecret !== process.env.INTERNAL_API_SECRET) {
    console.log('[Background API] Tentativa de acesso não autorizado');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // 3. Extração e validação do jobId
  const { jobId } = req.body;
  if (!jobId) {
    console.log('[Background API] jobId não fornecido');
    return res.status(400).json({ message: 'jobId is required' });
  }

  console.log(`[Background API] Recebido pedido para job: ${jobId}`);

  try {
    // 4. Buscar detalhes completos do job
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('transformations')
      .select('id, status, input_file_path, style_requested, user_id')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      console.log(`[Background API] Dados do job não encontrados: ${jobId}`, jobError);
      return res.status(200).json({ 
        success: false, 
        message: `Dados do job não encontrados: ${jobError?.message || 'Nenhum dado'}`
      });
    }

    console.log(`[Background API] Job carregado: ${jobId}, status atual: ${jobData.status}, user: ${jobData.user_id}`);

    // 5. Verificar dados necessários
    if (!jobData.input_file_path || !jobData.style_requested || !jobData.user_id) {
      const errorMsg = `Dados de job incompletos para ${jobId}`;
      console.log(`[Background API] ${errorMsg}`);
      
      // Atualizar status para falha
      await updateJobStatus(jobId, 'error', null, errorMsg);
      
      return res.status(200).json({ success: false, message: errorMsg });
    }

    // 6. Responda primeiro, depois inicie o processamento
    console.log(`[Background API] Respondendo ao cliente para o job ${jobId}`);
    res.status(202).json({
      success: true,
      message: 'Processamento em background iniciado',
      jobId
    });

    // 7. Iniciar processamento em background após responder
    console.log(`[Background API] Iniciando processamento de imagem para job ${jobId}`);
    processImage(jobId, jobData as JobData).catch(_error => {
      console.error(`[Background API] Erro não capturado no processamento: ${jobId}`, _error);
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[Background API] Erro no handler: ${errorMessage}`);
    return res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
}