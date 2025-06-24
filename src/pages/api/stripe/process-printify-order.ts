import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { printifyFetch } from '../../../lib/printify/printifyApi';
import { PrintifyShippingAddress, PrintifyOrderCreationPayload } from '../../../lib/printify/printifyTypes';
import { getPrintifyProduct } from '../../../lib/printify/printifyProducts';

// ✅ Mapeamento para normalizar nomes de distritos de valores alfanuméricos para nomes completos
const REGION_MAP: Record<string, string> = {
  'Aveiro': 'Aveiro',
  'Beja': 'Beja',
  'Braga': 'Braga',
  'Braganca': 'Bragança', // Correção
  'CasteloBranco': 'Castelo Branco', // Correção
  'Coimbra': 'Coimbra',
  'Evora': 'Évora', // Correção
  'Faro': 'Faro',
  'Guarda': 'Guarda',
  'Leiria': 'Leiria',
  'Lisboa': 'Lisboa',
  'Portalegre': 'Portalegre',
  'Porto': 'Porto',
  'Santarem': 'Santarém', // Correção
  'Setubal': 'Setúbal', // Correção
  'VianaDoCastelo': 'Viana do Castelo', // Correção
  'VilaReal': 'Vila Real', // Correção
  'Viseu': 'Viseu',
  'Acores': 'Açores', // Correção
  'Madeira': 'Madeira', // Correção
};

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

// Interface para cart item (SIMPLIFICADO - compatível com cartTypes.ts)
interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  userImageUrl: string; // A URL da imagem do cliente. Essencial!
  userImageId?: string; // ID da transformação para tracking
  price: number;
  quantity: number;
  customizations: { // Guarda as escolhas do user
    variantId: number; // ID da variante (cor/tamanho) da Printify
    size?: string;
    color?: string;
    variant?: string;
    phoneModel?: string; // Para capas de telemóvel
    paperType?: string; // Para cadernos
    selectedPhraseText?: string; // Para sweat de criança
    canvasEdgeType?: 'regular' | 'mirror' | 'off'; // Para Canvas Sem Borda
    frameColor?: string; // Para Canvas com Moldura
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

// Mapeamento de métodos de envio (UIDs internos/Gelato) para códigos Printify
// Adapta estes UIDs para os que vêm do tempData.shipping_method.uid
const SHIPPING_METHOD_MAP: Record<string, number> = {
  // UIDs do sistema Gelato anterior
  'gelato_standard_shipping_uid': 1, // Exemplo: UID do sistema para standard
  'gelato_express_shipping_uid': 2,  // Exemplo: UID do sistema para express/priority
  
  // UIDs diretos (caso o frontend envie diretamente)
  'standard': 1,
  'priority': 2,
  'express': 3,
  'economy': 4,
  
  // Possíveis UIDs específicos do sistema (adicionar conforme necessário)
  'standard_shipping': 1,
  'express_shipping': 2,
  'priority_shipping': 2,
  'overnight_shipping': 4
};

// ✅ CONSTANTE: Telefone placeholder para Portugal
const PHONE_PLACEHOLDER = '+351912345678';

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

    // ✅ MELHORADO: Extrair telefone de forma robusta (Stripe shipping_details tem prioridade)
    const customerPhone = shippingDetails?.phone || 
                         customerDetails?.phone || 
                         null;

    // ✅ VALIDAÇÃO: Garantir que temos um telefone válido para Printify
    if (!customerPhone || customerPhone.length < 5) {
      console.warn('⚠️ Telefone não fornecido pelo cliente ou inválido, usando placeholder:', PHONE_PLACEHOLDER);
      // Idealmente o Stripe deveria forçar a recolha do telefone
    }

    const finalPhone = customerPhone || PHONE_PLACEHOLDER; // Garante que há um número válido

    // ✅ DEBUG: Log da extração de telefone
    console.log('📞 Extração de telefone:', {
      fromShipping: shippingDetails?.phone,
      fromCustomer: customerDetails?.phone,
      final: finalPhone
    });

    // ✅ NOVO: Extrair o valor do custom_field 'district'
    // 'session.custom_fields' é um array de objetos { key: 'district', value: 'Porto' }
    const customFields = session.custom_fields || [];
    const districtField = customFields.find(field => field.key === 'district');
    // O valor do dropdown virá em 'text.value' ou 'dropdown.value' dependendo do tipo/Stripe API version.
    // Usamos 'value' que é o valor alfanumérico.
    const rawDistrictValueFromStripe = districtField?.dropdown?.value || districtField?.text?.value || null;

    // ✅ NOVO: Aplicar o mapeamento para normalizar o nome do distrito
    const finalRegion = rawDistrictValueFromStripe ? REGION_MAP[rawDistrictValueFromStripe] || rawDistrictValueFromStripe : '';
    // Se o mapeamento falhar, usa o valor raw, ou um fallback vazio se for null.
    // Garante que finalRegion não é null ou undefined.

    // Garantir que temos um endereço válido
    const rawAddress = shippingDetails?.address || customerDetails?.address || {};

    // ✅ DEBUG: Log da extração de região
    console.log('📍 Extração de região:', {
      fromCustomField: rawDistrictValueFromStripe,
      mappedDistrict: rawDistrictValueFromStripe ? REGION_MAP[rawDistrictValueFromStripe] : null,
      fromStripeState: rawAddress.state,
      fromMetadata: metadata.debug_region,
      final: finalRegion,
      reasoning: rawDistrictValueFromStripe ? 'Custom field district fornecido e mapeado' : rawAddress.state ? 'Stripe forneceu state' : metadata.debug_region ? 'Usando metadata debug' : 'Usando fallback vazio'
    });
    
    // ✅ DEBUG: Log dos dados brutos do endereço do Stripe
    console.log('📍 Dados brutos do endereço Stripe:', {
      shippingAddress: shippingDetails?.address,
      customerAddress: customerDetails?.address,
      rawAddress,
      customerPhone: finalPhone,
      validPhone: finalPhone,
      extractedRegion: rawAddress.state,
      finalRegion: finalRegion
    });
    
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
      address1: rawAddress.line1 || '',
      address2: rawAddress.line2 || undefined, // Printify aceita undefined para address2
      city: rawAddress.city || '',
      zip: rawAddress.postal_code || '',
      country: rawAddress.country || '',
      email: customerEmail,
      phone: finalPhone, // ✅ ROBUSTO: Vem do Stripe ou fallback válido
      region: finalRegion, // ✅ ROBUSTO: Use o 'state' do Stripe (distrito em PT) ou string vazia
    };

    // ✅ DEBUG: Log do endereço construído para Printify
    console.log('📋 Endereço Printify construído:', JSON.stringify(printifyShippingAddress, null, 2));
    console.log('📋 Campos críticos verificados:', {
      hasPhone: !!printifyShippingAddress.phone,
      hasRegion: !!printifyShippingAddress.region,
      phoneLength: printifyShippingAddress.phone?.length,
      regionValue: printifyShippingAddress.region || 'VAZIO'
    });

    // ✅ VALIDAÇÃO: Verificar se região foi fornecida pelo Stripe
    if (!finalRegion || finalRegion.length < 2) {
      console.warn('⚠️ AVISO: Região (distrito) não fornecida pelo Stripe ou muito curta:', finalRegion);
      console.warn('⚠️ Isto pode causar falha na validação da Printify');
      // Não vamos falhar aqui, mas vamos registar o aviso
      // Se a Printify rejeitar, será visível nos logs
    }

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
      customer_phone: finalPhone,
      
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
      
      // Mapear método de envio (FORÇAR PARA STANDARD PARA TESTE FINAL)
      const shippingMethodId = 1; // FORÇADO PARA STANDARD (código 1) para o teste final
      
      // Log do mapeamento para debug
      console.log('🚚 Mapeamento de método de envio:', {
        originalUid: shippingMethodData.uid,
        mappedId: SHIPPING_METHOD_MAP[shippingMethodData.uid],
        forcedId: shippingMethodId,
        note: 'FORÇADO PARA STANDARD (1) para teste final'
      });
      
      // Construir line_items para Printify usando método "on-the-fly" SEMPRE
      // Agora todos os produtos são criados dinamicamente usando apenas:
      // - blueprint_id + print_provider_id + variant_id + print_areas
      // Não mais produtos pré-criados ou IDs específicos
      const printifyLineItems = [];

      for (const cartItem of cartItems) {
        console.log(`📦 Building on-the-fly line item for product: ${cartItem.productId}`);
        
        // Mapear ProductId para configuração Printify
        const productMapping = getPrintifyProduct(cartItem.productId);
        if (!productMapping) {
          throw new Error(`Product mapping not found for: ${cartItem.productId}`);
        }

        console.log(`✅ Product mapping found: ${productMapping.name}`);

        if (!productMapping.printifyBlueprintId || !productMapping.printifyPrintProviderId) {
          throw new Error(`Product ${cartItem.productId} missing Printify blueprint/provider configuration`);
        }

        // Usar variantId do carrinho (obrigatório agora)
        const variantId = cartItem.customizations.variantId;
        if (!variantId) {
          throw new Error(`Missing variantId in customizations for product: ${cartItem.productId}`);
        }

        // Obter configuração da área de impressão
        const printAreaConfig = productMapping.printAreasConfig?.[0];
        if (!printAreaConfig) {
          throw new Error(`Print area configuration not found for product: ${cartItem.productId}`);
        }

        // ✅ CORREÇÃO: Usar URL da imagem do usuário diretamente (campo 'src')
        // A Printify aceita URLs públicas diretamente no campo 'src'
        const userImageUrl = cartItem.userImageUrl;
        if (!userImageUrl) {
          throw new Error(`Missing userImageUrl for product: ${cartItem.productId}`);
        }

        // Construir line item "on-the-fly" com campo 'src' correto
        const lineItem = {
          blueprint_id: productMapping.printifyBlueprintId,
          print_provider_id: productMapping.printifyPrintProviderId,
          variant_id: variantId,
          quantity: cartItem.quantity,
          print_areas: [
            {
              variant_ids: [variantId],
              placeholders: [
                {
                  position: printAreaConfig.position,
                  images: [
                    {
                      src: userImageUrl, // ✅ CORREÇÃO: usar 'src' em vez de 'id'
                      x: cartItem.imageAdjustments?.x || printAreaConfig.defaultX,
                      y: cartItem.imageAdjustments?.y || printAreaConfig.defaultY,
                      scale: cartItem.imageAdjustments?.scale || printAreaConfig.defaultScale,
                      angle: cartItem.imageAdjustments?.rotation || printAreaConfig.defaultAngle
                    }
                  ]
                }
              ]
            }
          ]
        };

        printifyLineItems.push(lineItem);
        console.log('✅ On-the-fly line item added:', lineItem);
      }

      // Construir payload para Printify
      const printifyPayload: PrintifyOrderCreationPayload = {
        external_id: `PICTUZ-${Date.now()}-${savedOrder.user_id.substring(0, 8)}`,
        line_items: printifyLineItems,
        shipping_method: shippingMethodId,
        address_to: printifyShippingAddress
      };

      console.log('📤 Payload Printify:', JSON.stringify(printifyPayload, null, 2));

      // --- NOVO: Tentar calcular o custo de envio primeiro ---
      console.log('🔄 Verificando custos de envio com a Printify API...');
      const shippingCalculationPayload = {
        line_items: printifyLineItems, // Use os mesmos line_items que vai usar no pedido final
        address_to: printifyShippingAddress, // Use o mesmo address_to que vai usar no pedido final
      };

      const shippingCostsResponse = await printifyFetch(
        `/shops/${process.env.PRINTIFY_SHOP_ID}/orders/shipping.json`,
        {
          method: 'POST',
          body: JSON.stringify(shippingCalculationPayload),
        }
      );
      console.log('✅ Resposta de Cálculo de Envio Printify:', shippingCostsResponse);

      // A Printify devolve um objeto com os métodos disponíveis (standard, express, etc.)
      // Ex: { "standard": 1000, "priority": 5000 }

      // Valide se o shipping_method que está a usar (ex: 2 para 'priority') está na resposta
      let validShippingMethodFound = false;
      let chosenShippingCost = 0;
      let chosenShippingMethodName = '';

      // Mapear o número do método de volta para o nome que a Printify usa na resposta
      const shippingMethodMap: { [key: number]: string } = {
        1: 'standard',
        2: 'priority',
        3: 'printify_express',
        4: 'economy',
      };

      const requestedMethodName = shippingMethodMap[shippingMethodId]; // O seu shipping_method (ex: 2 -> 'priority')

      if (requestedMethodName && shippingCostsResponse[requestedMethodName]) {
        validShippingMethodFound = true;
        chosenShippingCost = shippingCostsResponse[requestedMethodName];
        chosenShippingMethodName = requestedMethodName;
        console.log(`✅ Método de envio "${chosenShippingMethodName}" (${shippingMethodId}) disponível. Custo: ${chosenShippingCost}`);
      } else {
        console.error(`❌ ERRO: Método de envio "${requestedMethodName}" (${shippingMethodId}) NÃO DISPONÍVEL para esta morada/produto.`);
        throw new Error(`Failed to create order: Shipping method "${requestedMethodName}" is not available.`);
      }
      // --- FIM: Tentar calcular o custo de envio primeiro ---

      // Chamar API Printify
      const shopId = process.env.PRINTIFY_SHOP_ID;
      if (!shopId) {
        throw new Error('PRINTIFY_SHOP_ID not configured');
      }

      console.log('🚀 Chamando API Printify para criar pedido...');
      const printifyOrderResult = await printifyFetch(`shops/${shopId}/orders.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printifyPayload)
      });

      console.log('📥 Resposta da API Printify:', JSON.stringify(printifyOrderResult, null, 2));

      // ✅ FINALIZADOR: A resposta da Printify é o próprio objeto do pedido.
      // Se printifyOrderResult tiver um id, assume que a criação foi um sucesso.
      if (!printifyOrderResult || !printifyOrderResult.id) {
        // Se não houver um objeto ou ID de pedido, então é um erro real.
        throw new Error('Failed to create order in Printify: No order ID returned.');
      }

      const printifyOrderId = printifyOrderResult.id;
      // O status na resposta de criação pode ser 'on-hold', 'pending', ou até undefined.
      // Usar 'on-hold' como default se não for fornecido para refletir o estado real na Printify.
      const printifyOrderStatus = printifyOrderResult.status || 'on-hold'; // Default para 'on-hold'

      console.log('✅ Pedido enviado para Printify com sucesso. ID:', printifyOrderId, 'Status:', printifyOrderStatus);

      // 8. ATUALIZAR DB COM SUCESSO PRINTIFY
      const { error: updateError } = await supabaseAdmin
        .from('printify_orders')
        .update({
          printify_order_id: printifyOrderId,
          printify_status: printifyOrderStatus, // Status real do pedido Printify
          status: 'processing', // Status interno do seu sistema (ou 'on-hold' se quiser refletir)
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
        printifyOrderId: printifyOrderId,
        printifyStatus: printifyOrderStatus, // Status real da Printify
        status: 'processing',
        estimatedDelivery: '7-14 dias úteis',
        customerEmail: customerEmail,
        customerName: customerName,
        total: savedOrder.total_amount || 0, // ✅ GARANTIR QUE É UM NÚMERO
        subtotal: savedOrder.subtotal_amount || 0, // ✅ ADICIONAR SUBTOTAL
        shipping: savedOrder.shipping_amount || 0, // ✅ ADICIONAR SHIPPING
        tax: savedOrder.tax_amount || 0, // ✅ ADICIONAR TAX
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
        supportNeeded: true,
        // ✅ INCLUIR DADOS FINANCEIROS MESMO EM ERRO PARA EVITAR UNDEFINED
        customerEmail: customerEmail,
        customerName: customerName,
        status: 'failed',
        total: savedOrder.total_amount || 0,
        subtotal: savedOrder.subtotal_amount || 0,
        shipping: savedOrder.shipping_amount || 0,
        tax: savedOrder.tax_amount || 0,
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