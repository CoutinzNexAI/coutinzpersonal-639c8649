import { useState, useEffect } from 'react';
import { CartService } from '@/lib/cart/cartService';
import { CartItem, CartSummary } from '@/lib/cart/cartTypes';

export const useCart = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Adicionar ao carrinho (wrapper que abre o sidebar)
  const addToCart = (item: Omit<CartItem, 'id' | 'addedAt'>) => {
    try {
      CartService.addToCart(item);
      loadCartData();
      setIsCartOpen(true); // Abrir sidebar automaticamente
      return true;
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      return false;
    }
  };

  // Remover do carrinho
  const removeFromCart = (itemId: string) => {
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
    setIsCartOpen,
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