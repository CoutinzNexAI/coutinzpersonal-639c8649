// src/pages/api/gelato/mockups/create-draft.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getGelatoProduct, GELATO_CONSTANTS } from '@/lib/gelato/gelatoProducts';
import { gelatoFetch, createGelatoStoreProduct, GELATO_API_BASE_ECOMMERCE_URL } from '@/lib/gelato/gelatoApi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateDraftRequest {
  productId: string; // Nossa chave interna (ex: "canvas_200x200_square_slim_unframed")
  userImageUrl: string; // URL da imagem do utilizador
  userId: string; // ID do utilizador
}

// Interfaces para resposta da Gelato API (polling e outros)
interface GelatoPreview {
  url: string;
}

interface GelatoOrderItem {
  previews?: GelatoPreview[];
  mockups?: GelatoPreview[];
  files?: { url: string, type: string, fitMethod?: string }[];
  processedFileUrl?: string;
}

interface GelatoOrderData {
  id: string;
  items?: GelatoOrderItem[];
  previews?: GelatoPreview[];
}

// Atualiza GelatoStoreProductResponse para incluir 'status', 'isReadyToPublish' e 'publishedAt'
interface GelatoStoreProductResponse {
  id: string;
  title: string;
  status: 'created' | 'publishing' | 'active' | 'publishing_error';
  isReadyToPublish?: boolean;
  variants?: { id: string; title: string; productUid: string }[];
  publishedAt?: string | null; // Adicionado para verificar quando o produto está realmente publicado
  [key: string]: unknown;
}

interface CreateDraftResponse {
  success: boolean;
  previewUrls?: string[];
  draftOrderId?: string;
  printFileUrl?: string;
  error?: string;
  details?: string; // Para informação adicional de debug
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateDraftResponse>
) {
  console.log("--- [INÍCIO] /api/gelato/mockups/create-draft ---");
  console.log("Request method:", req.method);
  console.log("Request body keys:", Object.keys(req.body || {}));

  if (req.method !== 'POST') {
    console.log("❌ ERRO: Método não permitido:", req.method);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    console.log("🔐 PASSO 0: A verificar autenticação...");

    if (!process.env.GELATO_STORE_ID) {
      console.log("❌ ERRO: GELATO_STORE_ID não está configurado");
      return res.status(500).json({
        success: false,
        error: 'GELATO_STORE_ID not configured'
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("❌ ERRO: Token de autorização em falta");
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - missing token'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log("❌ ERRO: Token inválido:", error?.message);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - invalid token'
      });
    }

    console.log("✅ Autenticação bem-sucedida. User ID:", user.id);

    const { productId, userImageUrl, userId }: CreateDraftRequest = req.body;
    console.log("📋 Dados recebidos:", { productId, userImageUrl: userImageUrl?.substring(0, 50) + '...', userId });

    if (!productId || !userImageUrl || !userId) {
      console.log("❌ ERRO: Campos obrigatórios em falta:", { productId: !!productId, userImageUrl: !!userImageUrl, userId: !!userId });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, userImageUrl, userId'
      });
    }

    const product = getGelatoProduct(productId);
    if (!product) {
      console.log("❌ ERRO: Produto não encontrado:", productId);
      return res.status(404).json({
        success: false,
        error: `Product not found: ${productId}`
      });
    }

    console.log(`✅ Produto encontrado: ${product.name} (${product.productUid})`);

    // PASSO 1: Gerar ficheiro de impressão de alta resolução
    console.log('🔄 PASSO 1: A gerar o ficheiro de impressão...');

    const printFileResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/gelato/generate-print-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: userImageUrl,
        productId: productId,
        userId: userId
      })
    });

    if (!printFileResponse.ok) {
      console.log("❌ ERRO: Falha na chamada generate-print-file. Status:", printFileResponse.status);
      throw new Error('Failed to generate print file');
    }

    const printFileData = await printFileResponse.json();
    console.log("📄 Resposta generate-print-file:", printFileData);

    if (!printFileData.success || !printFileData.printFileUrl) {
      console.log("❌ ERRO: Geração do ficheiro de impressão falhou:", printFileData.error);
      throw new Error(`Print file generation failed: ${printFileData.error}`);
    }

    console.log('✅ SUCESSO no Passo 1: Ficheiro gerado:', printFileData.printFileUrl.substring(0, 80) + '...');

    // PASSO 1.5: Criar produto na loja Gelato
    console.log('🔄 PASSO 1.5: A criar produto na loja Gelato...');

    let createdStoreProductId: string | undefined;
    let createdStoreProductVariantId: string | undefined;

    try {
      const productCreationPayload = {
        templateId: product.gelatoTemplateId!,
        title: `Custom Canvas ${user.id}-${Date.now()}`,
        description: `Canvas personalizado criado para o utilizador ${user.id}`,
        isVisibleInTheOnlineStore: false,
        variants: [
          {
            templateVariantId: product.templateVariantId!,
            imagePlaceholders: [
              {
                name: product.printArea!,
                fileUrl: printFileData.printFileUrl,
                fitMethod: 'slice' as const
              }
            ],
            position: 1
          }
        ],
        tags: ['custom', 'canvas', 'photoia'],
        productType: 'Canvas',
        vendor: 'PhotoIA'
      };

      console.log('📤 Payload para criação do produto:', JSON.stringify(productCreationPayload, null, 2));

      const storeProductInitialResponse: GelatoStoreProductResponse = await createGelatoStoreProduct(productCreationPayload);
      console.log('✅ SUCESSO inicial no Passo 1.5: Produto criado na loja Gelato (resposta inicial):', storeProductInitialResponse);

      // --- NOVO PASSO: POLLING PARA O PRODUTO DA LOJA ATÉ FICAR PRONTO E PUBLICADO ---
      console.log('🔄 PASSO 1.6: A iniciar polling para confirmar que o produto da loja está pronto e publicado...');
      const maxStoreProductAttempts = 20; // Aumentado para dar mais tempo para publicação
      const storeProductDelay = 10000; // Aumentado o delay para 10 segundos

      let storeProductReadyResponse: GelatoStoreProductResponse | undefined;

      for (let attempt = 1; attempt <= maxStoreProductAttempts; attempt++) {
        console.log(`--> 🔍 Tentativa de polling do produto da loja ${attempt}/${maxStoreProductAttempts}: A buscar detalhes do produto ${storeProductInitialResponse.id}...`);

        try {
          const getStoreProductResponse: GelatoStoreProductResponse = await gelatoFetch(
            `${GELATO_API_BASE_ECOMMERCE_URL}/v1/stores/${process.env.GELATO_STORE_ID}/products/${storeProductInitialResponse.id}`,
            { method: 'GET' }
          );

          console.log(`--> 📨 Resposta GET do produto da loja tentativa ${attempt}:`, JSON.stringify(getStoreProductResponse, null, 2));

          // Condição de sucesso: Variantes preenchidas E status é 'active' E publishedAt não é null
          if (
            getStoreProductResponse.variants && getStoreProductResponse.variants.length > 0 &&
            getStoreProductResponse.status === 'active' &&
            getStoreProductResponse.publishedAt !== null && getStoreProductResponse.publishedAt !== undefined
          ) {
            console.log(`✅ SUCESSO no Polling do produto da loja! Variantes, status 'active' E 'publishedAt' encontrados na tentativa ${attempt}!`);
            storeProductReadyResponse = getStoreProductResponse;
            break;
          } else if (getStoreProductResponse.status === 'publishing_error') {
            console.error(`❌ ERRO: Produto da loja com status 'publishing_error'. Não é possível continuar.`);
            throw new Error('Store product publishing failed.');
          }
        } catch (pollError) {
          console.warn(`⚠️ AVISO: Erro na tentativa de polling do produto da loja ${attempt}:`, pollError instanceof Error ? pollError.message : String(pollError));
        }

        if (attempt < maxStoreProductAttempts) {
          console.log(`⏳ Produto da loja ainda não está 'active' e/ou publicado. A aguardar ${storeProductDelay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, storeProductDelay));
        }
      }

      if (storeProductReadyResponse && storeProductReadyResponse.variants && storeProductReadyResponse.variants.length > 0) {
        createdStoreProductId = storeProductReadyResponse.id;
        createdStoreProductVariantId = storeProductReadyResponse.variants[0].id;
        console.log(`✅ IDs do produto da loja capturados APÓS POLLING: ProductId=${createdStoreProductId}, VariantId=${createdStoreProductVariantId}`);
      } else {
        console.warn('⚠️ AVISO: Não foi possível obter as variantes, status "active" ou "publishedAt" do produto da loja após polling. A ordem será criada com productUid (sem mirror wrap).');
        // Se a criação da ordem for *impossível* sem o storeProductId/VariantId, lança um erro aqui.
      }
      // --- FIM DO NOVO PASSO DE POLLING ---


    } catch (storeProductError) {
      console.warn('⚠️ AVISO: Falha na criação do produto na loja Gelato (processo continua). A ordem será criada com productUid (sem mirror wrap).', storeProductError);
      console.warn('⚠️ Detalhes:', storeProductError instanceof Error ? storeProductError.message : String(storeProductError));
    }

    // PASSO 2: Criar Draft Order na Gelato
    console.log('🔄 PASSO 2: A criar o Draft Order na Gelato...');

    const orderReferenceId = `${GELATO_CONSTANTS.DRAFT_ORDER_PREFIX}-${productId}-${user.id}-${Date.now()}`;

    const draftOrderPayload = {
      orderType: 'draft',
      orderReferenceId: orderReferenceId,
      customerReferenceId: user.id,
      currency: "EUR",
      shippingAddress: {
        firstName: "Test",
        lastName: "User",
        companyName: "",
        addressLine1: "Rua de Teste, 123",
        addressLine2: "",
        city: "Lisboa",
        postCode: "1000-001",
        state: "",
        country: "PT",
        email: "test@example.com",
        phone: "+351912345678"
      },
      returnAddress: {
        firstName: "PhotoIA",
        lastName: "Store",
        companyName: "PhotoIA",
        addressLine1: "Rua PhotoIA, 456",
        addressLine2: "",
        city: "Porto",
        postCode: "4000-001",
        state: "",
        country: "PT",
        email: "returns@photoia.com",
        phone: "+351912345679"
      },
      items: [
        {
          itemReferenceId: `item-${productId}-${user.id}-${Date.now()}`,
          quantity: 1,
          files: [
            {
              type: 'default',
              url: printFileData.printFileUrl,
              fitMethod: 'slice' as const
            }
          ],
          // Ligar o item da order ao produto da loja criado no PASSO 1.5 APÓS POLLING
          ...(createdStoreProductId && createdStoreProductVariantId ? {
              storeProductId: createdStoreProductId,
              storeProductVariantId: createdStoreProductVariantId,
          } : {
              // Fallback: se o polling do produto da loja falhar, usa o productUid diretamente.
              productUid: product.productUid,
          }),
        }
      ]
    };

    console.log('📤 Payload para Gelato:', JSON.stringify(draftOrderPayload, null, 2));

    const draftOrderResponse = await gelatoFetch('/v4/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftOrderPayload)
    });

    console.log('📨 Resposta do Draft Order POST recebida');
    console.log('📨 Resposta completa:', JSON.stringify(draftOrderResponse, null, 2));

    if (!draftOrderResponse || !draftOrderResponse.id) {
      console.log("❌ ERRO: Resposta do Draft Order não tem ID:", draftOrderResponse);
      throw new Error(`Draft order creation failed: No ID in response`);
    }

    const draftOrderId = draftOrderResponse.id;
    console.log('✅ SUCESSO no Passo 2: Draft Order criado. ID:', draftOrderId);

    // PASSO 3: POLLING para buscar mockups da ORDEM
    console.log('🔄 PASSO 3: A iniciar polling para buscar os mockups da ordem...');

    let finalPreviewUrls: string[] = [];
    const maxAttempts = 15;
    const delay = 8000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`--> 🔍 Tentativa de polling da ordem ${attempt}/${maxAttempts}: A buscar detalhes da ordem ${draftOrderId}...`);

      try {
        const getResponse = await gelatoFetch(`/v4/orders/${draftOrderId}`, {
          method: 'GET'
        });

        console.log(`--> 📨 Resposta GET tentativa ${attempt}:`, JSON.stringify(getResponse, null, 2));

        const previewsInResponse = getResponse?.items?.[0]?.previews;
        console.log(`--> 🔍 Previews da ordem encontrados na tentativa ${attempt}:`, previewsInResponse);

        if (previewsInResponse && Array.isArray(previewsInResponse) && previewsInResponse.length > 0) {
          console.log(`✅ SUCESSO no Polling da ordem! Mockups da ordem encontrados na tentativa ${attempt}!`);
          finalPreviewUrls = previewsInResponse.map((p: GelatoPreview) => p.url).filter(Boolean);
          console.log(`✅ URLs finais de previews da ordem extraídos:`, finalPreviewUrls);
          break;
        }

        if (attempt < maxAttempts) {
          console.log(`⏳ Mockups da ordem ainda não estão prontos. A aguardar ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        console.error(`❌ ERRO na tentativa de polling da ordem ${attempt}:`, error);
        console.error(`❌ Detalhes do erro:`, error instanceof Error ? error.message : String(error));

        if (attempt === maxAttempts) {
          console.warn('⚠️ Todas as tentativas de polling da ordem falharam, continuando com fallback');
          break;
        }

        console.log(`⏳ Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`🏁 Polling da ordem completado. Encontrados ${finalPreviewUrls.length} URLs de preview.`);

    console.log('🔄 PASSO 4: A enviar resposta para o frontend...');

    if (finalPreviewUrls.length > 0) {
      console.log('✅ SUCESSO COMPLETO: Enviando resposta com mockups da Gelato');
      return res.status(200).json({
        success: true,
        previewUrls: finalPreviewUrls,
        draftOrderId: draftOrderId,
        printFileUrl: printFileData.printFileUrl
      });
    } else {
      console.warn('⚠️ TIMEOUT: Falha ao obter os mockups da Gelato a tempo - usando fallback');
      return res.status(200).json({
        success: true,
        previewUrls: [],
        draftOrderId: draftOrderId,
        printFileUrl: printFileData.printFileUrl
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