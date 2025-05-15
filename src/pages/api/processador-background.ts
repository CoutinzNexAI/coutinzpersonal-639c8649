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
  try {
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
  } catch (updateError) {
    // Capturar qualquer erro interno para não interromper o fluxo
    console.error(`[updateJobStatus] CRITICAL: Failed to update status for job ${jobId}:`, updateError);
    // Não relançamos o erro para não quebrar o fluxo principal
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
    console.log(`[processImage] Status updated to 'processing' for job ${jobId}`);

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

    if (downloadError) {
      console.error(`[processImage] Error downloading image: ${downloadError.message}`);
      throw new Error(`Falha ao baixar imagem: ${downloadError.message}`);
    }

    if (!downloadData) {
      console.error(`[processImage] Download completed but no data received`);
      throw new Error('Falha ao baixar imagem: Sem dados');
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
    formData.append('model', 'dall-e-2');
    formData.append('prompt', promptText);
    formData.append('image', fs.createReadStream(tempFilePath));
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    // 7. Chamar a API da OpenAI
    console.log(`[processImage] Calling OpenAI API for job ${jobId}`);
    let openaiResponse;
    try {
      openaiResponse = await axios.post(
        'https://api.openai.com/v1/images/edits',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          // Reduzir timeout para deixar margem para o resto do processamento
          timeout: 45000 // 45 segundos
        }
      );
      console.log(`[processImage] Received response from OpenAI with status: ${openaiResponse.status}`);
    } catch (openaiError) {
      if (axios.isAxiosError(openaiError)) {
        console.error(`[processImage] OpenAI API error for job ${jobId}:`, {
          status: openaiError.response?.status,
          statusText: openaiError.response?.statusText,
          data: JSON.stringify(openaiError.response?.data || {}).substring(0, 500), // Limitar para evitar logs muito grandes
          message: openaiError.message
        });
      } else {
        console.error(`[processImage] Non-Axios error calling OpenAI for job ${jobId}:`, openaiError);
      }
      throw openaiError; // Re-throw para ser capturado pelo catch externo
    }

    // 8. Limpar arquivo temporário
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
        tempFilePath = null;
        console.log(`[processImage] Deleted temp file for job ${jobId}`);
      } catch (unlinkError) {
        console.warn(`[processImage] Failed to delete temp file ${tempFilePath} for job ${jobId}:`, unlinkError);
        // Não interrompe o fluxo se falhar na limpeza
      }
    }

    console.log(`[processImage] Processing OpenAI response for job ${jobId}`);
    
    // Validação mais detalhada da resposta
    if (!openaiResponse) {
      throw new Error('Resposta da OpenAI é undefined');
    }
    
    if (openaiResponse.status !== 200) {
      throw new Error(`Resposta com status inesperado da API OpenAI: ${openaiResponse.status}`);
    }
    
    if (!openaiResponse.data) {
      throw new Error('Resposta da OpenAI não contém dados');
    }
    
    if (!openaiResponse.data.data || !Array.isArray(openaiResponse.data.data) || openaiResponse.data.data.length === 0) {
      throw new Error('Resposta da OpenAI não contém itens de dados');
    }

    console.log(`[processImage] OpenAI response validation passed for job ${jobId}`);

    // 10. Processar resultado (b64_json ou url)
    const b64Image = openaiResponse.data.data[0].b64_json;
    const imageUrl = openaiResponse.data.data[0].url;

    if (!b64Image && !imageUrl) {
      throw new Error('Dados de imagem ausentes na resposta da OpenAI');
    }

    // 11. Criar buffer a partir do resultado
    let outputImageBuffer: Buffer;
    if (b64Image) {
      console.log(`[processImage] Using b64_json for job ${jobId} (length: ${b64Image.length})`);
      outputImageBuffer = Buffer.from(b64Image, 'base64');
    } else {
      console.log(`[processImage] Using URL for job ${jobId}: ${imageUrl}`);
      try {
        const imageResponse = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 10000 // 10 segundos para o download
        });
        outputImageBuffer = Buffer.from(imageResponse.data);
        console.log(`[processImage] Successfully downloaded image from URL for job ${jobId}`);
      } catch (imageDownloadError) {
        console.error(`[processImage] Failed to download image from URL for job ${jobId}:`, imageDownloadError);
        throw new Error(`Falha ao baixar imagem da URL: ${imageDownloadError instanceof Error ? imageDownloadError.message : 'Erro desconhecido'}`);
      }
    }

    // 12. Upload do resultado para o Supabase
    const timestamp = Date.now();
    outputFilePath = `public/${jobData.user_id}/${jobId}/result_${timestamp}.png`;
    
    console.log(`[processImage] Uploading result to Supabase for job ${jobId}: ${outputFilePath}`);
    try {
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
        console.error(`[processImage] Upload error details for job ${jobId}:`, uploadError);
        throw new Error(`Falha ao fazer upload do resultado: ${uploadError.message}`);
      }
      
      console.log(`[processImage] Successfully uploaded result to Supabase for job ${jobId}`);
    } catch (uploadEx) {
      console.error(`[processImage] Exception during Supabase upload for job ${jobId}:`, uploadEx);
      throw uploadEx; // Re-throw para ser capturado pelo catch externo
    }
    
    // 13. Definir status final de sucesso
    finalStatus = 'completed';
    outputMetadata = {
      processedAt: new Date().toISOString(),
      style: jobData.style_requested,
      aiModel: 'dall-e-2',
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
        data: axiosError.response?.data ? JSON.stringify(axiosError.response.data).substring(0, 500) : null,
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
      console.log(`[processImage] Entering finally block for job ${jobId}`);
      
      // Verificar se temos a imagem no storage mesmo com erro
      if (finalStatus.startsWith('failed') && outputFilePath === null) {
        try {
          console.log(`[processImage] Checking for existing results for failed job ${jobId}`);
          // Verifica se, apesar do erro, existe alguma imagem associada a este job
          const { data: results, error: listError } = await supabaseAdmin
            .storage
            .from('results')
            .list(`public/${jobData.user_id}/${jobId}`, {
              limit: 1,
              sortBy: { column: 'name', order: 'desc' },
            });
          
          if (listError) {
            console.error(`[processImage] Error listing results for job ${jobId}:`, listError);
          } else if (results && results.length > 0) {
            const fileName = results[0].name;
            console.log(`[processImage] Found existing result despite error for job ${jobId}: ${fileName}`);
            outputFilePath = `public/${jobData.user_id}/${jobId}/${fileName}`;
            finalStatus = 'completed'; // Forçar sucesso se temos a imagem
            
            // Adiciona informação ao metadata
            outputMetadata = outputMetadata || {};
            outputMetadata.recoveryNote = "Recuperado após erro de processamento";
            
            // Tenta explicitamente obter a URL pública
            try {
              const { data: publicUrlData } = await supabaseAdmin
                .storage
                .from('results')
                .getPublicUrl(outputFilePath);
                
              if (publicUrlData?.publicUrl) {
                console.log(`[processImage] Successfully generated public URL for recovered job ${jobId}: ${publicUrlData.publicUrl}`);
                // A URL será adicionada pelo updateJobStatus
              }
            } catch (urlEx) {
              console.error(`[processImage] Failed to get public URL for recovered file:`, urlEx);
              // Continue mesmo sem a URL
            }
          } else {
            console.log(`[processImage] No existing results found for failed job ${jobId}`);
          }
        } catch (listEx) {
          console.error(`[processImage] Exception checking for existing results for job ${jobId}:`, listEx);
          // Continue mesmo com erro no listing
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
      
      // Tentativa de update do status final com retry
      let updateSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!updateSuccess && retryCount < maxRetries) {
        try {
          console.log(`[processImage] Attempting final updateJobStatus for job ${jobId} (attempt ${retryCount + 1}/${maxRetries})`);
          await updateJobStatus(jobId, finalStatus, outputFilePath, errorMessage, outputMetadata);
          updateSuccess = true;
          console.log(`[processImage] Final status update completed for job ${jobId}: ${finalStatus}`);
        } catch (updateEx) {
          retryCount++;
          const retryDelay = retryCount * 1000; // incrementa o delay a cada retry
          console.error(`[processImage] Failed update attempt ${retryCount}/${maxRetries} for job ${jobId}:`, updateEx);
          
          if (retryCount < maxRetries) {
            console.log(`[processImage] Will retry update in ${retryDelay}ms`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      if (!updateSuccess) {
        console.error(`[processImage] CRITICAL: All attempts to update final status failed for job ${jobId}`);
      }
    } catch (finallyError) {
      console.error(`[processImage] CRITICAL: Error in finally block for job ${jobId}: ${finallyError instanceof Error ? finallyError.message : 'Erro desconhecido'}`);
    }

    // Limpeza de arquivo temporário remanescente
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`[processImage] Cleaned up temp file for job ${jobId}: ${tempFilePath}`);
      } catch (cleanupError) {
        console.warn(`[processImage] Failed to clean up temp file in finally block: ${tempFilePath}`);
        // Ignorar erros na limpeza final
      }
    }
    
    console.log(`[processImage] Processing completed for job ${jobId} with final status: ${finalStatus}`);
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