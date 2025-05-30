import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { userId, amount, type, referenceId, description } = req.body;

    if (!userId || !amount || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validar tipos permitidos
    const allowedTypes = ['purchase', 'bonus_first_login', 'earned'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type' });
    }

    // Chamar função RPC atómica
    const { data, error } = await supabaseAdmin.rpc('earn_piccoins', {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_reference_id: referenceId,
      p_description: description || `Earned ${amount} PicCoin(s)`
    });

    if (error) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (!data.success) {
      return res.status(400).json({ 
        message: data.error
      });
    }

    return res.status(200).json({ 
      success: true,
      newBalance: data.newBalance
    });

  } catch (error) {
    console.error('Earn API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 