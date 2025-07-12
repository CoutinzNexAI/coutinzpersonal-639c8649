import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabase/admin';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

// Interface para item do carrinho
interface CartItem {
  productName: string;
  price: number;
  quantity: number;
  productId: string; // ✅ CORRIGIDO: usar productId como no frontend
  userImageId?: string;
  userImageUrl?: string;
  customizations?: { 
    size?: string;
    variant?: string;
    position?: string;
    variantId?: number;
    scale?: number;
    x?: number;
    y?: number;
    angle?: number;
  };
  printifyProductId?: string;
  printifyVariantId?: number;
  printifyImageId?: string;
  // ✅ NOVO: Preço final calculado pelo frontend (incluindo desconto)
  finalPrice?: number;
}

// ✅ NOVO: Função para validar preços do frontend
function validateItemPricing(item: CartItem, productGroups: Record<string, CartItem[]>): { isValid: boolean; expectedPrice: number; discountPercent: number } {
  // Calcular desconto esperado baseado na quantidade do grupo
  const sameProductItems = productGroups[item.productId] || [];
  const totalSameProductQty = sameProductItems.reduce((sum, groupItem) => sum + groupItem.quantity, 0);
  
  let discountPercent = 0;
  if (totalSameProductQty >= 3) {
    discountPercent = 15;
  } else if (totalSameProductQty >= 2) {
    discountPercent = 10;
  }
  
  // Calcular preço esperado
  const expectedPrice = item.price * (1 - discountPercent / 100);
  
  // Validar se o preço do frontend corresponde ao esperado (tolerância de 1 cêntimo)
  const frontendPrice = item.finalPrice || item.price;
  const isValid = Math.abs(frontendPrice - expectedPrice) < 0.01;
  
  return { isValid, expectedPrice, discountPercent };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, shippingMethod, userId, userName, userEmail, subtotal, originalSubtotal, discountAmount, shipping, tax, total } = req.body;

    // Gerar referências únicas para este checkout e pedido
    const checkoutReference = `CHK-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const orderReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Validar dados obrigatórios
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items são obrigatórios' });
    }

    if (!userId || !userName || !userEmail) {
      return res.status(400).json({ error: 'Dados do utilizador são obrigatórios' });
    }

    if (!shippingMethod) {
      return res.status(400).json({ error: 'Método de envio é obrigatório' });
    }

    console.log('💾 Salvando dados do checkout temporariamente...');

    // Salvar dados do checkout temporariamente para recuperar depois
    const { error: tempSaveError } = await supabaseAdmin
      .from('checkout_sessions_temp')
      .insert({
        checkout_reference: checkoutReference,
        user_id: userId,
        cart_items: items, // Salvar array completo diretamente
        shipping_method: shippingMethod,
        financial_data: {
          subtotal,
          originalSubtotal,
          discountAmount,
          shipping,
          tax,
          total
        },
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // Expira em 2 horas
      });

    if (tempSaveError) {
      console.error('❌ Erro ao salvar dados temporários:', tempSaveError);
      return res.status(500).json({ error: 'Erro ao preparar checkout' });
    }

    console.log('✅ Dados do checkout salvos temporariamente:', checkoutReference);

    // ✅ NOVO: Agrupar produtos para validação de preços
    const productGroups = items.reduce((groups: Record<string, CartItem[]>, item: CartItem) => {
      const key = item.productId;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});

    // ✅ NOVO: Validar preços calculados pelo frontend
    for (const item of items) {
      const validation = validateItemPricing(item, productGroups);
      
      if (!validation.isValid) {
        console.error(`❌ Discrepância de preço detectada para item ${item.productId}:`, {
          frontendPrice: item.finalPrice || item.price,
          expectedPrice: validation.expectedPrice,
          discountPercent: validation.discountPercent
        });
        return res.status(400).json({ 
          error: `Erro de validação: preço inconsistente para ${item.productName}. Recarregue a página e tente novamente.` 
        });
      }
    }

    console.log('✅ Validação de preços bem-sucedida');

    // Criar line items para o Stripe usando preços validados do frontend
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: CartItem) => {
      // Construir descrição com posição
      const position = item.customizations?.position || 'Centro';
      const variant = item.customizations?.variant || item.customizations?.size || 'Tamanho padrão';
      const description = `Produto personalizado com arte PicTuz - ${variant} - Posição: ${position}`;
      
      // ✅ USAR PREÇO FINAL VALIDADO DO FRONTEND
      const finalPrice = item.finalPrice || item.price;
      
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.productName,
            description: description,
            metadata: {
              productId: item.productId,
              userImageId: item.userImageId || '',
              transformationId: item.userImageId || '',
              position: position
            }
          },
          unit_amount: Math.round(finalPrice * 100), // Usar preço final validado
        },
        quantity: item.quantity,
      };
    });

    // Criar sessão Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.referer || req.headers.origin + '/shop'}`,
      customer_email: userEmail,
      // ✅ SIMPLIFICADO: Apenas metadados essenciais para o webhook
      metadata: {
        userId: userId,
        checkoutReference: checkoutReference,
        orderReference: orderReference,
      },
      // Configurar recolha obrigatória de endereço de envio - APENAS PORTUGAL
      shipping_address_collection: {
        allowed_countries: ['PT'],
      },
      phone_number_collection: {
        enabled: true // ✅ FORÇAR: Recolha obrigatória do telefone
      },
      billing_address_collection: 'auto',
      // ✅ ATUALIZADO: Definir opções de envio condicionalmente
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: Math.round(shipping * 100), // €0 se grátis, €3.99 se pago
              currency: 'eur',
            },
            display_name: shippingMethod.name, // "Envio Grátis" ou "Envio Standard"
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 4,
              },
              maximum: {
                unit: 'business_day',
                value: 7,
              },
            },
          },
        },
      ],
      custom_fields: [ // ✅ NOVO: Campo personalizado para o Distrito
        {
          key: 'district',
          label: { type: 'custom', custom: 'Distrito' },
          type: 'dropdown',
          dropdown: {
            options: [
              { label: 'Aveiro', value: 'Aveiro' },
              { label: 'Beja', value: 'Beja' },
              { label: 'Braga', value: 'Braga' },
              { label: 'Bragança', value: 'Braganca' }, // Corrigido
              { label: 'Castelo Branco', value: 'CasteloBranco' }, // Corrigido
              { label: 'Coimbra', value: 'Coimbra' },
              { label: 'Évora', value: 'Evora' }, // Corrigido
              { label: 'Faro', value: 'Faro' },
              { label: 'Guarda', value: 'Guarda' },
              { label: 'Leiria', value: 'Leiria' },
              { label: 'Lisboa', value: 'Lisboa' },
              { label: 'Portalegre', value: 'Portalegre' },
              { label: 'Porto', value: 'Porto' },
              { label: 'Santarém', value: 'Santarem' }, // Corrigido
              { label: 'Setúbal', value: 'Setubal' }, // Corrigido
              { label: 'Viana do Castelo', value: 'VianaDoCastelo' }, // Corrigido
              { label: 'Vila Real', value: 'VilaReal' }, // Corrigido
              { label: 'Viseu', value: 'Viseu' },
              // Regiões Autónomas (se suportadas)
              { label: 'Açores', value: 'Acores' }, // Corrigido
              { label: 'Madeira', value: 'Madeira' }, // Corrigido
            ],
            default_value: 'Porto', // Define um valor padrão para facilitar o teste
          },
        },
        {
          key: 'order_notes',
          label: {
            type: 'custom',
            custom: 'Notas do pedido (opcional)'
          },
          type: 'text',
          optional: true
        }
      ]
    });

    console.log('Stripe checkout session created:', {
      sessionId: session.id,
      checkoutReference,
      orderReference,
      userId,
      itemsCount: items.length,
      total
    });

    res.status(200).json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('Erro ao criar sessão Stripe:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        error: `Erro Stripe: ${error.message}`,
        type: error.type 
      });
    }

    res.status(500).json({ 
      error: 'Erro interno do servidor ao processar pagamento' 
    });
  }
} 