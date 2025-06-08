import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Ban, ExternalLink, Package, User, CreditCard, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface GelatoOrder {
  id: string;
  user_id: string;
  transformation_id: string;
  gelato_order_id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  user_image_url: string;
  price: number;
  currency: string;
  quantity: number;
  customizations: any;
  shipping_info: any;
  payment_info: any;
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

const AdminOrderDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<GelatoOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (id) {
      checkAdminAccess();
    }
  }, [id]);

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
      loadOrderDetails();

    } catch (error) {
      console.error('Erro na verificação de admin:', error);
      router.push('/');
    }
  };

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/admin/gelato-orders?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao carregar detalhes do pedido');
      }

      const orderData: GelatoOrder = await response.json();
      setOrder(orderData);

    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      toast.error('Erro ao carregar detalhes: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !order.gelato_order_id) {
      toast.error('Não é possível cancelar este pedido');
      return;
    }

    const confirmed = window.confirm(
      `Tens a certeza que queres cancelar o pedido ${order.gelato_order_id}?\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/admin/gelato-orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Erro ao cancelar pedido');
      }

      toast.success('Pedido cancelado com sucesso!');
      // Recarregar os detalhes do pedido
      loadOrderDetails();

    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      toast.error('Erro ao cancelar: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string, isGelato = false) => {
    const baseClasses = "text-sm";
    
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

  const canCancelOrder = (status: string) => {
    return ['pending', 'approved'].includes(status) && status !== 'cancelled';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>A carregar detalhes do pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Pedido não encontrado</h2>
          <Button onClick={() => router.push('/admin/orders')}>
            Voltar aos pedidos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/orders')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos pedidos
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Detalhes do Pedido</h1>
              <p className="text-gray-600">ID: {order.id}</p>
              {order.gelato_order_id && (
                <p className="text-gray-600">Gelato ID: {order.gelato_order_id}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              {getStatusBadge(order.status)}
              {getStatusBadge(order.gelato_status, true)}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações do Produto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{order.product_name}</h3>
                <p className="text-gray-600">Categoria: {order.product_category}</p>
                <p className="text-gray-600">ID: {order.product_id}</p>
              </div>
              
              {order.user_image_url && (
                <div>
                  <p className="text-sm font-medium mb-2">Imagem do utilizador:</p>
                  <img 
                    src={order.user_image_url} 
                    alt="Imagem do produto"
                    className="w-32 h-32 object-cover rounded border"
                  />
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600">Preço:</span>
                <span className="font-semibold">{formatPrice(order.price, order.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantidade:</span>
                <span>{order.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">{formatPrice(order.price * order.quantity, order.currency)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.users.full_name || 'Nome não disponível'}</p>
                <p className="text-gray-600">{order.users.email}</p>
              </div>
              
              {order.shipping_info && (
                <div>
                  <p className="text-sm font-medium mb-2">Endereço de envio:</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    {order.shipping_info.name && <p>{order.shipping_info.name}</p>}
                    {order.shipping_info.address1 && <p>{order.shipping_info.address1}</p>}
                    {order.shipping_info.address2 && <p>{order.shipping_info.address2}</p>}
                    {order.shipping_info.city && order.shipping_info.postal_code && (
                      <p>{order.shipping_info.postal_code} {order.shipping_info.city}</p>
                    )}
                    {order.shipping_info.country && <p>{order.shipping_info.country}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rastreamento */}
          {(order.tracking_number || order.tracking_url) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Rastreamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.tracking_number && (
                  <div>
                    <p className="text-sm font-medium">Código de rastreamento:</p>
                    <p className="font-mono text-sm">{order.tracking_number}</p>
                  </div>
                )}
                
                {order.tracking_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => window.open(order.tracking_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Rastrear encomenda
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações Técnicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Criado:</span>
                <span className="text-sm">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Atualizado:</span>
                <span className="text-sm">{formatDate(order.updated_at)}</span>
              </div>
              {order.transformation_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transformação ID:</span>
                  <span className="text-sm font-mono">{order.transformation_id}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customizações */}
        {order.customizations && Object.keys(order.customizations).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Customizações</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(order.customizations, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {canCancelOrder(order.gelato_status) && (
                <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="flex items-center gap-2"
                >
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                  {cancelling ? 'A cancelar...' : 'Cancelar Pedido'}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={loadOrderDetails}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4" />
                Atualizar dados
              </Button>
            </div>
            
            {!canCancelOrder(order.gelato_status) && (
              <p className="text-sm text-gray-600 mt-2">
                Este pedido não pode ser cancelado devido ao seu status atual.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage; 