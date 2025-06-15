import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { printifyFetch } from '../../../lib/printify/printifyApi';
import { PrintifyShippingAddress, PrintifyOrderCreationPayload } from '../../../lib/printify/printifyTypes';
// import { getPrintifyProduct, PrintifyProductMapping } from '../../../lib/printify/printifyProducts'; // Não necessário para produtos já criados

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

// Interface para cart item (compatível com cartTypes.ts)
interface CartItem {
  id: string;
  productId: string;
  productUid: string;
  productName: string;
  productCategory: string;
  userImageUrl: string;
  userImageId?: string;
  printifyImageId?: string; // ID da imagem na Printify
  printifyProductId?: string; // ID do produto temporário criado na Printify
  printifyVariantId?: number; // ID da variante do produto na Printify (number conforme API)
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

// Mapeamento de métodos de envio para códigos Printify
const SHIPPING_METHOD_MAP: Record<string, number> = {
  'standard': 1,
  'express': 2,
  'priority': 3,
  'overnight': 4
};

// Função utilitária para extrair transformation_id do URL de output
function extractTransformationIdFromUrl(outputUrl: string): string | null {
  try {
    // Padrão: /public/{user_id}/{transformation_id}/result_*.png
    const urlPattern = /\/public\/[^/]+\/([^/]+)\/result_/;
    const match = outputUrl.match(urlPattern);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Erro ao extrair transformation_id do URL:', error);
    return null;
  }
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

    // Formato do endereço para Printify
    const nameParts = customerName.split(' ');
    const printifyShippingAddress: PrintifyShippingAddress = {
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: customerEmail,
      phone: customerPhone || undefined,
      address1: rawAddress.line1,
      address2: rawAddress.line2 || undefined,
      city: rawAddress.city,
      region: rawAddress.state || undefined,
      zip: rawAddress.postal_code,
      country: rawAddress.country
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
    const transformationId = firstItem.userImageId || extractTransformationIdFromUrl(firstItem.userImageUrl);
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
      
      // ✅ PRINTIFY IDS (atualizados)
      printify_order_id: null, // Será preenchido após chamada Printify
      order_reference: orderReference, // ✅ Referência interna dos metadata
      
      // ✅ CAMPOS CRÍTICOS DO CLIENTE
      customer_email: customerEmail,
      customer_name: customerName,
      customer_phone: customerPhone,
      
      // ✅ DADOS FINANCEIROS - NOMES CORRECTOS DAS COLUNAS
      total_amount: financialData.total,
      subtotal_amount: financialData.subtotal,
      shipping_amount: financialData.shipping,
      tax_amount: financialData.tax,
      
      // ✅ DADOS JSONB
      customizations: firstItem.customizations || null,
      shipping_info: printifyShippingAddress, // ✅ OBRIGATÓRIO: JSONB do endereço
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
      
      // ✅ STATUS INICIAL - CORRIGIDO PARA PRINTIFY
      status: 'processing',
      printify_status: 'payment_processed_db_saved', // ✅ Estado interno do PicTuz
      
      // ✅ CAMPOS DE TRACKING (nulls por agora)
      tracking_number: null,
      tracking_url: null,
      
      // ✅ TIMESTAMPS (serão auto-preenchidos mas podemos especificar)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 Salvando pedido na base de dados com schema Printify...');
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
      .from('printify_orders') // ✅ ATUALIZADO: tabela printify_orders
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

    // 7. CHAMADA BLOQUEANTE À API PRINTIFY
    try {
      console.log('🚀 Enviando pedido para Printify API...');
      
      // Mapear método de envio
      const shippingMethodId = SHIPPING_METHOD_MAP[shippingMethodData.uid] || 1; // Default: standard
      
      // Construir line_items para Printify baseado nos cart items completos
      // NOTA: Esta lógica foi atualizada para usar produtos já criados na loja Printify
      // em vez de criar produtos on-the-fly com blueprint_id + print_areas
      // 
      // IMPORTANTE: Para produtos já existentes na loja Printify, usar APENAS:
      // - product_id: ID do produto criado
      // - variant_id: ID da variante do produto  
      // - quantity: Quantidade do pedido
      //
      // NÃO incluir print_provider_id, blueprint_id ou print_areas pois isso
      // faz a API pensar que queremos criar um produto "on-the-fly"
      const printifyLineItems = [];

      for (const item of cartItems) {
        // Verificar se o item tem os IDs do produto criado na Printify (Fase 3)
        if (!item.printifyProductId || !item.printifyVariantId) {
          throw new Error(`Missing Printify Product ID or Variant ID in cart item: ${item.id}`);
        }

        // --- CONSTRÓI O line_item APENAS PARA UM PRODUTO EXISTENTE NA LOJA PRINTIFY ---
        const lineItem = {
          product_id: item.printifyProductId, // O ID de STRING do produto JÁ criado na Printify (ex: "684edb998a7f6f02b7057248")
          variant_id: item.printifyVariantId, // O ID numérico da variante desse produto (ex: 82238)
          quantity: item.quantity || 1,
          // NÃO INCLUIR print_provider_id, blueprint_id, nem print_areas AQUI
          // Estes campos são apenas para criação "on-the-fly" de produtos
        };
        
        printifyLineItems.push(lineItem);
      }

      // Construir payload para Printify
      const printifyPayload: PrintifyOrderCreationPayload = {
        external_id: `PICTUZ-${Date.now()}-${savedOrder.user_id.substring(0, 8)}`,
        line_items: printifyLineItems,
        shipping_method: shippingMethodId,
        address_to: printifyShippingAddress
      };

      console.log('📤 Payload Printify:', JSON.stringify(printifyPayload, null, 2));

      // Chamar API Printify
      const shopId = process.env.PRINTIFY_SHOP_ID;
      if (!shopId) {
        throw new Error('PRINTIFY_SHOP_ID not configured');
      }

      const printifyOrderResult = await printifyFetch(`/shops/${shopId}/orders.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printifyPayload)
      });

      if (!printifyOrderResult.success) {
        throw new Error(printifyOrderResult.error || 'Failed to create order in Printify');
      }

      console.log('✅ Pedido enviado para Printify com sucesso:', printifyOrderResult.data);

      // 8. ATUALIZAR DB COM SUCESSO PRINTIFY
      const { error: updateError } = await supabaseAdmin
        .from('printify_orders')
        .update({
          printify_order_id: printifyOrderResult.data?.id,
          printify_status: printifyOrderResult.data?.status || 'submitted',
          status: 'processing', // Agora está realmente em processamento na Printify
          updated_at: new Date().toISOString()
        })
        .eq('id', savedOrder.id);

      if (updateError) {
        console.error('⚠️ ERRO: Falha ao atualizar DB com ID Printify:', updateError);
        // Não é crítico, mas deve ser registado
      }

      // 9. RESPOSTA DE SUCESSO COMPLETO
      return res.status(200).json({
        success: true,
        message: "Pedido processado com sucesso e enviado para a Printify!",
        orderId: savedOrder.id,
        orderReference: orderReference,
        printifyOrderId: printifyOrderResult.data?.id,
        status: 'processing',
        estimatedDelivery: '7-14 dias úteis',
        customerEmail: customerEmail,
        customerName: customerName,
        total: savedOrder.total_amount
      });

    } catch (printifyError: unknown) {
      console.error('❌ ERRO CRÍTICO: Falha ao enviar pedido para a Printify API:', printifyError);
      
      // 10. MARCAR COMO ERRO PRINTIFY NA DB
      const errorMessage = printifyError instanceof Error ? printifyError.message : 'Erro desconhecido na API Printify';
      
      await supabaseAdmin
        .from('printify_orders')
        .update({
          printify_status: 'failed_printify_api',
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', savedOrder.id);

      // 11. RESPOSTA DE ERRO PRINTIFY (PAGAMENTO FOI PROCESSADO MAS PRINTIFY FALHOU)
      return res.status(500).json({
        success: false,
        message: "O pagamento foi processado, mas houve um erro ao enviar o pedido para a Printify. Contacte o suporte.",
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