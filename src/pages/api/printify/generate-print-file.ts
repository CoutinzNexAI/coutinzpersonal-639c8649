import { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { getPrintifyProduct } from '@/lib/printify/printifyProducts';
import { printifyFetch } from '@/lib/printify/printifyApi';
import { PrintifyImagePlaceholder } from '@/lib/printify/printifyTypes';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ImageAdjustments {
  x: number;          // Posição X da imagem dentro da área de impressão (0-1, percentagem)
  y: number;          // Posição Y da imagem dentro da área de impressão (0-1, percentagem)
  scale: number;      // Zoom (escala, 1 = tamanho original)
  rotation?: number;  // Rotação em graus (se suportada pelo produto)
  cropArea?: {        // Área de crop da imagem original
    x: number;        // X do crop em percentagem da imagem original
    y: number;        // Y do crop em percentagem da imagem original
    width: number;    // Largura do crop em percentagem da imagem original
    height: number;   // Altura do crop em percentagem da imagem original
  };
}

interface GeneratePrintFileRequest {
  imageUrl: string;
  productId: string; // PicTuz product ID
  userId?: string;
  imageAdjustments?: ImageAdjustments; // Ajustes manuais da imagem
  printifyPlaceholder?: PrintifyImagePlaceholder; // Dimensões e posição do placeholder da Printify
}

interface GeneratePrintFileResponse {
  success: boolean;
  printifyImageId?: string; // O novo ID da Printify
  printFileUrl?: string; // Manter para debug/referência
  printFileId?: string; // Manter para debug/referência
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeneratePrintFileResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { imageUrl, productId, userId, imageAdjustments, printifyPlaceholder }: GeneratePrintFileRequest = req.body;

    // Validar dados de entrada
    if (!imageUrl || !productId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados incompletos: imageUrl e productId são obrigatórios' 
      });
    }

    // Obter informações do produto
    const product = getPrintifyProduct(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }

    console.log(`Generating print file for product: ${product.name}`);

    // Calcular dimensões de destino em pixels para impressão usando placeholder Printify
    const targetWidthPx = imageAdjustments?.cropArea ? undefined : printifyPlaceholder?.width;
    const targetHeightPx = imageAdjustments?.cropArea ? undefined : printifyPlaceholder?.height;

    if (!targetWidthPx || !targetHeightPx) {
      return res.status(400).json({ 
        success: false, 
        error: 'Printify placeholder dimensions are required' 
      });
    }

    console.log(`Target print dimensions from Printify placeholder: ${targetWidthPx}x${targetHeightPx}px`);

    // Download da imagem do utilizador
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Não foi possível descarregar a imagem do utilizador');
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Obter metadados da imagem original
    const originalImageMeta = await sharp(imageBuffer).metadata();
    const originalWidth = originalImageMeta.width!;
    const originalHeight = originalImageMeta.height!;

    console.log(`Original image: ${originalWidth}x${originalHeight}px`);

    // Processar imagem com Sharp
    let processedImage = sharp(imageBuffer);

    // APLICAR AJUSTES MANUAIS SE EXISTIREM (para Canecas/Capas)
    if (imageAdjustments && product.supportsManualAdjustment) {
      console.log('Applying manual adjustments for manual adjustment product...');

      // 1. CROP (se especificado)
      if (imageAdjustments.cropArea) {
        const crop = imageAdjustments.cropArea;
        
        // Calcular coordenadas de crop em pixels
        const cropX = Math.round(originalWidth * crop.x);
        const cropY = Math.round(originalHeight * crop.y);
        const cropWidth = Math.round(originalWidth * crop.width);
        const cropHeight = Math.round(originalHeight * crop.height);

        console.log(`Applying crop: ${cropX},${cropY} ${cropWidth}x${cropHeight}px`);

        processedImage = processedImage.extract({
          left: Math.max(0, cropX),
          top: Math.max(0, cropY),
          width: Math.min(cropWidth, originalWidth - cropX),
          height: Math.min(cropHeight, originalHeight - cropY)
        });
      }

      // 2. ROTAÇÃO (se suportada e especificada)
      if (imageAdjustments.rotation) {
        console.log(`Applying rotation: ${imageAdjustments.rotation}°`);
        processedImage = processedImage.rotate(imageAdjustments.rotation, { 
          background: { r: 255, g: 255, b: 255, alpha: 1 } 
        });
      }

      // 3. ESCALA/ZOOM (se especificado)
      if (imageAdjustments.scale && imageAdjustments.scale !== 1) {
        console.log(`Applying scale: ${imageAdjustments.scale}x`);
        
        // Para ajustes manuais, aplicar escala antes do resize final
        const scaledWidth = Math.round(targetWidthPx * imageAdjustments.scale);
        const scaledHeight = Math.round(targetHeightPx * imageAdjustments.scale);
        
        processedImage = processedImage.resize(scaledWidth, scaledHeight, {
          fit: 'cover',
          position: 'center'
        });
      }
    }

    // REDIMENSIONAR PARA DIMENSÕES FINAIS DE IMPRESSÃO
    const finalImageBuffer = await processedImage
      .resize(targetWidthPx, targetHeightPx, {
        fit: 'cover', // Preenche completamente a área
        position: 'center',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // Fundo branco se necessário
      })
      .jpeg({ 
        quality: 95, // Alta qualidade para impressão profissional
        progressive: false,
        mozjpeg: true 
      })
      .toBuffer();

    console.log(`Final processed image: ${targetWidthPx}x${targetHeightPx}px`);

    // Opcional: Upload para Supabase Storage (para debug/backup)
    const timestamp = Date.now();
    const userSuffix = userId ? `-${userId}` : '';
    const fileName = `print-${productId}${userSuffix}-${timestamp}`;
    const printFileId = fileName;

    const { error: uploadSupabaseError } = await supabase.storage
      .from('print-files')
      .upload(`${fileName}.jpg`, finalImageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadSupabaseError) {
      console.error('Supabase upload error:', uploadSupabaseError);
      // throw new Error(`Erro no upload para Supabase: ${uploadSupabaseError.message}`); // Decidir se é fatal
    }

    const { data: { publicUrl: supabasePublicUrl } } = supabase.storage
      .from('print-files')
      .getPublicUrl(`${fileName}.jpg`);

    console.log(`Print file uploaded to Supabase: ${supabasePublicUrl}`);

    // **NOVO: Upload para Printify Media Library**
    console.log('🔄 Uploading image to Printify Media Library...');
    const printifyUploadResponse = await printifyFetch('/v1/uploads/images.json', {
      method: 'POST',
      body: JSON.stringify({
        file_name: `${fileName}.jpg`,
        url: supabasePublicUrl // Usar URL do Supabase para upload para Printify (recomendado para ficheiros grandes)
        // Ou 'contents': finalImageBuffer.toString('base64') para base64 direto (evitar para ficheiros grandes)
      })
    });

    if (!printifyUploadResponse || !printifyUploadResponse.id) {
      console.error('Printify upload response error:', printifyUploadResponse);
      throw new Error('Failed to upload image to Printify Media Library.');
    }

    const printifyImageId = printifyUploadResponse.id;
    console.log(`✅ Image uploaded to Printify Media Library. ID: ${printifyImageId}`);

    return res.status(200).json({
      success: true,
      printifyImageId: printifyImageId,
      printFileUrl: supabasePublicUrl, // Manter para debug
      printFileId: printFileId // Manter para debug
    });

  } catch (error) {
    console.error('Error generating print file:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Configuração para permitir upload de ficheiros maiores
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 