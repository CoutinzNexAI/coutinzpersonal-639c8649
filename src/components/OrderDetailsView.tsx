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
    <div className="mb-4 lg:mb-6">
      <h3 className="text-sm lg:text-base font-semibold text-ghibli-earth mb-2 lg:mb-3 flex items-center gap-2">
        <StatusIcon className="w-4 h-4 text-ghibli-moss" />
        Estado Atual
      </h3>
      <div className="space-y-2 lg:space-y-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const stepStatus = getStepStatus(step.id);
          
          return (
            <div key={step.id} className="flex items-center gap-2 lg:gap-3">
              <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center ${
                stepStatus === 'completed' ? 'bg-ghibli-moss text-white' : 'bg-ghibli-stone/20 text-ghibli-stone'
              }`}>
                <StepIcon className="w-3 h-3 lg:w-4 lg:h-4" />
              </div>
              <span className={`text-xs lg:text-sm ${
                stepStatus === 'completed' ? 'text-ghibli-earth font-medium' : 'text-ghibli-stone'
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

// SupportButton Component
const SupportButton: React.FC<{ order: UserOrder }> = ({ order }) => {
  const subject = `Ajuda com Encomenda #${order.order_reference || order.id}`;
  const body = `Olá,

Preciso de ajuda com a minha encomenda:

- Referência: #${order.order_reference || order.id}
- Produto: ${order.product_name}
- Data: ${formatDate(order.created_at)}
- Status: ${order.status} (${order.printify_status})

Podem ajudar-me?

Obrigado!`;

  const mailtoLink = `mailto:pictuzinfo@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <Button 
      variant="outline" 
      size="sm"
      className="w-full lg:w-auto text-xs lg:text-sm border-ghibli-moss/30 text-ghibli-moss hover:bg-ghibli-moss/10 touch-manipulation"
      onClick={() => window.location.href = mailtoLink}
    >
      <Mail className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
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

// ProductList Component - Mostra todos os produtos da encomenda
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
      <div className="text-center py-6 lg:py-8 text-ghibli-earth/60">
        <Package className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2 lg:mb-4 opacity-50" />
        <p className="text-sm lg:text-base">Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-base lg:text-lg font-semibold text-ghibli-earth mb-3 lg:mb-4 flex items-center gap-2">
        <Package className="w-4 h-4 lg:w-5 lg:h-5" />
        {productsToShow.length === 1 ? 'Detalhes do Produto' : `Produtos da Encomenda (${productsToShow.length})`}
      </h2>
      
      <div className="space-y-3 lg:space-y-4">
        {productsToShow.map((item, index) => {
          const customizations = parseProductCustomizations(item.customizations || {});
          
          return (
            <div key={item.id || index} className="flex flex-col sm:flex-row gap-3 lg:gap-4 p-3 lg:p-4 bg-ghibli-stone/5 rounded-lg">
              <div className="w-full sm:w-20 lg:w-24 h-20 sm:h-20 lg:h-24 rounded-lg overflow-hidden bg-ghibli-stone/10 flex-shrink-0 mx-auto sm:mx-0">
                <img
                  src={item.userImageUrl}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-semibold text-ghibli-earth mb-1 text-sm lg:text-base">{item.productName}</h3>
                <p className="text-xs lg:text-sm text-ghibli-earth/60 mb-2">Categoria: {item.productCategory}</p>
                
                {/* Personalizações */}
                {customizations.length > 0 && (
                  <div className="mb-2 lg:mb-3">
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
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs lg:text-sm gap-1">
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
      {/* Mobile: Header com botão voltar */}
      <div className="lg:hidden mb-3 flex-shrink-0">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 p-0 text-ghibli-earth hover:text-ghibli-moss justify-start text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à Lista
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row h-full gap-3 lg:gap-8 overflow-hidden">
        {/* Coluna da Esquerda: Navegação e Ações - Mobile como seção horizontal */}
        <div className="lg:w-1/4 lg:border-r border-ghibli-stone/20 lg:pr-6 flex-shrink-0">
          {/* Desktop: Botão voltar */}
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

          {/* Mobile: Status e ações em layout horizontal compacto */}
          <div className="lg:block">
            <div className="flex lg:flex-col gap-3 lg:gap-4">
              <div className="flex-1 lg:flex-none">
                <StatusTimeline status={order.status} printifyStatus={order.printify_status} />
              </div>
              
              <div className="flex lg:flex-col gap-2">
                {/* Tracking Button */}
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

                {/* Support Button */}
                <div className="lg:mt-auto lg:pt-6">
                  <SupportButton order={order} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna da Direita: Conteúdo Principal - Scrollável */}
        <div className="lg:w-3/4 flex-1 overflow-y-auto">
          {/* Order Header - Mobile optimized */}
          <div className="mb-4 lg:mb-6 flex-shrink-0">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3 lg:mb-4 gap-3 lg:gap-4">
              <div className="flex-1">
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-ghibli-earth mb-2">
                  Encomenda #{order.order_reference || order.id.slice(0, 8)}
                </h1>
                <div className="flex items-center gap-2 mb-2 md:mb-0">
                  <Badge className={`${statusInfo.color} flex items-center gap-1 text-xs`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-ghibli-moss">
                  €{(order.total_amount || order.price).toFixed(2)}
                </p>
                <p className="text-xs lg:text-sm text-ghibli-earth/60">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Product List */}
          <div className="mb-4 lg:mb-6">
            <ProductList items={order.items} fallbackOrder={order} />
          </div>

          {/* Tracking Information - Mobile optimized */}
          {order.tracking_number && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 lg:p-4 mb-4 lg:mb-6">
              <h2 className="text-base lg:text-lg font-semibold text-blue-800 mb-3 lg:mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 lg:w-5 lg:h-5" />
                Informações de Envio
              </h2>
              
              <div className="space-y-2 lg:space-y-3">
                <p className="text-blue-700 text-xs lg:text-base break-all">
                  <span className="font-medium">Número de Rastreamento:</span> {order.tracking_number}
                </p>
                {order.tracking_url && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full md:w-auto border-blue-300 text-blue-700 hover:bg-blue-100 text-xs lg:text-sm"
                    onClick={() => window.open(order.tracking_url, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                    Acompanhar no Site da Transportadora
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Order Timeline - Mobile optimized */}
          <div className="bg-white rounded-lg border border-ghibli-stone/20 p-3 lg:p-4">
            <h2 className="text-base lg:text-lg font-semibold text-ghibli-earth mb-3 lg:mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />
              Histórico da Encomenda
            </h2>
            
            <div className="space-y-2 lg:space-y-3">
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-xs lg:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-ghibli-moss rounded-full"></div>
                  <span className="text-ghibli-earth/60">Criada em:</span>
                </div>
                <span className="text-ghibli-earth ml-4 md:ml-0">{formatDate(order.created_at)}</span>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-xs lg:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-ghibli-moss rounded-full"></div>
                  <span className="text-ghibli-earth/60">Última atualização:</span>
                </div>
                <span className="text-ghibli-earth ml-4 md:ml-0">{formatDate(order.updated_at)}</span>
              </div>
              
              {order.printify_status && (
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-xs lg:text-sm">
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