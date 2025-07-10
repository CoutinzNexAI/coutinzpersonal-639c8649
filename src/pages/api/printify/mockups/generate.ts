// src/pages/api/printify/mockups/generate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getPrintifyProduct } from '@/lib/printify/printifyProducts';
import { printifyFetch } from '@/lib/printify/printifyApi';
import { PrintifyProduct, PrintifyImagePlaceholder } from '@/lib/printify/printifyTypes';
import generatePrintFileHandler from '@/pages/api/printify/generate-print-file';
import https from 'https';
import http from 'http';

// ✅ FUNÇÃO PARA OBTER DIMENSÕES DA IMAGEM (VERSÃO INSTRUMENTADA)
async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  console.log(`[getImageDimensions] 🕵️  Iniciando a deteção para o URL: ${imageUrl}`);
  return new Promise((resolve, reject) => {
    // A parte do browser não é relevante aqui, pois isto só corre no servidor
      const client = imageUrl.startsWith('https://') ? https : http;
      
      client.get(imageUrl, (response) => {
      // ✅ NOVO LOG: Vamos ver o status code e os headers!
      const { statusCode, headers } = response;
      console.log(`[getImageDimensions] 🕵️  Resposta do servidor da imagem - Status: ${statusCode}`);
      console.log(`[getImageDimensions] 🕵️  Headers de resposta (location, content-type):`, { 
        location: headers.location, 
        'content-type': headers['content-type'] 
      });

      // Se for um redirecionamento, o 'location' header estará presente
      if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location) {
        console.error(`[getImageDimensions] ❌ ERRO: A URL retornou um redirecionamento para ${headers.location}. O http.get nativo não segue redirecionamentos. Isto é a causa provável!`);
        // Idealmente, aqui farias um novo pedido para o URL de redirecionamento,
        // mas por agora, vamos apenas identificar o problema.
        reject(new Error(`Image URL returned a redirect to ${headers.location}`));
        return; // Importante para não continuar
      }

      if (statusCode !== 200) {
        console.error(`[getImageDimensions] ❌ ERRO: O pedido à imagem falhou com o status ${statusCode}.`);
        // Consumir a resposta para libertar memória, mesmo em caso de erro.
        response.resume();
        reject(new Error(`Request to image URL failed with status code ${statusCode}`));
        return;
      }

        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
        console.log(`[getImageDimensions] 🕵️  Download da imagem concluído. Tamanho do buffer: ${buffer.length} bytes.`);
          
          // Detectar tipo de imagem e extrair dimensões
          if (buffer.length >= 4) {
            // PNG
            if (buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
              const width = buffer.readUInt32BE(16);
              const height = buffer.readUInt32BE(20);
            console.log(`[getImageDimensions] ✅ Sucesso! Imagem detetada como PNG (${width}x${height})`);
              resolve({ width, height });
            return;
            }
            // JPEG
            else if (buffer.toString('hex', 0, 4) === 'ffd8ffe0' || buffer.toString('hex', 0, 4) === 'ffd8ffe1') {
              let offset = 2;
              while (offset < buffer.length) {
                const marker = buffer.readUInt16BE(offset);
                if (marker === 0xffc0 || marker === 0xffc2) {
                  const height = buffer.readUInt16BE(offset + 5);
                  const width = buffer.readUInt16BE(offset + 7);
                console.log(`[getImageDimensions] ✅ Sucesso! Imagem detetada como JPEG (${width}x${height})`);
                  resolve({ width, height });
                  return;
                }
                offset += 2 + buffer.readUInt16BE(offset + 2);
              }
            }
            // WebP
            else if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
              // WebP simples (VP8)
              if (buffer.toString('ascii', 12, 16) === 'VP8 ') {
                const width = buffer.readUInt16LE(26) & 0x3fff;
                const height = buffer.readUInt16LE(28) & 0x3fff;
              console.log(`[getImageDimensions] ✅ Sucesso! Imagem detetada como WebP VP8 (${width}x${height})`);
                resolve({ width, height });
              }
              // WebP lossless (VP8L)
              else if (buffer.toString('ascii', 12, 16) === 'VP8L') {
                const bits = buffer.readUInt32LE(21);
                const width = (bits & 0x3fff) + 1;
                const height = ((bits >> 14) & 0x3fff) + 1;
              console.log(`[getImageDimensions] ✅ Sucesso! Imagem detetada como WebP VP8L (${width}x${height})`);
                resolve({ width, height });
              }
            }
          }
          
        console.warn('[getImageDimensions] ⚠️ O parsing manual do buffer falhou. Não foi detetado um formato conhecido.');
          // Fallback: assumir dimensões padrão se não conseguir detectar
          console.warn('⚠️ Could not detect image dimensions, using fallback 1024x1024');
          resolve({ width: 1024, height: 1024 });
        });
    }).on('error', (err) => {
      // ✅ NOVO LOG: Capturar erros de rede
      console.error('[getImageDimensions] ❌ ERRO DE REDE:', err.message);
      reject(err);
    });
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateDraftRequest {
  productId: string;
  userImageUrl: string;
  userId: string;
  selectedPrintifyVariantId?: number;
  imageAdjustments?: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
    cropArea?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  // Campos para Canvas
  printifyImageId?: string;
  printDetails?: { print_on_side: string };
}

interface CreateDraftResponse {
  success: boolean;
  previewUrls?: string[];
  printifyImageId?: string;
  printifyProductId?: string;
  customerPrintifyImageId?: string;
  dynamicPhrasePrintifyImageId?: string;
  error?: string;
  details?: string;
}

// Interface para a resposta do handler de generate-print-file
interface GeneratePrintFileResponseInternal {
  success: boolean;
  printifyImageId?: string;
  printFileUrl?: string;
  printFileId?: string;
  error?: string;
}

// Interfaces para a API Printify
interface PrintifyVariant {
  id: number;
  title: string;
  placeholders: PrintifyPlaceholder[];
}

interface PrintifyPlaceholder {
  position: string;
  width: number;
  height: number;
}

interface PrintifyVariantsResponse {
  variants: PrintifyVariant[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateDraftResponse>
) {
  console.log("--- [INÍCIO] /api/printify/mockups/generate ---");

  // Suporte para OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    console.log("🔄 STEP 1: Parsing and validating request...");
    const { 
      productId, 
      userImageUrl, 
      userId, 
      selectedPrintifyVariantId, 
      imageAdjustments,
      printifyImageId,
      printDetails
    }: CreateDraftRequest = req.body;

    // Validações básicas
    if (!productId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Dados incompletos: productId e userId são obrigatórios'
      });
    }

    // Para produtos padrão, usar userImageUrl
    const imageUrl = userImageUrl;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'userImageUrl é obrigatório'
      });
    }

    // Obter configuração do produto
    const productMapping = getPrintifyProduct(productId);
    if (!productMapping) {
      return res.status(400).json({
        success: false,
        error: `Produto não encontrado: ${productId}`
      });
    }

    console.log(`✅ STEP 1 Success: Product mapping found for ${productMapping.name}`);

    // LÓGICA PADRÃO PARA TODOS OS PRODUTOS
    console.log('🔄 Processing standard product with single image...');

    // PASSO 2: Upload/Obter ID da Imagem na Printify
    let finalPrintifyImageId = req.body.printifyImageId;

    if (!finalPrintifyImageId) {
      console.log('🔄 STEP 2: Uploading user image to Printify...');
      
      // Chamar o nosso endpoint generate-print-file
      const printFileResponse = await generatePrintFileHandler(
        {
          method: 'POST',
          body: {
            imageUrl: imageUrl,
            productId: productId,
            userId: userId,
            imageAdjustments: imageAdjustments,
            printifyPlaceholder: selectedPrintifyVariantId ? {
              position: 'front',
              width: productMapping.variants?.find(v => v.id === selectedPrintifyVariantId)?.placeholderWidth || 2000,
              height: productMapping.variants?.find(v => v.id === selectedPrintifyVariantId)?.placeholderHeight || 2000
            } : undefined
          }
        } as NextApiRequest,
        {} as NextApiResponse<GeneratePrintFileResponseInternal>
      );

      // O generatePrintFileHandler retorna diretamente o objeto de resposta
      const printFileResult = printFileResponse as unknown as GeneratePrintFileResponseInternal;

      if (!printFileResult.success || !printFileResult.printifyImageId) {
        throw new Error('Failed to upload image to Printify: ' + (printFileResult.error || 'Unknown error'));
      }

      finalPrintifyImageId = printFileResult.printifyImageId;
      console.log(`✅ STEP 2 Success: Image uploaded to Printify. ID: ${finalPrintifyImageId}`);
    } else {
      console.log(`✅ STEP 2 Skipped: Using provided printifyImageId: ${finalPrintifyImageId}`);
    }

    // PASSO 3: Criar produto Printify
    console.log('🔄 STEP 3: Creating Printify product...');
    
    const printifyProductTitle = `PicTuz ${productMapping.name} (${userId}-${Date.now()})`;
    const productPrice = (productMapping.basePrice || productMapping.price || 25) * 100; // Preço em cêntimos

    const printifyProductPayload = {
      title: printifyProductTitle,
      description: `Custom ${productMapping.name} for user ${userId}`,
      blueprint_id: productMapping.printifyBlueprintId,
      print_provider_id: productMapping.printifyPrintProviderId,
      variants: [{
        id: selectedPrintifyVariantId || productMapping.variants?.[0]?.id || 1,
        price: productPrice,
        is_enabled: true
      }],
      print_areas: [{
        variant_ids: [selectedPrintifyVariantId || productMapping.variants?.[0]?.id || 1],
        placeholders: [{
          position: productMapping.printAreasConfig?.[0]?.position || 'front',
          images: [{
            id: finalPrintifyImageId,
            x: imageAdjustments?.x || productMapping.printAreasConfig?.[0]?.defaultX || 0.5,
            y: imageAdjustments?.y || productMapping.printAreasConfig?.[0]?.defaultY || 0.5,
            scale: imageAdjustments?.scale || productMapping.printAreasConfig?.[0]?.defaultScale || 1.0,
            angle: imageAdjustments?.rotation || productMapping.printAreasConfig?.[0]?.defaultAngle || 0
          }]
        }]
      }],
      ...(printDetails ? { print_details: printDetails } : {})
    };

    console.log('📤 Creating Printify product:', JSON.stringify(printifyProductPayload, null, 2));

    const printifyProductResponse = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
      method: 'POST',
      body: JSON.stringify(printifyProductPayload)
    });

    if (!printifyProductResponse || !printifyProductResponse.id) {
      console.error('Printify product creation response error:', printifyProductResponse);
      throw new Error('Failed to create Printify product for mockup generation.');
    }
    const createdPrintifyProductId = printifyProductResponse.id;
    console.log(`✅ STEP 4 Success: Printify product created. ID: ${createdPrintifyProductId}`);

    // PASSO 5: Polling dos Mockups do Produto Printify
    console.log('🔄 STEP 5: Polling Printify product for mockups...');
    let finalPreviewUrls: string[] = [];
    const maxAttempts = 15;
    const delayMs = 8000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`--> 🔍 Attempt ${attempt}/${maxAttempts}: Fetching Printify product ${createdPrintifyProductId} details...`);
      try {
        const getProductResponse: PrintifyProduct = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdPrintifyProductId}.json`);

        if (getProductResponse.images && getProductResponse.images.length > 0) {
          console.log(`✅ SUCCESS in Printify product polling! Mockups found on attempt ${attempt}!`);
          finalPreviewUrls = getProductResponse.images.map(img => img.src) as string[];
          break;
        }
      } catch (pollError) {
        console.warn(`⚠️ WARNING: Error on Printify product polling attempt ${attempt}:`, pollError instanceof Error ? pollError.message : String(pollError));
        }

        if (attempt < maxAttempts) {
        console.log(`⏳ Printify product mockups not ready yet. Waiting ${delayMs}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    console.log(`🏁 Printify product polling completed. Found ${finalPreviewUrls.length} preview URLs.`);

    // Opcional: Apagar o produto Printify temporário se for apenas para mockups
    // console.log(`🗑️ Deleting temporary Printify product ${createdPrintifyProductId}...`);
    // try {
    //     await printifyFetch(`/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdPrintifyProductId}.json`, { method: 'DELETE' });
    //     console.log('✅ Temporary Printify product deleted.');
    // } catch (deleteError) {
    //     console.warn('⚠️ WARNING: Failed to delete temporary Printify product:', deleteError);
    // }

      return res.status(200).json({
        success: true,
        previewUrls: finalPreviewUrls,
        printifyImageId: finalPrintifyImageId,
        printifyProductId: createdPrintifyProductId,
        customerPrintifyImageId: undefined, // Removed as per new logic
        dynamicPhrasePrintifyImageId: undefined, // Removed as per new logic
    });

  } catch (error) {
    console.error('--- [CRASH] ERRO APANHADO NO CATCH-ALL ---', error);
    console.error('--- [CRASH] Stack trace completo ---', error instanceof Error ? error.stack : 'No stack trace');
    console.error('--- [CRASH] Tipo do erro ---', typeof error);

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
