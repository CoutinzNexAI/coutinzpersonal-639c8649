import { CartItem, CartSummary } from './cartTypes';

const CART_STORAGE_KEY = 'pictuz_cart';
const TAX_RATE = 0.23; // 23% IVA Portugal

export class CartService {
  // Get cart from localStorage
  static getCart(): CartItem[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const cartData = localStorage.getItem(CART_STORAGE_KEY);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  // Save cart to localStorage
  static saveCart(cart: CartItem[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      // Trigger storage event for other components
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  // Add item to cart
  static addToCart(newItem: Omit<CartItem, 'id' | 'addedAt'>): CartItem {
    const cart = this.getCart();
    
    // Check if item already exists (same product + user image + variant)
    const existingItem = cart.find(
      item => item.productId === newItem.productId && 
               item.userImageUrl === newItem.userImageUrl &&
               item.customizations.variantId === newItem.customizations.variantId
    );

    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity += newItem.quantity;
      this.saveCart(cart);
      return existingItem;
    } else {
      // Add new item
      const cartItem: CartItem = {
        ...newItem,
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedAt: new Date()
      };
      
      cart.push(cartItem);
      this.saveCart(cart);
      return cartItem;
    }
  }

  // Remove item from cart
  static removeFromCart(itemId: string): void {
    const cart = this.getCart();
    const updatedCart = cart.filter(item => item.id !== itemId);
    this.saveCart(updatedCart);
  }

  // Update item quantity
  static updateQuantity(itemId: string, quantity: number): void {
    const cart = this.getCart();
    const item = cart.find(item => item.id === itemId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        item.quantity = quantity;
        this.saveCart(cart);
      }
    }
  }

  // Clear entire cart
  static clearCart(): void {
    this.saveCart([]);
  }

  // Calculate cart summary (WITHOUT shipping - será calculado dinamicamente)
  static getCartSummary(): CartSummary {
    const items = this.getCart();
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 0; // Será calculado dinamicamente pelo hook useShippingCalculation
    const tax = subtotal * TAX_RATE;
    const total = subtotal + shipping + tax; // O shipping será adicionado no checkout
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount
    };
  }

  // Get cart item count
  static getCartCount(): number {
    const cart = this.getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Validate cart items (check if products still exist, prices are current, etc.)
  static validateCart(): { valid: boolean; issues: string[] } {
    const cart = this.getCart();
    const issues: string[] = [];

    // Check if cart is empty
    if (cart.length === 0) {
      return { valid: false, issues: ['Carrinho vazio'] };
    }

    // Check for invalid quantities and required fields
    cart.forEach(item => {
      if (item.quantity <= 0) {
        issues.push(`Quantidade inválida para ${item.productName}`);
      }
      if (!item.userImageUrl) {
        issues.push(`Imagem em falta para ${item.productName}`);
      }
      if (!item.customizations.variantId) {
        issues.push(`Variante não selecionada para ${item.productName}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Convert cart to simplified format for APIs
  static cartToApiFormat(cart: CartItem[]) {
    return cart.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      userImageUrl: item.userImageUrl,
      quantity: item.quantity,
      customizations: item.customizations,
      imageAdjustments: item.imageAdjustments,
      price: item.price
    }));
  }
} 