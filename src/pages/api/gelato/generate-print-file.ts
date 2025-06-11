import { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { getGelatoProduct } from '@/lib/gelato/gelatoProducts';

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
}

interface GeneratePrintFileResponse {
  success: boolean;
  printFileUrl?: string;
  printFileId?: string;
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
    const { imageUrl, productId, userId, imageAdjustments }: GeneratePrintFileRequest = req.body;

    // Validar dados de entrada
    if (!imageUrl || !productId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados incompletos: imageUrl e productId são obrigatórios' 
      });
    }

    // Obter informações do produto
    const product = getGelatoProduct(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Produto não encontrado' 
      });
    }

    console.log(`Generating print file for product: ${product.name}`);

    // Calcular dimensões de destino em pixels para impressão
    // Fórmula: (dimensão_mm / 25.4) * DPI = pixels
    const targetWidthPx = Math.round((product.gelatoPrintDimensionsMm.width / 25.4) * product.printFileResolution);
    const targetHeightPx = Math.round((product.gelatoPrintDimensionsMm.height / 25.4) * product.printFileResolution);

    console.log(`Target print dimensions: ${targetWidthPx}x${targetHeightPx}px (${product.printFileResolution} DPI)`);

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
      if (imageAdjustments.rotation && product.adjustmentLimits?.allowRotation) {
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
    // A Gelato recebe esta imagem e faz a otimização final (PDF, bleed, etc.)
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

    // Gerar nome único do ficheiro
    const timestamp = Date.now();
    const userSuffix = userId ? `-${userId}` : '';
    const fileName = `print-${productId}${userSuffix}-${timestamp}`;
    const printFileId = fileName;

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('print-files')
      .upload(`${fileName}.jpg`, finalImageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // Obter URL público do ficheiro
    const { data: { publicUrl } } = supabase.storage
      .from('print-files')
      .getPublicUrl(`${fileName}.jpg`);

    console.log(`Print file uploaded successfully: ${publicUrl}`);

    return res.status(200).json({
      success: true,
      printFileUrl: publicUrl,
      printFileId: printFileId
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