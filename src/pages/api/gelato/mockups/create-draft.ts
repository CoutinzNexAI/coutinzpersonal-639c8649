import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getGelatoProduct, GELATO_CONSTANTS } from '@/lib/gelato/gelatoProducts';
import { gelatoFetch } from '@/lib/gelato/gelatoApi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateDraftRequest {
  productId: string; // Nossa chave interna (ex: "canvas_200x200_square_slim_unframed")
  userImageUrl: string; // URL da imagem do utilizador
  userId: string; // ID do utilizador
}

interface CreateDraftResponse {
  success: boolean;
  previewUrls?: string[];
  draftOrderId?: string;
  printFileUrl?: string;
  error?: string;
  details?: string; // Para informação adicional de debug
}

// Interfaces para resposta da Gelato API
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

    // PASSO 2: Criar Draft Order na Gelato
    console.log('🔄 PASSO 2: A criar o Draft Order na Gelato...');

    const orderReferenceId = `${GELATO_CONSTANTS.DRAFT_ORDER_PREFIX}-${productId}-${userId}-${Date.now()}`;
    
    const draftOrderPayload = {
      orderType: 'draft',
      orderReferenceId: orderReferenceId,
      customerReferenceId: userId,
      "currency": "EUR", // <-- ADICIONADO! (ou USD, etc.)
      items: [
        {
          "itemReferenceId": "item-draft-1", 
          productUid: product.productUid,
          quantity: 1,
          files: [
            {
              type: 'default', // Para canvas, posters, t-shirts
              url: printFileData.printFileUrl,
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
    const maxAttempts = 10; // 10 tentativas (60 segundos total) - baseado no teu teste manual
    const delay = 6000; // 6 segundos entre tentativas (mais generoso para Gelato)

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