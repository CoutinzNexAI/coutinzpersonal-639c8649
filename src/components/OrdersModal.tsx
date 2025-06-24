import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  XCircle,
  ExternalLink,
  Search,
  Loader2,
  Mail,
  Package2
} from 'lucide-react';
import { useOrdersModal } from '@/hooks/ordersModalContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

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

// Helper function to get status color and icon
const getStatusInfo = (status: string, printifyStatus: string) => {
  switch (status) {
    case 'processing':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        label: printifyStatus === 'on-hold' ? 'Aguardar Pagamento' : 'Em Processamento'
      };
    case 'shipped':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Truck,
        label: 'Enviado'
      };
    case 'delivered':
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'Entregue'
      };
    case 'failed':
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle,
        label: 'Falhou'
      };
    case 'cancelled':
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircle,
        label: 'Cancelado'
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Package,
        label: 'Desconhecido'
      };
  }
};

// Helper function to parse customizations into readable format
const parseCustomizations = (customizations: Record<string, string | number | boolean>): string[] => {
  const readable: string[] = [];
  
  for (const [key, value] of Object.entries(customizations)) {
    switch (key) {
      case 'variantId':
        // Skip internal IDs
        break;
      case 'size':
        readable.push(`Tamanho: ${value}`);
        break;
      case 'color':
        readable.push(`Cor: ${value}`);
        break;
      case 'phoneModel':
        readable.push(`Modelo: ${value}`);
        break;
      case 'variant':
        readable.push(`Variante: ${value}`);
        break;
      case 'paperType':
        readable.push(`Papel: ${value}`);
        break;
      case 'canvasEdgeType':
        readable.push(`Tipo de Borda: ${value === 'mirror' ? 'Espelhada' : 'Normal'}`);
        break;
      case 'frameColor':
        if (value !== 'N/A') {
          readable.push(`Moldura: ${value}`);
        }
        break;
      case 'selectedPhraseText':
        readable.push(`Texto: ${value}`);
        break;
      default:
        // For any other customization, display as is
        readable.push(`${key}: ${value}`);
    }
  }
  
  return readable;
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Helper function to create support email
const createSupportEmail = (order: UserOrder) => {
  const subject = `Ajuda com Encomenda #${order.order_reference || order.id}`;
  const body = `Olá,

A minha encomenda falhou e preciso de ajuda:

- Referência: #${order.order_reference || order.id}
- Produto: ${order.product_name}
- Data: ${formatDate(order.created_at)}
- Status: ${order.status} (${order.printify_status})

Podem investigar o que aconteceu e ajudar-me?

Obrigado!`;

  return `mailto:suporte@pictuz.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const OrdersModal: React.FC = () => {
  const { isOpen, closeOrdersModal } = useOrdersModal();
  const { userInfo, session } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

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
        limit: '12'
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

  const handleClose = () => {
    setSearchTerm('');
    setCurrentPage(1);
    closeOrdersModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-ghibli-cream border-ghibli-stone">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status, order.printify_status);
                const StatusIcon = statusInfo.icon;
                const customizations = parseCustomizations(order.customizations);

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-ghibli-stone/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Order Image */}
                    <div className="aspect-square relative overflow-hidden bg-ghibli-stone/10">
                      <img
                        src={order.user_image_url}
                        alt={order.product_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Status Badge Overlay */}
                      <div className="absolute top-3 right-3">
                        <Badge className={`${statusInfo.color} flex items-center gap-1 shadow-sm`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="p-4">
                      {/* Product Name & Reference */}
                      <div className="mb-3">
                        <h3 className="font-medium text-ghibli-earth text-sm line-clamp-2">
                          {order.product_name}
                        </h3>
                        <p className="text-xs text-ghibli-earth/60 mt-1">
                          #{order.order_reference || order.id.slice(0, 8)}
                        </p>
                      </div>

                      {/* Customizations */}
                      {customizations.length > 0 && (
                        <div className="mb-3">
                          <div className="space-y-1">
                            {customizations.slice(0, 2).map((custom, index) => (
                              <p key={index} className="text-xs text-ghibli-earth/80">
                                {custom}
                              </p>
                            ))}
                            {customizations.length > 2 && (
                              <p className="text-xs text-ghibli-earth/60">
                                +{customizations.length - 2} mais...
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Price & Date */}
                      <div className="flex justify-between items-center mb-3 text-sm">
                        <span className="font-bold text-ghibli-moss">
                          €{(order.total_amount || order.price).toFixed(2)}
                        </span>
                        <span className="text-ghibli-earth/60">
                          {formatDate(order.created_at)}
                        </span>
                      </div>

                      {/* Tracking */}
                      {order.tracking_number && (
                        <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-blue-700 font-medium">
                              Rastreamento: {order.tracking_number}
                            </span>
                            {order.tracking_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                onClick={() => window.open(order.tracking_url, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Failed Order - Support Contact */}
                      {order.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => window.location.href = createSupportEmail(order)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Contactar Suporte
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with count */}
        <div className="border-t border-ghibli-stone/20 pt-4 flex justify-between items-center">
          <p className="text-sm text-ghibli-earth/70">
            {filteredOrders.length} encomenda{filteredOrders.length === 1 ? '' : 's'} 
            {searchTerm && ` encontrada${filteredOrders.length === 1 ? '' : 's'}`}
          </p>
          
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 