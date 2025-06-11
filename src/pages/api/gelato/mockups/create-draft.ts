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
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Verificar autenticação do utilizador
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized - missing token' 
      });
    }
    
    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized - invalid token' 
      });
    }

    const { productId, userImageUrl, userId }: CreateDraftRequest = req.body;

    // Validações básicas
    if (!productId || !userImageUrl || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, userImageUrl, userId'
      });
    }

    // Buscar produto no nosso mapeamento
    const product = getGelatoProduct(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product not found: ${productId}`
      });
    }

    console.log(`Creating draft order for product: ${product.name}`);

    // PASSO 1: Gerar ficheiro de impressão de alta resolução
    console.log('Step 1: Generating print file...');
    
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
      throw new Error('Failed to generate print file');
    }

    const printFileData = await printFileResponse.json();
    
    if (!printFileData.success || !printFileData.printFileUrl) {
      throw new Error(`Print file generation failed: ${printFileData.error}`);
    }

    console.log('Print file generated:', printFileData.printFileUrl);

    // PASSO 2: Criar Draft Order na Gelato
    console.log('Step 2: Creating Gelato draft order...');

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
              url: printFileData.printFileUrl
            }
          ]
        }
      ]
    };

    console.log('Creating draft order with payload:', JSON.stringify(draftOrderPayload, null, 2));

    const draftOrderResponse = await gelatoFetch('/v4/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draftOrderPayload)
    });

    console.log('Draft order POST response received');

    // IMPORTANTE: Só extrair o ID da resposta do POST, ignorar tudo o resto!
    if (!draftOrderResponse || !draftOrderResponse.id) {
      throw new Error(`Draft order creation failed: No ID in response`);
    }

    const draftOrderId = draftOrderResponse.id; // Só precisamos do ID daqui!
    console.log('Draft order created with ID:', draftOrderId);

    // PASSO 3: POLLING para buscar mockups (aguardar que Gelato os processe)
    console.log('Step 3: Starting polling for mockups...');

    // Variável para guardar os URLs finais quando os encontrarmos
    let finalPreviewUrls: string[] = [];
    const maxAttempts = 6; // Máximo 6 tentativas (18 segundos total)
    const delay = 3000; // 3 segundos entre tentativas

    // LOOP DE POLLING - só faz GETs
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Polling attempt ${attempt}/${maxAttempts}: Fetching order details for ${draftOrderId}...`);

      try {
        // FAZ O GET USANDO O ID DO RASCUNHO
        const getResponse = await gelatoFetch(`/v4/orders/${draftOrderId}`, {
          method: 'GET'
        });

        // PROCURA OS PREVIEWS NA RESPOSTA DO GET, NÃO DO POST!
        const previewsInResponse = getResponse?.items?.[0]?.previews;

        if (previewsInResponse && Array.isArray(previewsInResponse) && previewsInResponse.length > 0) {
          console.log('✅ Sucesso! Mockups encontrados!');
          finalPreviewUrls = previewsInResponse.map((p: GelatoPreview) => p.url).filter(Boolean); // Guarda os URLs
          break; // Encontrámos, por isso saímos do loop
        }

        // Se não encontrámos, esperamos antes de tentar de novo
        if (attempt < maxAttempts) {
          console.log('⏳ Mockups ainda não estão prontos. A aguardar 3 segundos...');
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        console.error(`Error in polling attempt ${attempt}:`, error);
        
        // Se é a última tentativa, continuar para resposta de fallback
        if (attempt === maxAttempts) {
          console.warn('All polling attempts failed, proceeding with fallback');
          break;
        }
        
        // Aguardar antes da próxima tentativa mesmo em caso de erro
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log(`Polling completed. Found ${finalPreviewUrls.length} preview URLs.`);

    // VERIFICAR RESULTADO DO POLLING
    if (finalPreviewUrls.length > 0) {
      // Se chegámos aqui, temos os mockups! Responde ao frontend com sucesso.
      return res.status(200).json({
        success: true,
        previewUrls: finalPreviewUrls,
        draftOrderId: draftOrderId,
        printFileUrl: printFileData.printFileUrl
      });
    } else {
      // Se o loop terminou sem encontrar nada, retorna sucesso parcial (não erro crítico)
      console.warn('⚠️ Timeout: Falha ao obter os mockups da Gelato a tempo.');
      return res.status(200).json({
        success: true,
        previewUrls: [], // Array vazio - frontend usará fallback local
        draftOrderId: draftOrderId,
        printFileUrl: printFileData.printFileUrl
      });
    }

  } catch (error) {
    console.error('Error creating draft order:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 