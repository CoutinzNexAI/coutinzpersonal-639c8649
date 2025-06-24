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
    size?: string;
    color?: string;
    variant?: string;
    phoneModel?: string; // Para capas de telemóvel
    paperType?: string; // Para cadernos
    selectedPhraseText?: string; // Para sweat de criança
    canvasEdgeType?: 'regular' | 'mirror' | 'off'; // Para Canvas Sem Borda
    frameColor?: string; // Para Canvas com Moldura
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
  subtotal: number;
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