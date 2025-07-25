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
  Calendar,
  ArrowLeft
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
      case 'x':
      case 'y':
      case 'angle':
      case 'scale':
      case 'rotation':
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

// Status Timeline Component
const StatusTimeline: React.FC<{ status: string; printifyStatus: string }> = ({ status, printifyStatus }) => {
  const steps = ['processing', 'shipped', 'delivered'];
  
  const getStepStatus = (stepId: string) => {
    const currentIndex = steps.indexOf(status);
    const stepIndex = steps.indexOf(stepId);
    
    if (status === 'failed' || status === 'cancelled') {
      return stepIndex === 0 ? 'error' : 'inactive';
    }
    
    if (stepIndex <= currentIndex) {
      return 'completed';
    } else {
      return 'inactive';
    }
  };

  const getStepIcon = (stepId: string) => {
    const stepStatus = getStepStatus(stepId);
    
    switch (stepId) {
      case 'processing':
        return stepStatus === 'error' ? AlertTriangle : Clock;
      case 'shipped':
        return Truck;
      case 'delivered':
        return CheckCircle;
      default:
        return Package;
    }
  };

  const getStepColor = (stepId: string) => {
    const stepStatus = getStepStatus(stepId);
    
    switch (stepStatus) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-300 text-gray-500';
    }
  };

  const getStepLabel = (stepId: string) => {
    switch (stepId) {
      case 'processing':
        return 'Processamento';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      default:
        return stepId;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-ghibli-earth">Estado Atual</h3>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const StepIcon = getStepIcon(step);
          const stepColor = getStepColor(step);
          const stepLabel = getStepLabel(step);
          
          return (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stepColor}`}>
                <StepIcon className="w-4 h-4" />
              </div>
              <span className="text-sm text-ghibli-earth">{stepLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Support Button Component
const SupportButton: React.FC<{ order: UserOrder }> = ({ order }) => {
  const createSupportEmail = () => {
    const subject = `Ajuda com Encomenda #${order.order_reference || order.id}`;
    const body = `Olá,

Preciso de ajuda com a minha encomenda:

- Referência: #${order.order_reference || order.id}
- Data: ${formatDate(order.created_at)}
- Status: ${order.status}
- Valor: €${(order.total_amount || order.price).toFixed(2)}

Descrição do problema:
[Descreva aqui o seu problema]

Obrigado!`;

    return `mailto:pictuzinfo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={() => window.location.href = createSupportEmail()}
    >
      <Mail className="w-4 h-4 mr-2" />
      Contactar Suporte
    </Button>
  );
};

// Parse product customizations
const parseProductCustomizations = (customizations: Record<string, string | number | boolean>): string[] => {
  const readable: string[] = [];
  
  for (const [key, value] of Object.entries(customizations)) {
    if (!value) continue;
    
    switch (key) {
      case 'x':
      case 'y':
      case 'angle':
      case 'scale':
      case 'rotation':
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
        if (typeof value === 'string' && value.length > 0 && 
            !['imageAdjustments', 'adjustments', 'coordinates'].includes(key)) {
          readable.push(`${key}: ${value}`);
        }
    }
  }
  
  return readable;
};

// Product List Component
const ProductList: React.FC<{ items: UserOrder['items']; fallbackOrder?: UserOrder }> = ({ items, fallbackOrder }) => {
  // Se não há items, usa dados da encomenda como fallback (compatibilidade com API antiga)
  const productsToShow = items && items.length > 0 ? items : (fallbackOrder ? [{
    id: fallbackOrder.id,
    productId: fallbackOrder.id,
    productName: fallbackOrder.product_name,
    productCategory: fallbackOrder.product_category,
    userImageUrl: fallbackOrder.user_image_url,
    price: fallbackOrder.price,
    quantity: fallbackOrder.quantity,
    customizations: fallbackOrder.customizations
  }] : []);

  if (productsToShow.length === 0) {
    return (
      <div className="text-center py-8 text-ghibli-earth/60">
        <Package className="w-12 h-12 mx-auto mb-4" />
        <p>Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold text-ghibli-earth mb-4 flex items-center gap-2 flex-shrink-0">
        <Package className="w-5 h-5 text-ghibli-moss" />
        Detalhes do Produto
      </h2>
      
      {/* Desktop: Scrollable product list */}
      <div className="hidden lg:block flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-ghibli-moss/50 scrollbar-track-transparent pr-2">
        <div className="space-y-4">
          {productsToShow.map((item) => {
            const customizations = parseProductCustomizations(item.customizations);
            
            return (
              <div key={item.id} className="flex gap-4 bg-white/60 rounded-lg border border-ghibli-stone/10 p-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-ghibli-stone/20 rounded-lg overflow-hidden">
                    {item.userImageUrl && (
                      <img 
                        src={item.userImageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-ghibli-earth mb-1">{item.productName}</h3>
                  <p className="text-sm text-ghibli-earth/60 mb-2">Categoria: {item.productCategory}</p>
                  
                  {/* Personalizações */}
                  {customizations.length > 0 && (
                    <div className="mb-2">
                      <div className="space-y-1">
                        {customizations.slice(0, 3).map((custom, idx) => (
                          <p key={idx} className="text-xs text-ghibli-earth/80">
                            {custom}
                          </p>
                        ))}
                        {customizations.length > 3 && (
                          <p className="text-xs text-ghibli-earth/60">
                            +{customizations.length - 3} mais...
                          </p>
                        )}
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

      {/* Mobile: Compact product list */}
      <div className="lg:hidden space-y-3">
        {productsToShow.map((item) => {
          const customizations = parseProductCustomizations(item.customizations);
          
          return (
            <div key={item.id} className="flex gap-3 bg-white/60 rounded-lg border border-ghibli-stone/10 p-3">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-ghibli-stone/20 rounded-lg overflow-hidden">
                  {item.userImageUrl && (
                    <img 
                      src={item.userImageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-ghibli-earth mb-1 text-sm">{item.productName}</h3>
                <p className="text-xs text-ghibli-earth/60 mb-1">Categoria: {item.productCategory}</p>
                
                {/* Personalizações - Mobile mais compacto */}
                {customizations.length > 0 && (
                  <div className="mb-1">
                    <div className="space-y-0.5">
                      {customizations.slice(0, 2).map((custom, idx) => (
                        <p key={idx} className="text-xs text-ghibli-earth/80">
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
                
                <div className="flex items-center justify-between text-xs">
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mobile: Header com botão voltar */}
      <div className="lg:hidden mb-3 flex-shrink-0">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 p-1 text-ghibli-earth hover:text-ghibli-moss justify-start text-sm h-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à Lista
        </Button>
      </div>

      {/* Mobile: Layout com scroll geral */}
      <div className="lg:hidden flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-ghibli-moss/50 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Status Timeline - Mobile */}
        <div className="bg-white/90 rounded-xl border border-ghibli-stone/20 p-4 shadow-sm">
          <StatusTimeline status={order.status} printifyStatus={order.printify_status} />
        </div>

        {/* Order Header - Mobile */}
        <div className="bg-white/90 rounded-xl border border-ghibli-stone/20 p-4 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-ghibli-earth mb-2">
                Encomenda #{order.order_reference || order.id.slice(0, 8)}
              </h1>
              <Badge className={`${statusInfo.color} flex items-center gap-1 text-sm w-fit`}>
                <StatusIcon className="w-4 h-4" />
                {statusInfo.label}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-ghibli-moss">
                €{(order.total_amount || order.price).toFixed(2)}
              </p>
              <p className="text-sm text-ghibli-earth/60">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          {/* Ações importantes - Mobile */}
          <div className="flex flex-col gap-2 mt-4">
            {order.tracking_url && (
              <Button 
                size="sm"
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

        {/* Product List - Mobile */}
        <div className="bg-white/90 rounded-xl border border-ghibli-stone/20 p-4 shadow-sm">
          <ProductList items={order.items} fallbackOrder={order} />
        </div>
      </div>

      {/* Desktop: Layout com sidebar + conteúdo */}
      <div className="hidden lg:flex lg:flex-row h-full gap-8 overflow-hidden">
        {/* Coluna da Esquerda: Navegação e Ações */}
        <div className="lg:w-1/4 lg:border-r border-ghibli-stone/20 lg:pr-6 flex-shrink-0">
          <div className="flex flex-col h-full">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="flex items-center gap-2 mb-6 p-0 text-ghibli-earth hover:text-ghibli-moss justify-start"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar à Lista
            </Button>

            <div className="flex-1 flex flex-col gap-6">
              <StatusTimeline status={order.status} printifyStatus={order.printify_status} />
              
              <div className="flex flex-col gap-3">
                {order.tracking_url && (
                  <Button 
                    size="sm"
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
          </div>
        </div>

        {/* Coluna da Direita: Conteúdo Principal */}
        <div className="lg:w-3/4 flex flex-col overflow-hidden">
          {/* Order Header - Desktop (fixo) */}
          <div className="mb-6 flex-shrink-0">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-ghibli-earth mb-2">
                  Encomenda #{order.order_reference || order.id.slice(0, 8)}
                </h1>
                <Badge className={`${statusInfo.color} flex items-center gap-1 text-sm w-fit`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusInfo.label}
                </Badge>
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

          {/* Product List - Desktop (scrollable) */}
          <div className="flex-1 overflow-hidden">
            <ProductList items={order.items} fallbackOrder={order} />
          </div>
        </div>
      </div>
    </div>
  );
}; 