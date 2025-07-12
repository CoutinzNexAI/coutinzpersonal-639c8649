import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Buffer } from 'buffer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { waitUntil } from '@vercel/functions';

// Definições para validação de ficheiro no servidor
const MAX_SERVER_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB (limite da OpenAI)
const CLIENT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB (para a mensagem de reembolso)
const ALLOWED_SERVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Custom Error class that includes a status
class CustomErrorWithStatus extends Error {
  status: string;
  constructor(status: string, message: string) {
    super(message);
    this.status = status;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, CustomErrorWithStatus.prototype);
  }
}

function isCustomErrorWithStatus(error: unknown): error is CustomErrorWithStatus {
  return error instanceof CustomErrorWithStatus;
}


// Handlers Globais de Erro (mantidos por precaução, mas com logging reduzido)
try {
    process.on('uncaughtException', (error: Error) => {
        console.error(`[GLOBAL] Uncaught Exception: ${error.message}`);
    });
    process.on('unhandledRejection', (reason: unknown) => {
        const reasonError = reason instanceof Error ? reason : new Error(String(reason));
        console.error(`[GLOBAL] Unhandled Rejection: ${reasonError.message}`);
    });
} catch (e) {
    console.error('[GLOBAL] Failed to register global error handlers:', e);
}

export const config = { maxDuration: 300 }; // 5 minutos para Vercel Pro

type JobData = {
    id: string;
    status: string; // Este é o status ANTES do processador-background ser chamado
    input_file_path: string | null;
    style_requested: string;
    user_id: string;
}

type ResponseData = {
    success?: boolean;
    message?: string;
    jobId?: string;
}

// Função para detectar tipo de imagem pelo conteúdo (header) - mais permissiva
function detectImageTypeFromBuffer(buffer: Buffer): string | null {
    const headerHex = buffer.toString('hex', 0, Math.min(12, buffer.length));
    
    // JPEG: ffd8ff
    if (headerHex.startsWith('ffd8ff')) {
        return 'image/jpeg';
    }
    
    // PNG: 89504e47
    if (headerHex.startsWith('89504e47')) {
        return 'image/png';
    }
    
    // WebP: RIFF no início (52494646) + WEBP no offset 8 (57454250)
    if (headerHex.startsWith('52494646') && buffer.length >= 12) {
        const webpSignature = buffer.toString('hex', 8, 12); // bytes 8-11
        if (webpSignature === '57454250') {
            return 'image/webp';
        }
    }
    
    return null;
}

// Função para validar o tipo de conteúdo do Buffer (ATUALIZADA)
async function validateBufferContentType(buffer: Buffer): Promise<string | null> {
    const headerHex = buffer.toString('hex', 0, Math.min(buffer.length, 16));
    
    if (headerHex.startsWith('ffd8ff')) return 'image/jpeg';
    if (headerHex.startsWith('89504e47')) return 'image/png';
    if (headerHex.startsWith('47494638')) return 'image/gif';
    if (headerHex.startsWith('52494646') && headerHex.includes('57454250')) return 'image/webp';
    if (headerHex.startsWith('424d')) return 'image/bmp';
    
        return null;
}


async function updateJobStatus(
    jobId: string,
    status: string,
    outputFilePath: string | null = null,
    errorMessage: string | null = null,
    metadata: Record<string, unknown> | null = null
) {
    if (!supabaseAdmin) {
        console.error(`[updateJobStatus: ${jobId}] CRITICAL: supabaseAdmin is not defined.`);
        // Não lançar erro aqui para não quebrar o 'finally' block, mas logar é crucial.
        return;
    }

    const updateData: Record<string, unknown> = {};

    if (status === 'processing') {
        updateData.processing_started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'error' || status.startsWith('failed_')) {
        // Nota: se o status já for 'error' vindo de uma falha de validação, não sobrescrever com 'failed_'
        updateData.completed_at = new Date().toISOString();
    }

    if (outputFilePath) {
        updateData.output_file_path = outputFilePath;
        try {
            const { data: publicUrlData } = await supabaseAdmin.storage.from('results').getPublicUrl(outputFilePath);
            if (publicUrlData?.publicUrl) {
                updateData.output_url = publicUrlData.publicUrl;
            } else {
                const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
                if (storageUrl) {
                    updateData.output_url = `${storageUrl}/storage/v1/object/public/results/${outputFilePath}`;
                }
            }
        } catch (urlException) {
            console.error(`[updateJobStatus: ${jobId}] Exception getting public URL for ${outputFilePath}:`, (urlException as Error).message);
        }
    }

    if (errorMessage) updateData.error_message = errorMessage.substring(0, 500); // Limita tamanho da mensagem
    
    // MERGE metadata instead of overwriting to preserve qualityUsed and other fields
    if (metadata) {
        // Get existing metadata from database first
        try {
            const { data: existingData } = await supabaseAdmin
                .from('transformations')
                .select('output_metadata')
                .eq('id', jobId)
                .single();
            
            const existingMetadata = existingData?.output_metadata || {};
            updateData.output_metadata = { ...existingMetadata, ...metadata };
            console.log(`[updateJobStatus: ${jobId}] MERGE - existing: ${JSON.stringify(existingMetadata)}, new: ${JSON.stringify(metadata)}, merged: ${JSON.stringify(updateData.output_metadata)}`);
        } catch (mergeError) {
            // If we can't get existing metadata, just use the new metadata
            updateData.output_metadata = metadata;
            console.log(`[updateJobStatus: ${jobId}] MERGE FAILED - using new metadata only: ${JSON.stringify(metadata)}`);
        }
    }

    // Normaliza 'failed_*' para 'error' para o status final, mas guarda o original em metadata
    let finalStatusToSet = status;
    if (status.startsWith('failed_')) {
        const currentMetadata = updateData.output_metadata ? { ...(updateData.output_metadata as object) } : {};
        updateData.output_metadata = { ...currentMetadata, originalDetailedErrorStatus: status };
        finalStatusToSet = 'error';
    }
    updateData.status = finalStatusToSet;


    try {
        const { error } = await supabaseAdmin.from('transformations').update(updateData).eq('id', jobId);
        if (error) {
            console.error(`[updateJobStatus: ${jobId}] Supabase Error updating job to ${finalStatusToSet}:`, error.message);
        }
    } catch (e) {
        console.error(`[updateJobStatus: ${jobId}] EXCEPTION during Supabase update to ${finalStatusToSet}. Error:`, (e as Error).message);
    }
}

async function getPromptFromDB(styleId: string, jobIdForLogging: string): Promise<{ prompt: string; quality: string }> {
    if (!supabaseAdmin) {
        console.error(`[getPromptFromDB: ${jobIdForLogging}] CRITICAL: supabaseAdmin is not defined for style ${styleId}.`);
        throw new Error(`DB connection error for style ${styleId}`); // Lança erro
    }
    try {
        const { data: styleResult, error } = await supabaseAdmin
            .from('styles').select('name, prompt_template, quality').or(`id.eq.${styleId},name.ilike.%${styleId}%`).limit(1).single();

        if (error) {
            console.error(`[getPromptFromDB: ${jobIdForLogging}] Error fetching style ${styleId}:`, error.message);
            throw new Error(`Failed to fetch style details for ${styleId}: ${error.message}`); // Lança erro
        }
        if (styleResult) {
            const prompt = styleResult.prompt_template || `Transform image in ${styleResult.name} style.`;
            const quality = styleResult.quality; // TESTE: sem fallback para confirmar se busca da BD
            console.log(`[getPromptFromDB: ${jobIdForLogging}] TESTE - Style: ${styleId}, Quality from DB: ${quality}`);
            if (!quality) {
                throw new Error(`Quality not found for style ${styleId} - this should not happen!`);
            }
            return { prompt, quality };
        }
        console.warn(`[getPromptFromDB: ${jobIdForLogging}] Style ${styleId} not found. Using fallback prompt.`);
        throw new Error(`Style ${styleId} not found in database`); // TESTE: sem fallback
    } catch (error) {
        console.error(`[getPromptFromDB: ${jobIdForLogging}] Exception fetching prompt for ${styleId}:`, (error as Error).message);
        throw error; // Re-lança o erro (pode ser o da query ou um novo)
    }
}

async function processImage(jobId: string, jobData: JobData) {
    let finalStatus = 'failed_unknown'; // Status inicial mais específico
    let errorMessage: string | null = null;
    let outputFilePath: string | null = null;
    let outputMetadata: Record<string, unknown> | null = {};
    let tempFilePath: string | null = null;

    try {
        if (!supabaseAdmin) {
            throw new CustomErrorWithStatus('failed_config', "supabaseAdmin client not available.");
        }

        if (!jobData.input_file_path) {
            throw new CustomErrorWithStatus('failed_input_path', 'Input file path missing in job data.');
        }

        const { data: downloadData, error: downloadError } = await supabaseAdmin.storage.from('images').download(jobData.input_file_path);
        if (downloadError || !downloadData) {
            throw new CustomErrorWithStatus('failed_download', `Download failed: ${downloadError?.message || 'No data'}`);
        }
        const imageInputBuffer = Buffer.from(await downloadData.arrayBuffer());

        // --- VALIDAÇÃO SERVER-SIDE DO FICHEIRO ---
        if (imageInputBuffer.length > MAX_SERVER_FILE_SIZE_BYTES) {
            const errorMsg = `Ficheiro excede o limite do servidor (${(MAX_SERVER_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(1)}MB).`;
            if (jobData.status === 'paid') {
                 throw new CustomErrorWithStatus('failed_server_validation_size_paid', `Ficheiro inválido após pagamento (tamanho). O reembolso deverá ser processado.`);
            }
            throw new CustomErrorWithStatus('failed_server_validation_size', errorMsg);
        }
        if (jobData.status === 'paid' && imageInputBuffer.length > CLIENT_MAX_FILE_SIZE_BYTES) {
            throw new CustomErrorWithStatus('failed_server_validation_size_paid_client_limit', `Ficheiro inválido após pagamento (excedeu limite original de ${(CLIENT_MAX_FILE_SIZE_BYTES / (1024*1024)).toFixed(1)}MB). O reembolso deverá ser processado.`);
        }


        const detectedMimeType = await validateBufferContentType(imageInputBuffer);
        if (!detectedMimeType || !ALLOWED_SERVER_MIME_TYPES.includes(detectedMimeType)) {
            const errorMsg = `Tipo de ficheiro inválido no servidor (detectado: ${detectedMimeType || 'desconhecido'}). Tipos permitidos: ${ALLOWED_SERVER_MIME_TYPES.join(', ')}.`;
            if (jobData.status === 'paid') {
                throw new CustomErrorWithStatus('failed_server_validation_type_paid', `Ficheiro inválido após pagamento (tipo). O reembolso deverá ser processado.`);
            }
            throw new CustomErrorWithStatus('failed_server_validation_type', errorMsg);
        }
        // --- FIM DA VALIDAÇÃO SERVER-SIDE ---

        const { prompt: promptText, quality: imageQuality } = await getPromptFromDB(jobData.style_requested, jobId);
        
        // Atualizar para processing COM todos os metadados já incluídos
        await updateJobStatus(jobId, 'processing', null, null, { 
            detectedMimeType, 
            promptUsed: promptText, 
            aiModelUsed: 'gpt-image-1', 
            qualityUsed: imageQuality 
        });
        
        outputMetadata = { ...outputMetadata, promptUsed: promptText, aiModelUsed: 'gpt-image-1', qualityUsed: imageQuality };

        const tempFileExtension = detectedMimeType.split('/')[1] || 'tmp';
        tempFilePath = path.join(os.tmpdir(), `input_${jobId}_${Date.now()}.${tempFileExtension}`);
        fs.writeFileSync(tempFilePath, imageInputBuffer);

        const formData = new FormData();
        formData.append('model', 'gpt-image-1');
        formData.append('prompt', promptText);
        formData.append('image', fs.createReadStream(tempFilePath));
        formData.append('n', 1);
        formData.append('size', '1024x1024');
        formData.append('quality', imageQuality); // ✅ Usar qualidade da base de dados


        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            throw new CustomErrorWithStatus('failed_config', 'OpenAI API key not configured.');
        }
        
        const requestConfig = {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${openaiApiKey}`
            },
            timeout: 280000 // 4min 40s - buffer de 20s para cleanup
        };

        const openaiResponse = await axios.post('https://api.openai.com/v1/images/edits', formData, requestConfig);

        if (tempFilePath) {
            try { fs.unlinkSync(tempFilePath); tempFilePath = null; }
            catch (unlinkErr) { console.warn(`[processImage: ${jobId}] Failed to delete temp input file: ${(unlinkErr as Error).message}`); }
        }

        if (openaiResponse.status !== 200 || !openaiResponse.data?.data || openaiResponse.data.data.length === 0) {
            throw new CustomErrorWithStatus('failed_api_response', `Invalid OpenAI API response: Status ${openaiResponse.status}`);
        }
        const b64Image = openaiResponse.data.data[0].b64_json;
        if (!b64Image) {
            throw new CustomErrorWithStatus('failed_api_data', 'b64_json missing from OpenAI response');
        }

        const outputImageBuffer = Buffer.from(b64Image, 'base64');
        const safeUserId = String(jobData.user_id || 'unknown_user').replace(/[^a-zA-Z0-9-_]/g, '');
        const safeJobId = String(jobId || 'unknown_job').replace(/[^a-zA-Z0-9-_]/g, '');
        outputFilePath = `public/${safeUserId}/${safeJobId}/result_${Date.now()}.png`; 

        const { error: uploadError } = await supabaseAdmin.storage.from('results')
            .upload(outputFilePath, outputImageBuffer, { contentType: 'image/png', cacheControl: 'public, max-age=31536000', upsert: false });
        if (uploadError) {
            throw new CustomErrorWithStatus('failed_upload', `Upload to Supabase Storage failed: ${uploadError.message}`);
        }

        finalStatus = 'completed';
        outputMetadata = { ...outputMetadata, processedAt: new Date().toISOString(), imageSizeBytes: outputImageBuffer.length };

    } catch (error) {
        if (isCustomErrorWithStatus(error)) {
            finalStatus = error.status;
            errorMessage = error.message;
        } else if (axios.isAxiosError(error)) {
            errorMessage = `OpenAI API Error: ${error.message}`;
            finalStatus = 'failed_api';
        } else {
            errorMessage = (error instanceof Error) ? error.message : 'Unknown processing error';
            finalStatus = 'failed_exception';
        }
        console.error(`[processImage: ${jobId}] Error during processing. Status: ${finalStatus}. Message: ${errorMessage}`);
    } finally {
        if (tempFilePath) {
            try { fs.unlinkSync(tempFilePath); }
            catch (unlinkErr) { console.warn(`[processImage: ${jobId}] Failed to clean up temp file in finally: ${(unlinkErr as Error).message}`);}
        }
        
        console.log(`[processImage: ${jobId}] FINALLY - finalStatus: ${finalStatus}, outputMetadata: ${JSON.stringify(outputMetadata)}`);
        await updateJobStatus(jobId, finalStatus, outputFilePath, errorMessage, outputMetadata);
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (!supabaseAdmin) {
        console.error('[Background API Handler] CRITICAL: supabaseAdmin is NOT defined at handler start!');
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const internalSecret = req.headers['x-internal-secret'];
    if (!internalSecret || internalSecret !== process.env.INTERNAL_API_SECRET) {
        console.warn('[Background API Handler] Unauthorized access attempt.');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { jobId } = req.body;
    if (!jobId || typeof jobId !== 'string') {
        return res.status(400).json({ message: 'jobId is required and must be a string' });
    }

    try {
        const { data: jobData, error: jobError } = await supabaseAdmin
            .from('transformations').select('id, status, input_file_path, style_requested, user_id').eq('id', jobId).single();

        if (jobError || !jobData) {
            console.error(`[Background API Handler] Job ${jobId} not found or error fetching:`, jobError?.message);
            return res.status(200).json({ success: false, message: `Job not found: ${jobError?.message || 'No data'}` });
        }

        if (!jobData.input_file_path || !jobData.style_requested || !jobData.user_id) {
            const errorMsg = `Incomplete job data for ${jobId}. Cannot process.`;
            console.error(`[Background API Handler] ${errorMsg}`);
            await updateJobStatus(jobId, 'error', null, errorMsg.substring(0, 500), { reason: "incomplete_job_data_at_handler" });
            return res.status(200).json({ success: false, message: errorMsg });
        }

        if (jobData.status === 'completed' || jobData.status === 'error') {
            return res.status(200).json({ success: true, message: `Job already terminal: ${jobData.status}.`, jobId });
        }
        
        res.status(202).json({ success: true, message: 'Background processing scheduled', jobId });

        waitUntil(
            (async () => {
                try {
                    await processImage(jobId, jobData as JobData);
                } catch (processError) {
                    console.error(`[Background API Handler: ${jobId}] waitUntil: Unhandled error during processImage execution:`, (processError as Error).message);
                    try {
                        await updateJobStatus(jobId, 'failed_uncaught_in_waituntil', null, (processError as Error).message);
                    } catch (finalUpdateError) {
                         console.error(`[Background API Handler: ${jobId}] CRITICAL: Failed to update status after uncaught waitUntil error.`, (finalUpdateError as Error).message);
                    }
                }
            })()
        );

    } catch (error) { 
        const errorMessage = error instanceof Error ? error.message : 'Unknown handler error';
        console.error(`[Background API Handler] GENERAL error for job ${jobId}: ${errorMessage}`);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: `Server error: ${errorMessage}` });
        }
    }
}
// REMINDER_REFUND: For jobs that fail server-side validation (size/type) AFTER payment (i.e., original job status was 'paid'),
// a manual refund process needs to be triggered. Check for statuses like:
// 'failed_server_validation_size_paid', 
// 'failed_server_validation_type_paid',
// 'failed_server_validation_size_paid_client_limit'.
// The error_message in the database will contain specific details.