import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Webhook, TrendingUp, Users, AlertCircle, ExternalLink, BarChart3, Target, Zap, TrendingDown, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    revenue_eur: number;
  };
  webhooks: {
    total: number;
    processed: number;
    unprocessed: number;
    recent_errors: number;
  };
  users: {
    total: number;
    active_today: number;
  };
}

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

interface AdminUser {
  id: string;
  email?: string;
  full_name?: string;
  role: string;
}

const AdminDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [postHogMetrics, setPostHogMetrics] = useState<PostHogMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [postHogLoading, setPostHogLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = verificando, true = admin, false = não admin

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        router.push('/404');
        return;
      }

      // Verificar se é admin
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, email, full_name')
        .eq('id', user.id)
        .single();

      if (error || !userData || userData.role !== 'admin') {
        // 🔒 STEALTH MODE: Redirecionar para 404 sem aviso
        // Age como se a página não existisse
        setIsAdmin(false);
        router.push('/404');
        return;
      }

      setIsAdmin(true);
      setCurrentUser({ ...user, ...userData });
      loadDashboardStats();
      loadPostHogMetrics();

    } catch (error) {
      // 🔒 STEALTH MODE: Qualquer erro redireciona para 404
      setIsAdmin(false);
      router.push('/404');
    }
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Carregar estatísticas dos pedidos
      const { data: ordersData, error: ordersError } = await supabase
        .from('printify_orders')
        .select('status, printify_status, price, currency');

      if (ordersError) {
        console.error('Erro ao carregar pedidos:', ordersError);
      }

      // Carregar estatísticas dos webhooks
      const { data: webhooksData, error: webhooksError } = await supabase
        .from('printify_webhooks')
        .select('processed, created_at');

      if (webhooksError) {
        console.error('Erro ao carregar webhooks:', webhooksError);
      }

      // Carregar estatísticas dos utilizadores
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('created_at, updated_at');

      if (usersError) {
        console.error('Erro ao carregar utilizadores:', usersError);
      }

      // Calcular estatísticas
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const ordersStats = {
        total: ordersData?.length || 0,
        pending: ordersData?.filter(o => o.status === 'pending').length || 0,
        completed: ordersData?.filter(o => o.status === 'completed').length || 0,
        cancelled: ordersData?.filter(o => o.status === 'cancelled').length || 0,
        revenue_eur: ordersData?.reduce((sum, o) => {
          if (o.currency === 'EUR' && o.status === 'completed') {
            return sum + (o.price || 0);
          }
          return sum;
        }, 0) || 0
      };

      const webhooksStats = {
        total: webhooksData?.length || 0,
        processed: webhooksData?.filter(w => w.processed === true).length || 0,
        unprocessed: webhooksData?.filter(w => w.processed === false).length || 0,
        recent_errors: webhooksData?.filter(w => {
          const createdAt = new Date(w.created_at);
          return createdAt >= today && w.processed === false;
        }).length || 0
      };

      const usersStats = {
        total: usersData?.length || 0,
        active_today: usersData?.filter(u => {
          const updatedAt = new Date(u.updated_at || u.created_at);
          return updatedAt >= today;
        }).length || 0
      };

      setStats({
        orders: ordersStats,
        webhooks: webhooksStats,
        users: usersStats
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadPostHogMetrics = async () => {
    try {
      setPostHogLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/admin/posthog-metrics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar métricas PostHog');
      }

      const metrics = await response.json();
      setPostHogMetrics(metrics);
    } catch (error) {
      console.error('Erro ao carregar métricas PostHog:', error);
      toast.error('Erro ao carregar analytics - ' + (error instanceof Error ? error.message : 'erro desconhecido'));
    } finally {
      setPostHogLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // 🔒 STEALTH MODE: Não mostrar nada se não for admin ou ainda verificando
  if (isAdmin === null || isAdmin === false) {
    return null; // Página "não existe" para não-admins
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>A carregar dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Administrador</h1>
          <p className="text-gray-600">
            Bem-vindo, {currentUser?.full_name || currentUser?.email}
          </p>
          <div className="mt-4 flex gap-4">
            <Button onClick={() => router.push('/admin/orders')}>
              Gerir Pedidos
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://printify.com/app', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Dashboard Printify
            </Button>
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Pedidos Totais */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Totais</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.orders.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.orders.pending || 0} pendentes
              </p>
            </CardContent>
          </Card>

          {/* Receita */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.orders.revenue_eur || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.orders.completed || 0} pedidos concluídos
              </p>
            </CardContent>
          </Card>

          {/* Utilizadores */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilizadores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.users.active_today || 0} ativos hoje
              </p>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
              <Webhook className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.webhooks.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.webhooks.unprocessed || 0} não processados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 🚀 PostHog Analytics - Futuristic Design */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Analytics Intelligence
              </h2>
              <p className="text-gray-600 text-sm">Métricas em tempo real powered by PostHog</p>
            </div>
          </div>

          {postHogLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* 1. Funil de Conversão */}
              <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-900">Funil de Conversão</CardTitle>
                  <Target className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800 mb-1">
                    {postHogMetrics?.conversionFunnel.conversionRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-blue-600 mb-3">Taxa de conversão global</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Visualizações</span>
                      <span className="font-semibold">{postHogMetrics?.conversionFunnel.productViews}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Adições ao carrinho</span>
                      <span className="font-semibold">{postHogMetrics?.conversionFunnel.cartAdditions}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Checkout iniciado</span>
                      <span className="font-semibold">{postHogMetrics?.conversionFunnel.checkoutStarted}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Compras</span>
                      <span className="font-semibold text-green-600">{postHogMetrics?.conversionFunnel.purchaseCompleted}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-600">
                      {postHogMetrics?.conversionFunnel.abandonmentRate.toFixed(1)}% abandono
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 2. Performance de Produtos */}
              <Card className="relative overflow-hidden border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-900">Top Produtos</CardTitle>
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-800 mb-1">
                    {postHogMetrics?.productPerformance.topViewedProducts[0]?.product.split(' ')[0] || 'Canvas'}
                  </div>
                  <p className="text-xs text-emerald-600 mb-3">Produto mais visualizado</p>
                  <div className="space-y-2">
                    {postHogMetrics?.productPerformance.topViewedProducts.slice(0, 3).map((product, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="truncate">{product.product}</span>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">{product.views}</span>
                          <span className="text-green-600">({product.conversionRate.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2 bg-emerald-100 rounded-lg">
                    <div className="flex justify-between text-xs">
                      <span>Melhor conversão</span>
                      <span className="font-semibold text-emerald-700">
                        {postHogMetrics?.productPerformance.topViewedProducts[0]?.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3. Segmentação de Utilizadores */}
              <Card className="relative overflow-hidden border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-amber-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-900">Utilizadores</CardTitle>
                  <Users className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-800 mb-1">
                    {postHogMetrics?.userSegmentation.avgSessionTime.toFixed(1)}min
                  </div>
                  <p className="text-xs text-orange-600 mb-3">Sessão média</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Novos utilizadores</span>
                      <span className="font-semibold">{postHogMetrics?.userSegmentation.newUsers}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Utilizadores recorrentes</span>
                      <span className="font-semibold">{postHogMetrics?.userSegmentation.returningUsers}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Taxa de abandono</span>
                      <span className="font-semibold">{postHogMetrics?.userSegmentation.bounceRate}%</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-orange-100 rounded-lg">
                    <div className="flex justify-between text-xs">
                      <span>Hora mais ativa</span>
                      <span className="font-semibold text-orange-700">
                        {postHogMetrics?.userSegmentation.mostActiveHours[0]?.hour}h00-{postHogMetrics?.userSegmentation.mostActiveHours[0]?.hour ? postHogMetrics?.userSegmentation.mostActiveHours[0]?.hour + 1 : 0}h00
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 4. Insights de Receita */}
              <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-violet-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-900">Receita Intelligence</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-800 mb-1">
                    {formatCurrency(postHogMetrics?.revenueInsights.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-purple-600 mb-3">Receita total (PostHog)</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Valor médio pedido</span>
                      <span className="font-semibold">{formatCurrency(postHogMetrics?.revenueInsights.avgOrderValue || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>LTV médio</span>
                      <span className="font-semibold">{formatCurrency(postHogMetrics?.revenueInsights.ltv || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Crescimento</span>
                      <span className="font-semibold text-green-600">+{postHogMetrics?.revenueInsights.revenueGrowth}%</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-purple-100 rounded-lg">
                    <div className="flex justify-between text-xs">
                      <span>Top produto (receita)</span>
                      <span className="font-semibold text-purple-700">
                        {postHogMetrics?.revenueInsights.topRevenueProducts[0]?.product.split(' ')[0] || 'Canvas'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 5. Métricas em Tempo Real */}
              <Card className="relative overflow-hidden border-l-4 border-l-pink-500 bg-gradient-to-br from-pink-50 to-rose-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-pink-900">Tempo Real</CardTitle>
                  <Zap className="h-4 w-4 text-pink-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-800 mb-1">
                    {postHogMetrics?.realTimeMetrics.activeUsers}
                  </div>
                  <p className="text-xs text-pink-600 mb-3">Utilizadores ativos agora</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Sessões ativas</span>
                      <span className="font-semibold">{postHogMetrics?.realTimeMetrics.currentSessions}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Eventos live</span>
                      <span className="font-semibold">{postHogMetrics?.realTimeMetrics.liveEvents}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Tempo resposta</span>
                      <span className="font-semibold">{postHogMetrics?.realTimeMetrics.responseTime}ms</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-pink-100 rounded-lg">
                    <div className="flex justify-between text-xs">
                      <span>Carga servidor</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-pink-700">{postHogMetrics?.realTimeMetrics.serverLoad}%</span>
                        <div className="w-12 h-1 bg-pink-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-pink-500 transition-all duration-300"
                            style={{ width: `${postHogMetrics?.realTimeMetrics.serverLoad}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </Card>
            </div>
          )}
        </div>

        {/* Status dos Pedidos */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Pedidos</CardTitle>
              <CardDescription>Distribuição atual dos pedidos por status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pendentes</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{stats?.orders.pending || 0}</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Concluídos</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{stats?.orders.completed || 0}</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cancelados</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{stats?.orders.cancelled || 0}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status dos Webhooks</CardTitle>
              <CardDescription>Monitorização dos webhooks da Gelato</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total</span>
                  <Badge variant="outline">{stats?.webhooks.total || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Processados</span>
                  <Badge variant="default">{stats?.webhooks.processed || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Não processados</span>
                  <Badge variant="secondary">{stats?.webhooks.unprocessed || 0}</Badge>
                </div>
                {(stats?.webhooks.recent_errors || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Erros hoje
                    </span>
                    <Badge variant="destructive">{stats?.webhooks.recent_errors}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Ferramentas e links úteis para administração</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/orders')}
                className="h-20 flex flex-col gap-2"
              >
                <Package className="h-6 w-6" />
                <span>Gerir Pedidos</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.open('https://app.gelato.com', '_blank')}
                className="h-20 flex flex-col gap-2"
              >
                <ExternalLink className="h-6 w-6" />
                <span>Dashboard Gelato</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.open(`${window.location.origin}/api/gelato/webhooks`, '_blank')}
                className="h-20 flex flex-col gap-2"
              >
                <Webhook className="h-6 w-6" />
                <span>Webhook Endpoint</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {((stats?.webhooks.unprocessed || 0) > 10 || (stats?.webhooks.recent_errors || 0) > 0) && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                Alertas do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-orange-700">
                {(stats?.webhooks.unprocessed || 0) > 10 && (
                  <p>• Há mais de 10 webhooks não processados. Verifica se há problemas na integração.</p>
                )}
                {(stats?.webhooks.recent_errors || 0) > 0 && (
                  <p>• Há {stats?.webhooks.recent_errors} webhooks com erros hoje. Verifica os logs.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 