// src/pages/api/gelato/mockups/create-draft.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getGelatoProduct, GELATO_CONSTANTS } from '@/lib/gelato/gelatoProducts';
// Importa GELATO_API_BASE_ECOMMERCE_URL daqui (aqui está o erro, tinha de vir de 'gelatoApi')
import { gelatoFetch, createGelatoStoreProduct, GELATO_API_BASE_ECOMMERCE_URL } from '@/lib/gelato/gelatoApi'; // <-- Certifica-te que isto está bem

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateDraftRequest {
  productId: string; // Nossa chave interna (ex: "canvas_200x200_square_slim_unframed")
  userImageUrl: string; // URL da imagem do utilizador
  userId: string; // ID do utilizador
}

// Interface para a resposta da variante do Get Template API
interface GelatoVariantObject {
  id: string;
  title: string;
  // Adiciona outras propriedades se precisares delas para o teu 'product.templateVariantId'
  // productUid?: string;
  // variantOptions?: { name: string; value: string; }[];
  // imagePlaceholders?: { name: string; printArea: string; height: number; width: number; }[];
}

interface CreateDraftResponse {
  success: boolean;
  previewUrls?: string[];
  draftOrderId?: string;
  printFileUrl?: string;
  error?: string;
  details?: string; // Para informação adicional de debug
}

// Interfaces para resposta da Gelato API (polling)
interface GelatoPreview {
  url: string;
}

interface GelatoOrderItem {
  previews?: GelatoPreview[];
  mockups?: GelatoPreview[];
}

interface GelatoOrderData {
  id: string;
  items?: GelatoOrderItem[];
  previews?: GelatoPreview[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateDraftResponse>
) {
  // Pista inicial para sabermos que a função começou
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

    // Verificar GELATO_STORE_ID
    if (!process.env.GELATO_STORE_ID) {
      console.log("❌ ERRO: GELATO_STORE_ID não está configurado");
      return res.status(500).json({
        success: false,
        error: 'GELATO_STORE_ID not configured'
      });
    }

    // Verificar autenticação do utilizador
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

    // Validações básicas
    if (!productId || !userImageUrl || !userId) {
      console.log("❌ ERRO: Campos obrigatórios em falta:", { productId: !!productId, userImageUrl: !!userImageUrl, userId: !!userId });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, userImageUrl, userId'
      });
    }

    // Buscar produto no nosso mapeamento
    const product = getGelatoProduct(productId);
    if (!product) {
      console.log("❌ ERRO: Produto não encontrado:", productId);
      return res.status(404).json({
        success: false,
        error: `Product not found: ${productId}`
      });
    }

    console.log(`✅ Produto encontrado: ${product.name} (${product.productUid})`);

    // --- CÓDIGO TEMPORÁRIO PARA OBTER DETALHES DO TEMPLATE ---
    console.log(`🔄 A buscar detalhes do template: ${product.gelatoTemplateId}`);
    try {
      // CORREÇÃO: Passar o URL COMPLETO com a base de ECOMMERCE para gelatoFetch
      const templateDetails = await gelatoFetch(
        `${GELATO_API_BASE_ECOMMERCE_URL}/v1/templates/${product.gelatoTemplateId}`,
        { method: 'GET' }
      );
      console.log('📄 Detalhes completos do template Gelato:', JSON.stringify(templateDetails, null, 2));

      // Usar a interface 'GelatoVariantObject'
      const expectedTemplateVariantId = product.templateVariantId;
      const foundVariant = (templateDetails.variants as GelatoVariantObject[]).find(
        (v: GelatoVariantObject) => v.id === expectedTemplateVariantId
      );

      if (!foundVariant) {
        console.warn(`⚠️ AVISO: A variante com ID ${expectedTemplateVariantId} NÃO foi encontrada no template ${product.gelatoTemplateId}`);
      } else {
        console.log(`✅ A variante ${expectedTemplateVariantId} foi encontrada no template.`);
      }

    } catch (templateError) {
      console.error('❌ ERRO ao buscar detalhes do template Gelato:', templateError);
    }
    // --- FIM DO CÓDIGO TEMPORÁRIO ---

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
        // Sem imageAdjustments para produtos automáticos (Canvas, T-shirt, Poster)
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

    // PASSO 1.5: Criar produto na loja Gelato (para ativar Mirror Wrap e múltiplos mockups 3D)
    console.log('🔄 PASSO 1.5: A criar produto na loja Gelato...');

    try {
      const productCreationPayload = {
        templateId: product.gelatoTemplateId!, // Usar o templateId do produto
        title: `Custom Canvas ${user.id}-${Date.now()}`, // Título único
        description: `Canvas personalizado criado para o utilizador ${user.id}`,
        isVisibleInTheOnlineStore: false, // Não visível na loja por ser para draft/teste
        variants: [
          {
            templateVariantId: product.templateVariantId!, // Usar o templateVariantId correto do nosso mapeamento
            imagePlaceholders: [
              {
                name: product.printArea!, // Usar printArea do produto
                fileUrl: printFileData.printFileUrl,
                fitMethod: 'slice' as const // 'meet' = fit completo, 'slice' = crop/zoom
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

      const storeProductResponse = await createGelatoStoreProduct(productCreationPayload);
      console.log('✅ SUCESSO no Passo 1.5: Produto criado na loja Gelato:', storeProductResponse);

    } catch (storeProductError) {
      // Registar o erro mas permitir que o processo continue
      console.warn('⚠️ AVISO: Falha na criação do produto na loja Gelato (processo continua):', storeProductError);
      console.warn('⚠️ Detalhes:', storeProductError instanceof Error ? storeProductError.message : String(storeProductError));
    }

    // PASSO 2: Criar Draft Order na Gelato
    console.log('🔄 PASSO 2: A criar o Draft Order na Gelato...');

    const orderReferenceId = `${GELATO_CONSTANTS.DRAFT_ORDER_PREFIX}-${productId}-${user.id}-${Date.now()}`;

    const draftOrderPayload = {
      orderType: 'draft',
      orderReferenceId: orderReferenceId,
      customerReferenceId: user.id, // Usar user.id em vez de userId
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
          itemReferenceId: `item-${productId}-${user.id}-${Date.now()}`, // Mais único
          productUid: product.productUid,
          quantity: 1,
          files: [
            {
              type: 'default', // Para canvas, posters, t-shirts
              url: printFileData.printFileUrl,
              fitMethod: 'slice' as const // <--- ADICIONA ESTA LINHA AQUI!
            }
          ]
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

    // IMPORTANTE: Só extrair o ID da resposta do POST, ignorar tudo o resto!
    if (!draftOrderResponse || !draftOrderResponse.id) {
      console.log("❌ ERRO: Resposta do Draft Order não tem ID:", draftOrderResponse);
      throw new Error(`Draft order creation failed: No ID in response`);
    }

    const draftOrderId = draftOrderResponse.id; // Só precisamos do ID daqui!
    console.log('✅ SUCESSO no Passo 2: Draft Order criado. ID:', draftOrderId);

    // PASSO 3: POLLING para buscar mockups (aguardar que Gelato os processe)
    console.log('🔄 PASSO 3: A iniciar polling para buscar os mockups...');

    // Variável para guardar os URLs finais quando os encontrarmos
    let finalPreviewUrls: string[] = [];
    const maxAttempts = 15; // 15 tentativas (aumentado para dar mais tempo)
    const delay = 8000; // 8 segundos entre tentativas (aumentado para polling mais generoso)

    // LOOP DE POLLING - só faz GETs
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`--> 🔍 Tentativa de polling ${attempt}/${maxAttempts}: A buscar detalhes da ordem ${draftOrderId}...`);

      try {
        // FAZ O GET USANDO O ID DO RASCUNHO
        const getResponse = await gelatoFetch(`/v4/orders/${draftOrderId}`, {
          method: 'GET'
        });

        console.log(`--> 📨 Resposta GET tentativa ${attempt}:`, JSON.stringify(getResponse, null, 2));

        // PROCURA OS PREVIEWS NA RESPOSTA DO GET, NÃO DO POST!
        const previewsInResponse = getResponse?.items?.[0]?.previews;
        console.log(`--> 🔍 Previews encontrados na tentativa ${attempt}:`, previewsInResponse);

        if (previewsInResponse && Array.isArray(previewsInResponse) && previewsInResponse.length > 0) {
          console.log(`✅ SUCESSO no Polling! Mockups encontrados na tentativa ${attempt}!`);
          finalPreviewUrls = previewsInResponse.map((p: GelatoPreview) => p.url).filter(Boolean); // Guarda os URLs
          console.log(`✅ URLs finais extraídos:`, finalPreviewUrls);
          break; // Encontrámos, por isso saímos do loop
        }

        // Se não encontrámos, esperamos antes de tentar de novo
        if (attempt < maxAttempts) {
          console.log(`⏳ Mockups ainda não estão prontos. A aguardar ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        console.error(`❌ ERRO na tentativa de polling ${attempt}:`, error);
        console.error(`❌ Detalhes do erro:`, error instanceof Error ? error.message : String(error));

        // Se é a última tentativa, continuar para resposta de fallback
        if (attempt === maxAttempts) {
          console.warn('⚠️ Todas as tentativas de polling falharam, continuando com fallback');
          break;
        }

        // Aguardar antes da próxima tentativa mesmo em caso de erro
        console.log(`⏳ Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`🏁 Polling completado. Encontrados ${finalPreviewUrls.length} URLs de preview.`);

    // VERIFICAR RESULTADO DO POLLING
    console.log('🔄 PASSO 4: A enviar resposta para o frontend...');

    if (finalPreviewUrls.length > 0) {
      // Se chegámos aqui, temos os mockups! Responde ao frontend com sucesso.
      console.log('✅ SUCESSO COMPLETO: Enviando resposta com mockups da Gelato');
      return res.status(200).json({
        success: true,
        previewUrls: finalPreviewUrls,
        draftOrderId: draftOrderId,
        printFileUrl: printFileData.printFileUrl
      });
    } else {
      // Se o loop terminou sem encontrar nada, retorna sucesso parcial (não erro crítico)
      console.warn('⚠️ TIMEOUT: Falha ao obter os mockups da Gelato a tempo - usando fallback');
      return res.status(200).json({
        success: true,
        previewUrls: [], // Array vazio - frontend usará fallback local
        draftOrderId: draftOrderId,
        printFileUrl: printFileData.printFileUrl
      });
    }

  } catch (error) {
    // Se qualquer um dos passos acima falhar, o erro será apanhado e registado aqui!
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