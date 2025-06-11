import { NextApiRequest, NextApiResponse } from 'next';
import { CartItem } from '@/lib/cart/cartTypes';
import { gelatoFetch } from '@/lib/gelato/gelatoApi';
import { CartService } from '@/lib/cart/cartService';

interface ShippingAddress {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface QuoteRequest {
  cart: CartItem[];
  shippingAddress: ShippingAddress;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cart, shippingAddress }: QuoteRequest = req.body;

    // Validar dados de entrada
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio ou inválido' });
    }

    if (!shippingAddress || !shippingAddress.country || !shippingAddress.postalCode) {
      return res.status(400).json({ error: 'Dados de envio incompletos' });
    }

    // Converter carrinho para formato Gelato
    const gelatoProducts = CartService.cartToGelatoProducts(cart);

    // Gerar ID de referência único para esta cotação
    const orderReferenceId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Construir payload para API da Gelato
    const quotePayload = {
      orderReferenceId,
      customerReferenceId: 'customer_' + Date.now(), // Placeholder - usar user.id real
      currency: 'EUR',
      recipient: {
        name: shippingAddress.name,
        email: shippingAddress.email,
        address: {
          line1: shippingAddress.address,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country
        }
      },
      products: gelatoProducts.map(product => ({
        ...product,
        // Para cotação, podemos usar URLs placeholder se não tivermos os ficheiros finais ainda
        files: product.files.map(file => ({
          ...file,
          // Nota: Para cotação real, a Gelato pode não exigir ficheiros reais
          // mas é boa prática incluir as dimensões corretas
          type: 'default'
        }))
      }))
    };

    console.log('Sending quote request to Gelato:', JSON.stringify(quotePayload, null, 2));

    // Chamar API da Gelato para cotação
    const response = await gelatoFetch('/v4/orders:quote', {
      method: 'POST',
      body: JSON.stringify(quotePayload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gelato quote error:', response.status, errorData);
      
      // Se a API da Gelato falhar, retornar cotações simuladas
      return res.status(200).json({
        success: false,
        fallback: true,
        shipmentMethods: [
          {
            uid: 'standard_fallback',
            name: 'Envio Standard',
            price: calculateShippingCost(cart, 'standard'),
            deliveryDaysMin: 5,
            deliveryDaysMax: 7,
            description: 'CTT - Entrega em 5-7 dias úteis (estimativa)'
          },
          {
            uid: 'express_fallback',
            name: 'Envio Expresso',
            price: calculateShippingCost(cart, 'express'),
            deliveryDaysMin: 2,
            deliveryDaysMax: 3,
            description: 'CTT Expresso - Entrega em 2-3 dias úteis (estimativa)'
          }
        ]
      });
    }

    const quoteData = await response.json();

    // Processar resposta da Gelato
    if (quoteData && quoteData.shipmentMethods) {
      // Transformar métodos de envio para formato consistente
      const formattedMethods = quoteData.shipmentMethods.map((method: {
        uid: string;
        name?: string;
        displayName?: string;
        price?: string;
        totalPrice?: string;
        deliveryDaysMin?: number;
        minDeliveryDays?: number;
        deliveryDaysMax?: number;
        maxDeliveryDays?: number;
        description?: string;
        carrier?: { name?: string };
      }) => ({
        uid: method.uid,
        name: method.name || method.displayName || 'Método de Envio',
        price: parseFloat(method.price || method.totalPrice || '0'),
        deliveryDaysMin: method.deliveryDaysMin || method.minDeliveryDays || 5,
        deliveryDaysMax: method.deliveryDaysMax || method.maxDeliveryDays || 7,
        description: method.description || method.carrier?.name
      }));

      res.status(200).json({
        success: true,
        orderReferenceId,
        shipmentMethods: formattedMethods,
        rawResponse: quoteData // Para debug
      });
    } else {
      throw new Error('Resposta da Gelato inválida');
    }

  } catch (error) {
    console.error('Error getting quote:', error);
    
    // Fallback com cotações simuladas em caso de erro
    const { cart } = req.body;
    res.status(200).json({
      success: false,
      fallback: true,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      shipmentMethods: [
        {
          uid: 'standard_fallback',
          name: 'Envio Standard',
          price: calculateShippingCost(cart || [], 'standard'),
          deliveryDaysMin: 5,
          deliveryDaysMax: 7,
          description: 'CTT - Entrega em 5-7 dias úteis (estimativa)'
        },
        {
          uid: 'express_fallback',
          name: 'Envio Expresso',
          price: calculateShippingCost(cart || [], 'express'),
          deliveryDaysMin: 2,
          deliveryDaysMax: 3,
          description: 'CTT Expresso - Entrega em 2-3 dias úteis (estimativa)'
        }
      ]
    });
  }
}

// Função para calcular custo de envio simulado
function calculateShippingCost(cart: CartItem[], method: 'standard' | 'express'): number {
  if (!cart || cart.length === 0) return 0;

  // Calcular peso/volume estimado baseado nos produtos
  const baseWeight = cart.reduce((total, item) => {
    // Estimar peso baseado na categoria do produto
    let itemWeight = 0.5; // kg por item por defeito
    
    switch (item.productCategory) {
      case 'canvas':
        itemWeight = 1.2; // Canvas são mais pesados
        break;
      case 'apparel':
        itemWeight = 0.3; // T-shirts são leves
        break;
      case 'poster':
        itemWeight = 0.1; // Posters são muito leves
        break;
      case 'mug':
        itemWeight = 0.8; // Canecas têm peso médio
        break;
      case 'phone-case':
        itemWeight = 0.1; // Capas são leves
        break;
    }
    
    return total + (itemWeight * item.quantity);
  }, 0);

  // Calcular custo baseado no peso e método
  const baseCost = method === 'express' ? 8.99 : 4.99;
  const weightCost = Math.max(0, (baseWeight - 1) * (method === 'express' ? 3 : 2)); // Custo adicional por kg extra
  
  return Math.round((baseCost + weightCost) * 100) / 100; // Arredondar para 2 casas decimais
} 