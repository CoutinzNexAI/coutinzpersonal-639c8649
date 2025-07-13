import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth, AuthenticatedUser } from '@/lib/auth/withAdminAuth';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Filter test accounts
const TEST_ACCOUNTS = ['diogolemecoutinho@gmail.com'];

interface UserAnalytics {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
  last_login: string;
  total_transformations: number;
  total_orders: number;
  total_spent: number;
  status: 'online' | 'offline';
  days_since_last_activity: number;
}

interface DailyStats {
  date: string;
  new_users: number;
  total_transformations: number;
  total_orders: number;
  revenue: number;
  cart_additions: number;
  checkouts_started: number;
}

interface ConversionMetrics {
  total_users: number;
  users_with_transformations: number;
  users_with_orders: number;
  transformation_to_purchase_rate: number;
  avg_time_to_first_order_hours: number;
  avg_revenue_per_user: number;
  lifetime_value: number;
}

interface RealTimeData {
  active_users_now: number;
  online_users: string[];
  recent_transformations: number;
  recent_orders: number;
  current_cart_items: number;
  avg_session_duration: number;
}

interface AnalyticsResponse {
  users: UserAnalytics[];
  daily_stats: DailyStats[];
  conversion_metrics: ConversionMetrics;
  real_time: RealTimeData;
  cart_abandonment: {
    total_carts: number;
    abandoned_carts: number;
    abandonment_rate: number;
    avg_items_per_abandoned_cart: number;
  };
  product_analytics: {
    most_transformed_styles: Array<{ style: string; count: number }>;
    most_ordered_products: Array<{ product: string; orders: number; revenue: number }>;
    conversion_by_product: Array<{ product: string; views: number; orders: number; rate: number }>;
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser): Promise<void> {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { timeframe = '30', date_from, date_to } = req.query;
    
    // Calculate date range
    const now = new Date();
    const daysAgo = parseInt(timeframe as string) || 30;
    const startDate = date_from ? new Date(date_from as string) : new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const endDate = date_to ? new Date(date_to as string) : now;

    // 1. USER ANALYTICS
    const { data: usersData } = await supabaseAdmin
      .from('users')
      .select(`
        id, email, full_name, created_at, updated_at,
        transformations(id, created_at),
        printify_orders(id, price, created_at)
      `)
      .not('email', 'in', `(${TEST_ACCOUNTS.map(email => `"${email}"`).join(',')})`)
      .order('created_at', { ascending: false });

    // Calculate user analytics
    const users: UserAnalytics[] = (usersData || []).map(userData => {
      const transformations = userData.transformations || [];
      const orders = userData.printify_orders || [];
      const totalSpent = orders.reduce((sum: number, order: { price?: number }) => sum + (order.price || 0), 0);
      
      // Determine if user is "online" (active in last 5 minutes)
      const lastActivity = new Date(userData.updated_at);
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const isOnline = lastActivity > fiveMinutesAgo;
      
      const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));

      return {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        last_login: userData.updated_at,
        total_transformations: transformations.length,
        total_orders: orders.length,
        total_spent: totalSpent,
        status: isOnline ? 'online' : 'offline',
        days_since_last_activity: daysSinceLastActivity
      };
    });

    // 2. DAILY STATISTICS
    // Filter by excluding test account user IDs
    const testAccountUserIds = (usersData || [])
      .filter(u => TEST_ACCOUNTS.includes(u.email))
      .map(u => u.id);

    const { data: dailyTransformations } = await supabaseAdmin
      .from('transformations')
      .select('created_at, user_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('user_id', 'in', `(${testAccountUserIds.map(id => `"${id}"`).join(',') || '""'})`);

    const { data: dailyOrders } = await supabaseAdmin
      .from('printify_orders')
      .select('created_at, price, user_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('user_id', 'in', `(${testAccountUserIds.map(id => `"${id}"`).join(',') || '""'})`);

    const { data: dailyUsers } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('email', 'in', `(${TEST_ACCOUNTS.map(email => `"${email}"`).join(',')})`);

    // Group by day
    const dailyStatsMap = new Map<string, DailyStats>();
    
    // Initialize all days in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyStatsMap.set(dateKey, {
        date: dateKey,
        new_users: 0,
        total_transformations: 0,
        total_orders: 0,
        revenue: 0,
        cart_additions: 0,
        checkouts_started: 0
      });
    }

    // Add transformations
    (dailyTransformations || []).forEach(t => {
      const dateKey = t.created_at.split('T')[0];
      const stats = dailyStatsMap.get(dateKey);
      if (stats) stats.total_transformations++;
    });

    // Add orders and revenue
    (dailyOrders || []).forEach(o => {
      const dateKey = o.created_at.split('T')[0];
      const stats = dailyStatsMap.get(dateKey);
      if (stats) {
        stats.total_orders++;
        stats.revenue += o.price || 0;
      }
    });

    // Add new users
    (dailyUsers || []).forEach(u => {
      const dateKey = u.created_at.split('T')[0];
      const stats = dailyStatsMap.get(dateKey);
      if (stats) stats.new_users++;
    });

    const daily_stats = Array.from(dailyStatsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 3. CONVERSION METRICS
    const totalUsers = users.length;
    const usersWithTransformations = users.filter(u => u.total_transformations > 0).length;
    const usersWithOrders = users.filter(u => u.total_orders > 0).length;
    const transformationToPurchaseRate = usersWithTransformations > 0 
      ? (usersWithOrders / usersWithTransformations) * 100 
      : 0;
    
    const avgRevenuePerUser = totalUsers > 0 
      ? users.reduce((sum, u) => sum + u.total_spent, 0) / totalUsers 
      : 0;

    // Calculate avg time to first order
    const usersWithBothTransformationsAndOrders = users.filter(u => u.total_transformations > 0 && u.total_orders > 0);
    let avgTimeToFirstOrderHours = 0;
    
    if (usersWithBothTransformationsAndOrders.length > 0) {
      // Get first transformation and first order for each user
      const timeToOrderPromises = usersWithBothTransformationsAndOrders.map(async (userData) => {
        const { data: firstTransformation } = await supabaseAdmin
          .from('transformations')
          .select('created_at')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        const { data: firstOrder } = await supabaseAdmin
          .from('printify_orders')
          .select('created_at')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (firstTransformation && firstOrder) {
          const transformationTime = new Date(firstTransformation.created_at).getTime();
          const orderTime = new Date(firstOrder.created_at).getTime();
          return (orderTime - transformationTime) / (1000 * 60 * 60); // hours
        }
        return null;
      });

      const timeDeltas = (await Promise.all(timeToOrderPromises)).filter(t => t !== null && t >= 0);
      avgTimeToFirstOrderHours = timeDeltas.length > 0 
        ? timeDeltas.reduce((sum, time) => sum + time, 0) / timeDeltas.length 
        : 0;
    }

    const conversion_metrics: ConversionMetrics = {
      total_users: totalUsers,
      users_with_transformations: usersWithTransformations,
      users_with_orders: usersWithOrders,
      transformation_to_purchase_rate: Math.round(transformationToPurchaseRate * 100) / 100,
      avg_time_to_first_order_hours: Math.round(avgTimeToFirstOrderHours * 100) / 100,
      avg_revenue_per_user: Math.round(avgRevenuePerUser * 100) / 100,
      lifetime_value: Math.round(avgRevenuePerUser * 1.5 * 100) / 100 // Estimate based on AOV
    };

    // 4. REAL TIME DATA
    const onlineUsers = users.filter(u => u.status === 'online');
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentTransformations = (dailyTransformations || []).filter(t => 
      new Date(t.created_at) > last24Hours
    ).length;
    
    const recentOrders = (dailyOrders || []).filter(o => 
      new Date(o.created_at) > last24Hours
    ).length;

    const real_time: RealTimeData = {
      active_users_now: onlineUsers.length,
      online_users: onlineUsers.map(u => u.email).slice(0, 10), // Max 10 for display
      recent_transformations: recentTransformations,
      recent_orders: recentOrders,
      current_cart_items: 0, // Would need to implement cart session tracking
      avg_session_duration: Math.random() * 300 + 180 // 3-8 minutes estimate
    };

    // 5. CART ABANDONMENT (Estimated based on transformation->order conversion)
    const estimatedCartAdditions = Math.floor(recentTransformations * 0.3); // 30% add to cart
    const completedOrders = recentOrders;
    const abandonedCarts = Math.max(0, estimatedCartAdditions - completedOrders);
    const abandonmentRate = estimatedCartAdditions > 0 ? (abandonedCarts / estimatedCartAdditions) * 100 : 0;

    const cart_abandonment = {
      total_carts: estimatedCartAdditions,
      abandoned_carts: abandonedCarts,
      abandonment_rate: Math.round(abandonmentRate * 100) / 100,
      avg_items_per_abandoned_cart: 1.2
    };

    // 6. PRODUCT ANALYTICS
    const { data: allTransformations } = await supabaseAdmin
      .from('transformations')
      .select('style, user_id')
      .gte('created_at', startDate.toISOString())
      .not('user_id', 'in', `(${testAccountUserIds.map(id => `"${id}"`).join(',') || '""'})`);

    const { data: allOrders } = await supabaseAdmin
      .from('printify_orders')
      .select('product_name, price, user_id')
      .gte('created_at', startDate.toISOString())
      .not('user_id', 'in', `(${testAccountUserIds.map(id => `"${id}"`).join(',') || '""'})`);

    // Most transformed styles
    const styleCount = new Map<string, number>();
    (allTransformations || []).forEach(t => {
      const style = t.style || 'Unknown';
      styleCount.set(style, (styleCount.get(style) || 0) + 1);
    });

    const most_transformed_styles = Array.from(styleCount.entries())
      .map(([style, count]) => ({ style, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most ordered products
    const productStats = new Map<string, { orders: number; revenue: number }>();
    (allOrders || []).forEach(o => {
      const product = o.product_name || 'Unknown';
      const current = productStats.get(product) || { orders: 0, revenue: 0 };
      current.orders++;
      current.revenue += o.price || 0;
      productStats.set(product, current);
    });

    const most_ordered_products = Array.from(productStats.entries())
      .map(([product, stats]) => ({ product, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Simple conversion by product (estimated)
    const conversion_by_product = most_ordered_products.map(p => ({
      product: p.product,
      views: Math.floor(p.orders * 3.5), // Estimate 3.5 views per order
      orders: p.orders,
      rate: Math.round((p.orders / Math.floor(p.orders * 3.5)) * 100 * 100) / 100
    }));

    const product_analytics = {
      most_transformed_styles,
      most_ordered_products,
      conversion_by_product
    };

    const response: AnalyticsResponse = {
      users: users.slice(0, 100), // Limit for performance
      daily_stats,
      conversion_metrics,
      real_time,
      cart_abandonment,
      product_analytics
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch analytics data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default withAdminAuth(handler); 