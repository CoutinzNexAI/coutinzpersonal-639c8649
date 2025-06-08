import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Verificar autenticação via header ou session
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }
    
    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Buscar a última transformação do utilizador
    const { data: transformation, error } = await supabase
      .from('transformations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('output_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhuma transformação encontrada
        return res.status(200).json({ 
          message: 'Nenhuma transformação encontrada',
          outputUrl: null 
        });
      }
      
      console.error('Erro ao buscar transformação:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    return res.status(200).json({
      id: transformation.id,
      outputUrl: transformation.output_url,
      style: transformation.style_requested,
      createdAt: transformation.created_at
    });

  } catch (error) {
    console.error('Erro na API de transformações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 