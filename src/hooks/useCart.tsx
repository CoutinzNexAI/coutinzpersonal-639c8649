import { useState, useEffect } from 'react';
import { CartService } from '@/lib/cart/cartService';
import { CartItem, CartSummary } from '@/lib/cart/cartTypes';
import { useAuth } from '@/hooks/useAuth';
import { 
  trackAddToCart, 
  trackRemoveFromCart, 
  trackCartView,
  trackCartAbandonment 
} from '@/lib/posthog';
import * as fpixel from '@/lib/fpixel';


export const useCart = () => {
  const { userInfo } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cartOpenTime, setCartOpenTime] = useState<Date | null>(null);

  // Carregar dados do carrinho
  const loadCartData = () => {
    const summary = CartService.getCartSummary();
    setCartSummary(summary);
  };

  // Atualizar carrinho quando houver mudanças
  useEffect(() => {
    loadCartData();

    const handleCartUpdated = () => {
      loadCartData();
    };

    window.addEventListener('cartUpdated', handleCartUpdated);
    return () => window.removeEventListener('cartUpdated', handleCartUpdated);
  }, []);

  // Track cart view when opened
  const handleSetIsCartOpen = (open: boolean) => {
    if (open && !isCartOpen && userInfo?.id && cartSummary) {
      // Track cart view
      trackCartView({
        user_id: userInfo.id,
        cart_items: cartSummary.itemCount,
        cart_value: cartSummary.subtotal,
        view_source: 'sidebar',
        items_by_category: getItemsByCategory(cartSummary.items),
        discount_applied: 0, // Fake discounts são aplicados no preço do item
        shipping_cost: cartSummary.shipping
      });
      setCartOpenTime(new Date());
    } else if (!open && isCartOpen && userInfo?.id && cartSummary && cartOpenTime) {
      // Track potential cart abandonment
      const timeInCart = (Date.now() - cartOpenTime.getTime()) / 1000;
      if (timeInCart > 10 && cartSummary.itemCount > 0) { // More than 10 seconds
        trackCartAbandonment({
          user_id: userInfo.id,
          cart_items: cartSummary.itemCount,
          cart_value: cartSummary.subtotal,
          time_in_cart: timeInCart,
          abandonment_stage: 'cart_view',
          last_interaction: 'cart_close',
          items_by_category: getItemsByCategory(cartSummary.items)
        });
      }
    }
    setIsCartOpen(open);
  };

  // Helper function to get items by category
  const getItemsByCategory = (items: CartItem[]): Record<string, number> => {
    const categoryCount: Record<string, number> = {};
    items.forEach(item => {
      const category = item.productCategory || 'unknown';
      categoryCount[category] = (categoryCount[category] || 0) + item.quantity;
    });
    return categoryCount;
  };

  // Adicionar ao carrinho (wrapper que abre o sidebar)
  const addToCart = (item: Omit<CartItem, 'id' | 'addedAt'>) => {
    try {
      const addedItem = CartService.addToCart(item);
      loadCartData();
      setIsCartOpen(true); // Abrir sidebar automaticamente
      
      // Track add to cart
      if (userInfo?.id) {
        const newCartSummary = CartService.getCartSummary();
        trackAddToCart({
          user_id: userInfo.id,
          product_id: item.productId,
          product_name: item.productName,
          product_category: item.productCategory || 'unknown',
          variant_id: item.customizations?.variantId,
          variant_name: item.customizations?.variant,
          price: item.price,
          quantity: item.quantity,
          cart_total_items: newCartSummary.itemCount,
          cart_total_value: newCartSummary.subtotal,
          customizations: item.customizations || {}
        });
        if (typeof window !== 'undefined' && localStorage.getItem('cookie_consent') === 'granted') {
          fpixel.event('AddToCart', {
            content_name: item.productName,
            content_ids: [item.productId], // ID do produto
            content_type: 'product',
            value: item.price * item.quantity,
            currency: 'EUR',
            num_items: item.quantity
          });
          // Meta Pixel AddToCart event sent
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      return false;
    }
  };

  // Remover do carrinho
  const removeFromCart = (itemId: string) => {
    if (userInfo?.id && cartSummary) {
      const item = cartSummary.items.find(i => i.id === itemId);
      if (item) {
        trackRemoveFromCart({
          user_id: userInfo.id,
          product_id: item.productId,
          product_name: item.productName,
          price: item.price,
          quantity: item.quantity,
          cart_total_items: cartSummary.itemCount,
          cart_total_value: cartSummary.subtotal,
          removal_reason: 'user_action'
        });
      }
    }
    
    CartService.removeFromCart(itemId);
    loadCartData();
  };

  // Atualizar quantidade
  const updateQuantity = (itemId: string, quantity: number) => {
    CartService.updateQuantity(itemId, quantity);
    loadCartData();
  };

  // Limpar carrinho
  const clearCart = () => {
    CartService.clearCart();
    loadCartData();
    setIsCartOpen(false);
  };

  return {
    // Estado
    isCartOpen,
    setIsCartOpen: handleSetIsCartOpen,
    cartSummary,
    isLoading,
    
    // Métodos
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCartData,
    
    // Computed
    cartCount: cartSummary?.itemCount || 0,
    cartTotal: cartSummary?.total || 0,
    hasItems: (cartSummary?.itemCount || 0) > 0
  };
}; 