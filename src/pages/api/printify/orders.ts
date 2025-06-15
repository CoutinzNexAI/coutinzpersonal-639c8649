import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { printifyFetch } from '@/lib/printify/printifyApi';
import { PrintifyOrderCreationPayload, PrintifyShippingAddress } from '@/lib/printify/printifyTypes';
import { getPrintifyProduct, PrintifyProductMapping } from '@/lib/printify/printifyProducts';

// Interface para o request de criação de pedido
interface OrderRequestPayload {
  line_items: Array<{
    productId: string; // ID interno do produto (ex: 'canvas_200x200_square_slim_unframed')
    userImageUrl: string; // URL da imagem do utilizador
    printifyImageId?: string; // ID da imagem na Printify (se já foi carregada)
    quantity: number;
    imageAdjustments?: {
      x: number;
      y: number;
      scale: number;
      rotation?: number;
    };
  }>;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    region: string;
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
  shipping_method: string; // 'standard', 'express', etc.
}

// Interface para resposta de listagem
interface OrderListResponse {
  success: boolean;
  data?: unknown[];
  error?: string;
  pagination?: {
    current_page: number;
    total_pages: number;
    total: number;
  };
}

// Interface para resposta de criação
interface OrderCreationResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Mapeamento de métodos de envio para códigos Printify
const SHIPPING_METHOD_MAP: Record<string, number> = {
  'standard': 1,
  'express': 2,
  'priority': 3,
  'overnight': 4
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OrderListResponse | OrderCreationResponse>
) {
  // Verificar autenticação
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - missing token'
    });
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - invalid token'
    });
  }

  try {
    // LISTAGEM DE PEDIDOS (GET)
    if (req.method === 'GET') {
      const { status, sku, limit = '10', page = '1' } = req.query;

      // Construir URL da Printify
      const shopId = process.env.PRINTIFY_SHOP_ID;
      if (!shopId) {
        return res.status(500).json({
          success: false,
          error: 'PRINTIFY_SHOP_ID not configured'
        });
      }

      let url = `/v1/shops/${shopId}/orders.json?`;
      const params = new URLSearchParams();

      if (status && typeof status === 'string') {
        params.append('status', status);
      }
      if (sku && typeof sku === 'string') {
        params.append('sku', sku);
      }
      if (limit && typeof limit === 'string') {
        params.append('limit', limit);
      }
      if (page && typeof page === 'string') {
        params.append('page', page);
      }

      url += params.toString();

      const response = await printifyFetch(url, {
        method: 'GET'
      });

      if (!response.success) {
        return res.status(500).json({
          success: false,
          error: response.error || 'Failed to fetch orders from Printify'
        });
      }

      return res.status(200).json({
        success: true,
        data: response.data?.data || [],
        pagination: {
          current_page: parseInt(page as string),
          total_pages: response.data?.last_page || 1,
          total: response.data?.total || 0
        }
      });
    }

    // CRIAÇÃO DE PEDIDO (POST)
    if (req.method === 'POST') {
      const orderRequest: OrderRequestPayload = req.body;

      if (!orderRequest.line_items || !orderRequest.address_to || !orderRequest.shipping_method) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: line_items, address_to, shipping_method'
        });
      }

      // Mapear método de envio
      const shippingMethodId = SHIPPING_METHOD_MAP[orderRequest.shipping_method];
      if (!shippingMethodId) {
        return res.status(400).json({
          success: false,
          error: `Invalid shipping method: ${orderRequest.shipping_method}`
        });
      }

      // Construir line_items para Printify
      const printifyLineItems = [];

      for (const item of orderRequest.line_items) {
        const productMapping = getPrintifyProduct(item.productId);
        if (!productMapping) {
          return res.status(400).json({
            success: false,
            error: `Product not found: ${item.productId}`
          });
        }

        if (!productMapping.printifyBlueprintId || !productMapping.printifyPrintProviderId || !productMapping.printifyVariantIds) {
          return res.status(400).json({
            success: false,
            error: `Product ${item.productId} missing Printify configuration`
          });
        }

        // Para produtos com imagem customizada
        if (item.userImageUrl && item.printifyImageId) {
          const lineItem = {
            product_id: productMapping.printifyBlueprintId,
            variant_id: productMapping.printifyVariantIds[0], // Usar primeira variante
            print_provider_id: productMapping.printifyPrintProviderId,
            quantity: item.quantity,
            print_areas: [
              {
                variant_ids: productMapping.printifyVariantIds,
                placeholders: [
                  {
                    position: productMapping.printArea || 'front',
                    images: [
                      {
                        id: item.printifyImageId,
                        x: item.imageAdjustments?.x || 0.5,
                        y: item.imageAdjustments?.y || 0.5,
                        scale: item.imageAdjustments?.scale || 1,
                        angle: item.imageAdjustments?.rotation || 0
                      }
                    ]
                  }
                ]
              }
            ]
          };
          printifyLineItems.push(lineItem);
        } else {
          // Para produtos sem customização (se aplicável)
          const lineItem = {
            product_id: productMapping.printifyBlueprintId,
            variant_id: productMapping.printifyVariantIds[0],
            print_provider_id: productMapping.printifyPrintProviderId,
            quantity: item.quantity
          };
          printifyLineItems.push(lineItem);
        }
      }

      // Construir endereço de envio
      const addressTo: PrintifyShippingAddress = {
        first_name: orderRequest.address_to.first_name,
        last_name: orderRequest.address_to.last_name,
        email: orderRequest.address_to.email,
        phone: orderRequest.address_to.phone,
        country: orderRequest.address_to.country,
        region: orderRequest.address_to.region,
        address1: orderRequest.address_to.address1,
        address2: orderRequest.address_to.address2,
        city: orderRequest.address_to.city,
        zip: orderRequest.address_to.zip
      };

      // Construir payload final para Printify
      const printifyPayload: PrintifyOrderCreationPayload = {
        external_id: `PICTUZ-${Date.now()}-${user.id.substring(0, 8)}`,
        line_items: printifyLineItems,
        shipping_method: shippingMethodId,
        address_to: addressTo
      };

      // Chamar API Printify
      const shopId = process.env.PRINTIFY_SHOP_ID;
      if (!shopId) {
        return res.status(500).json({
          success: false,
          error: 'PRINTIFY_SHOP_ID not configured'
        });
      }

      const response = await printifyFetch(`/v1/shops/${shopId}/orders.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printifyPayload)
      });

      if (!response.success) {
        return res.status(500).json({
          success: false,
          error: response.error || 'Failed to create order in Printify'
        });
      }

      return res.status(200).json({
        success: true,
        data: response.data
      });
    }

    // Método não permitido
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in orders API:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 