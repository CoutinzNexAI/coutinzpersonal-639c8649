import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from('transformations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('output_url', 'is', null);

    if (countError) {
      console.error('Error counting transformations:', countError);
      return res.status(500).json({ error: 'Failed to count transformations' });
    }

    // Get paginated transformations
    const { data: transformations, error: dataError } = await supabase
      .from('transformations')
      .select('id, output_url, style, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('output_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dataError) {
      console.error('Error fetching transformations:', dataError);
      return res.status(500).json({ error: 'Failed to fetch transformations' });
    }

    return res.status(200).json({
      transformations: transformations || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
      hasNextPage: offset + limit < (count || 0),
      hasPreviousPage: page > 1
    });

  } catch (error) {
    console.error('Error in transformations history API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 