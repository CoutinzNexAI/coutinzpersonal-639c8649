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
    x?: number;
    y?: number;
    scale?: number;
    angle?: number;
    print_on_side?: 'mirror' | 'regular' | 'off'; // Para produtos que suportam print details (canvas)
  };
  printDetails?: {
    print_on_side?: 'mirror' | 'regular' | 'off'; // Para produtos com bordas especiais
    position?: string; // Posição da área de impressão (ex: 'front', 'back')
    defaultScale?: number; // Escala padrão para este produto específico
    defaultX?: number; // Posição X padrão
    defaultY?: number; // Posição Y padrão
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
    originalSubtotal?: number;
    discountAmount?: number;
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
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido' 
    });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID é obrigatório' 
      });
    }

    // 1. RECUPERAR SESSÃO DO STRIPE
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'line_items', 'customer_details']
    });
    } catch (stripeError) {
      console.error('❌ Erro ao recuperar sessão do Stripe:', stripeError);
      return res.status(400).json({ 
        success: false, 
        error: 'Sessão de pagamento inválida' 
      });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        error: 'Pagamento não foi processado com sucesso' 
      });
    }

    // 2. EXTRAIR METADATA E DADOS FINANCEIROS
    const metadata = session.metadata || {};
    const { checkoutReference, orderReference } = metadata;

    if (!checkoutReference) {
      return res.status(400).json({ 
        success: false, 
        error: 'Referência do checkout não encontrada' 
      });
    }

    // 3. RECUPERAR DADOS TEMPORÁRIOS DO CHECKOUT
    const { data: tempCheckout, error: fetchError } = await supabaseAdmin
      .from('checkout_sessions_temp')
      .select('*')
      .eq('checkout_reference', checkoutReference)
      .single();

    if (fetchError || !tempCheckout) {
      console.error('❌ Erro ao recuperar dados do checkout:', fetchError);
      return res.status(400).json({ 
        success: false, 
        error: 'Dados do checkout não encontrados' 
      });
    }

    const { cart_items: cartItems, shipping_method: shippingMethod, financial_data: financialData } = tempCheckout;

    // 4. EXTRAÇÃO DOS DADOS DO CLIENTE DO STRIPE
    const shippingDetails = (session as ExtendedSession).shipping_details || null;
    const customerDetails = session.customer_details || null;

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

    // Log telefone apenas se houver problema
    if (!finalPhone || finalPhone === PHONE_PLACEHOLDER) {
      console.warn('⚠️ Telefone não fornecido pelo cliente, usando placeholder');
    }

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

    // Log região apenas se houver problemas
    if (!finalRegion || finalRegion.length < 2) {
      console.warn('⚠️ Região (distrito) não fornecida ou inválida:', finalRegion);
    }
    
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

    // Validação crítica do endereço Printify
    if (!printifyShippingAddress.phone || !printifyShippingAddress.region) {
      console.warn('⚠️ Endereço Printify com campos críticos em falta:', {
      hasPhone: !!printifyShippingAddress.phone,
        hasRegion: !!printifyShippingAddress.region
    });
    }

    // ✅ VALIDAÇÃO: Verificar se região foi fornecida pelo Stripe
    if (!finalRegion || finalRegion.length < 2) {
      console.warn('⚠️ AVISO: Região (distrito) não fornecida pelo Stripe ou muito curta:', finalRegion);
      console.warn('⚠️ Isto pode causar falha na validação da Printify');
      // Não vamos falhar aqui, mas vamos registar o aviso
      // Se a Printify rejeitar, será visível nos logs
    }

    // 5. PREPARAR DADOS DO PEDIDO PARA DB
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
      user_id: metadata.userId,
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

    // 6. INSERÇÃO CRÍTICA NA BASE DE DADOS (DEVE SER BEM-SUCEDIDA)
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

    // 7. LIMPEZA DOS DADOS TEMPORÁRIOS
    await supabaseAdmin
      .from('checkout_sessions_temp')
      .delete()
      .eq('checkout_reference', checkoutReference);

    // 8. CHAMADA BLOQUEANTE À API PRINTIFY
    try {
      // Mapear método de envio (FORÇAR PARA STANDARD PARA TESTE FINAL)
      const shippingMethodId = 1; // FORÇADO PARA STANDARD (código 1) para o teste final
      
      // Construir line_items para Printify usando método "on-the-fly" SEMPRE
      // Agora todos os produtos são criados dinamicamente usando apenas:
      // - blueprint_id + print_provider_id + variant_id + print_areas
      // Não mais produtos pré-criados ou IDs específicos
      const printifyLineItems = [];

      for (const cartItem of cartItems) {
        
        // Mapear ProductId para configuração Printify
        const productMapping = getPrintifyProduct(cartItem.productId);
        if (!productMapping) {
          throw new Error(`Product mapping not found for: ${cartItem.productId}`);
        }

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

        // Construir line item "on-the-fly" com estrutura correta para API de encomendas
        const lineItem: {
          blueprint_id: number;
          print_provider_id: number;
          variant_id: number;
          quantity: number;
          print_areas: Record<string, Array<{
            src: string;
            x: number;
            y: number;
            scale: number;
            angle: number;
          }>>;
          print_details?: {
            print_on_side: string;
          };
        } = {
          blueprint_id: productMapping.printifyBlueprintId,
          print_provider_id: productMapping.printifyPrintProviderId,
          variant_id: variantId,
          quantity: cartItem.quantity,
          print_areas: {
            // ✅ CORREÇÃO CRÍTICA: print_areas deve ser OBJETO {}, não ARRAY []
            // A chave é o nome da posição (ex: "front", "back")
            [printAreaConfig.position]: [
                    {
                src: userImageUrl, // ✅ URL da imagem do cliente
                // ✅ NOVA PRIORIDADE: Usar customizations primeiro (a "receita" definida)
                // Se customizations tiver os campos, usar eles, senão usar imageAdjustments como fallback
                x: cartItem.customizations.x ?? cartItem.imageAdjustments?.x ?? printAreaConfig.defaultX,
                y: cartItem.customizations.y ?? cartItem.imageAdjustments?.y ?? printAreaConfig.defaultY,
                scale: cartItem.customizations.scale ?? cartItem.imageAdjustments?.scale ?? printAreaConfig.defaultScale,
                angle: cartItem.customizations.angle ?? cartItem.imageAdjustments?.rotation ?? printAreaConfig.defaultAngle
                    }
                  ]
            // Se no futuro houver produtos com várias áreas (frente + costas),
            // adicionar aqui: "back": [{ src: "...", x: ..., y: ..., etc }]
            }
        };

        // ✅ NOVA LÓGICA: Usar customizations.print_on_side como prioridade
        // Primeiro verifica se há print_on_side em customizations (nova "receita")
        if (productMapping.allowsPrintDetails && cartItem.customizations.print_on_side) {
          lineItem.print_details = {
            print_on_side: cartItem.customizations.print_on_side
          };
        }
        // FALLBACK: Se não houver customizations.print_on_side, usar printDetails (legacy)
        else if (productMapping.allowsPrintDetails && cartItem.printDetails?.print_on_side) {
          lineItem.print_details = {
            print_on_side: cartItem.printDetails.print_on_side
          };
        }
        // FALLBACK FINAL: Para Canvas sem customizations, usar canvasEdgeType (legacy)
        else if (cartItem.productId === 'custom_canvas' && cartItem.customizations.canvasEdgeType) {
          lineItem.print_details = {
            print_on_side: cartItem.customizations.canvasEdgeType
          };
        }

        printifyLineItems.push(lineItem);
      }

      // --- NOVO: Tentar calcular o custo de envio primeiro ---
      const shippingCostsResponse = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/orders/shipping-cost.json`, {
        method: 'POST',
        body: JSON.stringify({
          line_items: printifyLineItems,
          address_to: printifyShippingAddress
        })
      });

      if (!shippingCostsResponse || !shippingCostsResponse.shipping_cost) {
        throw new Error('Falha ao calcular custos de envio com a Printify');
      }

      // Verificar se o método de envio está disponível
      const availableShippingMethods = shippingCostsResponse.shipping_cost;
      const requestedMethodName = shippingMethod.name || 'Envio Standard';
      
      // Buscar o método pelo nome ou ID
      const chosenShippingMethod = availableShippingMethods.find((method: { service_name: string; service_id: number; cost: number }) => 
        method.service_name === requestedMethodName || method.service_id === shippingMethodId
      );

      if (!chosenShippingMethod) {
        console.error(`❌ ERRO: Método de envio "${requestedMethodName}" (${shippingMethodId}) NÃO DISPONÍVEL para esta morada/produto.`);
        throw new Error(`Método de envio não disponível: ${requestedMethodName}`);
      }

      const chosenShippingCost = chosenShippingMethod.cost;
      const chosenShippingMethodName = chosenShippingMethod.service_name;

      // Criar o pedido na Printify
      const printifyOrderPayload = {
        external_id: orderReference,
        line_items: printifyLineItems,
        shipping_method: shippingMethodId,
        send_shipping_notification: false,
        address_to: printifyShippingAddress
      };

      const printifyOrderResult = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/orders.json`, {
        method: 'POST',
        body: JSON.stringify(printifyOrderPayload)
      });

      if (!printifyOrderResult || !printifyOrderResult.id) {
        throw new Error('Falha ao criar pedido na Printify - resposta inválida');
      }

      const printifyOrderId = printifyOrderResult.id;
      const printifyOrderStatus = printifyOrderResult.status;

      // 9. ATUALIZAR DB COM SUCESSO PRINTIFY
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

      // 10. RESPOSTA DE SUCESSO COMPLETO
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
      
      // 11. MARCAR COMO ERRO PRINTIFY NA DB
      const errorMessage = printifyError instanceof Error ? printifyError.message : 'Erro desconhecido na API Printify';
      
      await supabaseAdmin
        .from('printify_orders')
        .update({
          printify_status: 'failed_printify_api',
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', savedOrder.id);

      // 12. RESPOSTA DE ERRO PRINTIFY (PAGAMENTO FOI PROCESSADO MAS PRINTIFY FALHOU)
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