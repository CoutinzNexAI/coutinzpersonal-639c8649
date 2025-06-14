// src/pages/api/printify/mockups/generate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getPrintifyProduct } from '@/lib/printify/printifyProducts';
import { printifyFetch } from '@/lib/printify/printifyApi';
import { PrintifyProduct, PrintifyImagePlaceholder } from '@/lib/printify/printifyTypes';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateDraftRequest {
  productId: string; // Nossa chave interna (ex: "canvas_200x200_square_slim_unframed")
  userImageUrl: string; // URL da imagem do utilizador
  userId: string; // ID do utilizador
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
}

interface CreateDraftResponse {
  success: boolean;
  previewUrls?: string[];
  printifyImageId?: string;
  printifyProductId?: string;
  error?: string;
  details?: string;
  debug?: Record<string, unknown>; // Para depuração temporária
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
    const { productId, userImageUrl, userId, imageAdjustments } = req.body;

    // Validações básicas
    if (!productId || !userImageUrl || !userId) {
      console.log("❌ ERRO: Campos obrigatórios em falta:", { 
        productId: !!productId, 
        userImageUrl: !!userImageUrl, 
        userId: !!userId 
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, userImageUrl, userId'
      });
    }

    // Buscar produto no nosso mapeamento
    const product = getPrintifyProduct(productId);
    if (!product || !product.printifyBlueprintId || !product.printifyPrintProviderId || !product.printifyVariantIds) {
      console.log("❌ ERROR: Product not found in Printify mapping or missing Printify IDs:", productId);
      return res.status(404).json({
        success: false,
        error: `Product not found in Printify mapping or missing Printify IDs: ${productId}`
      });
    }

    console.log(`✅ Product found in mapping: ${product.name} (Blueprint: ${product.printifyBlueprintId}, PP: ${product.printifyPrintProviderId})`);

    // PASSO 1.5: Obter Detalhes do Placeholder da Printify
    console.log('🔄 STEP 1.5: Fetching Printify blueprint variant details...');
    const printifyVariantsResponse = await printifyFetch(
      `/blueprints/${product.printifyBlueprintId}/print_providers/${product.printifyPrintProviderId}/variants.json`
    );

    const selectedPrintifyVariant = printifyVariantsResponse.variants.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (v: any) => v.id === product.printifyVariantIds![0] // Assume o primeiro variant ID mapeado
    );

    if (!selectedPrintifyVariant || !selectedPrintifyVariant.placeholders || selectedPrintifyVariant.placeholders.length === 0) {
      throw new Error('Printify variant or placeholders not found for the selected product.');
    }

    const printifyPlaceholder = selectedPrintifyVariant.placeholders.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.position === (product.printArea || 'front') // Usa o printArea da Gelato como "position"
    ) as PrintifyImagePlaceholder; // Cast para a interface

    if (!printifyPlaceholder) {
      throw new Error(`Printify placeholder not found for position: ${product.printArea || 'front'}`);
    }

    console.log('✅ Printify placeholder details:', printifyPlaceholder);

    // PASSO 2: Chamar generate-print-file.ts (passando o placeholder Printify)
    console.log('🔄 STEP 2: Generating print-ready file and uploading to Printify Media Library...');
    const generateFileResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/printify/generate-print-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: userImageUrl,
        productId: productId,
        userId: userId,
        imageAdjustments: product.supportsManualAdjustment ? imageAdjustments : undefined, // Passa ajustes se for produto manual
        printifyPlaceholder: printifyPlaceholder // PASSA O PLACEHOLDER AQUI
      })
    });

    if (!generateFileResponse.ok) {
      const errorData = await generateFileResponse.json();
      console.error("❌ ERROR: Failed to generate print file and upload to Printify:", errorData);
      throw new Error(`Print file generation failed: ${errorData.error}`);
    }

    const generateFileData = await generateFileResponse.json();
    const printifyImageId = generateFileData.printifyImageId;
    if (!printifyImageId) {
      throw new Error('Printify image ID not returned from generate-print-file.');
    }

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

    // Aqui é onde a tua lógica de adaptação de coordenadas da Gelato para Printify entra
    // Exemplo BÁSICO de cálculo de escala para "fit" a uma dimensão.
    // Precisarás de usar as dimensões da imagem original e do placeholder da Printify.
    // Para "meet" (caber tudo), ou "slice" (preencher), é mais complexo.
    // Pelo que vi no teu generate-print-file.ts, tu já fazes resize da imagem para a dimensão final.
    // Então, x=0.5, y=0.5, scale=1.0 deve ser um bom ponto de partida se a imagem já tiver o tamanho certo para o placeholder.
    // Se tiveres `imageAdjustments` no cartItem, terás de os converter para o formato x, y, scale, angle da Printify.
    // Por agora, vamos usar valores simples.
    const printifyProductPayload = {
      title: printifyProductTitle,
      description: `Custom product generated for user ${user.id} via PicTuz AI.`,
      blueprint_id: product.printifyBlueprintId,
      print_provider_id: product.printifyPrintProviderId,
      variants: product.printifyVariantIds!.map(variantId => ({
        id: variantId,
        price: product.price * 100, // Preço em cêntimos (temporário)
        is_enabled: true
      })),
      print_areas: [
        {
          variant_ids: product.printifyVariantIds,
          placeholders: [
            {
              position: product.printArea || 'front', // Assumindo que printArea da Gelato mapeia para position da Printify
              images: [{
                id: printifyImageId,
                x: printAreaX, // Calcular com base em GelatoPrintOffsetsMm e dimensoes Printify
                y: printAreaY, // Calcular
                scale: printAreaScale, // Calcular
                angle: printAreaAngle // Calcular
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
    //     await printifyFetch(`/shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdPrintifyProductId}.json`, { method: 'DELETE' });
    //     console.log('✅ Temporary Printify product deleted.');
    // } catch (deleteError) {
    //     console.warn('⚠️ WARNING: Failed to delete temporary Printify product:', deleteError);
    // }

    return res.status(200).json({
      success: true,
      previewUrls: finalPreviewUrls,
      printifyImageId: printifyImageId, // Retornar o ID da imagem na Printify Media Library
      printifyProductId: createdPrintifyProductId // Retornar o ID do produto Printify criado
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
