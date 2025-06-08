import { CartItem, CartSummary } from './cartTypes';

const CART_STORAGE_KEY = 'pictuz_cart';
const SHIPPING_RATE = 0.1; // 10% shipping rate (to be replaced with real Gelato quotes)
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
    
    // Check if item already exists (same product + user image)
    const existingItem = cart.find(
      item => item.productId === newItem.productId && 
               item.userImageUrl === newItem.userImageUrl
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

  // Calculate cart summary
  static getCartSummary(): CartSummary {
    const items = this.getCart();
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : subtotal * SHIPPING_RATE; // Free shipping over €50
    const tax = subtotal * TAX_RATE;
    const total = subtotal + shipping + tax;
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

    // Check for invalid quantities
    cart.forEach(item => {
      if (item.quantity <= 0) {
        issues.push(`Quantidade inválida para ${item.productName}`);
      }
      if (!item.userImageUrl) {
        issues.push(`Imagem em falta para ${item.productName}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Convert cart to Gelato order format
  static cartToGelatoProducts(cart: CartItem[]) {
    return cart.map((item, index) => ({
      itemReferenceId: `item_${index + 1}`,
      productUid: item.productId, // Assuming productId is the Gelato productUid
      quantity: item.quantity,
      files: [
        {
          url: item.userImageUrl,
          type: 'default'
        }
      ]
    }));
  }
} 