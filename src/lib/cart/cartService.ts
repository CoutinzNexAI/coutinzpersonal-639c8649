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
    
    // ✅ VALIDAÇÃO: Verificar se os novos campos obrigatórios estão presentes
    if (typeof newItem.customizations.scale !== 'number') {
      throw new Error('Campo obrigatório missing: customizations.scale');
    }
    if (typeof newItem.customizations.x !== 'number') {
      throw new Error('Campo obrigatório missing: customizations.x');
    }
    if (typeof newItem.customizations.y !== 'number') {
      throw new Error('Campo obrigatório missing: customizations.y');
    }
    if (typeof newItem.customizations.angle !== 'number') {
      throw new Error('Campo obrigatório missing: customizations.angle');
    }
    
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

  // Calculate quantity discounts based on same product type
  static calculateDiscounts(items: CartItem[]): { discountPercent: number; discountAmount: number; finalSubtotal: number } {
    // Group items by productId (same product type)
    const productGroups = items.reduce((groups, item) => {
      const key = item.productId;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, CartItem[]>);

    let totalDiscount = 0;
    let subtotalBeforeDiscount = 0;

    // Apply discounts per product group
    Object.values(productGroups).forEach(group => {
      const totalQuantity = group.reduce((sum, item) => sum + item.quantity, 0);
      const groupSubtotal = group.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      subtotalBeforeDiscount += groupSubtotal;

      let discountPercent = 0;
      if (totalQuantity >= 3) {
        discountPercent = 15; // 15% para 3+ produtos iguais
      } else if (totalQuantity >= 2) {
        discountPercent = 10; // 10% para 2 produtos iguais
      }

      if (discountPercent > 0) {
        totalDiscount += groupSubtotal * (discountPercent / 100);
      }
    });

    const finalSubtotal = subtotalBeforeDiscount - totalDiscount;
    const overallDiscountPercent = subtotalBeforeDiscount > 0 ? (totalDiscount / subtotalBeforeDiscount) * 100 : 0;

    return {
      discountPercent: Math.round(overallDiscountPercent * 100) / 100,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      finalSubtotal: Math.round(finalSubtotal * 100) / 100
    };
  }

  // Calculate cart summary (WITHOUT shipping - será calculado dinamicamente)
  static getCartSummary(): CartSummary {
    const items = this.getCart();
    const originalSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate discounts
    const { discountAmount, finalSubtotal } = this.calculateDiscounts(items);
    
    const shipping = 0; // Será calculado dinamicamente pelo hook useShippingCalculation
    const tax = finalSubtotal * TAX_RATE; // IVA aplicado ao subtotal com desconto
    const total = finalSubtotal + shipping + tax;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal: Math.round(finalSubtotal * 100) / 100, // Subtotal já com desconto aplicado
      originalSubtotal: Math.round(originalSubtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
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