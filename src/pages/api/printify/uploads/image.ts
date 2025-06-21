import { NextApiRequest, NextApiResponse } from 'next';

interface PrintifyUploadResponse {
  id: string;
  file_name: string;
  height: number;
  width: number;
  size: number;
  mime_type: string;
  preview_url: string;
  upload_time: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { imageBase64, fileName, imageUrl } = req.body;

    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Either imageBase64 or imageUrl is required' 
      });
    }

    console.log('📁 Processing image upload to Printify...');

    const uploadPayload: { file_name: string; url?: string; contents?: string } = {
      file_name: fileName || 'uploaded_image.jpg',
      ...(imageUrl ? { url: imageUrl } : { contents: imageBase64 }),
    };

    // Log the upload method
    if (imageUrl) {
      console.log('🔗 Using image URL:', imageUrl);
    } else {
      console.log('📊 Using base64 data (length:', imageBase64?.length || 0, ')');
    }

    // Upload to Printify
    const printifyResponse = await fetch('https://api.printify.com/v1/uploads/images.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadPayload),
    });

    if (!printifyResponse.ok) {
      const errorText = await printifyResponse.text();
      console.error('❌ Printify upload failed:', errorText);
      return res.status(printifyResponse.status).json({ 
        success: false, 
        error: `Printify upload failed: ${errorText}` 
      });
    }

    const printifyData: PrintifyUploadResponse = await printifyResponse.json();
    
    console.log('✅ Printify upload successful:', {
      id: printifyData.id,
      fileName: printifyData.file_name,
      dimensions: `${printifyData.width}x${printifyData.height}`,
      size: `${Math.round(printifyData.size / 1024)}KB`
    });

    return res.status(200).json({
      success: true,
      imageId: printifyData.id,
      previewUrl: printifyData.preview_url,
      dimensions: {
        width: printifyData.width,
        height: printifyData.height,
      },
      fileName: printifyData.file_name,
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    });
  }
} 