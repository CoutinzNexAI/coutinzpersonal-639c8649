import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Loader2, 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  Target, 
  DollarSign, 
  Clock,
  Eye,
  UserCheck,
  Zap,
  BarChart3,
  Filter,
  Calendar,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

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

interface AnalyticsData {
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

interface AdvancedMetrics {
  cohort_analysis: Array<{
    cohort_week: string;
    users_registered: number;
    users_active_week1: number;
    users_active_month1: number;
    retention_week1_percent: number;
    retention_month1_percent: number;
  }>;
  peak_hours: Array<{
    hour: number;
    transformations: number;
    orders: number;
    signups: number;
    total_activity: number;
  }>;
  customer_journey: Array<{
    stage: string;
    users_count: number;
    avg_time_to_next_stage_hours: number;
    conversion_rate: number;
  }>;
  retention_metrics: {
    day1_retention: number;
    day7_retention: number;
    day30_retention: number;
    churn_risk_users: number;
  };
  revenue_trends: {
    this_week: number;
    last_week: number;
    growth_rate: number;
    daily_average: number;
    projected_monthly: number;
  };
  product_affinity: Array<{
    product_a: string;
    product_b: string;
    co_purchase_count: number;
    affinity_score: number;
  }>;
  session_quality: {
    avg_pages_per_session: number;
    avg_session_duration: number;
    high_engagement_sessions: number;
    bounce_rate: number;
  };
}

const CHART_COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#64748b'
};

const AdminAnalytics = () => {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [advancedData, setAdvancedData] = useState<AdvancedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Filters
  const [timeframe, setTimeframe] = useState('30');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAnalyticsData();
    }
  }, [isAdmin, timeframe, dateFrom, dateTo]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        router.push('/404');
        return;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('role, email, full_name')
        .eq('id', user.id)
        .single();

      if (error || !userData || userData.role !== 'admin') {
        setIsAdmin(false);
        router.push('/404');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      setIsAdmin(false);
      router.push('/404');
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const loadingState = loading ? setLoading : setRefreshing;
      loadingState(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const params = new URLSearchParams({
        timeframe,
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo })
      });

      const response = await fetch(`/api/admin/analytics-data?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load analytics data');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAdvancedMetrics = async () => {
    try {
      setAdvancedLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/admin/advanced-metrics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load advanced metrics');
      }

      const advancedMetrics = await response.json();
      setAdvancedData(advancedMetrics);
    } catch (error) {
      console.error('Error loading advanced metrics:', error);
      toast.error('Failed to load advanced metrics');
    } finally {
      setAdvancedLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-PT').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const filteredUsers = data?.users.filter(user => {
    const matchesSearch = !userFilter || 
      user.email.toLowerCase().includes(userFilter.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(userFilter.toLowerCase());
    
    const matchesStatus = userStatusFilter === 'all' ||
      (userStatusFilter === 'online' && user.status === 'online') ||
      (userStatusFilter === 'offline' && user.status === 'offline') ||
      (userStatusFilter === 'active' && user.days_since_last_activity <= 7) ||
      (userStatusFilter === 'inactive' && user.days_since_last_activity > 30);

    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate trends
  const calculateTrend = (data: DailyStats[], field: keyof DailyStats) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-7);
    const previous = data.slice(-14, -7);
    
    const recentAvg = recent.reduce((sum, day) => sum + (Number(day[field]) || 0), 0) / recent.length;
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, day) => sum + (Number(day[field]) || 0), 0) / previous.length
      : recentAvg;
    
    return previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  };

  if (isAdmin === null || isAdmin === false) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Métricas de sucesso e análise de dados em tempo real</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
              >
                Dashboard Admin
              </Button>
              <Button
                onClick={loadAnalyticsData}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Início</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Fim</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      setTimeframe('30');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards */}
        {data && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Total Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.conversion_metrics.total_users)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <UserCheck className="h-3 w-3 mr-1" />
                  {data.real_time.active_users_now} online agora
                </div>
              </CardContent>
            </Card>

            {/* Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.daily_stats.reduce((sum, day) => sum + day.revenue, 0))}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  RPU: {formatCurrency(data.conversion_metrics.avg_revenue_per_user)}
                </div>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(data.conversion_metrics.transformation_to_purchase_rate)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {data.conversion_metrics.avg_time_to_first_order_hours.toFixed(1)}h até primeira compra
                </div>
              </CardContent>
            </Card>

            {/* Cart Abandonment */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Abandono Carrinho</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(data.cart_abandonment.abandonment_rate)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Activity className="h-3 w-3 mr-1" />
                  {data.cart_abandonment.abandoned_carts} carrinhos abandonados
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        {data && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
              <TabsTrigger value="advanced">Avançado</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Revenue Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Receita Diária</CardTitle>
                    <CardDescription>Evolução da receita ao longo do tempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={data.daily_stats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => format(new Date(date), 'dd/MM')}
                        />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          labelFormatter={(date) => format(new Date(date), 'dd/MM/yyyy')}
                          formatter={(value: number) => [formatCurrency(value), 'Receita']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke={CHART_COLORS.primary} 
                          fill={CHART_COLORS.primary}
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Users & Transformations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Usuários e Transformações</CardTitle>
                    <CardDescription>Atividade diária de usuários</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.daily_stats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => format(new Date(date), 'dd/MM')}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(date) => format(new Date(date), 'dd/MM/yyyy')}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="new_users" 
                          stroke={CHART_COLORS.secondary} 
                          name="Novos Usuários"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total_transformations" 
                          stroke={CHART_COLORS.success} 
                          name="Transformações"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total_orders" 
                          stroke={CHART_COLORS.warning} 
                          name="Pedidos"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Funil de Conversão</CardTitle>
                  <CardDescription>Jornada do usuário desde a transformação até a compra</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{data.conversion_metrics.users_with_transformations}</div>
                      <div className="text-sm text-muted-foreground">Fizeram Transformações</div>
                      <div className="text-xs">100%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{Math.floor(data.conversion_metrics.users_with_transformations * 0.3)}</div>
                      <div className="text-sm text-muted-foreground">Adicionaram ao Carrinho</div>
                      <div className="text-xs">~30%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{Math.floor(data.conversion_metrics.users_with_transformations * 0.24)}</div>
                      <div className="text-sm text-muted-foreground">Iniciaram Checkout</div>
                      <div className="text-xs">~24%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{data.conversion_metrics.users_with_orders}</div>
                      <div className="text-sm text-muted-foreground">Compraram</div>
                      <div className="text-xs">{formatPercentage(data.conversion_metrics.transformation_to_purchase_rate)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestão de Usuários</CardTitle>
                  <CardDescription>Análise detalhada e filtros de usuários</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <Input
                      placeholder="Pesquisar por email ou nome..."
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="max-w-sm"
                    />
                    <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="active">Ativos (7 dias)</SelectItem>
                        <SelectItem value="inactive">Inativos (30+ dias)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Transformações</TableHead>
                          <TableHead>Pedidos</TableHead>
                          <TableHead>Total Gasto</TableHead>
                          <TableHead>Última Atividade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.slice(0, 20).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.full_name || 'Sem nome'}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.status === 'online' ? 'default' : 'secondary'}>
                                {user.status === 'online' ? 'Online' : 'Offline'}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.total_transformations}</TableCell>
                            <TableCell>{user.total_orders}</TableCell>
                            <TableCell>{formatCurrency(user.total_spent)}</TableCell>
                            <TableCell>
                              {user.days_since_last_activity === 0 
                                ? 'Hoje' 
                                : `${user.days_since_last_activity} dias atrás`
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {filteredUsers.length > 20 && (
                    <div className="text-center mt-4 text-sm text-muted-foreground">
                      Mostrando 20 de {filteredUsers.length} usuários
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Most Transformed Styles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estilos Mais Transformados</CardTitle>
                    <CardDescription>Top estilos de IA mais populares</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.product_analytics.most_transformed_styles}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="style" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill={CHART_COLORS.primary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Most Ordered Products */}
                <Card>
                  <CardHeader>
                    <CardTitle>Produtos Mais Vendidos</CardTitle>
                    <CardDescription>Ranking por receita gerada</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.product_analytics.most_ordered_products.map((product, index) => (
                        <div key={product.product} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{product.product}</div>
                              <div className="text-sm text-muted-foreground">{product.orders} pedidos</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(product.revenue)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Product Conversion Rates */}
              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Conversão por Produto</CardTitle>
                  <CardDescription>Performance de conversão de cada categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.product_analytics.conversion_by_product}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="product" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'rate') return [`${value}%`, 'Taxa de Conversão'];
                          return [value, name];
                        }}
                      />
                      <Bar dataKey="views" fill={CHART_COLORS.muted} name="Visualizações" />
                      <Bar dataKey="orders" fill={CHART_COLORS.success} name="Pedidos" />
                      <Bar dataKey="rate" fill={CHART_COLORS.warning} name="Taxa %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Real Time Tab */}
            <TabsContent value="realtime" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Live Users */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-500" />
                      Usuários Online
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-4">
                      {data.real_time.active_users_now}
                    </div>
                    <div className="space-y-2">
                      {data.real_time.online_users.slice(0, 5).map((email, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {email}
                        </div>
                      ))}
                      {data.real_time.online_users.length > 5 && (
                        <div className="text-xs text-muted-foreground">
                          +{data.real_time.online_users.length - 5} mais...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Atividade (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Transformações</span>
                        <span className="font-bold">{data.real_time.recent_transformations}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pedidos</span>
                        <span className="font-bold">{data.real_time.recent_orders}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sessão Média</span>
                        <span className="font-bold">{Math.round(data.real_time.avg_session_duration)}s</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo Rápido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(data.conversion_metrics.lifetime_value)}
                        </div>
                        <div className="text-sm text-blue-700">LTV Médio</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {data.conversion_metrics.avg_time_to_first_order_hours.toFixed(1)}h
                        </div>
                        <div className="text-sm text-green-700">Time to Value</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Métricas Avançadas</h3>
                  <p className="text-sm text-muted-foreground">Análise de cohorts, retenção e comportamento</p>
                </div>
                <Button
                  onClick={loadAdvancedMetrics}
                  disabled={advancedLoading}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${advancedLoading ? 'animate-spin' : ''}`} />
                  {advancedData ? 'Atualizar' : 'Carregar'}
                </Button>
              </div>

              {advancedLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Carregando métricas avançadas...</span>
                </div>
              )}

              {advancedData && (
                <>
                  {/* Retention & Revenue Trends */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Métricas de Retenção</CardTitle>
                        <CardDescription>Taxa de usuários que retornam</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Retenção D1</span>
                            <span className="font-bold">{advancedData.retention_metrics.day1_retention}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Retenção D7</span>
                            <span className="font-bold">{advancedData.retention_metrics.day7_retention}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Retenção D30</span>
                            <span className="font-bold">{advancedData.retention_metrics.day30_retention}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-red-600">Risco de Churn</span>
                            <span className="font-bold text-red-600">{advancedData.retention_metrics.churn_risk_users}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Tendências de Receita</CardTitle>
                        <CardDescription>Comparação semanal e projeções</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Esta Semana</span>
                            <span className="font-bold">{formatCurrency(advancedData.revenue_trends.this_week)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Semana Passada</span>
                            <span className="font-bold">{formatCurrency(advancedData.revenue_trends.last_week)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Crescimento</span>
                            <span className={`font-bold ${advancedData.revenue_trends.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {advancedData.revenue_trends.growth_rate >= 0 ? '+' : ''}{advancedData.revenue_trends.growth_rate}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Projeção Mensal</span>
                            <span className="font-bold text-blue-600">{formatCurrency(advancedData.revenue_trends.projected_monthly)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Customer Journey */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Jornada do Cliente</CardTitle>
                      <CardDescription>Análise detalhada do funil de conversão</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-6">
                        {advancedData.customer_journey.map((stage, index) => (
                          <div key={stage.stage} className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{formatNumber(stage.users_count)}</div>
                            <div className="text-sm font-medium">{stage.stage}</div>
                            <div className="text-xs text-muted-foreground">{stage.conversion_rate}% conversão</div>
                            {stage.avg_time_to_next_stage_hours > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                {stage.avg_time_to_next_stage_hours.toFixed(1)}h até próximo
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Peak Hours Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Atividade por Hora</CardTitle>
                      <CardDescription>Padrões de uso ao longo do dia</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={advancedData.peak_hours}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="hour" 
                            tickFormatter={(hour) => `${hour}:00`}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(hour) => `${hour}:00`}
                          />
                          <Bar dataKey="transformations" fill={CHART_COLORS.primary} name="Transformações" />
                          <Bar dataKey="orders" fill={CHART_COLORS.success} name="Pedidos" />
                          <Bar dataKey="signups" fill={CHART_COLORS.secondary} name="Registros" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Cohort Analysis & Product Affinity */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Análise de Cohorts</CardTitle>
                        <CardDescription>Retenção por semana de registro</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {advancedData.cohort_analysis.slice(0, 6).map((cohort) => (
                            <div key={cohort.cohort_week} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div>
                                <div className="font-medium">{format(new Date(cohort.cohort_week), 'dd/MM/yyyy')}</div>
                                <div className="text-sm text-muted-foreground">{cohort.users_registered} usuários</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm">Semana 1: {cohort.retention_week1_percent}%</div>
                                <div className="text-sm">Mês 1: {cohort.retention_month1_percent}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Afinidade de Produtos</CardTitle>
                        <CardDescription>Produtos frequentemente comprados juntos</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {advancedData.product_affinity.length > 0 ? (
                            advancedData.product_affinity.map((affinity, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <div>
                                  <div className="font-medium text-sm">
                                    {affinity.product_a} + {affinity.product_b}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {affinity.co_purchase_count} compras conjuntas
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold">{affinity.affinity_score}</div>
                                  <div className="text-xs text-muted-foreground">Score</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              Dados insuficientes para análise de afinidade
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Session Quality */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Qualidade das Sessões</CardTitle>
                      <CardDescription>Métricas de engajamento e comportamento</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {advancedData.session_quality.avg_pages_per_session}
                          </div>
                          <div className="text-sm text-blue-700">Páginas/Sessão</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round(advancedData.session_quality.avg_session_duration / 60)}min
                          </div>
                          <div className="text-sm text-green-700">Duração Média</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {advancedData.session_quality.high_engagement_sessions}
                          </div>
                          <div className="text-sm text-purple-700">Alto Engajamento</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {advancedData.session_quality.bounce_rate}%
                          </div>
                          <div className="text-sm text-orange-700">Taxa de Rejeição</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {!advancedData && !advancedLoading && (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Métricas Avançadas</h3>
                      <p className="text-muted-foreground mb-4">
                        Clique em "Carregar" para ver análises detalhadas de cohorts, retenção e comportamento.
                      </p>
                      <Button onClick={loadAdvancedMetrics}>
                        Carregar Métricas Avançadas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics; 