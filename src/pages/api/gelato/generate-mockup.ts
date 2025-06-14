import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { PIC_TUZ_PRINTIFY_PRODUCT_MAP } from '@/lib/printify/printifyProducts';
// import { gelatoFetch } from '@/lib/gelato/gelatoApi';

interface GenerateMockupRequest {
  productId: string; // Nossa chave interna (ex: "canvas_200x200_square_slim_unframed")
  userImageUrl: string; // URL da imagem do utilizador
  userId: string; // ID do utilizador
}

interface GenerateMockupResponse {
  success: boolean;
  previewUrl?: string;
  gelatoStoreProductId?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateMockupResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Verificar autenticação do utilizador
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Verificar token de autorização no header
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

    const { productId, userImageUrl, userId }: GenerateMockupRequest = req.body;

    // Validações básicas
    if (!productId || !userImageUrl || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, userImageUrl, userId'
      });
    }

    // Buscar produto no nosso mapeamento
    const gelatoProduct = PIC_TUZ_PRINTIFY_PRODUCT_MAP[productId];
    if (!gelatoProduct) {
      return res.status(404).json({
        success: false,
        error: `Product not found: ${productId}`
      });
    }

    // Verificar se temos os dados necessários para Gelato
    if (!gelatoProduct.gelatoTemplateId || !gelatoProduct.templateVariantId) {
      return res.status(400).json({
        success: false,
        error: 'Product missing Gelato template configuration'
      });
    }

    // Buscar storeId das variáveis de ambiente
    const storeId = process.env.GELATO_STORE_ID;
    if (!storeId) {
      return res.status(500).json({
        success: false,
        error: 'GELATO_STORE_ID not configured'
      });
    }

    // Preparar payload para Gelato E-commerce API (comentado durante migração)
    // const gelatoPayload = {
    //   templateId: gelatoProduct.gelatoTemplateId,
    //   title: `Arte AI para Cliente ${userId} - ${gelatoProduct.name}`,
    //   isVisibleInTheOnlineStore: false, // Produto "fantasma" apenas para mockup
    //   variants: [
    //     {
    //       templateVariantId: gelatoProduct.templateVariantId,
    //       imagePlaceholders: [
    //         {
    //           name: gelatoProduct.printArea, // Nome da camada (ex: "design_principal")
    //           fileUrl: userImageUrl
    //         }
    //       ]
    //     }
    //   ]
    // };

    console.log('Gelato API temporarily disabled during Printify migration');

    // Chamar Gelato E-commerce API (comentado durante migração)
    // const gelatoResponse = await gelatoFetch(
    //   `/v1/stores/${storeId}/products:create-from-template`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(gelatoPayload)
    //   }
    // );

    // console.log('Gelato E-commerce API response:', gelatoResponse);

    // SIMULAÇÃO TEMPORÁRIA - será substituído pela Printify na Fase 5
    const gelatoResponse = {
      success: true,
      data: {
        id: 'temp-gelato-product-' + Date.now(),
        previewUrl: userImageUrl, // Usar a imagem do user como preview temporário
        variants: [
          {
            previewUrl: userImageUrl,
            mockups: [
              {
                previewUrl: userImageUrl
              }
            ]
          }
        ]
      },
      error: null
    };

    // Extrair URLs de preview da resposta
    if (!gelatoResponse.success || !gelatoResponse.data) {
      return res.status(500).json({
        success: false,
        error: `Gelato API error: ${gelatoResponse.error || 'Unknown error'}`
      });
    }

    const storeProductData = gelatoResponse.data;
    const previewUrl = storeProductData.previewUrl || 
                       storeProductData.variants?.[0]?.previewUrl ||
                       storeProductData.variants?.[0]?.mockups?.[0]?.previewUrl;

    if (!previewUrl) {
      return res.status(500).json({
        success: false,
        error: 'No preview URL received from Gelato'
      });
    }

    // Responder com sucesso
    return res.status(200).json({
      success: true,
      previewUrl,
      gelatoStoreProductId: storeProductData.id
    });

  } catch (error) {
    console.error('Error generating Gelato mockup:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 