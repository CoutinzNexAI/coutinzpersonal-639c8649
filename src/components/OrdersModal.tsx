import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Search,
  Loader2,
  Package2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useOrdersModal } from '@/hooks/ordersModalContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import { OrderListView } from '@/components/OrderListView';
import { OrderDetailsView } from '@/components/OrderDetailsView';

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

interface OrdersResponse {
  success: boolean;
  orders: UserOrder[];
  total: number;
  page: number;
  per_page: number;
}



export const OrdersModal: React.FC = () => {
  const { isOpen, closeOrdersModal } = useOrdersModal();
  const { userInfo, session } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);

  // Fetch orders from API
  const fetchOrders = async (page = 1, search = '') => {
    if (!session?.access_token) {
      console.log('❌ No access token available');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '3'
      });

      const response = await fetch(`/api/orders/my-orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: OrdersResponse = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setTotalOrders(data.total);
        console.log(`✅ Loaded ${data.orders.length} orders (total: ${data.total})`);
      } else {
        throw new Error('API returned error');
      }

    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      toast.error('Erro ao carregar encomendas', {
        description: 'Tente novamente mais tarde'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders when modal opens
  useEffect(() => {
    if (isOpen && userInfo && session) {
      console.log('🚀 Modal opened, fetching orders...');
      setCurrentPage(1);
      fetchOrders(1, searchTerm);
    }
  }, [isOpen, userInfo?.id, session]);

  // Filter orders based on search term
  const filteredOrders = orders.filter(order =>
    order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.order_reference || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOrderClick = (order: UserOrder) => {
    setSelectedOrder(order);
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
  };

  const handleClose = () => {
    setSearchTerm('');
    setCurrentPage(1);
    setSelectedOrder(null);
    closeOrdersModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] sm:max-h-[90vh] w-[95vw] sm:w-full overflow-hidden bg-ghibli-cream border-ghibli-stone">
        {selectedOrder ? (
          // Vista de Detalhes da Encomenda
          <>
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl sm:text-2xl font-semibold text-ghibli-earth flex items-center gap-2">
                <Package2 className="w-5 h-5 sm:w-6 sm:h-6 text-ghibli-moss" />
                Detalhes da Encomenda
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 min-h-0 overflow-hidden">
              <OrderDetailsView order={selectedOrder} onBack={handleBackToList} />
            </div>
          </>
        ) : (
          // Vista de Lista das Encomendas
          <>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-ghibli-earth flex items-center gap-2">
            <Package2 className="w-6 h-6 text-ghibli-moss" />
            As Minhas Encomendas
          </DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ghibli-earth/60 w-4 h-4" />
          <Input
            placeholder="Pesquisar por produto ou referência..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-ghibli-stone/30 focus:border-ghibli-moss"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-ghibli-moss animate-spin mb-4" />
              <p className="text-ghibli-earth/70">A carregar as suas encomendas...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-ghibli-earth/40 mb-4" />
              <h3 className="text-lg font-medium text-ghibli-earth mb-2">
                {searchTerm ? 'Nenhuma encomenda encontrada' : 'Ainda não tem encomendas'}
              </h3>
              <p className="text-ghibli-earth/70 text-center max-w-md">
                {searchTerm 
                  ? 'Tente pesquisar por outro termo ou limpe o filtro.'
                  : 'Comece a personalizar produtos na nossa loja!'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleClose}
                  className="mt-4"
                  variant="outline"
                >
                  Explorar Loja
                </Button>
              )}
            </div>
          ) : (
                <OrderListView orders={filteredOrders} onOrderSelect={handleOrderClick} />
          )}
        </div>

        {/* Footer with count and pagination */}
        <div className="border-t border-ghibli-stone/20 pt-4">
          {/* Pagination controls */}
          {!searchTerm && totalOrders > 3 && (
            <div className="flex justify-center items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prevPage = currentPage - 1;
                  setCurrentPage(prevPage);
                  fetchOrders(prevPage, searchTerm);
                }}
                disabled={currentPage <= 1 || loading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1 text-sm text-ghibli-earth">
                <span>Página {currentPage} de {Math.ceil(totalOrders / 3)}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextPage = currentPage + 1;
                  setCurrentPage(nextPage);
                  fetchOrders(nextPage, searchTerm);
                }}
                disabled={currentPage >= Math.ceil(totalOrders / 3) || loading}
                className="flex items-center gap-1"
              >
                Seguinte
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-ghibli-earth/70">
              {searchTerm ? (
                `${filteredOrders.length} encomenda${filteredOrders.length === 1 ? '' : 's'} encontrada${filteredOrders.length === 1 ? '' : 's'}`
              ) : (
                `${totalOrders} encomenda${totalOrders === 1 ? '' : 's'} total`
              )}
            </p>
            
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}; 