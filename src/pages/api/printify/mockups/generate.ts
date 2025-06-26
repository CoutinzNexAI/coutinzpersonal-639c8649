// src/pages/api/printify/mockups/generate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getPrintifyProduct } from '@/lib/printify/printifyProducts';
import { printifyFetch } from '@/lib/printify/printifyApi';
import { PrintifyProduct, PrintifyImagePlaceholder } from '@/lib/printify/printifyTypes';
import generatePrintFileHandler from '@/pages/api/printify/generate-print-file';
import { generatePhraseImage } from '@/utils/imageUtils';
import https from 'https';
import http from 'http';

// ✅ FUNÇÃO PARA OBTER DIMENSÕES DA IMAGEM
async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined') {
      // Código do browser
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = imageUrl;
    } else {
      // Código do servidor Node.js
      const client = imageUrl.startsWith('https://') ? https : http;
      
      client.get(imageUrl, (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          // Detectar tipo de imagem e extrair dimensões
          if (buffer.length >= 4) {
            // PNG
            if (buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
              const width = buffer.readUInt32BE(16);
              const height = buffer.readUInt32BE(20);
              resolve({ width, height });
            }
            // JPEG
            else if (buffer.toString('hex', 0, 4) === 'ffd8ffe0' || buffer.toString('hex', 0, 4) === 'ffd8ffe1') {
              let offset = 2;
              while (offset < buffer.length) {
                const marker = buffer.readUInt16BE(offset);
                if (marker === 0xffc0 || marker === 0xffc2) {
                  const height = buffer.readUInt16BE(offset + 5);
                  const width = buffer.readUInt16BE(offset + 7);
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
                resolve({ width, height });
              }
              // WebP lossless (VP8L)
              else if (buffer.toString('ascii', 12, 16) === 'VP8L') {
                const bits = buffer.readUInt32LE(21);
                const width = (bits & 0x3fff) + 1;
                const height = ((bits >> 14) & 0x3fff) + 1;
                resolve({ width, height });
              }
            }
          }
          
          // Fallback: assumir dimensões padrão se não conseguir detectar
          console.warn('⚠️ Could not detect image dimensions, using fallback 1024x1024');
          resolve({ width: 1024, height: 1024 });
        });
      }).on('error', reject);
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateDraftRequest {
  productId: string; // Nossa chave interna (ex: "canvas_200x200_square_slim_unframed")
  userImageUrl: string; // URL da imagem do utilizador
  userId: string; // ID do utilizador
  selectedPrintifyVariantId?: number; // ID da variante selecionada (para capas de telemóvel)
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
  // Novos campos para sweat de criança
  logoImageId?: string; // ID fixo do logo na Printify
  customerImageUrl?: string; // URL da imagem do cliente (pode ser diferente do userImageUrl)
  customerImageAdjustments?: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
  };
  selectedPhraseText?: string; // Texto da frase selecionada
  phraseImageAdjustments?: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
  };
  // Novos campos para Canvas
  printifyImageId?: string; // ID da imagem já carregada na Printify
  printDetails?: { print_on_side: string }; // Para opções de borda do Canvas
}

interface CreateDraftResponse {
  success: boolean;
  previewUrls?: string[];
  printifyImageId?: string; // Para produtos simples
  printifyProductId?: string;
  customerPrintifyImageId?: string; // Para sweat de criança
  dynamicPhrasePrintifyImageId?: string; // Para sweat de criança
  error?: string;
  details?: string;
  debug?: Record<string, unknown>; // Para depuração temporária
}

// Interface para a resposta do handler de generate-print-file
interface GeneratePrintFileResponseInternal {
  success: boolean;
  printifyImageId?: string;
  printFileUrl?: string; // Manter para debug/referência
  printFileId?: string; // Manter para debug/referência
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
  
  // 🔍 LOGS DE DEPURAÇÃO DETALHADOS
  console.log("🔍 [DEBUG] Request method:", req.method);
  console.log("🔍 [DEBUG] Request URL:", req.url);
  console.log("🔍 [DEBUG] Request headers:", JSON.stringify(req.headers, null, 2));
  console.log("🔍 [DEBUG] Request body type:", typeof req.body);
  console.log("🔍 [DEBUG] Request body keys:", Object.keys(req.body || {}));
  console.log("🔍 [DEBUG] Request body content:", JSON.stringify(req.body, null, 2));
  console.log("🔍 [DEBUG] Request query:", JSON.stringify(req.query, null, 2));
  console.log("🔍 [DEBUG] User-Agent:", req.headers['user-agent']);
  console.log("🔍 [DEBUG] Content-Type:", req.headers['content-type']);
  console.log("🔍 [DEBUG] Content-Length:", req.headers['content-length']);

  // Suporte para OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    console.log("✅ [DEBUG] OPTIONS preflight request - setting CORS headers");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  // Temporariamente aceitar GET para depuração
  if (req.method === 'GET') {
    console.log("⚠️ [DEBUG] GET request received - returning debug info");
    return res.status(200).json({
      success: false,
      error: 'GET request received for debugging',
      debug: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query
      }
    });
  }

  if (req.method !== 'POST') {
    console.log("❌ ERRO: Método não permitido:", req.method);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    console.log("🔐 PASSO 0: A verificar autenticação...");

    if (!process.env.PRINTIFY_SHOP_ID) {
      console.log("❌ ERRO: PRINTIFY_SHOP_ID não está configurado");
      return res.status(500).json({
        success: false,
        error: 'PRINTIFY_SHOP_ID not configured'
      });
    }

    //const authHeader = req.headers.authorization;
    //if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //  console.log("❌ ERRO: Token de autorização em falta");
    //  return res.status(401).json({
    //    success: false,
    //    error: 'Unauthorized - missing token'
    //  });
    //}

    //const token = authHeader.substring(7);
    //const { data: { user }, error } = await supabase.auth.getUser(token);

    //if (error || !user) {
    //  console.log("❌ ERRO: Token inválido:", error?.message);
    //  return res.status(401).json({
    //    success: false,
    //    error: 'Unauthorized - invalid token'
    //  });
    //}

    //console.log("✅ Autenticação bem-sucedida. User ID:", user.id);

    //const { productId, userImageUrl, userId, imageAdjustments }: CreateDraftRequest = req.body;

    //console.log("📋 Dados recebidos:", { 
      //productId, 
      //userImageUrl: userImageUrl?.substring(0, 50) + '...', 
      //userId,
      //hasImageAdjustments: !!imageAdjustments
    //});

    const user = { id: 'test-user-ficticio-123' };
    const { productId, userImageUrl, userId, imageAdjustments, selectedPrintifyVariantId, logoImageId, customerImageUrl, customerImageAdjustments, selectedPhraseText, phraseImageAdjustments, printifyImageId } = req.body;

    // Para sweat de criança, usar customerImageUrl; para outros produtos, usar userImageUrl
    const imageUrl = productId === 'custom_youth_hoodie' ? customerImageUrl : userImageUrl;

    // Validações básicas
    if (!productId || !imageUrl || !userId) {
      console.log("❌ ERRO: Campos obrigatórios em falta:", { 
        productId: !!productId, 
        userImageUrl: !!userImageUrl,
        customerImageUrl: !!customerImageUrl,
        imageUrl: !!imageUrl,
        userId: !!userId 
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, imageUrl (userImageUrl or customerImageUrl), userId'
      });
    }

    // Validação específica para capas de telemóvel
    if (productId === 'custom_phone_case' && !selectedPrintifyVariantId) {
      console.log("❌ ERRO: selectedPrintifyVariantId é obrigatório para capas de telemóvel");
      return res.status(400).json({
        success: false,
        error: 'selectedPrintifyVariantId é obrigatório para capas de telemóvel.'
      });
    }

    // Validação específica para sweat de criança
    if (productId === 'custom_youth_hoodie') {
      if (!selectedPrintifyVariantId || !logoImageId || !selectedPhraseText) {
        console.log("❌ ERRO: Campos obrigatórios para sweat de criança em falta:", { 
          selectedPrintifyVariantId: !!selectedPrintifyVariantId,
          logoImageId: !!logoImageId,
          selectedPhraseText: !!selectedPhraseText
        });
        return res.status(400).json({
          success: false,
          error: 'Para sweat de criança são obrigatórios: selectedPrintifyVariantId, logoImageId, selectedPhraseText'
        });
      }
    }

    // Buscar produto no nosso mapeamento
    const product = getPrintifyProduct(productId);
    if (!product || !product.printifyBlueprintId || !product.printifyPrintProviderId) {
      console.log("❌ ERROR: Product not found in Printify mapping or missing Printify IDs:", productId);
      return res.status(404).json({
        success: false,
        error: `Product not found in Printify mapping or missing Printify IDs: ${productId}`
      });
    }

    // Verificar se tem variants (para capas) ou printifyVariantIds (para outros produtos)
    const hasVariants = (product.variants && product.variants.length > 0) || (product.printifyVariantIds && product.printifyVariantIds.length > 0);
    if (!hasVariants) {
      console.log("❌ ERROR: Product has no variants or printifyVariantIds:", productId);
      return res.status(404).json({
        success: false,
        error: `Product has no variants configured: ${productId}`
      });
    }

    console.log(`✅ Product found in mapping: ${product.name} (Blueprint: ${product.printifyBlueprintId}, PP: ${product.printifyPrintProviderId})`);

    // PASSO 1.5: Obter Detalhes do Placeholder da Printify
    console.log('🔄 STEP 1.5: Fetching Printify blueprint variant details...');
    const printifyVariantsResponse = await printifyFetch(
      `/catalog/blueprints/${product.printifyBlueprintId}/print_providers/${product.printifyPrintProviderId}/variants.json?show-out-of-stock=1`
    );

    // Debug: Log all available variants
    console.log('🔍 DEBUG: Available variants from Printify API:', printifyVariantsResponse.variants);

    // Determinar qual variante usar
    let targetVariantId: number;
    if (selectedPrintifyVariantId) {
      targetVariantId = selectedPrintifyVariantId;
    } else if (product.variants && product.variants.length > 0) {
      targetVariantId = product.variants[0].id;
    } else if (product.printifyVariantIds && product.printifyVariantIds.length > 0) {
      targetVariantId = product.printifyVariantIds[0];
      } else {
      throw new Error('No variant ID available for the product');
    }
    console.log('🎯 Selected variant ID:', targetVariantId);

    const selectedPrintifyVariant = printifyVariantsResponse.variants.find(
      (v: PrintifyVariant) => v.id === targetVariantId
    );

    if (!selectedPrintifyVariant) {
      console.error('❌ Variant not found! Available variant IDs:', printifyVariantsResponse.variants.map((v: PrintifyVariant) => v.id));
      throw new Error(`Printify variant with ID ${targetVariantId} not found. Available IDs: ${printifyVariantsResponse.variants.map((v: PrintifyVariant) => v.id).join(', ')}`);
    }

    if (!selectedPrintifyVariant.placeholders || selectedPrintifyVariant.placeholders.length === 0) {
      throw new Error('Printify variant placeholders not found for the selected product.');
    }

    console.log('✅ Printify variant details:', selectedPrintifyVariant);

    // LÓGICA ESPECÍFICA PARA SWEAT DE CRIANÇA
    if (productId === 'custom_youth_hoodie') {
      console.log('🔄 Processing youth hoodie with multiple print areas...');

      // PASSO 1: Processar e fazer upload da imagem do cliente para Printify
      console.log('🔄 Processing and uploading customer image to Printify...');
      
             // Obter o placeholder para a posição back (onde vai a imagem do cliente)
       const customerBackPlaceholder = selectedPrintifyVariant.placeholders.find(
         (p: PrintifyPlaceholder) => p.position === 'back'
       );
      
      let customerPrintifyImageId: string;
      
             if (customerBackPlaceholder) {
         // Usar generate-print-file.ts para processar a imagem do cliente
         console.log('🔄 Using print file processing for customer image...');
         
         const mockGenerateCustomerFileReq: NextApiRequest = {
           method: 'POST',
           headers: {
             'content-type': 'application/json',
           },
           body: {
             imageUrl: customerImageUrl || userImageUrl,
             productId: productId,
             userId: userId,
             imageAdjustments: customerImageAdjustments,
             printifyPlaceholder: customerBackPlaceholder
           }
        } as NextApiRequest;

        let generateCustomerFileData: GeneratePrintFileResponseInternal | undefined;
        const mockGenerateCustomerFileRes = {
          status: (_statusCode: number) => mockGenerateCustomerFileRes,
          json: (data: GeneratePrintFileResponseInternal) => {
            generateCustomerFileData = data;
            return mockGenerateCustomerFileRes;
          },
          setHeader: () => mockGenerateCustomerFileRes,
          end: () => mockGenerateCustomerFileRes,
        } as unknown as NextApiResponse;

        await generatePrintFileHandler(mockGenerateCustomerFileReq, mockGenerateCustomerFileRes);

        if (generateCustomerFileData?.success && generateCustomerFileData?.printifyImageId) {
          customerPrintifyImageId = generateCustomerFileData.printifyImageId;
          console.log('✅ Customer image processed and uploaded:', customerPrintifyImageId);
        } else {
          console.warn('⚠️ Print file processing failed, using direct upload fallback');
          // Fallback para upload direto
          const customerUploadResponse = await printifyFetch('uploads/images.json', {
            method: 'POST',
            body: JSON.stringify({
              file_name: `customer-art-${Date.now()}.png`,
              url: customerImageUrl || userImageUrl
            })
          });

          if (!customerUploadResponse?.id) {
            throw new Error('Failed to upload customer image to Printify');
          }
          customerPrintifyImageId = customerUploadResponse.id;
          console.log('✅ Customer image uploaded (fallback):', customerPrintifyImageId);
        }
      } else {
        // Fallback se não encontrar placeholder
        console.warn('⚠️ Back placeholder not found, using direct upload');
                const customerUploadResponse = await printifyFetch('uploads/images.json', {
      method: 'POST',
      body: JSON.stringify({
          file_name: `customer-art-${Date.now()}.png`,
          url: customerImageUrl || userImageUrl
      })
    });

      if (!customerUploadResponse?.id) {
        throw new Error('Failed to upload customer image to Printify');
      }
        customerPrintifyImageId = customerUploadResponse.id;
        console.log('✅ Customer image uploaded (direct):', customerPrintifyImageId);
      }

      // PASSO 2: Gerar e fazer upload da imagem da frase (se não for "Sem frase")
      let dynamicPhrasePrintifyImageId = '';
      
      if (selectedPhraseText && selectedPhraseText !== 'Sem frase') {
        console.log('🔄 Generating phrase image for:', selectedPhraseText);
        
        try {
          // Gerar a imagem da frase dinamicamente
          dynamicPhrasePrintifyImageId = await generatePhraseImage(selectedPhraseText);
          console.log('✅ Phrase image ID generated:', dynamicPhrasePrintifyImageId);
        } catch (phraseError) {
          console.warn('⚠️ Failed to generate phrase image, using fallback:', phraseError);
          // Fallback para o mapeamento estático
        const phraseImageMapping: Record<string, string> = {
          'PicTuz - since 2025': '68548af2cc947707f0ee650f',
          'Criado com IA': '68548af3cc947707f0ee651a',
          'Arte Personalizada': '68548af4cc947707f0ee652b',
          'Feito em Portugal': '68548af5cc947707f0ee653c',
        };
        
        dynamicPhrasePrintifyImageId = phraseImageMapping[selectedPhraseText] || '68548b05a7a3520a5d3534c0';
          console.log('✅ Fallback phrase image ID:', dynamicPhrasePrintifyImageId);
        }
      } else {
        // "Sem frase" - usar imagem transparente
        dynamicPhrasePrintifyImageId = '68548b05a7a3520a5d3534c0';
        console.log('✅ Using transparent image for "no phrase"');
      }

      // PASSO 3: Obter placeholders para front e back
      const frontPlaceholder = selectedPrintifyVariant.placeholders.find(
        (p: PrintifyPlaceholder) => p.position === 'front'
      );
      const backPlaceholder = selectedPrintifyVariant.placeholders.find(
        (p: PrintifyPlaceholder) => p.position === 'back'
      );

      if (!frontPlaceholder || !backPlaceholder) {
        throw new Error('Front or back placeholder not found for youth hoodie');
      }

      // PASSO 4: Criar produto com múltiplas áreas de impressão
      console.log('🔄 Creating youth hoodie product with multiple print areas...');
      console.log('🔍 DEBUG: Logo ID being used:', logoImageId);
      console.log('🔍 DEBUG: Customer Image ID:', customerPrintifyImageId);
      console.log('🔍 DEBUG: Phrase Image ID:', dynamicPhrasePrintifyImageId);
      console.log('🔍 DEBUG: Selected variant ID:', targetVariantId);
      
      const printifyProductTitle = `PicTuz Youth Hoodie (${user.id}-${Date.now()})`;
      const productPrice = (product.basePrice || 40) * 100; // 40€ em cêntimos

      const printifyProductPayload = {
        title: printifyProductTitle,
        description: `Custom youth hoodie for user ${user.id} with logo, custom art, and phrase.`,
        blueprint_id: product.printifyBlueprintId,
        print_provider_id: product.printifyPrintProviderId,
        variants: [{
          id: targetVariantId,
          price: productPrice,
          is_enabled: true
        }],
        print_areas: [
          // Área 1: Logo na frente
          {
            variant_ids: [targetVariantId],
            placeholders: [{
              position: 'front',
              images: [{
                id: logoImageId, // ID fixo do logo
                x: 0.5,
                y: 0.4, // Posicionar mais para cima no peito
                scale: 0.6, // Reduzir escala para garantir que o logo esteja visível
                angle: 0,
                is_default: true, // Forçar como imagem principal da vista frontal
                is_selected_for_publishing: true // Forçar para publicação/mockups
              }]
            }]
          },
          // Área 2: Arte do cliente e frase nas costas
          {
            variant_ids: [targetVariantId],
            placeholders: [{
              position: 'back',
              images: [
                {
                  id: customerPrintifyImageId, // Imagem do cliente
                  x: customerImageAdjustments?.x || 0.5,
                  y: customerImageAdjustments?.y || 0.5,
                  scale: customerImageAdjustments?.scale || 0.9,
                  angle: customerImageAdjustments?.rotation || 0
                },
                {
                  id: dynamicPhrasePrintifyImageId, // Frase
                  x: phraseImageAdjustments?.x || 0.5,
                  y: phraseImageAdjustments?.y || 0.85, // Mais em baixo
                  scale: phraseImageAdjustments?.scale || 0.8, // Ajustar conforme necessário, mas 1.0 é um bom início para imagens geradas
                  angle: phraseImageAdjustments?.rotation || 0
                }
              ]
            }]
          }
        ]
      };

      console.log('📤 Creating youth hoodie product:', JSON.stringify(printifyProductPayload, null, 2));

      const printifyProductResponse = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
        method: 'POST',
        body: JSON.stringify(printifyProductPayload)
      });

      if (!printifyProductResponse || !printifyProductResponse.id) {
        console.error('Printify product creation response error:', printifyProductResponse);
        throw new Error('Failed to create youth hoodie product for mockup generation.');
      }

      const createdPrintifyProductId = printifyProductResponse.id;
      console.log(`✅ Youth hoodie product created. ID: ${createdPrintifyProductId}`);

      // PASSO 5: Polling dos mockups
      console.log('🔄 Polling for youth hoodie mockups...');
      const maxAttempts = 15;
      const delayMs = 10000; // Aumentar para dar tempo à Printify para gerar mockups complexos

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔄 Attempt ${attempt}/${maxAttempts}: Checking mockup status...`);
        
        const productDetails = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdPrintifyProductId}.json`);
        
        if (productDetails && productDetails.images && productDetails.images.length > 0) {
          console.log('--- DEBUG: Resposta COMPLETA de productDetails.images da Printify ---');
          console.log(JSON.stringify(productDetails.images, null, 2));
          console.log('--- FIM DEBUG ---');
          
          const previewUrls = productDetails.images.map((img: { src: string }) => img.src);
          
          if (previewUrls.length > 0) {
            console.log(`✅ Mockups ready! Found ${previewUrls.length} preview(s) - ALL mockup views included`);
            // RETORNA IMEDIATAMENTE quando mockups estão prontos
            return res.status(200).json({
              success: true,
              previewUrls: previewUrls,
              printifyProductId: createdPrintifyProductId,
              customerPrintifyImageId: customerPrintifyImageId,
              dynamicPhrasePrintifyImageId: dynamicPhrasePrintifyImageId
            });
          }
        }
        
        // Se não houver imagens ainda, espera ANTES da próxima tentativa
        if (attempt < maxAttempts) {
          console.log(`⏳ Mockups not ready yet, waiting ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      // Se o loop terminar sem encontrar mockups, retorna um fallback
      console.warn(`⚠️ Polling falhou após ${maxAttempts} tentativas. Nenhum mockup encontrado.`);
      return res.status(200).json({
        success: false,
        error: 'Tempo limite atingido para geração de mockups. Tente novamente mais tarde.',
        previewUrls: [product.mockupInitialPath], // Fallback para mockup inicial
        printifyProductId: createdPrintifyProductId,
        customerPrintifyImageId: customerPrintifyImageId,
        dynamicPhrasePrintifyImageId: dynamicPhrasePrintifyImageId
      });
    } else if (productId === 'custom_canvas' || productId === 'framed_canvas' ||
               productId === 'poster_horizontal_semi_glossy' || productId === 'poster_vertical_semi_glossy' ||
               productId === 'ceramic_mug' || productId === 'heart_mug') {
      // LÓGICA UNIFICADA PARA CANVAS/POSTER/CANECAS (USA SRC, NÃO ID)
      console.log(`🔄 Processing ${productId} with unified robust logic (src + calculated scale)`);

      // Validar que temos a imagem URL
      if (!userImageUrl) {
        throw new Error(`userImageUrl is required for ${productId} products`);
      }

      const printAreaConfig = product.printAreasConfig?.[0];
      if (!printAreaConfig) {
        throw new Error(`Print area configuration not found for ${productId} product`);
      }

      // ✅ DEBUG: Log dos imageAdjustments recebidos do frontend
      console.log('🎯 [BACKEND] imageAdjustments recebidos do frontend:', imageAdjustments);

      // ✅ OBTER DIMENSÕES REAIS DA IMAGEM PARA CÁLCULO PRECISO
      console.log(`🧠 [BACKEND] Obtendo dimensões reais da imagem para ${productId}...`);
      
      let userImageWidth = 1024; // Fallback
      let userImageHeight = 1024; // Fallback
      
      try {
        const imageDimensions = await getImageDimensions(userImageUrl);
        userImageWidth = imageDimensions.width;
        userImageHeight = imageDimensions.height;
        console.log(`✅ Dimensões reais da imagem obtidas: ${userImageWidth}x${userImageHeight}`);
      } catch (error) {
        console.warn('⚠️ Erro ao obter dimensões da imagem, usando fallback 1024x1024:', error);
      }
      
      // Obter dimensões do placeholder da variante selecionada
      const selectedVariant = product.variants?.find(v => v.id === targetVariantId);
      if (!selectedVariant) {
        throw new Error(`Variant ${targetVariantId} not found for ${productId}`);
      }
      
      const { placeholderWidth, placeholderHeight } = selectedVariant;

      // ✅ CALCULAR ESCALA SEMPRE (usando a lógica robusta do Math.max)
      console.log(`🧠 [BACKEND] Calculando escala robusta para ${productId}...`);

      // PASSO A: Calcula o fator de zoom necessário para cobrir toda a área (lógica Math.max)
      const scaleToCover = Math.max(
        placeholderWidth / userImageWidth,
        placeholderHeight / userImageHeight
      );

      // PASSO B: Calcula qual será a LARGURA da imagem depois de aplicar este zoom
      const finalImageWidth = userImageWidth * scaleToCover;

      // PASSO C (A TRADUÇÃO): Converte para o valor de 'scale' que a Printify entende
      const calculatedScale = finalImageWidth / placeholderWidth;
      
      console.log(`🧠 [BACKEND] Cálculo de escala robusta para ${productId}:`, {
        placeholderWidth,
        placeholderHeight,
        userImageWidth,
        userImageHeight,
        scaleToCover,
        finalImageWidth,
        calculatedScale
      });

      // Calcular valores finais que serão usados (priorizar frontend, fallback para cálculo robusto)
      const finalValues = {
        x: imageAdjustments?.x || printAreaConfig.defaultX,
        y: imageAdjustments?.y || printAreaConfig.defaultY,
        scale: imageAdjustments?.scale || calculatedScale, // ✅ USA A ESCALA CALCULADA!
        angle: imageAdjustments?.rotation || printAreaConfig.defaultAngle
      };
      console.log('🎯 [BACKEND] Valores finais para Printify:', finalValues);

      // Criar produto temporário na Printify para gerar mockup
      const printifyProductPayload = {
        title: `PicTuz ${productId} Mockup (${user.id}-${Date.now()})`,
        description: `Temporary ${productId} product for mockup generation`,
        blueprint_id: product.printifyBlueprintId,
        print_provider_id: product.printifyPrintProviderId,
        variants: [{
          id: targetVariantId,
          price: 1000, // Preço dummy para mockup
          is_enabled: true
        }],
        // *** MODIFICA ESTA CONDIÇÃO para APENAS Canvas ***
        ...(productId === 'custom_canvas' || productId === 'framed_canvas' ? { print_details: { print_on_side: 'mirror' } } : {}),
        print_areas: [{
          variant_ids: [targetVariantId],
          placeholders: [{
            position: printAreaConfig.position,
            images: [{
              src: userImageUrl, // ✅ USA SRC EM VEZ DE ID!
              x: finalValues.x,
              y: finalValues.y,
              scale: finalValues.scale,
              angle: finalValues.angle
            }]
          }]
          // *** REMOVIDO print_details DAQUI - agora está no nível superior ***
        }]
      };

      console.log(`📤 ${productId} payload:`, JSON.stringify(printifyProductPayload, null, 2));

      const printifyProductResponse = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
        method: 'POST',
        body: JSON.stringify(printifyProductPayload)
      });

      if (!printifyProductResponse || !printifyProductResponse.id) {
        throw new Error(`Failed to create ${productId} product on Printify`);
      }

      const createdProductId = printifyProductResponse.id;
      console.log(`✅ ${productId} product created with ID: ${createdProductId}`);

      // Polling para obter mockups
      let finalPreviewUrls: string[] = [];
      const maxAttempts = 15;
      const delayMs = 8000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`--> 🔍 ${productId} polling attempt ${attempt}/${maxAttempts}...`);
        
        try {
          const getProductResponse: PrintifyProduct = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdProductId}.json`);

          if (getProductResponse.images && getProductResponse.images.length > 0) {
            console.log(`✅ ${productId} mockups ready! Found ${getProductResponse.images.length} preview(s) - ALL mockup views included`);
            finalPreviewUrls = getProductResponse.images.map(img => img.src) as string[];
            break;
          }
        } catch (pollError) {
          console.warn(`⚠️ ${productId} polling attempt ${attempt} failed:`, pollError);
        }

        if (attempt < maxAttempts) {
          console.log(`⏳ ${productId} mockups not ready yet. Waiting ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      console.log(`🏁 ${productId} mockup polling completed. Found ${finalPreviewUrls.length} preview URLs.`);

      return res.status(200).json({
        success: true,
        previewUrls: finalPreviewUrls.length > 0 ? finalPreviewUrls : [product.mockupInitialPath],
        printifyImageId: null, // ✅ Não fazemos upload, usamos SRC diretamente
        printifyProductId: createdProductId,
      });

    } else {
    // LÓGICA PARA OUTROS PRODUTOS (código existente)
    const printArea = product.printAreasConfig?.[0]?.position || product.printArea || 'front';
    const printifyPlaceholder = selectedPrintifyVariant.placeholders.find(
      (p: PrintifyPlaceholder) => p.position === printArea
    ) as PrintifyImagePlaceholder;

    if (!printifyPlaceholder) {
      throw new Error(`Printify placeholder not found for position: ${printArea}`);
    }

    console.log('✅ Printify placeholder details:', printifyPlaceholder);

    // PASSO 2: Chamar generate-print-file.ts diretamente (passando o placeholder Printify)
    console.log('🔄 STEP 2: Generating print-ready file and uploading to Printify Media Library...');

    // Criar objetos req e res simulados para passar ao handler interno
    const mockGeneratePrintFileReq: NextApiRequest = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: {
        imageUrl: imageUrl,
        productId: productId,
        userId: userId,
        imageAdjustments: product.supportsManualAdjustment ? imageAdjustments : undefined,
        printifyPlaceholder: printifyPlaceholder
      }
    } as NextApiRequest;

    // Criar um objeto res simulado para capturar a resposta
    let generateFileData: GeneratePrintFileResponseInternal | undefined;
    const mockGeneratePrintFileRes = {
      status: (_statusCode: number) => {
        return mockGeneratePrintFileRes; // Permite chain .status().json()
      },
      json: (data: GeneratePrintFileResponseInternal) => {
        generateFileData = data;
        return mockGeneratePrintFileRes;
      },
      setHeader: () => mockGeneratePrintFileRes,
      end: () => mockGeneratePrintFileRes,
    } as unknown as NextApiResponse;

    // Chamar o handler diretamente
    await generatePrintFileHandler(mockGeneratePrintFileReq, mockGeneratePrintFileRes);

    if (!generateFileData || !generateFileData.success || !generateFileData.printifyImageId) {
      console.error("❌ ERROR: Print file generation failed (internal call):", generateFileData?.error || "No data");
      throw new Error(`Print file generation failed: ${generateFileData?.error || "Unknown error"}`);
    }

    const printifyImageId = generateFileData.printifyImageId;
    console.log(`✅ STEP 2 Success: Image uploaded to Printify Media Library with ID: ${printifyImageId}`);

    // PASSO 3: Criar Produto Printify Temporário (para Mockups)
    console.log('🔄 STEP 3: Creating temporary Printify product for mockup generation...');
    const printifyProductTitle = `PicTuz Custom ${product.name} (${user.id}-${Date.now()})`;

    // ✅ CALCULAR ESCALA CORRETA (igual aos posters)
    let finalX = 0.5;
    let finalY = 0.5;
    let finalScale = 1.0;
    let finalAngle = 0;

    // Para produtos que suportam ajuste manual (como canecas)
    if (imageAdjustments && product.supportsManualAdjustment) {
      console.log('🔍 [ESCALA] Calculando escala para produto com ajuste manual...');
      
      try {
        // Obter dimensões da imagem do utilizador
        const userImageDimensions = await getImageDimensions(imageUrl);
        console.log('📐 [ESCALA] Dimensões da imagem do utilizador:', userImageDimensions);
        
        // Dimensões do placeholder Printify
        const placeholderWidth = printifyPlaceholder.width;
        const placeholderHeight = printifyPlaceholder.height;
        console.log('📐 [ESCALA] Dimensões do placeholder Printify:', { placeholderWidth, placeholderHeight });
        
        // PASSO A: Calcula o fator de zoom para cobrir tudo (igual aos posters)
        const scaleToCover = Math.max(
          placeholderWidth / userImageDimensions.width,
          placeholderHeight / userImageDimensions.height
        );
        console.log('🔍 [ESCALA] Scale to cover calculado:', scaleToCover);
        
        // PASSO B: Calcula a largura final da imagem com esse zoom
        const finalImageWidth = userImageDimensions.width * scaleToCover;
        console.log('🔍 [ESCALA] Largura final da imagem:', finalImageWidth);
        
        // PASSO C: Traduz para o 'scale' que a Printify entende
        const printifyScale = finalImageWidth / placeholderWidth;
        console.log('🔍 [ESCALA] Scale final para Printify:', printifyScale);
        
        // Aplicar coordenadas calculadas no frontend
        finalX = imageAdjustments.x;
        finalY = imageAdjustments.y;
        finalScale = printifyScale; // ✅ USA A ESCALA CORRETA!
        finalAngle = imageAdjustments.rotation || 0;
        
        console.log('✅ [ESCALA] Coordenadas finais calculadas:', { finalX, finalY, finalScale, finalAngle });
        
      } catch (error) {
        console.error('❌ [ESCALA] Erro ao calcular escala:', error);
        // Fallback para configuração padrão
        finalScale = 1.0;
      }
      
    } else if (product.printAreasConfig && product.printAreasConfig.length > 0) {
      // Usar configuração padrão para produtos sem ajuste manual
      const printAreaConfig = product.printAreasConfig[0];
      finalX = printAreaConfig.defaultX;
      finalY = printAreaConfig.defaultY;
      finalScale = printAreaConfig.defaultScale;
      finalAngle = printAreaConfig.defaultAngle;
    }

    const productPrice = (product.basePrice || product.price || 25) * 100; // Preço em cêntimos
    
    const printifyProductPayload = {
      title: printifyProductTitle,
      description: `Custom product generated for user ${user.id} via PicTuz AI.`,
      blueprint_id: product.printifyBlueprintId,
      print_provider_id: product.printifyPrintProviderId,
      variants: [{
        id: targetVariantId, // Use a variante selecionada
        price: productPrice,
        is_enabled: true
      }],
      print_areas: [
        {
          variant_ids: [targetVariantId], // Use a variante selecionada
          placeholders: [
            {
              position: printArea,
              images: [{
                id: printifyImageId,
                x: finalX,
                y: finalY,
                scale: finalScale,
                angle: finalAngle
              }]
            }
          ]
        }
      ],
      // is_locked: false, // Opcional, pode ser 'true' durante o processamento
      // is_visible: false // Define se deve ser visível na tua loja Printify (provavelmente falso para mockups temporários)
    };

    console.log('📤 Payload for Printify product creation:', JSON.stringify(printifyProductPayload, null, 2));

    const printifyProductResponse = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
      method: 'POST',
      body: JSON.stringify(printifyProductPayload)
    });

    if (!printifyProductResponse || !printifyProductResponse.id) {
      console.error('Printify product creation response error:', printifyProductResponse);
      throw new Error('Failed to create Printify product for mockup generation.');
    }
    const createdPrintifyProductId = printifyProductResponse.id;
    console.log(`✅ STEP 3 Success: Printify product created. ID: ${createdPrintifyProductId}`);

    // PASSO 4: Polling dos Mockups do Produto Printify
    console.log('🔄 STEP 4: Polling Printify product for mockups...');
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
      printifyImageId: null, // ✅ Não fazemos upload, usamos SRC diretamente
      printifyProductId: createdPrintifyProductId, // Retornar o ID do produto Printify criado
      customerPrintifyImageId: logoImageId, // Retornar o ID da imagem do logo
      dynamicPhrasePrintifyImageId: selectedPhraseText, // Retornar o texto da frase
    });
    }

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
