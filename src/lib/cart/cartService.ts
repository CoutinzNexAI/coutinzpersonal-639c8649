import { CartItem, CartSummary } from './cartTypes';
import { mugConfig } from '@/config/products/mug.config';
import { canvasConfig } from '@/config/products/canvas.config';
import { posterConfig } from '@/config/products/poster.config';
import { notebookConfig } from '@/config/products/notebook.config';
import { phoneCaseConfig } from '@/config/products/phoneCase.config';
import { bagConfig } from '@/config/products/bag.config';
import { mousepadConfig } from '@/config/products/mousepad.config';
import * as fpixel from '@/lib/fpixel';
import { validateDiscountCode, calculateDiscountAmount, type DiscountCode } from '@/lib/discountCodes'; 

const CART_STORAGE_KEY = 'pictuz_cart';
const DISCOUNT_CODE_STORAGE_KEY = 'pictuz_discount_code';
// ✅ REMOVIDO: const TAX_RATE = 0.23; // IVA agora incluído nos preços

export class CartService {
  
  // ✅ NOVO: Função para obter preço original de um item (para cálculo de entrega grátis)
  private static getItemOriginalPrice(item: CartItem): number {
    // Mapear produto para sua configuração e usar getOriginalPrice se disponível
    let config = null;
    
    // Determinar config baseado no productId
    if (item.productId.includes('heart_mug') || item.productId.includes('ceramic_mug')) {
      config = mugConfig;
    } else if (item.productId.includes('canvas')) {
      config = canvasConfig;
    } else if (item.productId.includes('poster')) {
      config = posterConfig;
    } else if (item.productId.includes('spiral_journal')) {
      config = notebookConfig;
    } else if (item.productId.includes('phone_case')) {
      config = phoneCaseConfig;
    } else if (item.productId.includes('tote_bag')) {
      config = bagConfig;
    } else if (item.productId.includes('mousepad')) {
      config = mousepadConfig;
    }
    
    // Usar getOriginalPrice se disponível, senão usar preço do item
    if (config && config.getOriginalPrice) {
      return config.getOriginalPrice(item.customizations.variantId, item.quantity);
    }
    
    return item.price;
  }

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
    
    // Check if item already exists (same product + user image + variant + position)
    const existingItem = cart.find(
      item => item.productId === newItem.productId && 
               item.userImageUrl === newItem.userImageUrl &&
               item.customizations.variantId === newItem.customizations.variantId &&
               item.customizations.position === newItem.customizations.position
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

  // ✅ REMOVIDO: Sistema de descontos de quantidade (substituído por descontos fake individuais)

  // ✅ SIMPLIFICADO: Calculate shipping based on subtotal
  static calculateShipping(subtotal: number): number {
    // Envio grátis se subtotal >= €40, senão €3.99
    return subtotal >= 40 ? 0 : 3.99;
  }

  // ✅ ATUALIZADO: Calculate cart summary (com códigos de desconto)
  static getCartSummary(): CartSummary {
    const items = this.getCart();
    
    // Subtotal simples - preços já são os finais (com descontos fake aplicados)
    const originalSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Verificar se há código de desconto aplicado
    const appliedDiscountCode = this.getAppliedDiscountCode();
    let discountAmount = 0;
    let discountCode: string | undefined;
    let discountPercent: number | undefined;
    
    if (appliedDiscountCode) {
      const validation = validateDiscountCode(appliedDiscountCode, originalSubtotal);
      if (validation.valid && validation.discount) {
        discountAmount = calculateDiscountAmount(validation.discount, originalSubtotal);
        discountCode = appliedDiscountCode;
        discountPercent = validation.discount.discountPercent;
      }
    }
    
    const subtotal = originalSubtotal - discountAmount;
    
    // Shipping baseado no subtotal ORIGINAL (antes do código de desconto)
    const shipping = this.calculateShipping(originalSubtotal);
    
    // IVA incluído nos preços
    const tax = 0;
    const total = subtotal + shipping + tax;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      originalSubtotal: Math.round(originalSubtotal * 100) / 100,
      discountAmount: discountAmount > 0 ? Math.round(discountAmount * 100) / 100 : undefined,
      discountCode,
      discountPercent,
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

  // ✅ NOVO: Métodos para códigos de desconto
  static applyDiscountCode(code: string): { success: boolean; error?: string; discount?: DiscountCode } {
    if (typeof window === 'undefined') return { success: false, error: 'Não disponível no servidor' };
    
    const cartSummary = this.getCartSummary();
    const validation = validateDiscountCode(code, cartSummary.originalSubtotal || cartSummary.subtotal);
    
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Salvar código aplicado
    localStorage.setItem(DISCOUNT_CODE_STORAGE_KEY, code.toUpperCase());
    
    return { success: true, discount: validation.discount };
  }

  static removeDiscountCode(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(DISCOUNT_CODE_STORAGE_KEY);
  }

  static getAppliedDiscountCode(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(DISCOUNT_CODE_STORAGE_KEY);
  }
} 