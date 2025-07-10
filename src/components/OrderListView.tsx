import React from 'react';
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
  Mail,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

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
  items?: Array<{
    id: string;
    productId: string;
    productName: string;
    productCategory: string;
    userImageUrl: string;
    price: number;
    quantity: number;
    customizations: Record<string, string | number | boolean>;
    imageAdjustments?: {
      x: number;
      y: number;
      scale: number;
      rotation?: number;
    };
  }>;
}

interface OrderListViewProps {
  orders: UserOrder[];
  onOrderSelect: (order: UserOrder) => void;
}

// Helper function to get status color and icon
const getStatusInfo = (status: string, printifyStatus: string) => {
  switch (status) {
    case 'processing':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        label: 'Em Processamento'
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

// Helper function to parse customizations
const parseCustomizations = (customizations: Record<string, string | number | boolean>): string[] => {
  const readable: string[] = [];
  
  for (const [key, value] of Object.entries(customizations)) {
    if (!value) continue;
    
    switch (key) {
      case 'x': // Remove coordenadas
      case 'y': // Remove coordenadas
      case 'angle': // Remove ângulo
      case 'scale': // Remove escala
      case 'rotation': // Remove rotação
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
      case 'position':
        readable.push(`Posição: ${value}`);
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
        // Filtrar apenas keys que não sejam técnicas
        if (typeof value === 'string' && value.length > 0 && 
            !['imageAdjustments', 'adjustments', 'coordinates'].includes(key)) {
          readable.push(`${key}: ${value}`);
        }
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

  return `mailto:pictuzinfo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

// Helper function to get products summary
const getProductsSummary = (order: UserOrder) => {
  // Se tem items array, usar esse (nova API)
  if (order.items && order.items.length > 0) {
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueProducts = order.items.length;
    
    if (uniqueProducts === 1) {
      return `${totalItems}x ${order.items[0].productName}`;
    } else {
      const firstProduct = order.items[0].productName;
      return `${uniqueProducts} produtos diferentes (${totalItems} itens total) - ${firstProduct} +${uniqueProducts - 1} outros`;
    }
  }
  
  // Fallback para API antiga
  return `${order.quantity}x ${order.product_name}`;
};

export const OrderListView: React.FC<OrderListViewProps> = ({ orders, onOrderSelect }) => {
  return (
    <div className="space-y-3">
      {orders.map((order, index) => {
        const statusInfo = getStatusInfo(order.status, order.printify_status);
        const StatusIcon = statusInfo.icon;
        const productsSummary = getProductsSummary(order);

        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-ghibli-stone/20 p-4 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => onOrderSelect(order)}
          >
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center gap-4">
              {/* Status Badge */}
              <div className="flex-shrink-0">
                <Badge className={`${statusInfo.color} flex items-center gap-1.5 px-3 py-1`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="font-medium">{statusInfo.label}</span>
                </Badge>
              </div>

              {/* Order Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-semibold text-ghibli-earth text-base mb-1 truncate">
                      Encomenda #{order.order_reference || order.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-ghibli-earth/80 mb-1 leading-relaxed">
                      {productsSummary}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-ghibli-earth/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(order.created_at)}
                      </span>
                      {order.tracking_number && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Truck className="w-3 h-3" />
                          Tracking: {order.tracking_number}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Price and Action */}
                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    <div>
                      <p className="text-lg font-bold text-ghibli-moss">
                        €{(order.total_amount || order.price).toFixed(2)}
                      </p>
                      {order.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = createSupportEmail(order);
                          }}
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Suporte
                        </Button>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-ghibli-earth/40 group-hover:text-ghibli-moss transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-3">
                  <h3 className="font-semibold text-ghibli-earth text-sm mb-1">
                    #{order.order_reference || order.id.slice(0, 8)}
                  </h3>
                  <Badge className={`${statusInfo.color} flex items-center gap-1 w-fit`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="text-xs">{statusInfo.label}</span>
                  </Badge>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-ghibli-moss">
                    €{(order.total_amount || order.price).toFixed(2)}
                  </p>
                  <p className="text-xs text-ghibli-earth/60">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-ghibli-earth/80 leading-relaxed">
                  {productsSummary}
                </p>
                {order.tracking_number && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Tracking: {order.tracking_number}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                {order.status === 'failed' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = createSupportEmail(order);
                    }}
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Contactar Suporte
                  </Button>
                ) : (
                  <div />
                )}
                
                <p className="text-xs text-ghibli-earth/50 flex items-center gap-1">
                  Toque para detalhes
                  <ChevronRight className="w-3 h-3" />
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}; 