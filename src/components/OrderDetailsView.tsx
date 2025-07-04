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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// StatusTimeline Component
const StatusTimeline: React.FC<{ status: string; printifyStatus: string }> = ({ status, printifyStatus }) => {
  const statusInfo = getStatusInfo(status, printifyStatus);
  const StatusIcon = statusInfo.icon;

  const getStepStatus = (stepId: string) => {
    const steps = ['processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(status);
    const stepIndex = steps.indexOf(stepId);
    
    if (currentIndex >= stepIndex) return 'completed';
    return 'pending';
  };

  const steps = [
    { id: 'processing', label: 'Processamento', icon: Clock },
    { id: 'shipped', label: 'Enviado', icon: Truck },
    { id: 'delivered', label: 'Entregue', icon: CheckCircle }
  ];

  return (
    <div className="mb-3 lg:mb-6">
      <h3 className="text-sm lg:text-base font-semibold text-ghibli-earth mb-2 flex items-center gap-2">
        <StatusIcon className="w-4 h-4 text-ghibli-moss" />
        Estado Atual
      </h3>
      {/* Mobile: Layout horizontal compacto */}
      <div className="lg:hidden flex items-center justify-between gap-1">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const stepStatus = getStepStatus(step.id);
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                stepStatus === 'completed' ? 'bg-ghibli-moss text-white' : 'bg-ghibli-stone/20 text-ghibli-stone'
              }`}>
                <StepIcon className="w-3 h-3" />
              </div>
              <span className={`text-xs text-center ${
                stepStatus === 'completed' ? 'text-ghibli-moss font-medium' : 'text-ghibli-earth/60'
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-2.5 w-4 h-0.5 bg-ghibli-stone/20 -mr-2"></div>
              )}
            </div>
          );
        })}
      </div>
      {/* Desktop: Layout vertical original */}
      <div className="hidden lg:block space-y-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const stepStatus = getStepStatus(step.id);
          
          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                stepStatus === 'completed' ? 'bg-ghibli-moss text-white' : 'bg-ghibli-stone/20 text-ghibli-stone'
              }`}>
                <StepIcon className="w-4 h-4" />
              </div>
              <span className={`text-sm ${
                stepStatus === 'completed' ? 'text-ghibli-moss font-medium' : 'text-ghibli-earth/60'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Support Button Component
const SupportButton: React.FC<{ order: UserOrder }> = ({ order }) => {
  const mailtoLink = `mailto:pictuzinfo@gmail.com?subject=Suporte para Encomenda ${order.order_reference || order.id.slice(0, 8)}&body=Olá,%0D%0A%0D%0AEstou a contactar em relação à minha encomenda:%0D%0A%0D%0A- Número da Encomenda: ${order.order_reference || order.id.slice(0, 8)}%0D%0A- Produto: ${order.product_name}%0D%0A- Data: ${formatDate(order.created_at)}%0D%0A- Estado: ${order.status}%0D%0A%0D%0ADescreva aqui o seu problema ou questão:%0D%0A%0D%0A%0D%0A%0D%0AObrigado!`;

  return (
    <div>
      <h3 className="text-sm font-semibold text-ghibli-earth mb-2 lg:mb-3 flex items-center gap-2">
        <Mail className="w-4 h-4 text-ghibli-moss" />
        Contactar Suporte
      </h3>
      <Button 
        size="sm"
        className="w-full bg-ghibli-moss hover:bg-ghibli-moss/80 text-white text-xs lg:text-sm h-8 lg:h-auto"
        onClick={() => window.open(mailtoLink, '_blank')}
      >
        <Mail className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
        Enviar Email
      </Button>
    </div>
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
      <div className="text-center py-4 lg:py-8 text-ghibli-earth/60">
        <Package className="w-6 h-6 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-4" />
        <p className="text-sm lg:text-base">Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm lg:text-lg font-semibold text-ghibli-earth mb-2 lg:mb-4 flex items-center gap-2">
        <Package className="w-4 h-4 lg:w-5 lg:h-5 text-ghibli-moss" />
        Detalhes do Produto
      </h2>
      
      <div className="space-y-2 lg:space-y-4">
        {productsToShow.map((item) => {
          const customizations = parseProductCustomizations(item.customizations);
          
          return (
            <div key={item.id} className="flex gap-3 lg:gap-4 bg-white/60 rounded-lg border border-ghibli-stone/10 p-2 lg:p-4">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 lg:w-20 lg:h-20 bg-ghibli-stone/20 rounded-lg overflow-hidden">
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
                <h3 className="font-semibold text-ghibli-earth mb-1 text-sm lg:text-base">{item.productName}</h3>
                <p className="text-xs lg:text-sm text-ghibli-earth/60 mb-1 lg:mb-2">Categoria: {item.productCategory}</p>
                
                {/* Personalizações - Mobile mais compacto */}
                {customizations.length > 0 && (
                  <div className="mb-1 lg:mb-2">
                    <div className="space-y-0.5 lg:space-y-1">
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
                
                <div className="flex items-center justify-between text-xs lg:text-sm">
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

  // ✅ DEBUG: Log da encomenda completa recebida
  console.log('📋 OrderDetailsView - Encomenda recebida:', order);
  console.log('🛍️ OrderDetailsView - Campo items:', order.items);
  console.log('📊 OrderDetailsView - Número de itens:', order.items ? order.items.length : 'Campo items não existe');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mobile: Header com botão voltar - mais compacto */}
      <div className="lg:hidden mb-2 flex-shrink-0">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 p-1 text-ghibli-earth hover:text-ghibli-moss justify-start text-sm h-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à Lista
        </Button>
      </div>

      {/* Mobile: Layout vertical compacto */}
      <div className="lg:hidden flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-ghibli-moss/50 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Status Timeline - Compacto */}
        <div className="bg-white/90 rounded-xl border border-ghibli-stone/20 p-3 shadow-sm">
          <StatusTimeline status={order.status} printifyStatus={order.printify_status} />
        </div>

        {/* Order Header - Compacto */}
        <div className="bg-white/90 rounded-xl border border-ghibli-stone/20 p-3 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-3">
              <h1 className="text-base font-bold text-ghibli-earth mb-1 leading-tight">
                Encomenda #{order.order_reference || order.id.slice(0, 8)}
              </h1>
              <Badge className={`${statusInfo.color} flex items-center gap-1 text-xs w-fit`}>
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </Badge>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-ghibli-moss">
                €{(order.total_amount || order.price).toFixed(2)}
              </p>
              <p className="text-xs text-ghibli-earth/60">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Product Details - Compacto */}
        <div className="bg-white/90 rounded-xl border border-ghibli-stone/20 p-3 shadow-sm">
          <ProductList items={order.items} fallbackOrder={order} />
        </div>

        {/* Tracking Information - Se existir */}
        {order.tracking_number && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 shadow-sm">
            <h2 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Informações de Envio
            </h2>
            
            <div className="space-y-2">
              <p className="text-blue-700 text-xs break-all">
                <span className="font-medium">Número:</span> {order.tracking_number}
              </p>
              {order.tracking_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-100 text-xs h-8"
                  onClick={() => window.open(order.tracking_url, '_blank')}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Seguir Encomenda
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Order Timeline - Compacto */}
        <div className="bg-white/90 rounded-xl border border-ghibli-stone/20 p-3 shadow-sm">
          <h2 className="text-sm font-semibold text-ghibli-earth mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Histórico da Encomenda
          </h2>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-ghibli-moss rounded-full flex-shrink-0"></div>
              <span className="text-ghibli-earth/60">Criada em:</span>
              <span className="text-ghibli-earth">{formatDate(order.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-ghibli-moss rounded-full flex-shrink-0"></div>
              <span className="text-ghibli-earth/60">Última atualização:</span>
              <span className="text-ghibli-earth">{formatDate(order.updated_at)}</span>
            </div>
            
            {order.printify_status && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                <span className="text-ghibli-earth/60">Estado Printify:</span>
                <span className="text-ghibli-earth">{order.printify_status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Support Button - Fixo no final */}
        <div className="bg-white/90 rounded-xl border border-ghibli-stone/20 p-3 shadow-sm">
          <SupportButton order={order} />
        </div>
      </div>

      {/* Desktop: Layout original em duas colunas */}
      <div className="hidden lg:flex lg:flex-row h-full gap-8 overflow-hidden">
        {/* Coluna da Esquerda: Navegação e Ações */}
        <div className="lg:w-1/4 lg:border-r border-ghibli-stone/20 lg:pr-6 flex-shrink-0">
          <div className="hidden lg:block">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="flex items-center gap-2 mb-6 p-0 text-ghibli-earth hover:text-ghibli-moss justify-start"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar à Lista
            </Button>
          </div>

          <div className="lg:block">
            <div className="flex lg:flex-col gap-3 lg:gap-4">
              <div className="flex-1 lg:flex-none">
                <StatusTimeline status={order.status} printifyStatus={order.printify_status} />
              </div>
              
              <div className="flex lg:flex-col gap-2">
                {order.tracking_url && (
                  <Button 
                    size="sm"
                    className="lg:w-full bg-blue-600 hover:bg-blue-700 text-white text-xs lg:text-sm"
                    onClick={() => window.open(order.tracking_url, '_blank')}
                  >
                    <Truck className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                    Seguir
                  </Button>
                )}

                <div className="lg:mt-auto lg:pt-6">
                  <SupportButton order={order} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna da Direita: Conteúdo Principal - Scrollável */}
        <div className="lg:w-3/4 flex-1 overflow-y-auto">
          {/* Order Header - Desktop */}
          <div className="mb-6 flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-ghibli-earth mb-2">
                  Encomenda #{order.order_reference || order.id.slice(0, 8)}
                </h1>
                <div className="flex items-center gap-2 mb-0">
                  <Badge className={`${statusInfo.color} flex items-center gap-1 text-xs`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-2xl font-bold text-ghibli-moss">
                  €{(order.total_amount || order.price).toFixed(2)}
                </p>
                <p className="text-sm text-ghibli-earth/60">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Product List - Desktop */}
          <div className="mb-6">
            <ProductList items={order.items} fallbackOrder={order} />
          </div>

          {/* Tracking Information - Desktop */}
          {order.tracking_number && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Informações de Envio
              </h2>
              
              <div className="space-y-3">
                <p className="text-blue-700 text-base break-all">
                  <span className="font-medium">Número de Rastreamento:</span> {order.tracking_number}
                </p>
                {order.tracking_url && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full md:w-auto border-blue-300 text-blue-700 hover:bg-blue-100 text-sm"
                    onClick={() => window.open(order.tracking_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Acompanhar no Site da Transportadora
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Order Timeline - Desktop */}
          <div className="bg-white rounded-lg border border-ghibli-stone/20 p-4">
            <h2 className="text-lg font-semibold text-ghibli-earth mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Histórico da Encomenda
            </h2>
            
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-ghibli-moss rounded-full"></div>
                  <span className="text-ghibli-earth/60">Criada em:</span>
                </div>
                <span className="text-ghibli-earth ml-4 md:ml-0">{formatDate(order.created_at)}</span>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-ghibli-moss rounded-full"></div>
                  <span className="text-ghibli-earth/60">Última atualização:</span>
                </div>
                <span className="text-ghibli-earth ml-4 md:ml-0">{formatDate(order.updated_at)}</span>
              </div>
              
              {order.printify_status && (
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-ghibli-earth/60">Estado Printify:</span>
                  </div>
                  <span className="text-ghibli-earth ml-4 md:ml-0">{order.printify_status}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 