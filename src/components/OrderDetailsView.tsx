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
      <h3 className="font-semibold text-ghibli-earth text-base">Estado da Encomenda</h3>
      <div className="space-y-4">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.id);
          const StepIcon = step.icon;
          
          return (
            <div key={step.id} className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                stepStatus === 'completed' 
                  ? 'bg-ghibli-moss text-white border-ghibli-moss' 
                  : stepStatus === 'current'
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                  : 'bg-gray-100 text-gray-400 border-gray-300'
              }`}>
                <StepIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-relaxed ${
                  stepStatus === 'completed' ? 'text-ghibli-earth' : 
                  stepStatus === 'current' ? 'text-yellow-700' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
                {stepStatus === 'current' && (
                  <p className="text-xs text-yellow-600 mt-1">Em andamento...</p>
                )}
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

// Helper to parse product customizations 
const parseProductCustomizations = (customizations: Record<string, string | number | boolean>): string[] => {
  const readable: string[] = [];
  
  for (const [key, value] of Object.entries(customizations)) {
    switch (key) {
      case 'variantId':
      case 'x': // Remove coordenadas
      case 'y': // Remove coordenadas
        break;
      case 'size':
        readable.push(`Tamanho: ${value}`);
        break;
      case 'variant':
        readable.push(`Variante: ${value}`);
        break;
      case 'position':
        readable.push(`Posição da foto: ${value}`);
        break;
      case 'paperType':
        readable.push(`Papel: ${value}`);
        break;
      case 'frameColor':
        if (value !== 'N/A') {
          readable.push(`Moldura: ${value}`);
        }
        break;
      default:
        if (value && value !== 'N/A') {
          readable.push(`${key}: ${value}`);
        }
    }
  }
  
  return readable;
};

// ProductList Component - Mostra todos os produtos da encomenda
const ProductList: React.FC<{ items: UserOrder['items']; fallbackOrder?: UserOrder }> = ({ items, fallbackOrder }) => {
  // Se não houver items array, usar os dados do fallbackOrder (compatibilidade)
  const productsToShow = items && items.length > 0 ? items : (fallbackOrder ? [{
    id: fallbackOrder.id,
    productId: fallbackOrder.id,
    productName: fallbackOrder.product_name,
    productCategory: fallbackOrder.product_category,
    userImageUrl: fallbackOrder.user_image_url,
    price: fallbackOrder.price,
    quantity: fallbackOrder.quantity,
    customizations: fallbackOrder.customizations,
  }] : []);

  return (
    <div className="bg-white rounded-lg border border-ghibli-stone/20 p-4 mb-6">
      <h2 className="text-lg font-semibold text-ghibli-earth mb-4 flex items-center gap-2">
        <Package className="w-5 h-5" />
        {productsToShow.length === 1 ? 'Detalhes do Produto' : `Produtos da Encomenda (${productsToShow.length})`}
      </h2>
      
      <div className="space-y-4">
        {productsToShow.map((item, index) => {
          const customizations = parseProductCustomizations(item.customizations || {});
          
          return (
            <div key={item.id || index} className="flex flex-col gap-4 p-3 bg-ghibli-stone/5 rounded-lg">
              {/* Imagem do produto - Mobile otimizado */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-24 h-48 sm:h-24 rounded-lg overflow-hidden bg-ghibli-stone/10 flex-shrink-0">
                  <img
                    src={item.userImageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ghibli-earth mb-1 text-base">{item.productName}</h3>
                  <p className="text-sm text-ghibli-earth/60 mb-2">Categoria: {item.productCategory}</p>
                  
                  {/* Preço e quantidade - destacados */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 p-2 bg-white/50 rounded">
                    <span className="text-sm text-ghibli-earth/70">Quantidade: <span className="font-medium">{item.quantity}</span></span>
                    <span className="text-lg font-bold text-ghibli-moss">€{item.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Personalizações - Mobile otimizado */}
              {customizations.length > 0 && (
                <div className="border-t border-ghibli-stone/10 pt-3">
                  <h4 className="text-sm font-medium text-ghibli-earth mb-2">Personalizações:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customizations.map((custom, idx) => (
                      <div key={idx} className="text-xs text-ghibli-earth/80 bg-ghibli-stone/10 px-2 py-1 rounded">
                        {custom}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

  // ✅ DEBUG: Log da encomenda completa recebida
  console.log('📋 OrderDetailsView - Encomenda recebida:', order);
  console.log('🛍️ OrderDetailsView - Campo items:', order.items);
  console.log('📊 OrderDetailsView - Número de itens:', order.items ? order.items.length : 'Campo items não existe');

  return (
    <div className="h-full overflow-y-auto">
      {/* Header com botão voltar - sempre visível */}
      <div className="sticky top-0 bg-ghibli-cream z-10 pb-4 mb-4 border-b border-ghibli-stone/20">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 p-0 text-ghibli-earth hover:text-ghibli-moss justify-start mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à Lista
        </Button>

        {/* Order Header - Mobile first */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-ghibli-earth mb-2">
              Encomenda #{order.order_reference || order.id.slice(0, 8)}
            </h1>
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl sm:text-2xl font-bold text-ghibli-moss">
              €{(order.total_amount || order.price).toFixed(2)}
            </p>
            <p className="text-sm text-ghibli-earth/60">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Stack vertical */}
      <div className="space-y-6">
        {/* Status Timeline - Mobile optimized */}
        <div className="bg-white rounded-lg border border-ghibli-stone/20 p-4">
          <StatusTimeline status={order.status} printifyStatus={order.printify_status} />
          
          {/* Action buttons - Mobile full width */}
          <div className="mt-6 space-y-3">
            {order.tracking_url && (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.open(order.tracking_url, '_blank')}
              >
                <Truck className="h-4 w-4 mr-2" />
                Seguir Encomenda
              </Button>
            )}
            
            <SupportButton order={order} />
          </div>
        </div>

        {/* Product List */}
        <ProductList items={order.items} fallbackOrder={order} />

        {/* Tracking Information - Mobile optimized */}
        {order.tracking_number && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Informações de Envio
            </h2>
            
            <div className="space-y-3">
              <div className="break-all">
                <p className="text-sm font-medium text-blue-700 mb-1">Número de Rastreamento:</p>
                <p className="text-blue-700 text-sm bg-blue-100 p-2 rounded font-mono">
                  {order.tracking_number}
                </p>
              </div>
              
              {order.tracking_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => window.open(order.tracking_url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Acompanhar no Site da Transportadora
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Order Timeline - Mobile optimized */}
        <div className="bg-white rounded-lg border border-ghibli-stone/20 p-4">
          <h2 className="text-lg font-semibold text-ghibli-earth mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Histórico da Encomenda
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-ghibli-moss rounded-full flex-shrink-0"></div>
                <span className="text-ghibli-earth/60">Criada em:</span>
              </div>
              <span className="text-ghibli-earth ml-4 font-medium">{formatDate(order.created_at)}</span>
            </div>
            
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-ghibli-moss rounded-full flex-shrink-0"></div>
                <span className="text-ghibli-earth/60">Última atualização:</span>
              </div>
              <span className="text-ghibli-earth ml-4 font-medium">{formatDate(order.updated_at)}</span>
            </div>
            
            {order.printify_status && (
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <span className="text-ghibli-earth/60">Estado Printify:</span>
                </div>
                <span className="text-ghibli-earth ml-4 font-medium">{order.printify_status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Espaçamento extra no final para mobile */}
        <div className="h-6"></div>
      </div>
    </div>
  );
}; 