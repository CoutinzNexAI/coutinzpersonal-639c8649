// src/pages/api/printify/mockups/generate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getPrintifyProduct } from '@/lib/printify/printifyProducts';
import { printifyFetch } from '@/lib/printify/printifyApi';
import { PrintifyProduct, PrintifyImagePlaceholder } from '@/lib/printify/printifyTypes';
import generatePrintFileHandler from '@/pages/api/printify/generate-print-file';

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
    const { productId, userImageUrl, userId, imageAdjustments, selectedPrintifyVariantId, logoImageId, customerImageUrl, customerImageAdjustments, selectedPhraseText, phraseImageAdjustments } = req.body;

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
      `/catalog/blueprints/${product.printifyBlueprintId}/print_providers/${product.printifyPrintProviderId}/variants.json`
    );

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
    console.log('🎯 Target variant ID:', targetVariantId);

    const selectedPrintifyVariant = printifyVariantsResponse.variants.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (v: any) => v.id === targetVariantId
    );

    if (!selectedPrintifyVariant || !selectedPrintifyVariant.placeholders || selectedPrintifyVariant.placeholders.length === 0) {
      throw new Error('Printify variant or placeholders not found for the selected product.');
    }

    console.log('✅ Printify variant details:', selectedPrintifyVariant);

    // LÓGICA ESPECÍFICA PARA SWEAT DE CRIANÇA
    if (productId === 'custom_youth_hoodie') {
      console.log('🔄 Processing youth hoodie with multiple print areas...');

      // PASSO 1: Upload da imagem do cliente para Printify
      console.log('🔄 Uploading customer image to Printify...');
      const customerUploadResponse = await printifyFetch('/uploads/images.json', {
        method: 'POST',
        body: JSON.stringify({
          file_name: `customer-art-${Date.now()}.png`,
          url: customerImageUrl || userImageUrl
        })
      });

      if (!customerUploadResponse?.id) {
        throw new Error('Failed to upload customer image to Printify');
      }
      const customerPrintifyImageId = customerUploadResponse.id;
      console.log('✅ Customer image uploaded:', customerPrintifyImageId);

      // PASSO 2: Gerar e fazer upload da imagem da frase (se não for "Sem frase")
      let dynamicPhrasePrintifyImageId = '';
      
      if (selectedPhraseText && selectedPhraseText !== 'Sem frase') {
        console.log('🔄 Generating phrase image for:', selectedPhraseText);
        
        // Aqui implementarias a geração da imagem da frase
        // Por enquanto, usar um ID estático baseado na frase
        const phraseImageMapping: Record<string, string> = {
          'PicTuz - since 2025': '68548af2cc947707f0ee650f',
          'Criado com IA': '68548af3cc947707f0ee651a',
          'Arte Personalizada': '68548af4cc947707f0ee652b',
          'Feito em Portugal': '68548af5cc947707f0ee653c',
        };
        
        dynamicPhrasePrintifyImageId = phraseImageMapping[selectedPhraseText] || '68548b05a7a3520a5d3534c0';
        console.log('✅ Phrase image ID:', dynamicPhrasePrintifyImageId);
      } else {
        // "Sem frase" - usar imagem transparente
        dynamicPhrasePrintifyImageId = '68548b05a7a3520a5d3534c0';
        console.log('✅ Using transparent image for "no phrase"');
      }

      // PASSO 3: Obter placeholders para front e back
      const frontPlaceholder = selectedPrintifyVariant.placeholders.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p.position === 'front'
      );
      const backPlaceholder = selectedPrintifyVariant.placeholders.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p.position === 'back'
      );

      if (!frontPlaceholder || !backPlaceholder) {
        throw new Error('Front or back placeholder not found for youth hoodie');
      }

      // PASSO 4: Criar produto com múltiplas áreas de impressão
      console.log('🔄 Creating youth hoodie product with multiple print areas...');
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
                y: 0.5,
                scale: 0.85,
                angle: 0
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
                  scale: customerImageAdjustments?.scale || 1.0,
                  angle: customerImageAdjustments?.rotation || 0
                },
                {
                  id: dynamicPhrasePrintifyImageId, // Frase
                  x: phraseImageAdjustments?.x || 0.5,
                  y: phraseImageAdjustments?.y || 0.85, // Mais em baixo
                  scale: phraseImageAdjustments?.scale || 1.0,
                  angle: phraseImageAdjustments?.rotation || 0
                }
              ]
            }]
          }
        ]
      };

      console.log('📤 Creating youth hoodie product:', JSON.stringify(printifyProductPayload, null, 2));

      const printifyProductResponse = await printifyFetch(`/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
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
      let finalPreviewUrls: string[] = [];
      const maxAttempts = 15;
      const delayMs = 2000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔄 Attempt ${attempt}/${maxAttempts}: Checking mockup status...`);
        
        const productResponse = await printifyFetch(`/shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdPrintifyProductId}.json`);
        
        if (productResponse && productResponse.images && productResponse.images.length > 0) {
          finalPreviewUrls = productResponse.images
            .filter((img: { is_default: boolean }) => img.is_default)
            .map((img: { src: string }) => img.src);
          
          if (finalPreviewUrls.length > 0) {
            console.log(`✅ Mockups ready! Found ${finalPreviewUrls.length} preview(s)`);
            break;
          }
        }
        
        if (attempt < maxAttempts) {
          console.log(`⏳ Mockups not ready yet, waiting ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      if (finalPreviewUrls.length === 0) {
        console.log('⚠️ No mockups generated within timeout, but product was created successfully');
        finalPreviewUrls = [product.mockupInitialPath]; // Fallback para mockup inicial
      }

      // Retorna resposta específica para sweat de criança
      return res.status(200).json({
        success: true,
        previewUrls: finalPreviewUrls,
        printifyProductId: createdPrintifyProductId,
        customerPrintifyImageId: customerPrintifyImageId,
        dynamicPhrasePrintifyImageId: dynamicPhrasePrintifyImageId
      });
    }

    // LÓGICA PARA OUTROS PRODUTOS (código existente)
    const printArea = product.printAreasConfig?.[0]?.position || product.printArea || 'front';
    const printifyPlaceholder = selectedPrintifyVariant.placeholders.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.position === printArea
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
      status: (statusCode: number) => {
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

    // Lógica para calcular x, y, scale para Printify (baseado em gelatoPrintOffsetsMm e dimensões Printify)
    // Estes são cálculos complexos e precisarão de ser afinados
    const printAreaX = 0.5; // Placeholder temporário
    const printAreaY = 0.5; // Placeholder temporário
    const printAreaScale = 1.0; // Placeholder temporário
    const printAreaAngle = 0; // Placeholder temporário

    // Calcular coordenadas baseadas nos imageAdjustments (se disponível)
    let finalX = printAreaX;
    let finalY = printAreaY;
    let finalScale = printAreaScale;
    let finalAngle = printAreaAngle;

    if (imageAdjustments && product.supportsManualAdjustment) {
      finalX = imageAdjustments.x;
      finalY = imageAdjustments.y;
      finalScale = imageAdjustments.scale;
      finalAngle = imageAdjustments.rotation || 0;
    } else if (product.printAreasConfig && product.printAreasConfig.length > 0) {
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

    const printifyProductResponse = await printifyFetch(`/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
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
    const delay = 8000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`--> 🔍 Attempt ${attempt}/${maxAttempts}: Fetching Printify product ${createdPrintifyProductId} details...`);
      try {
        const getProductResponse: PrintifyProduct = await printifyFetch(`/shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdPrintifyProductId}.json`);

        if (getProductResponse.images && getProductResponse.images.length > 0) {
          console.log(`✅ SUCCESS in Printify product polling! Mockups found on attempt ${attempt}!`);
          finalPreviewUrls = getProductResponse.images.map(img => img.src).filter(Boolean) as string[];
          break;
        }
      } catch (pollError) {
        console.warn(`⚠️ WARNING: Error on Printify product polling attempt ${attempt}:`, pollError instanceof Error ? pollError.message : String(pollError));
      }

      if (attempt < maxAttempts) {
        console.log(`⏳ Printify product mockups not ready yet. Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
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
      printifyImageId: printifyImageId, // Retornar o ID da imagem na Printify Media Library
      printifyProductId: createdPrintifyProductId, // Retornar o ID do produto Printify criado
      customerPrintifyImageId: logoImageId, // Retornar o ID da imagem do logo
      dynamicPhrasePrintifyImageId: selectedPhraseText, // Retornar o texto da frase
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
