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
      items: [
        {
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

    console.log('Draft order response:', draftOrderResponse);

    if (!draftOrderResponse.success || !draftOrderResponse.data) {
      throw new Error(`Draft order creation failed: ${draftOrderResponse.error}`);
    }

    const draftOrderId = draftOrderResponse.data.id;
    console.log('Draft order created with ID:', draftOrderId);

    // PASSO 3: Buscar mockups do Draft Order
    console.log('Step 3: Fetching draft order mockups...');

    // Pequeno delay para permitir que a Gelato processe
    await new Promise(resolve => setTimeout(resolve, 2000));

    const orderDetailsResponse = await gelatoFetch(`/v4/orders/${draftOrderId}`, {
      method: 'GET'
    });

    console.log('Order details response:', orderDetailsResponse);

    if (!orderDetailsResponse.success || !orderDetailsResponse.data) {
      // Se não conseguir buscar detalhes, retorna sucesso parcial
      console.warn('Could not fetch order details, returning basic success');
      return res.status(200).json({
        success: true,
        draftOrderId: draftOrderId,
        printFileUrl: printFileData.printFileUrl,
        previewUrls: [] // Array vazio, frontend usará fallback
      });
    }

    // Extrair URLs de preview
    const orderData = orderDetailsResponse.data as GelatoOrderData;
    let previewUrls: string[] = [];

    // Tentar extrair previews de diferentes locais na resposta
    if (orderData.items && orderData.items.length > 0) {
      const item = orderData.items[0];
      
      // Verificar se há previews no item
      if (item.previews && Array.isArray(item.previews)) {
        previewUrls = item.previews.map((preview: GelatoPreview) => preview.url).filter(Boolean);
      }
      
      // Verificar se há mockups no item
      if (previewUrls.length === 0 && item.mockups && Array.isArray(item.mockups)) {
        previewUrls = item.mockups.map((mockup: GelatoPreview) => mockup.url).filter(Boolean);
      }
    }

    // Verificar se há previews ao nível da ordem
    if (previewUrls.length === 0 && orderData.previews && Array.isArray(orderData.previews)) {
      previewUrls = orderData.previews.map((preview: GelatoPreview) => preview.url).filter(Boolean);
    }

    console.log('Extracted preview URLs:', previewUrls);

    // Responder com sucesso
    return res.status(200).json({
      success: true,
      previewUrls: previewUrls,
      draftOrderId: draftOrderId,
      printFileUrl: printFileData.printFileUrl
    });

  } catch (error) {
    console.error('Error creating draft order:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 