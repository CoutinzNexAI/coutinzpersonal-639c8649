import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { gelatoFetch } from '../../../lib/gelato/gelatoApi';

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

// Interface para endereço Gelato
interface GelatoShippingAddress {
  companyName?: string | null;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  postCode: string;
  state?: string | null;
  country: string;
  email: string;
  phone?: string | null;
}

// Interface para cart item (compatível com cartTypes.ts)
interface CartItem {
  id: string;
  productId: string;
  productUid: string;
  productName: string;
  productCategory: string;
  userImageUrl: string;
  userImageId?: string;
  price: number;
  quantity: number;
  customizations?: {
    size?: string;
    color?: string;
    variant?: string;
  };
  imageAdjustments?: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
    cropArea?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  addedAt: Date;
}

// Interface para dados do checkout temporário
interface CheckoutTempData {
  checkout_reference: string;
  user_id: string;
  cart_items: CartItem[];
  shipping_method: {
    uid: string;
    name: string;
    price: number;
    deliveryDaysMin: number;
    deliveryDaysMax: number;
    description?: string;
  };
  financial_data: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
}

// Estender a interface Session do Stripe
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
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionId, userId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID é obrigatório' });
    }

    console.log(`🔄 Processando pedido para sessão: ${sessionId}`);

    // 1. RECUPERAR SESSÃO DO STRIPE
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'payment_intent']
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Sessão não encontrada' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Pagamento não confirmado' });
    }

    // 2. RECUPERAR DADOS DO CHECKOUT TEMPORÁRIO
    const metadata = session.metadata || {};
    const checkoutReference = metadata.checkoutReference;
    const orderReference = metadata.orderReference;

    if (!checkoutReference) {
      return res.status(400).json({ 
        success: false, 
        error: 'Referência do checkout não encontrada nos metadata da sessão' 
      });
    }

    if (!orderReference) {
      return res.status(400).json({ 
        success: false, 
        error: 'Referência do pedido não encontrada nos metadata da sessão' 
      });
    }

    console.log(`📋 Recuperando dados do checkout: ${checkoutReference}`);

    const { data: checkoutData, error: fetchError } = await supabaseAdmin
      .from('checkout_sessions_temp')
      .select('*')
      .eq('checkout_reference', checkoutReference)
      .single();

    if (fetchError || !checkoutData) {
      console.error('❌ Erro ao recuperar dados do checkout:', fetchError);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao recuperar dados do checkout. Sessão pode ter expirado.' 
      });
    }

    const tempData = checkoutData as CheckoutTempData;
    const cartItems = tempData.cart_items;
    const shippingMethodData = tempData.shipping_method;
    const financialData = tempData.financial_data;

    console.log('✅ Dados do checkout recuperados:', {
      cartItemsCount: cartItems.length,
      checkoutReference,
      orderReference,
      total: financialData.total
    });

    // 3. EXTRAÇÃO DOS DADOS DO CLIENTE DO STRIPE
    const shippingDetails = (session as ExtendedSession).shipping_details || null;
    const customerDetails = session.customer_details || null;
    
    console.log('📦 Dados extraídos do Stripe:', {
      hasShipping: !!shippingDetails,
      hasCustomer: !!customerDetails,
      sessionEmail: session.customer_email,
      lineItemsCount: session.line_items?.data?.length || 0
    });

    // Prioridade para extrair informações do cliente
    const customerEmail = customerDetails?.email || 
                         session.customer_email || 
                         'email-nao-encontrado@example.com';

    const customerName = shippingDetails?.name || 
                        customerDetails?.name || 
                        metadata.userName || 
                        'Nome Desconhecido';

    const customerPhone = shippingDetails?.phone || 
                         customerDetails?.phone || 
                         null;

    // Garantir que temos um endereço válido
    const rawAddress = shippingDetails?.address || customerDetails?.address || {};
    
    if (!rawAddress.line1 || !rawAddress.city || !rawAddress.postal_code || !rawAddress.country) {
      console.error('❌ Endereço de envio incompleto:', rawAddress);
      return res.status(400).json({ 
        success: false, 
        error: 'Endereço de envio incompleto. Verifique os dados no checkout.' 
      });
    }

    // Formato do endereço para Gelato
    const nameParts = customerName.split(' ');
    const gelatoShippingAddress: GelatoShippingAddress = {
      companyName: null,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      addressLine1: rawAddress.line1,
      addressLine2: rawAddress.line2 || null,
      city: rawAddress.city,
      postCode: rawAddress.postal_code,
      state: rawAddress.state || null,
      country: rawAddress.country,
      email: customerEmail,
      phone: customerPhone,
    };

    // 4. PREPARAR DADOS DO PEDIDO PARA DB
    // O orderReference agora vem dos metadata do Stripe
    
    // Extrair dados do primeiro item do carrinho (para campos obrigatórios)
    const firstItem = cartItems[0];
    if (!firstItem) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhum item encontrado no carrinho' 
      });
    }

    // Garantir que temos transformation_id (obrigatório na DB)
    const transformationId = firstItem.userImageId;
    if (!transformationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID da transformação não encontrado no primeiro item do carrinho' 
      });
    }

    const orderData = {
      // ✅ CAMPOS OBRIGATÓRIOS DA TABELA
      user_id: userId || metadata.userId,
      transformation_id: transformationId, // ✅ OBRIGATÓRIO: UUID da transformação
      product_id: firstItem.productId, // ✅ OBRIGATÓRIO: ID do produto
      product_name: firstItem.productName, // ✅ OBRIGATÓRIO: Nome do produto
      product_category: firstItem.productCategory, // ✅ OBRIGATÓRIO: Categoria
      user_image_url: firstItem.userImageUrl, // ✅ OBRIGATÓRIO: URL da imagem
      price: firstItem.price, // ✅ OBRIGATÓRIO: Preço por item
      
      // ✅ CAMPOS COM DEFAULTS
      currency: 'EUR',
      quantity: firstItem.quantity || 1,
      
      // ✅ STRIPE E GELATO IDS
      gelato_order_id: null, // Será preenchido após chamada Gelato
      order_reference: orderReference, // ✅ Referência interna dos metadata
      
      // ✅ CAMPOS CRÍTICOS DO CLIENTE
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      
      // ✅ DADOS FINANCEIROS - NOMES CORRECTOS DAS COLUNAS
      total_amount: financialData.total, // ✅ CORRIGIDO: era total_amount não total_amount
      subtotal_amount: financialData.subtotal, // ✅ CORRIGIDO: era subtotal não subtotal_amount  
      shipping_amount: financialData.shipping, // ✅ CORRIGIDO: era shipping_cost não shipping_amount
      tax_amount: financialData.tax, // ✅ CORRECTO: tax_amount
      
      // ✅ DADOS JSONB
      customizations: firstItem.customizations || null,
      shipping_info: gelatoShippingAddress, // ✅ OBRIGATÓRIO: JSONB do endereço
      payment_info: { // JSONB com info do pagamento
        stripe_session_id: sessionId,
        stripe_payment_intent_id: typeof session.payment_intent === 'string' 
          ? session.payment_intent 
          : session.payment_intent?.id || null,
        customer_details: session.customer_details,
        amount_total: session.amount_total,
        currency: session.currency
      },
      items: cartItems, // Array JSONB completo dos itens do carrinho
      
      // ✅ STATUS INICIAL
      status: 'payment_processed_db_saved',
      gelato_status: null, // Ainda não enviado para Gelato
      
      // ✅ CAMPOS DE TRACKING (nulls por agora)
      tracking_number: null,
      tracking_url: null,
      
      // ✅ TIMESTAMPS (serão auto-preenchidos mas podemos especificar)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 Salvando pedido na base de dados com schema completo...');
    console.log('📋 Dados do pedido preparados:', {
      user_id: orderData.user_id,
      transformation_id: orderData.transformation_id,
      product_id: orderData.product_id,
      order_reference: orderData.order_reference,
      total_amount: orderData.total_amount,
      cartItemsCount: cartItems.length
    });

    // 5. INSERÇÃO CRÍTICA NA BASE DE DADOS (DEVE SER BEM-SUCEDIDA)
    const { data: savedOrder, error: dbError } = await supabaseAdmin
      .from('gelato_orders')
      .insert(orderData)
      .select()
      .single();

    if (dbError) {
      console.error('❌ ERRO CRÍTICO: Falha ao salvar pedido na base de dados:', dbError);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao salvar pedido na base de dados: ' + dbError.message,
        details: dbError
      });
    }

    console.log('✅ Pedido salvo com sucesso na DB:', {
      orderId: savedOrder.id,
      orderReference: orderReference
    });

    // 6. LIMPEZA DOS DADOS TEMPORÁRIOS
    await supabaseAdmin
      .from('checkout_sessions_temp')
      .delete()
      .eq('checkout_reference', checkoutReference);

    console.log('🧹 Dados temporários do checkout removidos');

    // 7. CHAMADA BLOQUEANTE À API GELATO
    let gelatoOrderResult;
    
    try {
      console.log('🚀 Enviando pedido para Gelato API...');
      
      // Construir payload para Gelato baseado nos cart items completos
      const gelatoItems = cartItems.map((item: CartItem) => ({
        productUid: item.productUid || 'canvas_200x200-mm-8x8-inch_canvas_wood-fsc-slim_4-0_ver', // Usar o productUid real do cart
        quantity: item.quantity || 1,
        files: [
          {
            type: 'default',
            url: 'https://example.com/print-file.pdf' // TODO: gerar print file real baseado na transformação do item.userImageUrl
          }
        ]
      }));

      const gelatoPayload = {
        orderType: "order",
        orderReferenceId: savedOrder.id,
        customerReferenceId: savedOrder.user_id,
        currency: savedOrder.currency,
        items: gelatoItems,
        shippingAddress: gelatoShippingAddress,
        shipmentMethodUid: shippingMethodData.uid // Usar dados do checkout temporário
      };

      console.log('📤 Payload Gelato:', JSON.stringify(gelatoPayload, null, 2));

      gelatoOrderResult = await gelatoFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(gelatoPayload)
      });

      console.log('✅ Pedido enviado para Gelato com sucesso:', gelatoOrderResult);

      // 8. ATUALIZAR DB COM SUCESSO GELATO
      const { error: updateError } = await supabaseAdmin
        .from('gelato_orders')
        .update({
          gelato_order_id: gelatoOrderResult.id,
          gelato_status: gelatoOrderResult.fulfillmentStatus || 'submitted',
          status: 'processing', // Agora está realmente em processamento na Gelato
          updated_at: new Date().toISOString()
        })
        .eq('id', savedOrder.id);

      if (updateError) {
        console.error('⚠️ ERRO: Falha ao atualizar DB com ID Gelato:', updateError);
        // Não é crítico, mas deve ser registado
      }

      // 9. RESPOSTA DE SUCESSO COMPLETO
      return res.status(200).json({
        success: true,
        message: "Pedido processado com sucesso e enviado para a Gelato!",
        orderId: savedOrder.id,
        orderReference: orderReference,
        gelatoOrderId: gelatoOrderResult.id,
        status: 'processing',
        estimatedDelivery: '4-5 dias úteis',
        customerEmail: customerEmail,
        customerName: customerName,
        total: savedOrder.total_amount
      });

    } catch (gelatoError: unknown) {
      console.error('❌ ERRO CRÍTICO: Falha ao enviar pedido para a Gelato API:', gelatoError);
      
      // 10. MARCAR COMO ERRO GELATO NA DB
      const errorMessage = gelatoError instanceof Error ? gelatoError.message : 'Erro desconhecido na API Gelato';
      
      await supabaseAdmin
        .from('gelato_orders')
        .update({
          gelato_status: 'failed_gelato_api',
          status: 'cancelled', // Usar status válido do constraint check
          updated_at: new Date().toISOString()
        })
        .eq('id', savedOrder.id);

      // 11. RESPOSTA DE ERRO GELATO (PAGAMENTO FOI PROCESSADO MAS GELATO FALHOU)
      return res.status(500).json({
        success: false,
        message: "O pagamento foi processado, mas houve um erro ao enviar o pedido para a Gelato. Contacte o suporte.",
        orderId: savedOrder.id,
        orderReference: orderReference,
        error: errorMessage,
        supportNeeded: true
      });
    }

  } catch (error) {
    console.error('❌ Erro geral no processo:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        success: false,
        error: `Erro Stripe: ${error.message}` 
      });
    }

    return res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido')
    });
  }
} 