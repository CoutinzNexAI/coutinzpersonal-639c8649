import { NextApiRequest, NextApiResponse } from 'next';
import { gelatoFetch } from '@/lib/gelato/gelatoApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'POST': {
        const { action, ...bodyData } = req.body;

        if (action === 'search') {
          // Buscar pedidos existentes - POST para manter consistência com Gelato API
          const searchData = await gelatoFetch('/v4/orders:search', {
            method: 'POST',
            body: JSON.stringify(bodyData) // Filtros vindos do body da requisição
          });
          return res.status(200).json(searchData);
        } else {
          // Criar novo pedido
          const orderData = await gelatoFetch('/v4/orders', {
            method: 'POST',
            body: JSON.stringify(req.body)
          });
          return res.status(201).json(orderData);
        }
      }

      default:
        return res.status(405).json({ message: 'Método não permitido. Apenas POST.' });
    }
  } catch (error) {
    console.error('Erro na API de pedidos Gelato:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
} 