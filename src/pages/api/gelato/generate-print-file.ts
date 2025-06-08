import { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import { PDFDocument, rgb } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { getGelatoProduct } from '@/lib/gelato/gelatoProducts';
import { calculatePrintDimensions, generatePrintFileName } from '@/lib/gelato/printFileGenerator';

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
  productUid: string;
  productId: string; // PicTuz product ID
  userId?: string;
  transformationId?: string;
  imageAdjustments?: ImageAdjustments; // NOVO: Ajustes manuais da imagem
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, productUid, productId, userId, transformationId, imageAdjustments }: GeneratePrintFileRequest = req.body;

    // Validar dados de entrada
    if (!imageUrl || !productUid || !productId) {
      return res.status(400).json({ error: 'Dados incompletos: imageUrl, productUid e productId são obrigatórios' });
    }

    // Obter informações do produto
    const product = getGelatoProduct(productId);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    console.log(`Generating print file for product: ${product.name}`);
    console.log('Image adjustments:', imageAdjustments);

    // Calcular dimensões de impressão
    const printDimensions = calculatePrintDimensions(product);
    
    console.log('Print dimensions:', printDimensions);

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

    // Processar imagem com Sharp - APLICAR AJUSTES MANUAIS SE EXISTIREM
    let processedImage = sharp(imageBuffer);

    if (imageAdjustments && product.supportsManualAdjustment) {
      console.log('Applying manual adjustments...');

      // 1. ROTAÇÃO (se suportada e especificada)
      if (imageAdjustments.rotation && product.adjustmentLimits?.allowRotation) {
        console.log(`Applying rotation: ${imageAdjustments.rotation}°`);
        processedImage = processedImage.rotate(imageAdjustments.rotation, { background: { r: 255, g: 255, b: 255, alpha: 1 } });
        
        // Recalcular dimensões após rotação
        const rotatedMeta = await processedImage.metadata();
        console.log(`After rotation: ${rotatedMeta.width}x${rotatedMeta.height}px`);
      }

      // 2. CROP (se especificado)
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

      // 3. ESCALA/ZOOM
      if (imageAdjustments.scale && imageAdjustments.scale !== 1) {
        console.log(`Applying scale: ${imageAdjustments.scale}x`);
        
        const targetWidth = Math.round(printDimensions.widthPx * imageAdjustments.scale);
        const targetHeight = Math.round(printDimensions.heightPx * imageAdjustments.scale);
        
        processedImage = processedImage.resize(targetWidth, targetHeight, {
          fit: 'cover',
          position: 'center'
        });
      }
    }

    // Redimensionar para as dimensões finais de impressão
    const processedImageBuffer = await processedImage
      .resize(printDimensions.widthPx, printDimensions.heightPx, {
        fit: imageAdjustments && product.supportsManualAdjustment ? 'inside' : 'cover',
        position: 'center',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // Fundo branco se necessário
      })
      .png() // Converter para PNG para melhor qualidade
      .toBuffer();

    console.log(`Final processed image: ${printDimensions.widthPx}x${printDimensions.heightPx}px`);

    // Criar PDF/X-4 com pdf-lib
    const pdfDoc = await PDFDocument.create();
    
    // Definir metadados PDF/X-4
    pdfDoc.setTitle(`Print File - ${product.name}`);
    pdfDoc.setSubject('Print-ready artwork');
    pdfDoc.setCreator('PicTuz Print Generator');
    pdfDoc.setProducer('PicTuz');
    
    // Calcular dimensões da página em pontos (1 mm = 2.834645669 pontos)
    const mmToPoints = (mm: number) => mm * 2.834645669;
    
    const pageWidth = mmToPoints(product.gelatoPrintDimensionsMm.width + (product.printFileBleed * 2));
    const pageHeight = mmToPoints(product.gelatoPrintDimensionsMm.height + (product.printFileBleed * 2));

    console.log(`PDF dimensions: ${pageWidth}x${pageHeight} points`);

    // Criar página
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Incorporar imagem no PDF
    const pngImage = await pdfDoc.embedPng(processedImageBuffer);
    
    // Calcular posição e tamanho da imagem na página
    const imageX = mmToPoints(product.gelatoPrintOffsetsMm.x + product.printFileBleed);
    const imageY = mmToPoints(product.gelatoPrintOffsetsMm.y + product.printFileBleed);
    const imageWidth = mmToPoints(product.gelatoPrintDimensionsMm.width);
    const imageHeight = mmToPoints(product.gelatoPrintDimensionsMm.height);

    // Desenhar imagem na página
    page.drawImage(pngImage, {
      x: imageX,
      y: pageHeight - imageY - imageHeight, // PDF coordinates are bottom-up
      width: imageWidth,
      height: imageHeight
    });

    // Adicionar marcas de corte se necessário (para bleed)
    if (product.printFileBleed > 0) {
      const cropMarkLength = mmToPoints(5);
      const cropMarkOffset = mmToPoints(2);
      
      // Marcas de corte nos cantos
      const corners = [
        { x: mmToPoints(product.printFileBleed), y: mmToPoints(product.printFileBleed) },
        { x: pageWidth - mmToPoints(product.printFileBleed), y: mmToPoints(product.printFileBleed) },
        { x: mmToPoints(product.printFileBleed), y: pageHeight - mmToPoints(product.printFileBleed) },
        { x: pageWidth - mmToPoints(product.printFileBleed), y: pageHeight - mmToPoints(product.printFileBleed) }
      ];

      corners.forEach(corner => {
        // Linha horizontal
        page.drawLine({
          start: { x: corner.x - cropMarkOffset - cropMarkLength, y: corner.y },
          end: { x: corner.x - cropMarkOffset, y: corner.y },
          thickness: 0.5,
          color: rgb(0, 0, 0)
        });
        
        // Linha vertical
        page.drawLine({
          start: { x: corner.x, y: corner.y - cropMarkOffset - cropMarkLength },
          end: { x: corner.x, y: corner.y - cropMarkOffset },
          thickness: 0.5,
          color: rgb(0, 0, 0)
        });
      });
    }

    // Gerar PDF final
    const pdfBytes = await pdfDoc.save();

    // Gerar nome único do ficheiro
    const fileName = generatePrintFileName(userId || 'anonymous', productId, 'pdf');

    console.log(`Uploading PDF: ${fileName}`);

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('print-files')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error('Erro ao fazer upload do ficheiro: ' + uploadError.message);
    }

    // Obter URL público
    const { data: urlData } = supabase.storage
      .from('print-files')
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    console.log(`Print file generated successfully: ${fileUrl}`);

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      fileUrl,
      fileName,
      printDimensions,
      imageAdjustments: imageAdjustments || null,
      metadata: {
        productId,
        productUid,
        productName: product.name,
        printSizeMm: product.gelatoPrintDimensionsMm,
        bleedMm: product.printFileBleed,
        resolutionDpi: product.printFileResolution,
        fileSizeBytes: pdfBytes.length,
        generatedAt: new Date().toISOString(),
        manualAdjustments: !!imageAdjustments
      }
    });

  } catch (error) {
    console.error('Error generating print file:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar ficheiro de impressão'
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