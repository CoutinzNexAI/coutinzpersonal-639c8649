import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../lib/supabase/admin';

// Interfaces para eventos Printify
interface PrintifyWebhookEvent {
  id: string;
  type: string; // ex: 'order:updated', 'order:shipment:created', 'product:deleted'
  created_at: string;
  resource: {
    id: string;
    type: string; // ex: 'order', 'shipment', 'product'
    data: OrderResourceData | ShipmentResourceData | ProductResourceData;
  };
}

interface OrderResourceData {
  id: string;
  external_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  line_items?: Array<{
    id: string;
    product_id: string;
    variant_id: number;
    quantity: number;
    status: string;
  }>;
  address_to?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country: string;
    region?: string;
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
  total_price?: number;
  total_shipping?: number;
  total_tax?: number;
}

interface ShipmentResourceData {
  id: string;
  order_id: string;
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
  service?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ProductResourceData {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Interface para resposta do webhook
interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Função para validar assinatura HMAC-SHA256
function validateSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // Remover prefixo 'sha256=' se presente
    const cleanSignature = signature.replace('sha256=', '');
    
    // Calcular HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    // Comparação segura para evitar timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

// Função para ler o corpo raw da requisição
async function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

// Função para processar eventos de pedido
async function processOrderEvent(event: PrintifyWebhookEvent): Promise<void> {
  const orderData = event.resource.data as OrderResourceData;
  const orderId = orderData.id;
  const externalId = orderData.external_id;



  try {
    // Encontrar pedido na nossa DB pelo printify_order_id ou external_id
    let query = supabaseAdmin
      .from('printify_orders')
      .select('id, printify_order_id, order_reference');

    if (externalId) {
      // Tentar encontrar pelo external_id primeiro (mais confiável)
      query = query.or(`order_reference.eq.${externalId},printify_order_id.eq.${orderId}`);
    } else {
      query = query.eq('printify_order_id', orderId);
    }

    const { data: orders, error: findError } = await query;

    if (findError) {
      console.error('Erro ao encontrar pedido na DB:', findError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.warn(`Pedido não encontrado na DB: printify_order_id=${orderId}, external_id=${externalId}`);
      return;
    }

    const dbOrder = orders[0];

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      printify_status: orderData.status,
      updated_at: new Date().toISOString()
    };

    // Mapear status Printify para status interno
    switch (orderData.status) {
      case 'pending':
        updateData.status = 'processing';
        break;
      case 'in_production':
        updateData.status = 'processing';
        break;
      case 'shipped':
        updateData.status = 'shipped';
        break;
      case 'delivered':
        updateData.status = 'delivered';
        break;
      case 'canceled':
        updateData.status = 'cancelled';
        break;
      case 'failed':
        updateData.status = 'failed';
        break;
      default:
        updateData.status = 'processing';
    }

    // Atualizar totais se disponíveis
    if (orderData.total_price !== undefined) {
      updateData.total_amount = orderData.total_price;
    }
    if (orderData.total_shipping !== undefined) {
      updateData.shipping_amount = orderData.total_shipping;
    }
    if (orderData.total_tax !== undefined) {
      updateData.tax_amount = orderData.total_tax;
    }

    // Atualizar na DB
    const { error: updateError } = await supabaseAdmin
      .from('printify_orders')
      .update(updateData)
      .eq('id', dbOrder.id);

          if (updateError) {
        console.error('Erro ao atualizar pedido na DB:', updateError);
      }

  } catch (error) {
    console.error('Erro ao processar evento de pedido:', error);
  }
}

// Função para processar eventos de envio
async function processShipmentEvent(event: PrintifyWebhookEvent): Promise<void> {
  const shipmentData = event.resource.data as ShipmentResourceData;
  const orderId = shipmentData.order_id;



  try {
    // Encontrar pedido na nossa DB
    const { data: orders, error: findError } = await supabaseAdmin
      .from('printify_orders')
      .select('id')
      .eq('printify_order_id', orderId);

    if (findError) {
      console.error('Erro ao encontrar pedido para envio:', findError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.warn(`Pedido não encontrado para envio: printify_order_id=${orderId}`);
      return;
    }

    const dbOrder = orders[0];

    // Preparar dados de tracking
    const updateData: Record<string, unknown> = {
      tracking_number: shipmentData.tracking_number || null,
      tracking_url: shipmentData.tracking_url || null,
      status: 'shipped',
      printify_status: shipmentData.status,
      updated_at: new Date().toISOString()
    };

    // Atualizar na DB
    const { error: updateError } = await supabaseAdmin
      .from('printify_orders')
      .update(updateData)
      .eq('id', dbOrder.id);

          if (updateError) {
        console.error('Erro ao atualizar tracking na DB:', updateError);
      }

  } catch (error) {
    console.error('Erro ao processar evento de envio:', error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WebhookResponse>
) {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Obter secret do webhook
    const webhookSecret = process.env.PRINTIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('PRINTIFY_WEBHOOK_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Webhook secret not configured'
      });
    }

    // Obter assinatura do header
    const signature = req.headers['x-pfy-signature'] as string;
    if (!signature) {
      return res.status(401).json({
        success: false,
        error: 'Missing webhook signature'
      });
    }

    // Ler corpo raw da requisição
    const rawBody = await getRawBody(req);
    
    // Validar assinatura
    if (!validateSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    // Parse do evento
    let event: PrintifyWebhookEvent;
    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Error parsing webhook payload:', parseError);
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload'
      });
    }



    // Processar evento baseado no tipo
    switch (event.type) {
      case 'order:created':
      case 'order:updated':
      case 'order:sent-to-production':
      case 'order:shipment:created':
        if (event.resource.type === 'order') {
          await processOrderEvent(event);
        } else if (event.resource.type === 'shipment') {
          await processShipmentEvent(event);
        }
        break;

      case 'order:shipment:delivered':
        await processShipmentEvent(event);
        break;

      case 'product:deleted':
      case 'product:updated':
        // Para eventos de produto, pode implementar lógica específica se necessário
  
        break;

      default:
        console.log(`ℹ️ Evento não processado: ${event.type}`);
    }

    // Responder rapidamente com sucesso
    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Configuração para desativar bodyParser e ler raw body
export const config = {
  api: {
    bodyParser: false,
  },
}; 