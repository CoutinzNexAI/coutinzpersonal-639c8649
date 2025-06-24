import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  XCircle,
  ExternalLink,
  Mail,
  MapPin,
  Calendar,
  Euro
} from 'lucide-react';

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

interface OrderDetailsViewProps {
  order: UserOrder;
  onBack: () => void;
}

// Helper function to get status info (duplicated from OrdersModal for now)
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

// Helper function to parse customizations
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// StatusTimeline Component
const StatusTimeline: React.FC<{ status: string; printifyStatus: string }> = ({ status, printifyStatus }) => {
  const steps = [
    { id: 'processing', label: 'Pedido Recebido', icon: Package },
    { id: 'in_production', label: 'Em Produção', icon: Clock },
    { id: 'shipped', label: 'Enviado', icon: Truck },
    { id: 'delivered', label: 'Entregue', icon: CheckCircle }
  ];

  const getStepStatus = (stepId: string) => {
    const currentIndex = steps.findIndex(s => s.id === status || (status === 'processing' && s.id === 'processing'));
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (status === 'failed' || status === 'cancelled') {
      return stepIndex === 0 ? 'completed' : 'inactive';
    }
    
    if (stepIndex <= currentIndex) return 'completed';
    if (stepIndex === currentIndex + 1) return 'current';
    return 'inactive';
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-ghibli-earth">Estado da Encomenda</h3>
      <div className="space-y-3">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.id);
          const StepIcon = step.icon;
          
          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                stepStatus === 'completed' 
                  ? 'bg-ghibli-moss text-white border-ghibli-moss' 
                  : stepStatus === 'current'
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                  : 'bg-gray-100 text-gray-400 border-gray-300'
              }`}>
                <StepIcon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  stepStatus === 'completed' ? 'text-ghibli-earth' : 
                  stepStatus === 'current' ? 'text-yellow-700' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// SupportButton Component
const SupportButton: React.FC<{ order: UserOrder }> = ({ order }) => {
  const subject = `Dúvida sobre a Encomenda #${order.order_reference || order.id}`;
  const body = `Olá equipa PicTuz,

Tenho uma pergunta sobre a minha encomenda:

- Referência: #${order.order_reference || order.id}
- Produto: ${order.product_name}
- Data: ${formatDate(order.created_at)}
- Estado: ${order.status}

`;

  const mailtoLink = `mailto:pictuzinfo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <Button 
      variant="outline" 
      className="w-full flex items-center gap-2 text-ghibli-earth border-ghibli-stone/30 hover:bg-ghibli-stone/10"
      onClick={() => window.location.href = mailtoLink}
    >
      <Mail className="h-4 w-4" />
      Contactar Suporte
    </Button>
  );
};

// ProductList Component - Mostra todos os produtos da encomenda
const ProductList: React.FC<{ items: UserOrder['items']; fallbackOrder?: UserOrder }> = ({ items, fallbackOrder }) => {
  // Se não houver items array, usar os dados do fallbackOrder (compatibilidade)
  const productsToShow = items && items.length > 0 ? items : (fallbackOrder ? [{
    id: fallbackOrder.id,
    productId: fallbackOrder.id, // Usando id como fallback
    productName: fallbackOrder.product_name,
    productCategory: fallbackOrder.product_category,
    userImageUrl: fallbackOrder.user_image_url,
    price: fallbackOrder.price,
    quantity: fallbackOrder.quantity,
    customizations: fallbackOrder.customizations,
  }] : []);

  console.log('🛍️ ProductList - produtos a mostrar:', productsToShow); // DEBUG LOG

  return (
    <div className="bg-white rounded-lg border border-ghibli-stone/20 p-6 mb-6">
      <h2 className="text-lg font-semibold text-ghibli-earth mb-4 flex items-center gap-2">
        <Package className="w-5 h-5" />
        {productsToShow.length === 1 ? 'Detalhes do Produto' : `Produtos da Encomenda (${productsToShow.length})`}
      </h2>
      
      <div className="space-y-4">
        {productsToShow.map((item, index) => {
          const customizations = parseCustomizations(item.customizations);
          
          return (
            <div key={item.id || index} className="flex gap-4 p-4 bg-ghibli-stone/5 rounded-lg">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-ghibli-stone/10 flex-shrink-0">
                <img
                  src={item.userImageUrl}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-ghibli-earth mb-1">{item.productName}</h3>
                <p className="text-sm text-ghibli-earth/60 mb-2">Categoria: {item.productCategory}</p>
                
                {customizations.length > 0 && (
                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-ghibli-earth mb-1">Personalizações:</h4>
                    <div className="space-y-1">
                      {customizations.map((custom, customIndex) => (
                        <p key={customIndex} className="text-xs text-ghibli-earth/80">
                          • {custom}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ghibli-earth/60">Quantidade: {item.quantity}</span>
                  <span className="font-semibold text-ghibli-moss">€{item.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({ order, onBack }) => {
  const statusInfo = getStatusInfo(order.status, order.printify_status);
  const StatusIcon = statusInfo.icon;
  const customizations = parseCustomizations(order.customizations);

  // ✅ DEBUG: Log da encomenda completa recebida
  console.log('📋 OrderDetailsView - Encomenda recebida:', order);
  console.log('🛍️ OrderDetailsView - Campo items:', order.items);
  console.log('📊 OrderDetailsView - Número de itens:', order.items ? order.items.length : 'Campo items não existe');

  return (
    <div className="flex h-full gap-8">
      {/* Coluna da Esquerda: Navegação e Ações */}
      <aside className="w-1/4 border-r border-ghibli-stone/20 pr-6 flex flex-col">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 mb-6 p-0 text-ghibli-earth hover:text-ghibli-moss justify-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à Lista
        </Button>

        <StatusTimeline status={order.status} printifyStatus={order.printify_status} />
        
        {/* Tracking Button */}
        {order.tracking_url && (
          <Button 
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.open(order.tracking_url, '_blank')}
          >
            <Truck className="h-4 w-4 mr-2" />
            Seguir Encomenda
          </Button>
        )}

        {/* Support Button - Always at bottom */}
        <div className="mt-auto pt-6">
          <SupportButton order={order} />
        </div>
      </aside>

      {/* Coluna da Direita: Conteúdo Principal */}
      <main className="w-3/4 overflow-y-auto">
        {/* Order Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-ghibli-earth mb-2">
                Encomenda #{order.order_reference || order.id.slice(0, 8)}
              </h1>
              <div className="flex items-center gap-2">
                <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-ghibli-moss">
                €{(order.total_amount || order.price).toFixed(2)}
              </p>
              <p className="text-sm text-ghibli-earth/60">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Product List */}
        <ProductList items={order.items} fallbackOrder={order} />

        {/* Tracking Information */}
        {order.tracking_number && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Informações de Envio
            </h2>
            
            <div className="space-y-2">
              <p className="text-blue-700">
                <span className="font-medium">Número de Rastreamento:</span> {order.tracking_number}
              </p>
              {order.tracking_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => window.open(order.tracking_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Acompanhar no Site da Transportadora
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Order Timeline */}
        <div className="bg-white rounded-lg border border-ghibli-stone/20 p-6">
          <h2 className="text-lg font-semibold text-ghibli-earth mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Histórico da Encomenda
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-ghibli-moss rounded-full"></div>
              <span className="text-ghibli-earth/60">Criada em:</span>
              <span className="text-ghibli-earth">{formatDate(order.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-ghibli-moss rounded-full"></div>
              <span className="text-ghibli-earth/60">Última atualização:</span>
              <span className="text-ghibli-earth">{formatDate(order.updated_at)}</span>
            </div>
            
            {order.printify_status && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-ghibli-earth/60">Estado Printify:</span>
                <span className="text-ghibli-earth">{order.printify_status}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}; 