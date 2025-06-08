import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedUser } from '@/lib/auth/withAdminAuth';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface WebhookFilters {
  event_type?: string;
  processed?: boolean;
  gelato_order_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser): Promise<void> {
  try {
    switch (req.method) {
      case 'GET': {
        // Buscar todos os webhooks ou um webhook específico
        const { id, limit = 50, offset = 0 } = req.query;
        
        if (id && typeof id === 'string') {
          // Buscar webhook específico
          const { data: webhook, error } = await supabaseAdmin
            .from('gelato_webhooks')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            res.status(404).json({ message: 'Webhook não encontrado', error: error.message });
            return;
          }

          res.status(200).json(webhook);
          return;
        } else {
          // Buscar todos os webhooks com paginação
          const { data: webhooks, error, count } = await supabaseAdmin
            .from('gelato_webhooks')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

          if (error) {
            res.status(500).json({ message: 'Erro ao buscar webhooks', error: error.message });
            return;
          }

          res.status(200).json({
            webhooks,
            total: count,
            limit: Number(limit),
            offset: Number(offset)
          });
          return;
        }
      }

      case 'POST': {
        // Buscar webhooks com filtros
        const filters: WebhookFilters = req.body;
        const { 
          event_type, 
          processed, 
          gelato_order_id,
          start_date,
          end_date,
          page = 1,
          per_page = 50
        } = filters;

        let query = supabaseAdmin
          .from('gelato_webhooks')
          .select('*', { count: 'exact' });

        // Aplicar filtros
        if (event_type) {
          query = query.eq('event_type', event_type);
        }
        if (typeof processed === 'boolean') {
          query = query.eq('processed', processed);
        }
        if (gelato_order_id) {
          query = query.eq('gelato_order_id', gelato_order_id);
        }
        if (start_date) {
          query = query.gte('created_at', start_date);
        }
        if (end_date) {
          query = query.lte('created_at', end_date);
        }

        // Paginação
        const offset_calc = (Number(page) - 1) * Number(per_page);
        query = query
          .order('created_at', { ascending: false })
          .range(offset_calc, offset_calc + Number(per_page) - 1);

        const { data: filteredWebhooks, error: filterError, count: totalFiltered } = await query;

        if (filterError) {
          res.status(500).json({ message: 'Erro na busca com filtros', error: filterError.message });
          return;
        }

        res.status(200).json({
          webhooks: filteredWebhooks,
          total: totalFiltered,
          page: Number(page),
          per_page: Number(per_page)
        });
        return;
      }

      case 'PATCH': {
        // Marcar webhook como processado/não processado
        const { id } = req.query;
        const { processed } = req.body;

        if (!id || typeof id !== 'string') {
          res.status(400).json({ message: 'ID do webhook é obrigatório.' });
          return;
        }

        if (typeof processed !== 'boolean') {
          res.status(400).json({ message: 'Campo "processed" deve ser boolean.' });
          return;
        }

        const { data: webhook, error } = await supabaseAdmin
          .from('gelato_webhooks')
          .update({ processed })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          res.status(500).json({ message: 'Erro ao atualizar webhook', error: error.message });
          return;
        }

        res.status(200).json({
          message: `Webhook marcado como ${processed ? 'processado' : 'não processado'}`,
          webhook
        });
        return;
      }

      case 'DELETE': {
        // Deletar webhooks antigos (opcional - para limpeza)
        const { older_than_days } = req.body;

        if (!older_than_days || typeof older_than_days !== 'number') {
          res.status(400).json({ message: 'Campo "older_than_days" é obrigatório e deve ser número.' });
          return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - older_than_days);

        const { data: deletedWebhooks, error } = await supabaseAdmin
          .from('gelato_webhooks')
          .delete()
          .lt('created_at', cutoffDate.toISOString())
          .select();

        if (error) {
          res.status(500).json({ message: 'Erro ao deletar webhooks', error: error.message });
          return;
        }

        res.status(200).json({
          message: `${deletedWebhooks?.length || 0} webhooks deletados`,
          deleted_count: deletedWebhooks?.length || 0,
          cutoff_date: cutoffDate.toISOString()
        });
        return;
      }

      default: {
        res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
        res.status(405).end(`Método ${req.method} Não Permitido`);
        return;
      }
    }
  } catch (error) {
    console.error('Erro na API /api/admin/gelato-webhooks:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor', 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
}

export default withAdminAuth(handler); 