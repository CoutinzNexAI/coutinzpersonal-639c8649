// src/pages/api/printify/mockups/generate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getPrintifyProduct } from '@/lib/printify/printifyProducts';
import { printifyFetch } from '@/lib/printify/printifyApi';
import { PrintifyProduct, PrintifyImagePlaceholder } from '@/lib/printify/printifyTypes';
import generatePrintFileHandler from '@/pages/api/printify/generate-print-file';
import { generatePhraseImage } from '@/utils/imageUtils';

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
  console.log("🚀 [API] Printify Mockups Generate - Starting");
  
  // Suporte para OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log("❌ ERRO: Método não permitido:", req.method);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // 🔐 Verificação de configuração básica
    if (!process.env.PRINTIFY_SHOP_ID) {
      console.log("❌ ERRO: PRINTIFY_SHOP_ID não está configurado");
      return res.status(500).json({
        success: false,
        error: 'PRINTIFY_SHOP_ID not configured'
      });
    }

    // 📋 Extrair e validar dados do request
    const { 
      productId, 
      userImageUrl, 
      userId, 
      imageAdjustments, 
      selectedPrintifyVariantId, 
      logoImageId, 
      customerImageUrl, 
      customerImageAdjustments, 
      selectedPhraseText, 
      phraseImageAdjustments, 
      printifyImageId 
    } = req.body;

    // Para sweat de criança, usar customerImageUrl; para outros produtos, usar userImageUrl
    const imageUrl = productId === 'custom_youth_hoodie' ? customerImageUrl : userImageUrl;

    console.log("📋 Processando produto:", { 
      productId, 
      userId,
      hasImageUrl: !!imageUrl,
      isYouthHoodie: productId === 'custom_youth_hoodie'
    });

    // ✅ Validações básicas
    if (!productId || !imageUrl || !userId) {
      console.log("❌ ERRO: Campos obrigatórios em falta");
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, imageUrl, userId'
      });
    }

    // 🎯 Validação específica para capas de telemóvel
    if (productId === 'custom_phone_case' && !selectedPrintifyVariantId) {
      console.log("❌ ERRO: selectedPrintifyVariantId é obrigatório para capas de telemóvel");
      return res.status(400).json({
        success: false,
        error: 'selectedPrintifyVariantId é obrigatório para capas de telemóvel.'
      });
    }

    // 👕 Validação específica para sweat de criança
    if (productId === 'custom_youth_hoodie') {
      if (!selectedPrintifyVariantId || !logoImageId || !selectedPhraseText) {
        console.log("❌ ERRO: Campos obrigatórios para sweat de criança em falta");
        return res.status(400).json({
          success: false,
          error: 'Para sweat de criança são obrigatórios: selectedPrintifyVariantId, logoImageId, selectedPhraseText'
        });
      }
    }

    // 🔍 Buscar produto no nosso mapeamento
    const product = getPrintifyProduct(productId);
    if (!product || !product.printifyBlueprintId || !product.printifyPrintProviderId) {
      console.log("❌ ERROR: Product not found in Printify mapping:", productId);
      return res.status(404).json({
        success: false,
        error: `Product not found in Printify mapping: ${productId}`
      });
    }

    // ✅ Verificar se tem variants
    const hasVariants = (product.variants && product.variants.length > 0) || 
                       (product.printifyVariantIds && product.printifyVariantIds.length > 0);
    if (!hasVariants) {
      console.log("❌ ERROR: Product has no variants:", productId);
      return res.status(404).json({
        success: false,
        error: `Product has no variants configured: ${productId}`
      });
    }

    console.log(`✅ Product found: ${product.name} (Blueprint: ${product.printifyBlueprintId})`);

    // 🔄 Obter detalhes das variantes da Printify
    console.log('🔄 Fetching Printify blueprint variant details...');
    const printifyVariantsResponse = await printifyFetch(
      `/catalog/blueprints/${product.printifyBlueprintId}/print_providers/${product.printifyPrintProviderId}/variants.json?show-out-of-stock=1`
    );

    // 🎯 Determinar qual variante usar
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
      console.error('❌ Variant not found! Available variant IDs:', 
        printifyVariantsResponse.variants.map((v: PrintifyVariant) => v.id)
      );
      throw new Error(`Printify variant with ID ${targetVariantId} not found`);
    }

    if (!selectedPrintifyVariant.placeholders || selectedPrintifyVariant.placeholders.length === 0) {
      throw new Error('Printify variant placeholders not found for the selected product.');
    }

    console.log('✅ Printify variant details obtained');

    // 👕 LÓGICA ESPECÍFICA PARA SWEAT DE CRIANÇA
    if (productId === 'custom_youth_hoodie') {
      console.log('🔄 Processing youth hoodie with multiple print areas...');

      return await handleYouthHoodie({
        selectedPrintifyVariant,
        customerImageUrl: customerImageUrl || userImageUrl,
        userId,
        customerImageAdjustments,
        selectedPhraseText,
        logoImageId,
        productId,
        res
      });
    } else if (productId === 'custom_canvas' || productId === 'framed_canvas' ||
               productId === 'poster_horizontal_semi_glossy' || productId === 'poster_vertical_semi_glossy') {
      // LÓGICA ESPECÍFICA PARA CANVAS/POSTER
      console.log(`🔄 Processing Canvas/Poster product: ${productId}`);

      // Para Canvas, sempre fazer upload da imagem primeiro se não temos printifyImageId
      let finalPrintifyImageId = printifyImageId;
      
      if (!finalPrintifyImageId && userImageUrl) {
        console.log('🔄 Canvas: Fazendo upload da imagem para Printify primeiro...');
        
        try {
          // Upload direto para Printify sem chamada HTTP interna
          const fileName = `canvas_image_${Date.now()}.jpg`;
          
          // Fazer download da imagem
          const imageResponse = await fetch(userImageUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
          }
          
          const imageBuffer = await imageResponse.arrayBuffer();
          const imageBase64 = Buffer.from(imageBuffer).toString('base64');
          
          // Upload para Printify
          const uploadPayload = {
            file_name: fileName,
            contents: imageBase64
          };
          
          const printifyUploadResponse = await printifyFetch(`/uploads/images.json`, {
            method: 'POST',
            body: JSON.stringify(uploadPayload)
          });
          
          if (printifyUploadResponse && printifyUploadResponse.id) {
            finalPrintifyImageId = printifyUploadResponse.id;
            console.log('✅ Canvas: Imagem carregada para Printify com ID:', finalPrintifyImageId);
          } else {
            throw new Error('Printify upload response invalid or missing ID');
          }
        } catch (uploadError) {
          console.error('❌ Erro no upload da imagem para Printify:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      // Agora validar que temos printifyImageId
      if (!finalPrintifyImageId) {
        console.log('❌ [ERROR] printifyImageId é obrigatório para Canvas/Poster products');
        throw new Error('printifyImageId is required for Canvas/Poster products');
      }

      const printAreaConfig = product.printAreasConfig?.[0];
      if (!printAreaConfig) {
        throw new Error('Print area configuration not found for Canvas product');
      }

      // Criar produto temporário na Printify para gerar mockup
      const printifyProductPayload = {
        title: `PicTuz Canvas Mockup (${userId}-${Date.now()})`,
        description: 'Temporary Canvas product for mockup generation',
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
              id: finalPrintifyImageId,
              x: imageAdjustments?.x || printAreaConfig.defaultX,
              y: imageAdjustments?.y || printAreaConfig.defaultY,
              scale: imageAdjustments?.scale || printAreaConfig.defaultScale,
              angle: imageAdjustments?.rotation || printAreaConfig.defaultAngle
            }]
          }]
          // *** REMOVIDO print_details DAQUI - agora está no nível superior ***
        }]
      };

      console.log(`📤 ${productId} payload:`, JSON.stringify(printifyProductPayload, null, 2));

      const printifyProductResponse = await printifyFetch(`/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
        method: 'POST',
        body: JSON.stringify(printifyProductPayload)
      });

      if (!printifyProductResponse?.id) {
        throw new Error('Failed to create Canvas product on Printify');
      }

      const createdProductId = printifyProductResponse.id;
      console.log(`✅ Canvas product created with ID: ${createdProductId}`);

      // Polling para obter mockups
      let finalPreviewUrls: string[] = [];
      const maxAttempts = 15;
      const delayMs = 8000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`--> 🔍 Canvas polling attempt ${attempt}/${maxAttempts}...`);
        
        try {
          const getProductResponse: PrintifyProduct = await printifyFetch(`/shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdProductId}.json`);

          if (getProductResponse.images && getProductResponse.images.length > 0) {
            console.log(`✅ Canvas mockups ready! Found ${getProductResponse.images.length} preview(s) - ALL mockup views included`);
            finalPreviewUrls = getProductResponse.images.map(img => img.src) as string[];
            break;
          }
        } catch (pollError) {
          console.warn(`⚠️ Canvas polling attempt ${attempt} failed:`, pollError);
        }

        if (attempt < maxAttempts) {
          console.log(`⏳ Canvas mockups not ready yet. Waiting ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      console.log(`🏁 Canvas mockup polling completed. Found ${finalPreviewUrls.length} preview URLs.`);

      return res.status(200).json({
        success: true,
        previewUrls: finalPreviewUrls.length > 0 ? finalPreviewUrls : [product.mockupInitialPath],
        printifyImageId: finalPrintifyImageId,
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
    const printifyProductTitle = `PicTuz Custom ${product.name} (${userId}-${Date.now()})`;

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
      description: `Custom product generated for user ${userId} via PicTuz AI.`,
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
    const delayMs = 8000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`--> 🔍 Attempt ${attempt}/${maxAttempts}: Fetching Printify product ${createdPrintifyProductId} details...`);
      try {
        const getProductResponse: PrintifyProduct = await printifyFetch(`/shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdPrintifyProductId}.json`);

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
      printifyImageId: printifyImageId, // Retornar o ID da imagem na Printify Media Library
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
