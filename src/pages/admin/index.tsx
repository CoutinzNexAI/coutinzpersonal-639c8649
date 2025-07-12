import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Webhook, TrendingUp, Users, AlertCircle, ExternalLink } from 'lucide-react';
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

interface AdminUser {
  id: string;
  email?: string;
  full_name?: string;
  role: string;
}

const AdminDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
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