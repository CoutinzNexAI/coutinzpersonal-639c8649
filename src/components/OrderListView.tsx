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
  Mail
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

export const OrderListView: React.FC<OrderListViewProps> = ({ orders, onOrderSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((order) => {
        const statusInfo = getStatusInfo(order.status, order.printify_status);
        const StatusIcon = statusInfo.icon;
        const customizations = parseCustomizations(order.customizations);

        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-ghibli-stone/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onOrderSelect(order)}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(order.tracking_url, '_blank');
                        }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = createSupportEmail(order);
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contactar Suporte
                </Button>
              )}

              {/* Click hint */}
              <div className="mt-3 pt-3 border-t border-ghibli-stone/10">
                <p className="text-xs text-ghibli-earth/50 text-center">
                  Clique para ver detalhes
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}; 