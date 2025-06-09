import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabase/admin';

// Interface para shipping details
interface ShippingDetails {
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

// Estender a interface Session do Stripe para incluir shipping_details
interface ExtendedSession extends Stripe.Checkout.Session {
  shipping_details?: ShippingDetails;
}

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
    const { sessionId, userId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID é obrigatório' });
    }

    // Recuperar sessão do Stripe com todos os detalhes necessários
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'payment_intent']
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Pagamento não confirmado' });
    }

    // Extrair dados da sessão
    const lineItems = session.line_items?.data || [];
    const metadata = session.metadata || {};
    
    // Extrair detalhes de envio - Stripe pode colocar em diferentes campos
    const shippingDetails = (session as ExtendedSession).shipping_details || null;
    const customerDetails = session.customer_details || null;
    
    console.log('Detalhes de envio extraídos:', {
      shipping: shippingDetails,
      customer: customerDetails,
      sessionId: session.id
    });

    // Preparar endereço de envio para Gelato
    const finalShippingAddress = shippingDetails?.address || customerDetails?.address || {};
    const finalShippingName = shippingDetails?.name || customerDetails?.name || metadata.userName || 'N/A';
    const finalShippingPhone = shippingDetails?.phone || customerDetails?.phone || null;
    
    // Preparar dados do pedido
    const orderData = {
      user_id: userId || metadata.userId,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent?.id || null,
      order_reference: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      customer_email: session.customer_email || customerDetails?.email || null,
      customer_name: metadata.userName || finalShippingName,
      
      // Dados financeiros
      subtotal: parseFloat(metadata.subtotal || '0'),
      shipping_cost: parseFloat(metadata.shipping || '0'),
      tax_amount: parseFloat(metadata.tax || '0'),
      total_amount: parseFloat(metadata.total || '0'),
      currency: 'EUR',
      
      // Dados de envio extraídos do Stripe
      shipping_name: finalShippingName,
      shipping_address: JSON.stringify(finalShippingAddress),
      shipping_phone: finalShippingPhone,
      shipping_method_uid: metadata.shippingMethodUid || 'express',
      shipping_method_name: metadata.shippingMethodName || 'Envio Expresso',
      
      // Status e timestamps
      status: 'paid',
      payment_status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Salvar pedido na base de dados usando supabaseAdmin
    const { data: order, error: orderError } = await supabaseAdmin
      .from('gelato_orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Erro ao salvar pedido:', orderError);
      throw new Error('Erro ao salvar pedido na base de dados: ' + orderError.message);
    }

    console.log('Pedido salvo com sucesso:', {
      orderId: order?.id,
      orderReference: orderData.order_reference,
      total: orderData.total_amount
    });

    // Preparar resposta com dados do pedido
    const responseData = {
      success: true,
      orderReference: orderData.order_reference,
      orderId: order?.id,
      status: orderData.status,
      total: orderData.total_amount,
      subtotal: orderData.subtotal,
      shipping: orderData.shipping_cost,
      tax: orderData.tax_amount,
      customerName: orderData.customer_name,
      customerEmail: orderData.customer_email,
      items: lineItems.map(item => ({
        productName: item.description || 'Produto',
        quantity: item.quantity || 1,
        price: item.amount_total ? item.amount_total / 100 : 0
      })),
      shippingAddress: finalShippingAddress,
      shippingName: finalShippingName,
      shippingPhone: finalShippingPhone,
      shippingMethod: orderData.shipping_method_name,
      estimatedDelivery: '4-5 dias úteis'
    };

    // Enviar para Gelato (em background, não bloqueante)
    processGelatoOrder(order, lineItems, {
      address: finalShippingAddress,
      name: finalShippingName,
      phone: finalShippingPhone,
      methodUid: orderData.shipping_method_uid
    }).catch(error => {
      console.error('Erro ao processar pedido Gelato:', error);
      // Não falhar a resposta por causa disso
    });

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        error: `Erro Stripe: ${error.message}` 
      });
    }

    res.status(500).json({ 
      error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
    });
  }
}

// Interface para dados de envio para Gelato
interface GelatoShippingData {
  address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  name: string;
  phone: string | null;
  methodUid: string;
}

// Função auxiliar para processar pedido no Gelato (não bloqueante)
async function processGelatoOrder(
  order: { id: string; order_reference: string }, 
  lineItems: Stripe.LineItem[],
  shippingData: GelatoShippingData
) {
  try {
    console.log('Iniciando processamento Gelato para pedido:', order.order_reference);
    
    // Log dos dados de envio extraídos do Stripe
    console.log('Dados de envio para Gelato:', {
      name: shippingData.name,
      address: shippingData.address,
      phone: shippingData.phone,
      shippingMethod: shippingData.methodUid
    });
    
    // Dados dos produtos para Gelato
    console.log('Line items para Gelato:', lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      amount: item.amount_total
    })));
    
    // Aqui seria a integração real com a API da Gelato
    // Poderia construir o payload completo para Create Order:
    // - shippingAddress com shippingData.address
    // - shipmentMethodUid com shippingData.methodUid
    // - orderItems baseado nos lineItems
    
    // Atualizar status do pedido
    const { error: updateError } = await supabaseAdmin
      .from('gelato_orders')
      .update({ 
        gelato_status: 'processing',
        gelato_processed_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      throw new Error('Erro ao atualizar status Gelato: ' + updateError.message);
    }

    console.log('Pedido preparado para Gelato com sucesso:', order.order_reference);
    
  } catch (error) {
    console.error('Erro no processamento Gelato:', error);
    
    // Marcar como erro mas não falhar o pedido principal
    await supabaseAdmin
      .from('gelato_orders')
      .update({ 
        gelato_status: 'error',
        gelato_error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      .eq('id', order.id);
  }
} 