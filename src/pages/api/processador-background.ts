import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin'; 
import { Buffer } from 'buffer';
import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface ErrorWithCause extends Error {
  cause?: unknown;
}

// Global Node.js error handlers (mantidos por precaução)
try {
    process.on('uncaughtException', (error, origin) => {
        console.error(`[GLOBAL HANDLER] Uncaught Exception at: ${origin}. Error: ${error.message}`, {
            name: error.name, stack: error.stack, cause: (error as ErrorWithCause).cause,
        });
    });
    console.log('[GLOBAL HANDLER] "uncaughtException" handler registered.');

    process.on('unhandledRejection', (reason, promise) => {
        const reasonError = reason instanceof Error ? reason : new Error(String(reason));
        console.error(`[GLOBAL HANDLER] Unhandled Rejection at: Promise ${String(promise)}. Reason: ${reasonError.message}`, {
            name: reasonError.name, stack: reasonError.stack, cause: (reasonError as ErrorWithCause).cause,
        });
    });
    console.log('[GLOBAL HANDLER] "unhandledRejection" handler registered.');
} catch (e) {
    console.error('[GLOBAL HANDLER] Failed to register global error handlers:', e);
}

export const config = { maxDuration: 59 };

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

async function updateJobStatus(
  jobId: string,
  status: string,
  outputFilePath: string | null = null,
  errorMessage: string | null = null,
  metadata: Record<string, unknown> | null = null
) {
  if (!supabaseAdmin) {
    console.error(`[updateJobStatus: ${jobId}] CRITICAL: supabaseAdmin is not defined.`);
    throw new Error(`[updateJobStatus: ${jobId}] supabaseAdmin is not available.`);
  }
  console.log(`[updateJobStatus: ${jobId}] supabaseAdmin client confirmed available.`);

  const updateData: Record<string, unknown> = { status };

  if (status === 'processing') {
    updateData.processing_started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed' || status === 'error' || status.startsWith('failed_')) {
    updateData.completed_at = new Date().toISOString();
  }

  if (outputFilePath) {
    updateData.output_file_path = outputFilePath;
    console.log(`[updateJobStatus: ${jobId}] Attempting public URL for: ${outputFilePath}`);
    try {
      const { data: publicUrlData } = await supabaseAdmin.storage.from('results').getPublicUrl(outputFilePath);
      if (publicUrlData?.publicUrl) {
        console.log(`[updateJobStatus: ${jobId}] Generated public URL: ${publicUrlData.publicUrl}`);
        updateData.output_url = publicUrlData.publicUrl;
      } else {
        console.warn(`[updateJobStatus: ${jobId}] getPublicUrl for ${outputFilePath} no publicUrl. Data: ${JSON.stringify(publicUrlData)}. Fallback.`);
        const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        if (storageUrl) {
          updateData.output_url = `${storageUrl}/storage/v1/object/public/results/${outputFilePath}`;
          console.warn(`[updateJobStatus: ${jobId}] Fallback URL: ${updateData.output_url}`);
        } else {
          console.error(`[updateJobStatus: ${jobId}] No storage URL for fallback.`);
        }
      }
    } catch (urlException) {
      console.error(`[updateJobStatus: ${jobId}] Exception getting public URL for ${outputFilePath}:`, urlException);
    }
  }

  if (errorMessage) updateData.error_message = errorMessage.substring(0, 500);
  if (metadata) updateData.output_metadata = metadata;
  if (status === 'completed' && !updateData.output_url) {
    console.error(`[updateJobStatus: ${jobId}] Job completed but NO output URL. Data:`, JSON.stringify(updateData));
  }

  const finalStatusToSet = status.startsWith('failed_') ? 'error' : status;
  if (status.startsWith('failed_')) {
    console.log(`[updateJobStatus: ${jobId}] Converting detailed status ${status} to 'error'.`);
    updateData.output_metadata = { ...(updateData.output_metadata as object || {}), originalStatus: status };
  }
  updateData.status = finalStatusToSet;

  console.log(`[updateJobStatus: ${jobId}] Preparing to update. Target: ${finalStatusToSet}. Payload:`, JSON.stringify(updateData, null, 2));

  try {
    const { error } = await supabaseAdmin.from('transformations').update(updateData).eq('id', jobId);
    if (error) {
      console.error(`[updateJobStatus: ${jobId}] Supabase Error updating job:`, error);
      throw new Error(`Falha ao atualizar status (Supabase): ${error.message}`);
    } else {
      console.log(`[updateJobStatus: ${jobId}] Successfully updated job to: ${finalStatusToSet}`);
    }
  } catch (e) {
    const castError = e as Error;
    console.error(`[updateJobStatus: ${jobId}] EXCEPTION during Supabase update. Status: ${finalStatusToSet}. Error: ${castError.message}`, {
        errorObject: castError, stack: castError.stack, jobId: jobId, updatePayload: updateData
    });
    throw e;
  }
}

async function getPromptFromDB(styleId: string, jobIdForLogging: string): Promise<string> {
  if (!supabaseAdmin) {
    console.error(`[getPromptFromDB: ${jobIdForLogging}] CRITICAL: supabaseAdmin is not defined for style ${styleId}.`);
    return `Error: DB connection not available for style ${styleId}`;
  }
  try {
    console.log(`[getPromptFromDB: ${jobIdForLogging}] Querying style: ${styleId}`);
    const { data: styleResult, error } = await supabaseAdmin
      .from('styles').select('name, prompt_template').or(`id.eq.${styleId},name.ilike.%${styleId}%`).limit(1).single();
    if (error) {
      console.error(`[getPromptFromDB: ${jobIdForLogging}] Error fetching style ${styleId}:`, error);
      return `Error fetching style details for ${styleId}.`;
    }
    if (styleResult) {
      console.log(`[getPromptFromDB: ${jobIdForLogging}] Found style: ${styleResult.name} for ${styleId}`);
      return styleResult.prompt_template || `Transform image in ${styleResult.name} style.`;
    }
    console.warn(`[getPromptFromDB: ${jobIdForLogging}] Style ${styleId} not found. Using fallback.`);
    return `Transform image in ${styleId} style.`;
  } catch (error) {
    const castError = error as Error;
    console.error(`[getPromptFromDB: ${jobIdForLogging}] Exception fetching prompt for ${styleId}: ${castError.message}`, { stack: castError.stack });
    return `Exception fetching style details for ${styleId}.`;
  }
}

async function processImage(jobId: string, jobData: JobData) {
  let finalStatus = 'failed'; 
  let errorMessage: string | null = null;
  let outputFilePath: string | null = null;
  let outputMetadata: Record<string, unknown> | null = {}; 
  let tempFilePath: string | null = null;

  console.log(`[processImage: ${jobId}] Starting. Style: ${jobData.style_requested}`);

  try {
    if (!supabaseAdmin) {
        console.error(`[processImage: ${jobId}] PRE-CHECK FAIL: supabaseAdmin is not defined.`);
        throw new Error("supabaseAdmin client not available.");
    }
    console.log(`[processImage: ${jobId}] Supabase connectivity test...`);
    const { data: testData, error: testError } = await supabaseAdmin.from('styles').select('id').limit(1);
    if (testError) {
      console.error(`[processImage: ${jobId}] Connectivity test FAILED:`, testError);
      throw new Error(`Supabase connectivity test failed: ${testError.message}`);
    }
    console.log(`[processImage: ${jobId}] Connectivity test SUCCEEDED. Found ${testData?.length || 0} records.`);

    console.log(`[processImage: ${jobId}] Setting job status to 'processing'.`);
    await updateJobStatus(jobId, 'processing'); 
    console.log(`[processImage: ${jobId}] Job status is 'processing'.`);

    if (!jobData.input_file_path) throw new Error('Input file path missing');
    console.log(`[processImage: ${jobId}] Input file: ${jobData.input_file_path}`);

    console.log(`[processImage: ${jobId}] Downloading original image...`);
    const { data: downloadData, error: downloadError } = await supabaseAdmin.storage.from('images').download(jobData.input_file_path);
    if (downloadError || !downloadData) {
      console.error(`[processImage: ${jobId}] Failed to download image:`, downloadError);
      throw new Error(`Download failed: ${downloadError?.message || 'No data'}`);
    }
    const imageInputBuffer = Buffer.from(await downloadData.arrayBuffer());
    console.log(`[processImage: ${jobId}] Image downloaded.`);

    console.log(`[processImage: ${jobId}] Getting prompt for style: ${jobData.style_requested}`);
    const promptText = await getPromptFromDB(jobData.style_requested, jobId);
    console.log(`[processImage: ${jobId}] Prompt: "${promptText}"`);
    outputMetadata = { promptUsed: promptText, aiModelUsed: 'dall-e-2' };

    tempFilePath = path.join(os.tmpdir(), `input_${jobId}_${Date.now()}.png`);
    fs.writeFileSync(tempFilePath, imageInputBuffer); 
    console.log(`[processImage: ${jobId}] Temp file saved: ${tempFilePath}`);

    const formData = new FormData();
    formData.append('model', 'dall-e-2'); 
    formData.append('prompt', promptText);
    formData.append('image', fs.createReadStream(tempFilePath));
    formData.append('n', '1');
    formData.append('size', '1024x1024');
    formData.append('response_format', 'b64_json'); 

    console.log(`[processImage: ${jobId}] Calling OpenAI API...`);
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/images/edits', formData,
      { headers: { ...formData.getHeaders(), 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`}, timeout: 55000 }
    );

    if (tempFilePath) { 
      try { fs.unlinkSync(tempFilePath); console.log(`[processImage: ${jobId}] Temp file deleted.`); tempFilePath = null; }
      catch (unlinkErr) { console.warn(`[processImage: ${jobId}] Failed to delete temp file immediately: ${(unlinkErr as Error).message}`); }
    }

    console.log(`[processImage: ${jobId}] OpenAI response status: ${openaiResponse.status}.`);
    if (openaiResponse.status !== 200 || !openaiResponse.data?.data || openaiResponse.data.data.length === 0) {
      console.error(`[processImage: ${jobId}] Invalid OpenAI API response. Status: ${openaiResponse.status}. Data:`, openaiResponse.data);
      throw new Error(`Invalid OpenAI API response: Status ${openaiResponse.status}`);
    }
    const b64Image = openaiResponse.data.data[0].b64_json;
    if (!b64Image) throw new Error('b64_json missing from OpenAI response');
    
    const outputImageBuffer = Buffer.from(b64Image, 'base64');
    console.log(`[processImage: ${jobId}] Received image from OpenAI. Buffer length: ${outputImageBuffer.length}`);
    
    const safeUserId = String(jobData.user_id || 'unknown_user').replace(/[^a-zA-Z0-9-_]/g, '');
    const safeJobId = String(jobId || 'unknown_job').replace(/[^a-zA-Z0-9-_]/g, '');
    outputFilePath = `public/${safeUserId}/${safeJobId}/result_${Date.now()}.png`;
    
    console.log(`[processImage: ${jobId}] Uploading result to: ${outputFilePath}`);
    const { error: uploadError } = await supabaseAdmin.storage.from('results')
      .upload(outputFilePath, outputImageBuffer, { contentType: 'image/png', cacheControl: 'public, max-age=31536000', upsert: false });
    if (uploadError) {
      console.error(`[processImage: ${jobId}] Failed to upload result:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    console.log(`[processImage: ${jobId}] Result uploaded.`);

    finalStatus = 'completed';
    outputMetadata = { ...outputMetadata, processedAt: new Date().toISOString(), imageSizeBytes: outputImageBuffer.length };
    console.log(`[processImage: ${jobId}] Processing successful.`);

  } catch (error) {
    const castError = error as Error; 
    errorMessage = castError.message;
    console.error(`[processImage: ${jobId}] ERROR: ${errorMessage}`, { errorObject: castError, stack: castError.stack });

    if (axios.isAxiosError(error)) {
      finalStatus = error.config?.url?.includes('openai.com') ? 'failed_api' : 'failed_network_other';
    } else if (errorMessage.includes('connectivity test failed')) finalStatus = 'failed_connectivity_test';
    else if (errorMessage.includes('Download failed')) finalStatus = 'failed_download';
    else if (errorMessage.includes('Upload failed')) finalStatus = 'failed_upload';
    else finalStatus = 'failed'; // Default processing error
  } finally {
    if (tempFilePath) { 
      try { fs.unlinkSync(tempFilePath); console.log(`[processImage: ${jobId}] Cleaned up temp file in finally.`); }
      catch (unlinkErr) { console.error(`[processImage: ${jobId}] Failed to clean up temp file in finally: ${(unlinkErr as Error).message}`);}
    }

    console.log(`[processImage: ${jobId}] In 'finally'. Final Status: ${finalStatus}. Error: ${errorMessage}`);
    if (finalStatus.startsWith('failed_')) {
      outputMetadata = { ...(outputMetadata || {}), originalErrorType: finalStatus };
      finalStatus = 'error'; 
      console.log(`[processImage: ${jobId}] Normalized status to 'error'. Original: ${outputMetadata.originalErrorType}`);
    }
    
    try {
      await updateJobStatus(jobId, finalStatus, outputFilePath, errorMessage, outputMetadata);
    } catch (updateError) {
      console.error(`[processImage: ${jobId}] CRITICAL: Failed to update final status in 'finally'. Error: ${(updateError as Error).message}`);
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log('[Background API Handler] Handler module loaded.'); 
  if (!supabaseAdmin) console.error('[Background API Handler] CRITICAL: supabaseAdmin is NOT defined at handler start!');
  else console.log('[Background API Handler] supabaseAdmin client available at handler start.');

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
  console.log(`[Background API Handler] Request for job: ${jobId}`);

  try {
    console.log(`[Background API Handler] Fetching job details: ${jobId}`);
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('transformations').select('id, status, input_file_path, style_requested, user_id').eq('id', jobId).single();

    if (jobError || !jobData) {
      console.error(`[Background API Handler] Job ${jobId} not found or error fetching:`, jobError);
      return res.status(200).json({ success: false, message: `Job not found: ${jobError?.message || 'No data'}`});
    }
    console.log(`[Background API Handler] Job ${jobId} loaded. Status: '${jobData.status}'.`);

    if (!jobData.input_file_path || !jobData.style_requested || !jobData.user_id) {
      const errorMsg = `Incomplete job data for ${jobId}.`;
      console.error(`[Background API Handler] ${errorMsg}`);
      try { await updateJobStatus(jobId, 'error', null, errorMsg.substring(0,500)); }
      catch (updateErr) { console.error(`[Background API Handler] Failed to update status for incomplete data job ${jobId}: ${(updateErr as Error).message}`);}
      return res.status(200).json({ success: false, message: errorMsg });
    }

    if (jobData.status === 'completed' || jobData.status === 'error' ) {
        console.warn(`[Background API Handler] Job ${jobId} already in terminal state '${jobData.status}'. No reprocess.`);
        return res.status(200).json({ success: true, message: `Job already terminal: ${jobData.status}.`, jobId });
    }
    
    console.log(`[Background API Handler] Responding 202 for job ${jobId}, starting background process.`);
    res.status(202).json({ success: true, message: 'Background processing scheduled', jobId });

    processImage(jobId, jobData as JobData).catch(_error => {
      const castError = _error as Error;
      console.error(`[Background API Handler] UNHANDLED ERROR at top of processImage call for ${jobId}: ${castError.message}`, {
          errorObject: castError, stack: castError.stack
      });
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown handler error';
    console.error(`[Background API Handler] GENERAL error for job ${jobId}: ${errorMessage}`, { errorObject: error, stack: (error as Error).stack });
    if (!res.writableEnded) {
        return res.status(500).json({ success: false, message: `Server error: ${errorMessage}` });
    }
  }
}
