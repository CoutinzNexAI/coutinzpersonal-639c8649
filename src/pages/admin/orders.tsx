import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Eye, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CurrentUser {
  id: string;
  email?: string;
  role: string;
}

interface SearchFilters {
  status?: string;
  gelato_status?: string;
  user_email?: string;
  product_name?: string;
  start_date?: string;
  end_date?: string;
}

interface GelatoOrder {
  id: string;
  user_id: string;
  gelato_order_id: string;
  product_name: string;
  price: number;
  currency: string;
  quantity: number;
  status: string;
  gelato_status: string;
  tracking_number?: string;
  tracking_url?: string;
  created_at: string;
  updated_at: string;
  users: {
    email: string;
    full_name: string;
  };
}

interface OrdersResponse {
  orders: GelatoOrder[];
  total: number;
  page: number;
  per_page: number;
}

const AdminOrdersPage = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<GelatoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [_currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    gelato_status: '',
    user_email: '',
    product_name: '',
    start_date: '',
    end_date: ''
  });

  // Paginação
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 25,
    total: 0
  });

  // Verificar se é admin
  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      // Verificar se é admin
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', user.id)
        .single();

      if (error || !userData || userData.role !== 'admin') {
        toast.error('Acesso negado. Apenas administradores.');
        router.push('/');
        return;
      }

      setCurrentUser({ ...user, role: userData.role });
      loadOrders();

    } catch (error) {
      console.error('Erro na verificação de admin:', error);
      router.push('/');
    }
  };

  const loadOrders = async (searchFilters?: SearchFilters) => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/admin/printify-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...filters,
          ...searchFilters,
          page: pagination.page,
          per_page: pagination.per_page
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao carregar pedidos');
      }

      const data: OrdersResponse = await response.json();
      setOrders(data.orders);
      setPagination(prev => ({
        ...prev,
        total: data.total
      }));

    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    setPagination(prev => ({ ...prev, page: 1 }));
    await loadOrders();
    setSearching(false);
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      gelato_status: '',
      user_email: '',
      product_name: '',
      start_date: '',
      end_date: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    loadOrders({
      status: '',
      gelato_status: '',
      user_email: '',
      product_name: '',
      start_date: '',
      end_date: ''
    });
  };

  const getStatusBadge = (status: string, isGelato = false) => {
    const baseClasses = "text-xs";
    
    if (isGelato) {
      switch (status) {
        case 'pending':
          return <Badge variant="secondary" className={baseClasses}>Pendente</Badge>;
        case 'approved':
          return <Badge variant="default" className={baseClasses}>Aprovado</Badge>;
        case 'in_production':
          return <Badge variant="default" className={baseClasses}>Em Produção</Badge>;
        case 'shipped':
          return <Badge variant="default" className={baseClasses}>Enviado</Badge>;
        case 'delivered':
          return <Badge variant="default" className={baseClasses}>Entregue</Badge>;
        case 'cancelled':
          return <Badge variant="destructive" className={baseClasses}>Cancelado</Badge>;
        default:
          return <Badge variant="outline" className={baseClasses}>{status}</Badge>;
      }
    } else {
      switch (status) {
        case 'pending':
          return <Badge variant="secondary" className={baseClasses}>Pendente</Badge>;
        case 'completed':
          return <Badge variant="default" className={baseClasses}>Concluído</Badge>;
        case 'cancelled':
          return <Badge variant="destructive" className={baseClasses}>Cancelado</Badge>;
        default:
          return <Badge variant="outline" className={baseClasses}>{status}</Badge>;
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-PT');
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(price);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>A carregar dashboard de admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Admin - Pedidos Gelato</h1>
          <p className="text-gray-600">Gerir e monitorizar todos os pedidos de produtos físicos</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Pesquisa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Email do utilizador"
                value={filters.user_email}
                onChange={(e) => setFilters(prev => ({ ...prev, user_email: e.target.value }))}
              />
              <Input
                placeholder="Nome do produto"
                value={filters.product_name}
                onChange={(e) => setFilters(prev => ({ ...prev, product_name: e.target.value }))}
              />
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filters.gelato_status}
                onChange={(e) => setFilters(prev => ({ ...prev, gelato_status: e.target.value }))}
              >
                <option value="">Todos os Status Gelato</option>
                <option value="pending">Pendente</option>
                <option value="approved">Aprovado</option>
                <option value="in_production">Em Produção</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSearch} 
                disabled={searching}
                className="flex items-center gap-2"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Pesquisar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>
              Pedidos ({pagination.total})
            </CardTitle>
            <CardDescription>
              Página {pagination.page} de {Math.ceil(pagination.total / pagination.per_page)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum pedido encontrado
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium">{order.product_name}</h3>
                          {getStatusBadge(order.status)}
                          {getStatusBadge(order.gelato_status, true)}
                        </div>
                        <p className="text-sm text-gray-600">
                          Cliente: {order.users.full_name || order.users.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          Pedido: {order.gelato_order_id || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(order.price, order.currency)}</p>
                        <p className="text-sm text-gray-600">Qtd: {order.quantity}</p>
                      </div>
                    </div>

                    {order.tracking_number && (
                      <div className="mb-3 p-2 bg-blue-50 rounded">
                        <p className="text-sm text-blue-700">
                          Rastreamento: {order.tracking_number}
                          {order.tracking_url && (
                            <a 
                              href={order.tracking_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 underline"
                            >
                              Rastrear
                            </a>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Criado: {formatDate(order.created_at)}
                        {order.updated_at !== order.created_at && (
                          <span className="ml-2">
                            | Atualizado: {formatDate(order.updated_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação */}
            {pagination.total > pagination.per_page && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                    loadOrders();
                  }}
                >
                  Anterior
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Página {pagination.page} de {Math.ceil(pagination.total / pagination.per_page)}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.per_page)}
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                    loadOrders();
                  }}
                >
                  Próxima
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOrdersPage; 