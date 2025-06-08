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

interface GeneratePrintFileRequest {
  imageUrl: string;
  productUid: string;
  productId: string; // PicTuz product ID
  userId?: string;
  transformationId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, productUid, productId, userId, transformationId }: GeneratePrintFileRequest = req.body;

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

    // Calcular dimensões de impressão
    const printDimensions = calculatePrintDimensions(product);
    
    console.log('Print dimensions:', printDimensions);

    // Download da imagem do utilizador
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Não foi possível descarregar a imagem do utilizador');
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Processar imagem com Sharp
    const processedImageBuffer = await sharp(imageBuffer)
      .resize(printDimensions.widthPx, printDimensions.heightPx, {
        fit: 'cover',
        position: 'center'
      })
      .png() // Converter para PNG para melhor qualidade
      .toBuffer();

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
      metadata: {
        productId,
        productUid,
        productName: product.name,
        printSizeMm: product.gelatoPrintDimensionsMm,
        bleedMm: product.printFileBleed,
        resolutionDpi: product.printFileResolution,
        fileSizeBytes: pdfBytes.length,
        generatedAt: new Date().toISOString()
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