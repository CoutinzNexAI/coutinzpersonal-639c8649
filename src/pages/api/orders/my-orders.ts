import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Create admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UserOrder {
  id: string;
  product_name: string;
  product_category: string;
  user_image_url: string;
  total_amount: number;
  price: number;
  quantity: number;
  status: string;
  printify_status: string;
  tracking_number?: string;
  tracking_url?: string;
  created_at: string;
  updated_at: string;
  customizations: Record<string, string | number | boolean>;
  order_reference?: string;
  customer_name?: string;
}

interface MyOrdersResponse {
  success: boolean;
  orders?: UserOrder[];
  total?: number;
  page?: number;
  per_page?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<MyOrdersResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed` 
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization header required' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify user authentication using Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Parse query parameters
    const { page = '1', limit = '20', status } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 50); // Max 50 per page
    const offset = (pageNum - 1) * limitNum;

    console.log(`📦 Fetching orders for user ${user.id}, page ${pageNum}, limit ${limitNum}`);

    // Build query
    let query = supabaseAdmin
      .from('printify_orders')
      .select(`
        id,
        product_name,
        product_category,
        user_image_url,
        total_amount,
        price,
        quantity,
        status,
        printify_status,
        tracking_number,
        tracking_url,
        created_at,
        updated_at,
        customizations,
        order_reference,
        customer_name
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: orders, error: ordersError, count } = await query;

    if (ordersError) {
      console.error('Database error:', ordersError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch orders from database' 
      });
    }

    console.log(`✅ Found ${orders?.length || 0} orders (total: ${count}) for user ${user.id}`);

    return res.status(200).json({
      success: true,
      orders: orders || [],
      total: count || 0,
      page: pageNum,
      per_page: limitNum
    });

  } catch (error) {
    console.error('Server error in /api/orders/my-orders:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
} 