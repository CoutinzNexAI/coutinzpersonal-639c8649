import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import OpenAI from 'openai';
import { Buffer } from 'buffer';
import axios, { AxiosError } from 'axios'; // Import AxiosError
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Verificar e inicializar o cliente OpenAI
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ [Process Image API] CRITICAL ERROR: OPENAI_API_KEY not defined!");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

type ResponseData = {
  success?: boolean;
  message?: string;
  jobId?: string;
}

// Define the structure of the job data we expect
type JobData = {
  id: string;
  status: string;
  input_file_path: string | null; // Allow null explicitly
  style_requested: string;
  user_id: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  console.log('[Process Image API] Received request');

  // Verify method
  if (req.method !== 'POST') {
    console.warn('[Process Image API] Method not allowed:', req.method);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Verify internal API secret
  const internalSecret = req.headers['x-internal-secret'];
  if (!internalSecret || internalSecret !== process.env.INTERNAL_API_SECRET) {
    console.error('❌ [Process Image API] Unauthorized access attempt. Invalid or missing X-Internal-Secret.');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  console.log('[Process Image API] Internal secret verified.');

  // Check OpenAI API key (redundant check, but safe)
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ [Process Image API] OPENAI_API_KEY not configured');
    return res.status(500).json({ message: 'Server configuration incomplete: Missing OpenAI API Key' });
  }

  // Extract jobId from request body
  const { jobId } = req.body;
  if (!jobId) {
    console.error('❌ [Process Image API] jobId is missing from request body');
    return res.status(400).json({ message: 'jobId is required' });
  }
  console.log(`[Process Image API] Received request for jobId: ${jobId}`);

  try {
    // Using 'processing_queued' status - ensure it exists in your enum
    const initialStatus = 'processing_queued';
    console.log(`[Process Image API] Updating job ${jobId} status to '${initialStatus}' (Check Enum)`);
    const { error: queueUpdateError } = await supabaseAdmin
      .from('transformations')
      .update({ status: initialStatus, processing_started_at: null, completed_at: null })
      .eq('id', jobId);

    if (queueUpdateError) {
      console.error(`❌ [Process Image API] Failed to update job status to ${initialStatus} for ${jobId}: ${queueUpdateError.message} (Check Enum)`);
    } else {
       console.log(`✅ [Process Image API] Successfully updated job ${jobId} status to '${initialStatus}'`);
    }


    // Get job details
    console.log(`[Process Image API] Fetching job details for ${jobId}...`);
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('transformations')
      .select('id, status, input_file_path, style_requested, user_id')
      .eq('id', jobId)
      .single();

    console.log(`[Process Image API] Job data fetched for ${jobId}:`, JSON.stringify(jobData, null, 2));
    if (jobError) {
      console.error(`❌ [Process Image API] Supabase error fetching job details for ${jobId}: ${jobError.message}`);
    }
    if (!jobData) {
       console.error(`❌ [Process Image API] No job data found in Supabase for ${jobId}`);
    }

    if (jobError || !jobData) {
      const errorMsg = `Failed to retrieve job data for ${jobId}: ${jobError?.message || 'No data found'}`;
      console.error(`❌ [Process Image API] ${errorMsg}`);
      const failureStatus = 'failed'; // Ensure 'failed' exists in enum
      updateJobStatus(jobId, failureStatus, null, errorMsg).catch(e => console.error(`[Process Image API] Error updating status to ${failureStatus} after failing to fetch job data: ${e} (Check Enum)`));
      return res.status(500).json({ message: 'Failed to get job details' });
    }

    // Check input_file_path
    if (!jobData.input_file_path) {
       const errorMsg = `Input file path is missing in fetched job data for ${jobId}. Cannot proceed.`;
       console.error(`❌ [Process Image API] ${errorMsg}`);
       const failureStatus = 'failed_input_path'; // Ensure 'failed_input_path' exists in enum
       updateJobStatus(jobId, failureStatus, null, errorMsg).catch(e => console.error(`[Process Image API] Error updating status to ${failureStatus} after missing input path: ${e} (Check Enum)`));
       return res.status(200).json({ success: false, message: errorMsg, jobId });
    }

    console.log(`[Process Image API] Job data validated for ${jobId}. input_file_path: ${jobData.input_file_path}`);

    // Initiate background processing
    console.log(`[Process Image API] Initiating background processing for ${jobId}...`);
    processImage(jobId, jobData as JobData).catch(error => {
      console.error(`❌ [Process Image API] Uncaught error in background processing task for ${jobId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      const failureStatus = 'failed'; // Ensure 'failed' exists in enum
      updateJobStatus(jobId, failureStatus, null, `Background process uncaught error: ${error instanceof Error ? error.message : 'Unknown'}`).catch(e => console.error(`[Process Image API] Error updating status to ${failureStatus} after background process error: ${e} (Check Enum)`));
    });

    console.log(`[Process Image API] Responding 200 OK for ${jobId}, background processing initiated.`);
    return res.status(200).json({
      success: true,
      message: 'Image processing started',
      jobId
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [Process Image API] Error in main handler for job ${jobId}: ${errorMessage}`);
    const failureStatus = 'failed'; // Ensure 'failed' exists in enum
    updateJobStatus(jobId, failureStatus, null, `Handler error: ${errorMessage}`).catch(e => console.error(`[Process Image API] Error updating status to ${failureStatus} after handler error: ${e} (Check Enum)`));
    return res.status(500).json({ message: 'Server error during processing setup' });
  }
}

/**
 * Helper function to update job status in the database
 */
async function updateJobStatus(
  jobId: string,
  status: string, // Ensure this status exists in your Supabase enum
  outputFilePath: string | null = null,
  errorMessage: string | null = null,
  metadata: Record<string, unknown> | null = null
) {
  console.log(`[Update Job Status] Updating job ${jobId} to status: ${status} (Check Enum)`);
  const updateData: Record<string, unknown> = { status };

  if (status === 'processing') { // Ensure 'processing' exists in enum
      updateData.processing_started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed' || status.startsWith('failed_')) { // Ensure these exist in enum
      updateData.completed_at = new Date().toISOString();
  }

  if (outputFilePath) {
    updateData.output_file_path = outputFilePath;
    console.log(`[Update Job Status] Attempting to get public URL for: ${outputFilePath}`);
    const { data: publicUrlData } = await supabaseAdmin
      .storage
      .from('results')
      .getPublicUrl(outputFilePath);

    if (publicUrlData?.publicUrl) {
      updateData.output_url = publicUrlData.publicUrl;
      console.log(`[Update Job Status] Public URL generated: ${publicUrlData.publicUrl}`);
    } else {
       console.warn(`[Update Job Status] Could not get public URL for ${outputFilePath}`);
    }
  }

  if (errorMessage) {
    // Truncate error message if too long for DB column
    updateData.error_message = errorMessage.substring(0, 500); // Example limit
    console.error(`[Update Job Status] Recording error for job ${jobId}: ${updateData.error_message}`);
  }

  if (metadata) {
    updateData.output_metadata = metadata;
  }

  console.log(`[Update Job Status] Sending update to Supabase for ${jobId}:`, JSON.stringify(updateData));
  const { error } = await supabaseAdmin
    .from('transformations')
    .update(updateData)
    .eq('id', jobId);

  if (error) {
    console.error(`❌ [Update Job Status] Failed to update job ${jobId} status to ${status}: ${error.message} (Check Enum)`);
    throw new Error(`Failed to update job status: ${error.message}`);
  }

  console.log(`✅ [Update Job Status] Successfully updated job ${jobId} to status: ${status}`);
}

/**
 * Generates an appropriate prompt based on the style requested
 */
function generatePrompt(style: string): string {
  console.log(`[Generate Prompt] Generating prompt for style: ${style}`);
  const basePrompt = `Transform this image using the ${style} style.`;
  switch (style.toLowerCase()) {
    // ... (cases remain the same) ...
    case 'watercolor':
      return `${basePrompt} Create a watercolor painting with soft, translucent colors, visible brush strokes, and flowing transitions. Maintain the composition but interpret with artistic freedom.`;
    case 'cyberpunk':
      return `${basePrompt} Create a futuristic cyberpunk scene with neon lights, high tech elements, dark atmospheric urban backgrounds, and vibrant contrasting colors.`;
    case 'vintage':
      return `${basePrompt} Create a vintage look with faded colors, subtle film grain, and warm tones reminiscent of photography from the 1970s.`;
    case 'comic':
      return `${basePrompt} Transform into a comic book style with bold outlines, flat colors, and characteristic comic shading. Add subtle action lines if appropriate.`;
    case 'pixel':
      return `${basePrompt} Convert to pixel art with limited color palette, visible pixel structure, and simplified forms while maintaining recognizable elements.`;
    default:
      return `${basePrompt} Apply artistic interpretation while maintaining the composition and key elements of the original image.`;
  }
}

/**
 * Main image processing function that runs in the background
 */
async function processImage(jobId: string, jobData: JobData) {
  console.log(`[Process Image Background] Starting processing for job ${jobId}`);
  // Ensure 'failed' and specific 'failed_*' statuses exist in your enum.
  let finalStatus = 'failed';
  let errorMessage = 'Unknown processing error';
  let outputFilePath = null;
  let outputMetadata = null;
  let tempFilePath: string | null = null; // Keep track of temp file path

  try {
    // --- Update status to 'processing' ---
    // Ensure 'processing' exists in your enum.
    await updateJobStatus(jobId, 'processing');
    console.log(`[Process Image Background] Job ${jobId} status updated to 'processing'.`);

    // 1. Check input file path AGAIN
    if (!jobData.input_file_path) {
      throw new Error('Input file path was unexpectedly null or empty when starting background processing.');
    }
    console.log(`[Process Image Background] Verified input file path for ${jobId}: ${jobData.input_file_path}`);


    // 2. Download the original image
    console.log(`[Process Image Background] Downloading original image from Supabase bucket 'images' path: ${jobData.input_file_path}`);
    const { data: downloadData, error: downloadError } = await supabaseAdmin
      .storage
      .from('images')
      .download(jobData.input_file_path);

    if (downloadError || !downloadData) {
      throw new Error(`Failed to download original image: ${downloadError?.message || 'No data returned from download'}`);
    }

    const imageArrayBuffer = await downloadData.arrayBuffer();
    const imageInputBuffer = Buffer.from(imageArrayBuffer);
    console.log(`✅ [Process Image Background] Successfully downloaded original image for ${jobId}. Buffer size: ${imageInputBuffer.length}`);

    // 3. Generate prompt
    const promptText = generatePrompt(jobData.style_requested);
    console.log(`✅ [Process Image Background] Generated prompt for job ${jobId}: "${promptText}"`); // Log the actual prompt

    // 4. Call OpenAI API
    console.log(`[Process Image Background] Preparing to call OpenAI API for job ${jobId}...`);
    const tempDir = os.tmpdir();
    const tempFileName = `input_${jobId}_${Date.now()}.png`;
    tempFilePath = path.join(tempDir, tempFileName); // Assign path here
    console.log(`[Process Image Background] Writing image buffer to temporary file: ${tempFilePath}`);
    fs.writeFileSync(tempFilePath, imageInputBuffer);
    console.log(`✅ [Process Image Background] Successfully wrote to temporary file: ${tempFilePath}`);

    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', promptText);
    formData.append('image', fs.createReadStream(tempFilePath));
    formData.append('n', '1');
    formData.append('size', '1024x1024');
    // formData.append('response_format', 'b64_json'); // REMOVED - Invalid parameter for this endpoint/model

    // Log FormData details (optional, can be verbose)
    // console.log('[Process Image Background] FormData Headers:', formData.getHeaders());

    console.log(`[Process Image Background] Calling OpenAI API endpoint: https://api.openai.com/v1/images/edits for job ${jobId}...`);
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/images/edits',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        // Increase timeout if needed, especially for larger images/complex edits
        timeout: 120000 // 120 seconds timeout
      }
    );
    console.log(`[Process Image Background] OpenAI API call completed for job ${jobId}. Status: ${openaiResponse.status}`);

    // Clean up temp file *after* successful API call
    if (tempFilePath) {
        try {
          console.log(`[Process Image Background] Deleting temporary file: ${tempFilePath}`);
          fs.unlinkSync(tempFilePath);
          tempFilePath = null; // Reset path after deletion
          console.log(`✅ [Process Image Background] Successfully deleted temporary file.`);
        } catch (e) {
          console.error(`⚠️ [Process Image Background] Failed to delete temp file: ${tempFilePath}`, e);
        }
    }


    // Validate OpenAI response
    if (openaiResponse.status !== 200 || !openaiResponse.data || !openaiResponse.data.data || openaiResponse.data.data.length === 0) {
       console.error(`❌ [Process Image Background] Invalid response from OpenAI API for job ${jobId}. Status: ${openaiResponse.status}, Data: ${JSON.stringify(openaiResponse.data)}`);
       // Try to parse potential error message from OpenAI response body
       let openAIErrorMsg = 'Invalid or empty response from OpenAI API.';
       if (openaiResponse.data?.error?.message) {
           openAIErrorMsg = `OpenAI Error: ${openaiResponse.data.error.message}`;
       }
       throw new Error(`${openAIErrorMsg} Status: ${openaiResponse.status}`);
    }

    // The response format might be different now. Check the structure.
    // Assuming the default still includes b64_json for this model:
    const b64Image = openaiResponse.data.data[0].b64_json;
    const imageUrl = openaiResponse.data.data[0].url; // Or maybe it returns a URL now? Check response structure.

    if (!b64Image && !imageUrl) { // Check if either b64 or URL is present
      console.error(`❌ [Process Image Background] No b64_json or url image data found in OpenAI response for job ${jobId}. Response: ${JSON.stringify(openaiResponse.data)}`);
      throw new Error('No b64_json or url image data in OpenAI response');
    }

    let outputImageBuffer: Buffer;
    if (b64Image) {
        console.log(`✅ [Process Image Background] Successfully received transformed image (b64_json) from OpenAI for job ${jobId}`);
        outputImageBuffer = Buffer.from(b64Image, 'base64');
        console.log(`[Process Image Background] Converted b64 to buffer for job ${jobId}. Size: ${outputImageBuffer.length}`);
    } else if (imageUrl) {
        // If OpenAI returns a URL instead, download it
        console.log(`✅ [Process Image Background] Received image URL from OpenAI for job ${jobId}: ${imageUrl}`);
        console.log(`[Process Image Background] Downloading image from URL for job ${jobId}...`);
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        outputImageBuffer = Buffer.from(imageResponse.data);
        console.log(`✅ [Process Image Background] Successfully downloaded image from URL for job ${jobId}. Size: ${outputImageBuffer.length}`);
    } else {
        // Should not happen due to the check above, but as a fallback
        throw new Error('Image data received from OpenAI but in an unexpected format.');
    }


    // 5. Upload result to Supabase
    const timestamp = Date.now();
    outputFilePath = `public/${jobData.user_id}/${jobId}/result_${timestamp}.png`;
    console.log(`[Process Image Background] Uploading transformed image to Supabase bucket 'results' path: ${outputFilePath} for job ${jobId}...`);

    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('results')
      .upload(outputFilePath, outputImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`❌ [Process Image Background] Failed to upload result image to Supabase storage for job ${jobId}: ${uploadError.message}`);
      throw new Error(`Failed to upload result to storage: ${uploadError.message}`);
    }
    console.log(`✅ [Process Image Background] Successfully uploaded result image to storage for job ${jobId}`);

    // 6. Set final status for success
    // Ensure 'completed' exists in your enum.
    finalStatus = 'completed';
    errorMessage = null;
    outputMetadata = {
      processedAt: new Date().toISOString(),
      style: jobData.style_requested,
      aiModel: 'gpt-image-1',
      promptUsed: promptText,
      // Add OpenAI response details if needed
      // openAIResponse: openaiResponse.data
    };
    console.log(`[Process Image Background] Processing successful for job ${jobId}. Status set to 'completed'.`);

  } catch (error) {
    // --- Enhanced Error Handling ---
    let detailedErrorMessage = 'Unknown processing error';
    if (axios.isAxiosError(error)) {
        // Handle Axios (OpenAI API call or image download from URL) errors specifically
        const axiosError = error as AxiosError;
        detailedErrorMessage = `API/Network Error: ${axiosError.message}. Status: ${axiosError.response?.status}. URL: ${axiosError.config?.url}`;
        if (axiosError.response?.data) {
            // Try to stringify, handle potential circular references or large objects
            let errorResponseData = '';
            try {
               errorResponseData = JSON.stringify(axiosError.response.data);
            } catch (stringifyError) {
               errorResponseData = "[Could not stringify error response data]";
            }
            console.error(`❌ [Process Image Background] API Error Response Data for job ${jobId}:\n${errorResponseData}`);
            detailedErrorMessage += ` Response: ${errorResponseData.substring(0, 300)}${errorResponseData.length > 300 ? '...' : ''}`;
        }
        // Classify based on URL or status
        if (axiosError.config?.url?.includes('openai.com')) {
            finalStatus = 'failed_api'; // Ensure 'failed_api' exists in enum
        } else {
            finalStatus = 'failed_download'; // Assuming other axios errors are image downloads
        }

    } else if (error instanceof Error) {
        // Handle other errors (FS, Supabase download/upload, etc.)
        detailedErrorMessage = error.message;
        if (detailedErrorMessage.includes('download original image')) {
           finalStatus = 'failed_download'; // Ensure exists
        } else if (detailedErrorMessage.includes('upload result to storage')) {
           finalStatus = 'failed_upload'; // Ensure exists
        } else if (detailedErrorMessage.includes('Input file path')) {
           finalStatus = 'failed_input_path'; // Ensure exists
        } else {
           finalStatus = 'failed'; // Ensure 'failed' exists
        }
    } else {
         detailedErrorMessage = String(error);
         finalStatus = 'failed'; // Ensure 'failed' exists
    }

    errorMessage = detailedErrorMessage;
    console.error(`❌ [Process Image Background] Error during processing for job ${jobId}: ${errorMessage}`);
    console.error(`[Process Image Background] Setting final status to '${finalStatus}' for job ${jobId} due to error.`);

  } finally {
    // --- Final Update Step & Cleanup ---
    console.log(`[Process Image Background] Reached finally block for job ${jobId}. Attempting final status update to '${finalStatus}'.`);
    try {
      await updateJobStatus(jobId, finalStatus, outputFilePath, errorMessage, outputMetadata);
      console.log(`[Process Image Background] Final status update successful for job ${jobId}.`);
    } catch (updateError) {
      console.error(`❌ [Process Image Background] CRITICAL: Failed to update FINAL job status for job ${jobId} to '${finalStatus}': ${updateError instanceof Error ? updateError.message : 'Unknown update error'} (Check Enum)`);
    }

    // Cleanup temp file
    if (tempFilePath) {
        try {
          console.log(`[Process Image Background - Finally] Attempting to delete potentially leftover temp file: ${tempFilePath}`);
          fs.unlinkSync(tempFilePath);
          console.log(`✅ [Process Image Background - Finally] Successfully deleted leftover temp file.`);
        } catch (e) {
          console.error(`⚠️ [Process Image Background - Finally] Failed to delete temp file during cleanup: ${tempFilePath}`, e);
        }
    }
  }
}
