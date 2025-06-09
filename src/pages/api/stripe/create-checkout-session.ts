import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, shippingMethod, userId, userName, userEmail, subtotal, shipping, tax, total } = req.body;

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

    // Criar line items para o Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: {
      productName: string;
      price: number;
      quantity: number;
      productUid: string;
      userImageId?: string;
      userImageUrl?: string;
      customizations?: { size?: string };
    }) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.productName,
          description: `Produto personalizado com arte AI - ${item.customizations?.size || 'Tamanho padrão'}`,
          images: item.userImageUrl ? [item.userImageUrl] : undefined,
          metadata: {
            productUid: item.productUid,
            userImageId: item.userImageId || '',
            transformationId: item.userImageId || ''
          }
        },
        unit_amount: Math.round(item.price * 100), // Stripe trabalha em cêntimos
      },
      quantity: item.quantity,
    }));

    // Adicionar envio como item separado
    if (shippingMethod && shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: shippingMethod.name,
            description: `${shippingMethod.description} (${shippingMethod.deliveryDaysMin}-${shippingMethod.deliveryDaysMax} dias)`
          },
          unit_amount: Math.round(shipping * 100)
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
        orderType: 'gelato',
        subtotal: subtotal.toString(),
        shipping: shipping.toString(),
        tax: tax.toString(),
        total: total.toString(),
        shippingMethodUid: shippingMethod.uid,
        shippingMethodName: shippingMethod.name,
        // Salvar items completos do carrinho para reconstruir na DB
        cartItemsJson: JSON.stringify(items)
      },
      // Configurar recolha obrigatória de endereço de envio
      shipping_address_collection: {
        allowed_countries: ['PT', 'ES', 'FR', 'DE', 'IT', 'NL', 'BE', 'AT', 'CH', 'US', 'CA', 'GB']
      },
      phone_number_collection: {
        enabled: false
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
                value: shippingMethod.deliveryDaysMin,
              },
              maximum: {
                unit: 'business_day',
                value: shippingMethod.deliveryDaysMax,
              },
            },
          },
        },
      ],
      // Campos personalizados opcionais
      custom_fields: [
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