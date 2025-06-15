import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { printifyFetch } from '@/lib/printify/printifyApi';
import { PrintifyShippingAddress } from '@/lib/printify/printifyTypes';
import { getPrintifyProduct } from '@/lib/printify/printifyProducts';

// Interface para o request de cálculo de envio
interface ShippingCalculationRequest {
  line_items: Array<{
    productId: string; // ID interno do produto
    quantity: number;
    printifyImageId?: string; // ID da imagem na Printify (se aplicável)
  }>;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country: string;
    region?: string;
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
}

// Interface para resposta de cálculo de envio
interface ShippingCalculationResponse {
  success: boolean;
  data?: {
    shipping_methods: Array<{
      id: number;
      name: string;
      price: number;
      currency: string;
      estimated_delivery_days?: {
        min: number;
        max: number;
      };
    }>;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ShippingCalculationResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

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
    const shippingRequest: ShippingCalculationRequest = req.body;

    if (!shippingRequest.line_items || !shippingRequest.address_to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: line_items, address_to'
      });
    }

    // Validar endereço obrigatório
    const { country, city, zip } = shippingRequest.address_to;
    if (!country || !city || !zip) {
      return res.status(400).json({
        success: false,
        error: 'Missing required address fields: country, city, zip'
      });
    }

    // Construir line_items para Printify
    const printifyLineItems = [];

    for (const item of shippingRequest.line_items) {
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

      // Para cálculo de envio, construir line item com tipo flexível
      const lineItem: Record<string, unknown> = {
        product_id: productMapping.printifyBlueprintId,
        variant_id: productMapping.printifyVariantIds[0], // Usar primeira variante
        print_provider_id: productMapping.printifyPrintProviderId,
        quantity: item.quantity
      };

      // Se tem imagem customizada, adicionar print_areas (pode afetar o cálculo)
      if (item.printifyImageId) {
        lineItem.print_areas = [
          {
            variant_ids: productMapping.printifyVariantIds,
            placeholders: [
              {
                position: productMapping.printArea || 'front',
                images: [
                  {
                    id: item.printifyImageId,
                    x: 0.5,
                    y: 0.5,
                    scale: 1,
                    angle: 0
                  }
                ]
              }
            ]
          }
        ];
      }

      printifyLineItems.push(lineItem);
    }

    // Construir endereço de envio
    const addressTo: PrintifyShippingAddress = {
      first_name: shippingRequest.address_to.first_name,
      last_name: shippingRequest.address_to.last_name,
      email: shippingRequest.address_to.email,
      phone: shippingRequest.address_to.phone,
      country: shippingRequest.address_to.country,
      region: shippingRequest.address_to.region,
      address1: shippingRequest.address_to.address1,
      address2: shippingRequest.address_to.address2,
      city: shippingRequest.address_to.city,
      zip: shippingRequest.address_to.zip
    };

    // Construir payload para cálculo de envio
    const shippingPayload = {
      line_items: printifyLineItems,
      address_to: addressTo
    };

    // Chamar API Printify para cálculo de envio
    const shopId = process.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      return res.status(500).json({
        success: false,
        error: 'PRINTIFY_SHOP_ID not configured'
      });
    }

    console.log('📦 Calculando custos de envio na Printify...');
    console.log('Payload:', JSON.stringify(shippingPayload, null, 2));

    const response = await printifyFetch(`/v1/shops/${shopId}/orders/shipping.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shippingPayload)
    });

    if (!response.success) {
      return res.status(500).json({
        success: false,
        error: response.error || 'Failed to calculate shipping costs from Printify'
      });
    }

    // Processar resposta da Printify
    const shippingMethods = response.data?.shipping_methods || [];
    
    // Mapear para formato mais amigável
    const formattedMethods = shippingMethods.map((method: Record<string, unknown>) => ({
      id: method.id as number,
      name: (method.name as string) || `Shipping Method ${method.id}`,
      price: (method.price as number) || 0,
      currency: (method.currency as string) || 'USD',
      estimated_delivery_days: (method.estimated_delivery_days as { min: number; max: number }) || {
        min: 7,
        max: 14
      }
    }));

    console.log('✅ Custos de envio calculados:', formattedMethods);

    return res.status(200).json({
      success: true,
      data: {
        shipping_methods: formattedMethods
      }
    });

  } catch (error) {
    console.error('Error calculating shipping costs:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 