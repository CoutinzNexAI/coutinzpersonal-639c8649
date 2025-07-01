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
  productUid: string;
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

    // ✅ DEBUG: Log dos items do carrinho para verificar campos Printify
    console.log('🛒 Items do carrinho recebidos:', JSON.stringify(items, null, 2));
    
    // Verificar se algum item tem campos Printify
    const itemsWithPrintify = items.filter((item: CartItem) => item.printifyProductId && item.printifyVariantId);
    console.log(`📊 Items com campos Printify: ${itemsWithPrintify.length}/${items.length}`);

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

    // Calcular descontos por grupo de produtos
    const productGroups = items.reduce((groups: Record<string, CartItem[]>, item: CartItem) => {
      const key = item.productUid;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});

    // Criar line items para o Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: CartItem) => {
      // Construir descrição com posição
      const position = item.customizations?.position || 'Centro';
      const variant = item.customizations?.variant || item.customizations?.size || 'Tamanho padrão';
      const description = `Produto personalizado com arte PicTuz - ${variant} - Posição: ${position}`;
      
      // Calcular desconto para este item baseado no grupo do produto
      const sameProductItems = productGroups[item.productUid] || [];
      const totalSameProductQty = sameProductItems.reduce((sum, groupItem) => sum + groupItem.quantity, 0);
      
      let discountPercent = 0;
      if (totalSameProductQty >= 3) {
        discountPercent = 15;
      } else if (totalSameProductQty >= 2) {
        discountPercent = 10;
      }
      
      // Aplicar desconto ao preço
      const originalPrice = item.price;
      const discountedPrice = originalPrice * (1 - discountPercent / 100);
      
      return {
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.productName,
            description: description,
          images: item.userImageUrl ? [item.userImageUrl] : undefined,
          metadata: {
            productUid: item.productUid,
            userImageId: item.userImageId || '',
              transformationId: item.userImageId || '',
              position: position,
              originalPrice: originalPrice.toString(),
              discountPercent: discountPercent.toString(),
              discountedPrice: discountedPrice.toString()
          }
        },
          unit_amount: Math.round(discountedPrice * 100), // Usar preço com desconto
      },
      quantity: item.quantity,
      };
    });

    // Adicionar envio como item separado
    if (shippingMethod && shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: shippingMethod.name,
            description: `Envio gratuito em 4-7 dias úteis`
          },
          unit_amount: Math.round(shipping * 100)
        },
        quantity: 1
      });
    }

    // Adicionar IVA como item separado para transparência
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'IVA (23%)',
            description: 'Imposto sobre o Valor Acrescentado'
          },
          unit_amount: Math.round(tax * 100)
        },
        quantity: 1
      });
    }

    // Criar sessão Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/checkout/cancelled`,
      customer_email: userEmail,
      metadata: {
        userId,
        userName,
        checkoutReference, // Referência única para recuperar dados depois
        orderReference, // Referência do pedido para guardar na DB
        orderType: 'gelato',
        subtotal: subtotal.toString(),
        originalSubtotal: originalSubtotal?.toString() || subtotal.toString(),
        discountAmount: discountAmount?.toString() || '0',
        shipping: shipping.toString(),
        tax: tax.toString(),
        total: total.toString(),
        shippingMethodUid: shippingMethod.uid,
        shippingMethodName: shippingMethod.name,
        itemsCount: items.length.toString(),
        // ✅ DEBUG: Metadata para testar region se Stripe não a fornecer
        debug_region: 'Porto' // Fallback para teste - pode ser removido em produção
      },
      // Configurar recolha obrigatória de endereço de envio - APENAS PORTUGAL
      shipping_address_collection: {
        allowed_countries: ['PT'],
        // ✅ BLOQUEADO PARA PORTUGAL APENAS
      },
      phone_number_collection: {
        enabled: true // ✅ FORÇAR: Recolha obrigatória do telefone
      },
      billing_address_collection: 'auto',
      // Definir opções de envio
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: Math.round(shipping * 100),
              currency: 'eur',
            },
            display_name: shippingMethod.name,
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