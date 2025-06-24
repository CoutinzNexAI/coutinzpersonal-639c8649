import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedUser } from '@/lib/auth/withAdminAuth';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Função para fazer chamadas à API da Printify
async function printifyFetch(endpoint: string, options?: RequestInit) {
  const baseURL = 'https://api.printify.com';
  const apiToken = process.env.PRINTIFY_API_TOKEN;

  if (!apiToken) {
    throw new Error('PRINTIFY_API_TOKEN não configurado');
  }

  const response = await fetch(`${baseURL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      `Printify API Error: ${response.status} - ${errorData?.message || response.statusText}`
    );
  }

  return response.json();
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} Não Permitido`);
    return;
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      res.status(400).json({ message: 'ID do pedido é obrigatório.' });
      return;
    }

    // 1. Buscar o pedido no nosso banco de dados
    const { data: order, error: orderError } = await supabaseAdmin
      .from('printify_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      res.status(404).json({ message: 'Pedido não encontrado no nosso sistema.' });
      return;
    }

    if (!order.printify_order_id) {
      res.status(400).json({ message: 'Pedido não tem ID da Printify associado.' });
      return;
    }

    // 2. Verificar o status atual do pedido na Printify
    let printifyOrder;
    try {
      const shopId = process.env.PRINTIFY_SHOP_ID;
      printifyOrder = await printifyFetch(`shops/${shopId}/orders/${order.printify_order_id}.json`);
    } catch (error) {
      console.error('Erro ao buscar pedido na Printify:', error);
      res.status(500).json({ 
        message: 'Erro ao verificar status do pedido na Printify.',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return;
    }

    // 3. Verificar se o pedido pode ser cancelado
    const currentStatus = printifyOrder.status;
    const cancelableStatuses = ['pending', 'on-hold'];

    if (!cancelableStatuses.includes(currentStatus)) {
      res.status(400).json({ 
        message: `Pedido não pode ser cancelado. Status atual: ${currentStatus}`,
        current_status: currentStatus,
        cancelable_statuses: cancelableStatuses
      });
      return;
    }

    // 4. Cancelar o pedido na Printify
    let cancelResponse;
    try {
      const shopId = process.env.PRINTIFY_SHOP_ID;
      cancelResponse = await printifyFetch(`shops/${shopId}/orders/${order.printify_order_id}/cancel.json`, {
        method: 'POST',
        body: JSON.stringify({
          reason: `Cancelado pelo admin: ${user.email} (${user.id})`
        })
      });
    } catch (error) {
      console.error('Erro ao cancelar pedido na Printify:', error);
      res.status(500).json({ 
        message: 'Erro ao cancelar pedido na Printify.',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return;
    }

    // 5. Atualizar o status no nosso banco de dados
    const { error: updateError } = await supabaseAdmin
      .from('printify_orders')
      .update({
        status: 'cancelled',
        printify_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Erro ao atualizar status local:', updateError);
      // Não falhar aqui, pois o cancelamento na Gelato foi bem-sucedido
    }

    // 6. Log da ação
    console.log(`Pedido ${id} cancelado pelo admin ${user.email}:`, {
      printify_order_id: order.printify_order_id,
      previous_status: currentStatus,
      cancel_response: cancelResponse
    });

    res.status(200).json({
      message: 'Pedido cancelado com sucesso.',
      order_id: id,
      printify_order_id: order.printify_order_id,
      previous_status: currentStatus,
      new_status: 'cancelled',
      cancelled_by: user.email,
      cancelled_at: new Date().toISOString(),
      printify_response: cancelResponse
    });

  } catch (error) {
    console.error('Erro no cancelamento do pedido:', error);
    res.status(500).json({ 
      message: 'Erro interno no cancelamento do pedido',
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
}

export default withAdminAuth(handler); 