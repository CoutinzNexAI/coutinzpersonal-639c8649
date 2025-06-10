import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Desativa o parser de corpo padrão do Next.js para poder ler o raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

// Função para ler o raw body
async function getRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  
  const rawBodyBuffer = Buffer.concat(chunks);
  const rawBody = rawBodyBuffer.toString('utf8');
  
  // Log para debug (remover depois)
  console.log('📄 RAW_BODY_DEBUG:', {
    totalChunks: chunks.length,
    totalBytes: rawBodyBuffer.length,
    bodyLength: rawBody.length,
    bodyStart: rawBody.substring(0, 100),
    bodyEncoding: 'utf8'
  });
  
  return rawBody;
}

// Função para validar a assinatura do webhook
// A Gelato não usa HMAC - é uma comparação direta do header com o secret
function validateWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    // Remove prefixos se presentes (por precaução)
    const cleanSignatureFromHeader = signature.replace(/^sha256=/, '');
    const cleanSecret = secret.replace(/^sha256=/, '');
    
    // Log detalhado para debug
    console.log('🔍 DEBUG_DIRECT_SIGNATURE_VALIDATION:', {
      originalSignature: signature,
      cleanSignatureFromHeader: cleanSignatureFromHeader,
      cleanSecret: cleanSecret,
      signatureLength: cleanSignatureFromHeader.length,
      secretLength: cleanSecret.length,
      signatureFirst20: cleanSignatureFromHeader.substring(0, 20),
      secretFirst20: cleanSecret.substring(0, 20)
    });

    // Verificar se os comprimentos são iguais
    if (cleanSignatureFromHeader.length !== cleanSecret.length) {
      console.error('❌ Erro de comprimento na validação de webhook:', {
        headerLength: cleanSignatureFromHeader.length,
        secretLength: cleanSecret.length
      });
      return false;
    }

    // Comparação direta e segura usando timing-safe comparison
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(cleanSignatureFromHeader, 'utf8'),
      Buffer.from(cleanSecret, 'utf8')
    );
    
    console.log(isMatch ? '✅ Assinatura válida!' : '❌ Assinatura inválida!');
    
    return isMatch;
    
  } catch (error) {
    console.error('❌ Erro na validação da assinatura do webhook:', error);
    return false;
  }
}

// Tipos para os eventos do webhook da Gelato
interface GelatoWebhookEvent {
  id: string;                     // ID único do webhook
  event: string;                  // Tipo de evento (ex: "order_status_updated")
  orderId?: string;               // ID do pedido Gelato
  channel?: string;               // Canal da Gelato
  created?: string;               // Data de criação
  status?: string;                // Status do pedido/item
  orderStatus?: string;           // Status alternativo
  order_status?: string;          // Status alternativo
  fulfillmentStatus?: string;     // Status de fulfillment
  fullPayload?: Record<string, unknown>; // Payload completo para casos complexos
  [key: string]: unknown;         // Outros campos dinâmicos
}

// Função para mapear status da Gelato para status interno válido
function mapGelatoStatusToInternal(gelatoStatus: string): string {
  switch (gelatoStatus?.toLowerCase()) {
    case 'created':
    case 'accepted':
    case 'in_production':
    case 'printed':
    case 'printing':
      return 'processing';
    case 'shipped':
    case 'dispatched':
      return 'shipped';
    case 'delivered':
    case 'completed':
      return 'delivered';
    case 'cancelled':
      return 'cancelled';
    case 'failed':
    case 'error':
    case 'rejected':
      return 'failed';
    default:
      console.warn('Status Gelato desconhecido:', gelatoStatus);
      return 'processing'; // Default seguro
  }
}

// Função para processar eventos do webhook
async function processWebhookEvent(event: GelatoWebhookEvent, signature: string) {
  // Extrair corretamente os campos do payload da Gelato
  const eventType = event.event;                    // Campo 'event' contém o tipo
  const orderIdFromPayload = event.orderId || null; // Campo 'orderId' contém o ID do pedido
  const webhookId = event.id;                       // ID único do webhook
  const channel = event.channel;                    // Canal da Gelato

  // Log para debug da extração
  console.log('🔍 DEBUG_WEBHOOK_EXTRACTION:', {
    eventType,
    orderIdFromPayload,
    webhookId,
    channel,
    fullPayload: event
  });
  
  // 1. Primeiro, salvar o webhook na tabela gelato_webhooks
  const { data: webhookRecord, error: webhookError } = await supabaseAdmin
    .from('gelato_webhooks')
    .insert({
      event_type: eventType,
      gelato_order_id: orderIdFromPayload,
      payload: event,
      signature,
      processed: false,
    })
    .select('id')
    .single();

  if (webhookError) {
    console.error('Erro ao salvar webhook:', webhookError);
    throw new Error('Falha ao salvar webhook');
  }

  const savedWebhookId = webhookRecord.id;

  try {
    // 2. Processar com base no tipo de evento
    switch (eventType) {
      case 'order_status_updated':
        await processOrderStatusUpdate(event);
        break;
        
      case 'order_item_status_updated':
        await processOrderItemStatusUpdate(event);
        break;
        
      case 'order_item_tracking_code_updated':
        await processTrackingUpdate(event);
        break;
        
      case 'catalog_product_stock_availability_updated':
        console.log('Stock update event received:', event);
        // Para já só registamos, no futuro podes implementar lógica específica
        break;
        
      default:
        console.warn(`Evento não processado: ${eventType}`, event);
    }

    // 3. Marcar como processado
    await supabaseAdmin
      .from('gelato_webhooks')
      .update({ processed: true })
      .eq('id', savedWebhookId);

  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    // Deixa processed = false para poder tentar novamente mais tarde
    throw error;
  }
}

// Processar atualização de status do pedido
async function processOrderStatusUpdate(event: GelatoWebhookEvent) {
  const orderIdFromEvent = event.orderId;
  
  if (!orderIdFromEvent) {
    console.warn('order_status_updated sem orderId:', event);
    return;
  }

  // Extrair status da Gelato de diferentes possíveis campos
  const gelatoStatus = (event.fullPayload?.fulfillmentStatus as string) || 
                      (event.fullPayload?.status as string) || 
                      event.status || 
                      event.orderStatus || 
                      event.order_status;

  if (!gelatoStatus) {
    console.warn('order_status_updated sem status válido:', event);
    return;
  }

  // Mapear para status interno válido
  const internalStatus = mapGelatoStatusToInternal(gelatoStatus);

  const updateData = {
    gelato_status: gelatoStatus,    // Status exato da Gelato
    status: internalStatus,         // Status interno válido
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('gelato_orders')
    .update(updateData)
    .eq('gelato_order_id', orderIdFromEvent);

  if (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    throw error;
  }

  console.log(`Status atualizado para pedido ${orderIdFromEvent}:`, {
    gelato: gelatoStatus,
    internal: internalStatus
  });
}

// Processar atualização de status de item do pedido
async function processOrderItemStatusUpdate(event: GelatoWebhookEvent) {
  const orderIdFromEvent = event.orderId;
  
  if (!orderIdFromEvent) {
    console.warn('order_item_status_updated sem orderId:', event);
    return;
  }

  // Extrair status da Gelato de diferentes possíveis campos
  const gelatoStatus = (event.fullPayload?.fulfillmentStatus as string) || 
                      (event.fullPayload?.status as string) || 
                      event.status || 
                      event.orderStatus || 
                      event.order_status;

  if (!gelatoStatus) {
    console.warn('order_item_status_updated sem status válido:', event);
    return;
  }

  // Mapear para status interno válido
  const internalStatus = mapGelatoStatusToInternal(gelatoStatus);

  const updateData = {
    gelato_status: gelatoStatus,    // Status exato da Gelato
    status: internalStatus,         // Status interno válido
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('gelato_orders')
    .update(updateData)
    .eq('gelato_order_id', orderIdFromEvent);

  if (error) {
    console.error('Erro ao atualizar status do item do pedido:', error);
    throw error;
  }

  console.log(`Status do item atualizado para pedido ${orderIdFromEvent}:`, {
    gelato: gelatoStatus,
    internal: internalStatus
  });
}

// Processar atualização de código de rastreamento
async function processTrackingUpdate(event: GelatoWebhookEvent) {
  const orderIdFromEvent = event.orderId;
  
  if (!orderIdFromEvent) {
    console.warn('tracking_update sem orderId:', event);
    return;
  }

  const updateData = {
    tracking_number: event.tracking_code || event.trackingCode || event.tracking_number,
    tracking_url: event.tracking_url || event.trackingUrl,
    updated_at: new Date().toISOString(),
  };

  // Remove campos undefined
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  const { error } = await supabaseAdmin
    .from('gelato_orders')
    .update(updateData)
    .eq('gelato_order_id', orderIdFromEvent);

  if (error) {
    console.error('Erro ao atualizar tracking do pedido:', error);
    throw error;
  }

  console.log(`Tracking atualizado para pedido ${orderIdFromEvent}:`, updateData);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método Não Permitido. Apenas POST.' });
  }

  try {
    // 1. Ler o raw body
    const rawBody = await getRawBody(req);
    
    if (!rawBody) {
      return res.status(400).json({ message: 'Corpo da requisição vazio.' });
    }

    // 2. Parse do JSON
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (error) {
      console.error('Erro ao fazer parse do corpo do webhook:', error);
      return res.status(400).json({ message: 'Corpo da requisição inválido.' });
    }

    // 3. Verificar assinatura do webhook
    const signatureHeader = req.headers['x-gelato-signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const webhookSecret = process.env.GELATO_WEBHOOK_SECRET;

    // Log detalhado dos headers recebidos para debug
    console.log('📨 WEBHOOK_HEADERS_DEBUG:', {
      'x-gelato-signature': signatureHeader,
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'content-length': req.headers['content-length'],
      allHeaders: Object.keys(req.headers),
      signatureAfterProcessing: signature
    });

    if (!webhookSecret) {
      console.error('❌ GELATO_WEBHOOK_SECRET não configurado');
      return res.status(500).json({ message: 'Configuração de webhook inválida.' });
    }

    if (!signature) {
      console.error('❌ Assinatura do webhook ausente no cabeçalho X-Gelato-Signature');
      return res.status(403).json({ message: 'Assinatura do webhook ausente.' });
    }

    // 4. Validar assinatura
    const isValidSignature = validateWebhookSignature(rawBody, signature, webhookSecret);
    
    // Log adicional para debug da validação
    console.log('🔍 DEBUG_WEBHOOK_VALIDATION:', {
      signatureReceived: signature,
      webhookSecretUsed: webhookSecret,
      isValid: isValidSignature
    });
    
    if (!isValidSignature) {
      console.error('❌ Assinatura do webhook inválida!');
      return res.status(403).json({ message: 'Assinatura do webhook inválida.' });
    }

    console.log('--- Webhook Gelato Válido Recebido ---');
    console.log('Evento:', event.event);
    console.log('ID do Pedido:', event.orderId);
    console.log('ID do Webhook:', event.id);
    console.log('Canal:', event.channel);
    console.log('Assinatura: Válida ✓');
    console.log('---------------------------------------');

    // 5. Processar o evento
    await processWebhookEvent(event, signature);

    // 6. Responder sucesso
    res.status(200).json({ 
      status: 'success', 
      message: 'Webhook processado com sucesso!',
      event_type: event.event,
      order_id: event.orderId,
      webhook_id: event.id
    });

  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro interno no processamento do webhook',
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
} 