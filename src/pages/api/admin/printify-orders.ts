import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedUser } from '@/lib/auth/withAdminAuth';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Função principal protegida por autenticação de admin
async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser): Promise<void> {
  try {
    switch (req.method) {
      case 'GET': {
        // Buscar todos os pedidos ou um pedido específico
        const { id, limit = 50, offset = 0 } = req.query;
        
        if (id && typeof id === 'string') {
          // Buscar pedido específico
          const { data: order, error } = await supabaseAdmin
            .from('printify_orders')
            .select(`
              *,
              users:user_id (
                email,
                full_name
              )
            `)
            .eq('id', id)
            .single();

          if (error) {
            res.status(404).json({ message: 'Pedido não encontrado', error: error.message });
            return;
          }

          res.status(200).json(order);
          return;
        } else {
          // Buscar todos os pedidos com paginação
          const { data: orders, error, count } = await supabaseAdmin
            .from('printify_orders')
            .select(`
              *,
              users:user_id (
                email,
                full_name
              )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);

          if (error) {
            res.status(500).json({ message: 'Erro ao buscar pedidos', error: error.message });
            return;
          }

          res.status(200).json({
            orders,
            total: count,
            limit: Number(limit),
            offset: Number(offset)
          });
          return;
        }
      }

      case 'POST': {
        const { 
          status, 
          printify_status, 
          user_email, 
          product_name,
          start_date,
          end_date,
          page = 1,
          per_page = 50
        } = req.body;

        let query = supabaseAdmin
          .from('printify_orders')
          .select(`
            *,
            users:user_id (
              email,
              full_name
            )
          `, { count: 'exact' });

        // Aplicar filtros
        if (status) {
          query = query.eq('status', status);
        }
        if (printify_status) {
          query = query.eq('printify_status', printify_status);
        }
        if (product_name) {
          query = query.ilike('product_name', `%${product_name}%`);
        }
        if (start_date) {
          query = query.gte('created_at', start_date);
        }
        if (end_date) {
          query = query.lte('created_at', end_date);
        }

        // Filtro por email do utilizador (join)
        if (user_email) {
          const { data: userIds } = await supabaseAdmin
            .from('users')
            .select('id')
            .ilike('email', `%${user_email}%`);
          
          if (userIds && userIds.length > 0) {
            const ids = userIds.map(u => u.id);
            query = query.in('user_id', ids);
          } else {
            // Se não encontrar utilizadores com esse email, retornar array vazio
            res.status(200).json({
              orders: [],
              total: 0,
              page: Number(page),
              per_page: Number(per_page)
            });
            return;
          }
        }

        // Paginação
        const offset_calc = (Number(page) - 1) * Number(per_page);
        query = query
          .order('created_at', { ascending: false })
          .range(offset_calc, offset_calc + Number(per_page) - 1);

        const { data: filteredOrders, error: filterError, count: totalFiltered } = await query;

        if (filterError) {
          res.status(500).json({ message: 'Erro na busca com filtros', error: filterError.message });
          return;
        }

        res.status(200).json({
          orders: filteredOrders,
          total: totalFiltered,
          page: Number(page),
          per_page: Number(per_page)
        });
        return;
      }

      default: {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Método ${req.method} Não Permitido`);
        return;
      }
    }
  } catch (error) {
    console.error('Erro na API /api/admin/printify-orders:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor', 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
}

export default withAdminAuth(handler); 