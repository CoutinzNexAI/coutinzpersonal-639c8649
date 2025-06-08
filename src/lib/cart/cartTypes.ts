export interface CartItem {
  id: string;
  productId: string; // PicTuz product slug
  productUid: string; // Gelato productUid
  productName: string;
  productCategory: string;
  userImageUrl: string;
  userImageId?: string;
  price: number;
  quantity: number;
  customizations?: {
    size?: string;
    color?: string;
    variant?: string;
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