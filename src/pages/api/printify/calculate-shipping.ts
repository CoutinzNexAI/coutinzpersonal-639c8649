import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { printifyFetch } from '@/lib/printify/printifyApi';
import { PrintifyShippingAddress } from '@/lib/printify/printifyTypes';
import { getPrintifyProduct } from '@/lib/printify/printifyProducts';

// Interface para o request de cálculo de envio (SIMPLIFICADO)
interface ShippingCalculationRequest {
  line_items: Array<{
    productId: string; // ID interno do produto
    quantity: number;
    customizations: {
      variantId: number; // ID da variante da Printify
    };
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

// Interface para resposta de cálculo de envio (SIMPLIFICADO)
interface ShippingCalculationResponse {
  success: boolean;
  cheapestCost?: number; // Apenas o custo mais barato em centavos
  error?: string;
  retryAfter?: number; // Para rate limiting
  details?: string; // Para detalhes de debug
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

    // Mapeia os itens do carrinho para o formato que a API da Printify precisa
    const printifyLineItems = [];

    for (const item of shippingRequest.line_items) {
      const productMapping = getPrintifyProduct(item.productId);
      if (!productMapping) {
        return res.status(400).json({
          success: false,
          error: `Product not found: ${item.productId}`
        });
      }

      if (!productMapping.printifyBlueprintId || !productMapping.printifyPrintProviderId) {
        return res.status(400).json({
          success: false,
          error: `Product ${item.productId} missing Printify configuration`
        });
      }

      const lineItem = {
        print_provider_id: productMapping.printifyPrintProviderId,
        blueprint_id: productMapping.printifyBlueprintId,
        variant_id: item.customizations.variantId,
        quantity: item.quantity,
      };

      printifyLineItems.push(lineItem);
    }

    // Construir endereço de envio
    const addressTo: PrintifyShippingAddress = {
      first_name: shippingRequest.address_to.first_name,
      last_name: shippingRequest.address_to.last_name,
      email: shippingRequest.address_to.email,
      phone: shippingRequest.address_to.phone || '+351912345678',
      country: shippingRequest.address_to.country,
      region: shippingRequest.address_to.region || '',
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

    let response;
    try {
      response = await printifyFetch(`shops/${shopId}/orders/shipping.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shippingPayload)
      });
    } catch (printifyError) {
      console.error('❌ Erro na chamada Printify shipping API:', {
        error: printifyError instanceof Error ? printifyError.message : String(printifyError),
        endpoint: `shops/${shopId}/orders/shipping.json`,
        timestamp: new Date().toISOString(),
        payload: JSON.stringify(shippingPayload).substring(0, 500) // Truncar para logs
      });
      
      // Se for erro de rate limit, informar claramente
      if (printifyError instanceof Error && printifyError.message.includes('429')) {
        return res.status(429).json({
          success: false,
          error: 'Printify API temporariamente indisponível. Tente novamente em alguns segundos.',
          retryAfter: 10
        });
      }
      
      // Se for erro de autenticação, é crítico
      if (printifyError instanceof Error && printifyError.message.includes('401')) {
        console.error('🚨 CRÍTICO: Credenciais Printify inválidas');
        return res.status(500).json({
          success: false,
          error: 'Erro de configuração do serviço. Contacte o suporte.'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Erro temporário no cálculo de portes. Tente novamente.',
        details: process.env.NODE_ENV === 'development' ? printifyError instanceof Error ? printifyError.message : String(printifyError) : undefined
      });
    }

    // A resposta da Printify pode vir diretamente como dados ou com wrapper
    let shippingCosts;
    if (response.success === false) {
      console.error('❌ Printify retornou erro no cálculo de envio');
      return res.status(500).json({
        success: false,
        error: response.error || 'Failed to calculate shipping costs from Printify'
      });
    } else {
      // A Printify pode responder diretamente com os custos ou com { data: custos }
      shippingCosts = response.data || response;
    }

    // Filtra os custos válidos e encontra o mais barato
    const validCosts = Object.values(shippingCosts).filter(cost => typeof cost === 'number');
    
    if (validCosts.length === 0) {
      console.error('❌ Nenhum método de envio disponível para este endereço');
      return res.status(400).json({ 
        success: false,
        error: "No shipping options available for this address." 
      });
    }
    
    const cheapestCost = Math.min(...validCosts);

    // Devolve apenas o custo mais barato
    return res.status(200).json({ 
      success: true,
      cheapestCost: cheapestCost 
    });

  } catch (error) {
    console.error('Error calculating shipping costs:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 