import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface PostHogMetrics {
  conversionFunnel: {
    productViews: number;
    cartAdditions: number;
    checkoutStarted: number;
    purchaseCompleted: number;
    conversionRate: number;
    abandonmentRate: number;
  };
  productPerformance: {
    topViewedProducts: Array<{
      product: string;
      views: number;
      conversions: number;
      conversionRate: number;
    }>;
    topSellingProducts: Array<{
      product: string;
      sales: number;
      revenue: number;
    }>;
  };
  userSegmentation: {
    newUsers: number;
    returningUsers: number;
    avgSessionTime: number;
    bounceRate: number;
    mostActiveHours: Array<{ hour: number; activity: number }>;
  };
  revenueInsights: {
    totalRevenue: number;
    avgOrderValue: number;
    ltv: number;
    revenueGrowth: number;
    topRevenueProducts: Array<{
      product: string;
      revenue: number;
      orders: number;
    }>;
  };
  realTimeMetrics: {
    activeUsers: number;
    currentSessions: number;
    liveEvents: number;
    serverLoad: number;
    responseTime: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verificar se é admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de acesso requerido' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Verificar se é admin
    const { data: userData, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !userData || userData.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // TODO: Integrar com PostHog API real
    // const posthogClient = new PostHogClient(process.env.POSTHOG_API_KEY);
    // const metrics = await posthogClient.getMetrics();

    // Por agora, devolver dados simulados baseados em dados reais
    const mockMetrics: PostHogMetrics = {
      conversionFunnel: {
        productViews: Math.floor(Math.random() * 1000) + 2500,
        cartAdditions: Math.floor(Math.random() * 200) + 350,
        checkoutStarted: Math.floor(Math.random() * 100) + 250,
        purchaseCompleted: Math.floor(Math.random() * 80) + 120,
        conversionRate: parseFloat((Math.random() * 3 + 4).toFixed(2)),
        abandonmentRate: parseFloat((Math.random() * 15 + 40).toFixed(1))
      },
      productPerformance: {
        topViewedProducts: [
          { 
            product: 'Canvas Personalizado', 
            views: Math.floor(Math.random() * 300) + 1100, 
            conversions: Math.floor(Math.random() * 30) + 70, 
            conversionRate: parseFloat((Math.random() * 3 + 6).toFixed(2))
          },
          { 
            product: 'Poster Retrato', 
            views: Math.floor(Math.random() * 200) + 800, 
            conversions: Math.floor(Math.random() * 20) + 40, 
            conversionRate: parseFloat((Math.random() * 2 + 4).toFixed(2))
          },
          { 
            product: 'Caneca Coração', 
            views: Math.floor(Math.random() * 150) + 600, 
            conversions: Math.floor(Math.random() * 15) + 20, 
            conversionRate: parseFloat((Math.random() * 1.5 + 2.5).toFixed(2))
          }
        ],
        topSellingProducts: [
          { product: 'Canvas Personalizado', sales: Math.floor(Math.random() * 30) + 70, revenue: Math.floor(Math.random() * 1000) + 2000 },
          { product: 'Poster Retrato', sales: Math.floor(Math.random() * 20) + 40, revenue: Math.floor(Math.random() * 500) + 1200 },
          { product: 'Caneca Coração', sales: Math.floor(Math.random() * 15) + 20, revenue: Math.floor(Math.random() * 200) + 400 }
        ]
      },
      userSegmentation: {
        newUsers: Math.floor(Math.random() * 500) + 1700,
        returningUsers: Math.floor(Math.random() * 300) + 800,
        avgSessionTime: parseFloat((Math.random() * 2 + 3.5).toFixed(1)),
        bounceRate: parseFloat((Math.random() * 10 + 28).toFixed(1)),
        mostActiveHours: [
          { hour: 20, activity: Math.floor(Math.random() * 50) + 130 },
          { hour: 21, activity: Math.floor(Math.random() * 60) + 160 },
          { hour: 22, activity: Math.floor(Math.random() * 40) + 120 }
        ]
      },
      revenueInsights: {
        totalRevenue: parseFloat((Math.random() * 3000 + 10000).toFixed(2)),
        avgOrderValue: parseFloat((Math.random() * 10 + 25).toFixed(2)),
        ltv: parseFloat((Math.random() * 50 + 130).toFixed(2)),
        revenueGrowth: parseFloat((Math.random() * 15 + 18).toFixed(1)),
        topRevenueProducts: [
          { product: 'Canvas Personalizado', revenue: Math.floor(Math.random() * 1000) + 2000, orders: Math.floor(Math.random() * 30) + 70 },
          { product: 'Poster Retrato', revenue: Math.floor(Math.random() * 500) + 1200, orders: Math.floor(Math.random() * 20) + 40 },
          { product: 'Caneca Coração', revenue: Math.floor(Math.random() * 200) + 400, orders: Math.floor(Math.random() * 15) + 20 }
        ]
      },
      realTimeMetrics: {
        activeUsers: Math.floor(Math.random() * 30) + 35,
        currentSessions: Math.floor(Math.random() * 40) + 50,
        liveEvents: Math.floor(Math.random() * 100) + 200,
        serverLoad: parseFloat((Math.random() * 20 + 65).toFixed(1)),
        responseTime: Math.floor(Math.random() * 100) + 200
      }
    };

    return res.status(200).json(mockMetrics);

  } catch (error) {
    console.error('Erro ao carregar métricas PostHog:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
} 