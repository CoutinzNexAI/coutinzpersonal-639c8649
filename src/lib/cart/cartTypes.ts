export interface CartItem {
  id: string;
  productId: string; // O ID interno do produto (ex: 'custom_phone_case')
  productName: string;
  productCategory: string;
  userImageUrl: string; // A URL da imagem do cliente. Essencial!
  userImageId?: string; // ID da transformação para tracking
  price: number;
  quantity: number;
  customizations: { // Guarda as escolhas do user
    variantId: number; // ID da variante (cor/tamanho) da Printify
    
    // ✅ NOVOS CAMPOS: A "receita" de design viaja com o item
    scale: number; // O scale correto para este produto específico
    x: number; // Posição X da imagem (0.5 = centro)
    y: number; // Posição Y da imagem (0.5 = centro)
    angle: number; // Rotação da imagem (0 = sem rotação)
    position?: string; // Posição da foto (ex: 'centro', 'esquerda', 'direita', 'cima', 'baixo')
    print_on_side?: 'mirror' | 'regular' | 'off'; // Para produtos que suportam print details (canvas)
    
    // Campos específicos de cada produto (mantidos para compatibilidade)
    size?: string;
    color?: string;
    variant?: string;
    phoneModel?: string; // Para capas de telemóvel
    paperType?: string; // Para cadernos
    selectedPhraseText?: string; // Para sweat de criança
    canvasEdgeType?: 'regular' | 'mirror' | 'off'; // Para Canvas Sem Borda (LEGACY - agora usa print_on_side)
    frameColor?: string; // Para Canvas com Moldura
  };
  printDetails?: {
    print_on_side?: 'mirror' | 'regular' | 'off'; // Para produtos com bordas especiais
    position?: string; // Posição da área de impressão (ex: 'front', 'back')
    defaultScale?: number; // Escala padrão para este produto específico
    defaultX?: number; // Posição X padrão
    defaultY?: number; // Posição Y padrão
  };
  imageAdjustments?: {
    x: number;          // Posição X da imagem dentro da área de impressão (0-1, percentagem)
    y: number;          // Posição Y da imagem dentro da área de impressão (0-1, percentagem)
    scale: number;      // Zoom (escala, 1 = tamanho original)
    rotation?: number;  // Rotação em graus (se suportada pelo produto)
    cropArea?: {        // Área de crop da imagem original
      x: number;        // X do crop em percentagem da imagem original
      y: number;        // Y do crop em percentagem da imagem original
      width: number;    // Largura do crop em percentagem da imagem original
      height: number;   // Altura do crop em percentagem da imagem original
    };
  };
  addedAt: Date;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number; // Subtotal final com desconto aplicado
  originalSubtotal?: number; // Subtotal original antes do desconto
  discountAmount?: number; // Valor do desconto aplicado
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartSummary: () => CartSummary;
}

export interface OrderItem extends CartItem {
  gelatoOrderId?: string;
  gelatoStatus?: string;
  trackingNumber?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  paymentInfo: {
    method: string;
    transactionId: string;
    status: 'pending' | 'completed' | 'failed';
  };
  gelatoOrderId?: string;
  status: 'pending' | 'processing' | 'printing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
} 