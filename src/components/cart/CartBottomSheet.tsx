import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { supabase } from '@/lib/supabase/client';
import { CartItem, CartSummary } from '@/lib/cart/cartTypes';
import { trackCheckoutStarted } from '@/lib/posthog';
import Image from 'next/image';

interface CartBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cartSummary: CartSummary | null;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

interface UserData {
  full_name: string;
  email: string;
}

// Utilitário para calcular desconto de um item
const calculateItemDiscount = (item: CartItem, allItems: CartItem[]) => {
  const sameProductItems = allItems.filter(cartItem => cartItem.productId === item.productId);
  const totalSameProductQty = sameProductItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
  
  let discountPercent = 0;
  if (totalSameProductQty >= 3) {
    discountPercent = 15;
  } else if (totalSameProductQty >= 2) {
    discountPercent = 10;
  }
  
  const originalPrice = item.price * item.quantity;
  const discountedPrice = originalPrice * (1 - discountPercent / 100);
  
  return {
    originalPrice,
    discountedPrice,
    discountPercent,
    hasDiscount: discountPercent > 0
  };
};

export const CartBottomSheet: React.FC<CartBottomSheetProps> = ({
  isOpen,
  onClose,
  cartSummary,
  onRemoveItem,
  onUpdateQuantity
}) => {
  const { userInfo } = useAuth();
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Hook para fechar carrinho quando clicar fora
  const bottomSheetRef = useOutsideClick<HTMLDivElement>(() => {
    if (isOpen) {
      onClose();
    }
  }, isOpen);

  // Controle de scroll do body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  // Carregar dados do utilizador
  const loadUserData = async () => {
    if (!userInfo?.id || userData) return userData;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', userInfo.id)
        .single();

      if (error) {
        toast.error('Erro ao carregar dados do perfil');
        return null;
      }

      setUserData(data);
      return data;
    } catch {
      toast.error('Erro ao carregar dados do perfil');
      return null;
    }
  };

  // Lógica de checkout
  const handleCheckout = async () => {
    if (!cartSummary || !userInfo) {
      toast.error('Dados incompletos para finalizar compra');
      return;
    }

    // Track checkout started
    if (userInfo?.id) {
      const itemsByCategory = cartSummary.items.reduce((acc, item) => {
        const category = item.productCategory || 'unknown';
        acc[category] = (acc[category] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      trackCheckoutStarted({
        user_id: userInfo.id,
        cart_items: cartSummary.itemCount,
        cart_value: cartSummary.subtotal,
        discount_amount: cartSummary.discountAmount,
        shipping_cost: cartSummary.shipping,
        total_amount: cartSummary.subtotal + cartSummary.shipping,
        checkout_source: 'cart_bottom_sheet',
        items_by_category: itemsByCategory
      });
    }

    setIsProcessingCheckout(true);

    try {
      const currentUserData = await loadUserData();
      if (!currentUserData) {
        toast.error('Erro ao carregar dados do perfil');
        return;
      }

      if (cartSummary.itemCount === 0) {
        toast.error('Carrinho vazio!');
        return;
      }

      const finalTotal = cartSummary.subtotal + cartSummary.shipping;

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartSummary.items,
          shippingMethod: {
            uid: cartSummary.shipping === 0 ? 'free_shipping' : 'standard_shipping',
            name: cartSummary.shipping === 0 ? 'Envio Grátis' : 'Envio Standard',
            price: cartSummary.shipping,
            deliveryDaysMin: 4,
            deliveryDaysMax: 7,
            description: cartSummary.shipping === 0 ? 'Envio gratuito em 4-7 dias úteis' : 'Envio standard em 4-7 dias úteis'
          },
          userId: userInfo.id,
          userName: currentUserData.full_name,
          userEmail: currentUserData.email,
          subtotal: cartSummary.subtotal,
          originalSubtotal: cartSummary.originalSubtotal,
          discountAmount: cartSummary.discountAmount,
          shipping: cartSummary.shipping,
          tax: 0,
          total: finalTotal
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar sessão de pagamento');
      }

      const result = await response.json();
      
      if (result.url) {
        onClose();
        window.location.href = result.url;
      } else {
        throw new Error('URL de pagamento não recebida');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao processar compra: ' + errorMessage);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Componente para cada item do carrinho
  const CartItemCard = ({ item }: { item: CartItem }) => {
    const discount = useMemo(() => 
      calculateItemDiscount(item, cartSummary?.items || []), 
      [item, cartSummary?.items]
    );

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-white rounded-xl p-3 border border-ghibli-sand/30 shadow-sm"
      >
        <div className="flex gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-ghibli-cream shadow-sm flex-shrink-0">
            <Image
              src={item.userImageUrl}
              alt={item.productName}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-ghibli-wood text-sm truncate mb-1">
              {item.productName}
            </h4>
            
            <div className="text-xs text-ghibli-earth space-y-0.5">
              {item.customizations?.variant && (
                <p><span className="font-medium">Variante:</span> {item.customizations.variant}</p>
              )}
              {item.customizations?.position && (
                <p><span className="font-medium">Posição:</span> {item.customizations.position}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              {discount.hasDiscount ? (
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end mb-0.5">
                    <p className="text-xs text-red-500 line-through">
                      €{discount.originalPrice.toFixed(2)}
                    </p>
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                      -{discount.discountPercent}%
                    </span>
                  </div>
                  <p className="text-sm font-bold text-ghibli-moss">
                    €{discount.discountedPrice.toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-bold text-ghibli-moss">
                  €{discount.originalPrice.toFixed(2)}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                disabled={item.quantity <= 1}
                className="h-6 w-6 p-0 rounded-md"
              >
                <Minus className="w-3 h-3" />
              </Button>
              
              <span className="text-xs font-bold text-ghibli-earth min-w-[1.5rem] text-center">
                {item.quantity}
              </span>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="h-6 w-6 p-0 rounded-md"
              >
                <Plus className="w-3 h-3" />
              </Button>
              
              <button
                onClick={() => onRemoveItem(item.id)}
                className="text-ghibli-poppy hover:text-red-700 transition-colors p-1 ml-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '80%' }}
          animate={{ y: '8%' }}
          exit={{ y: '90%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 bg-white z-[70] shadow-2xl border-t border-ghibli-sand/20 lg:hidden rounded-t-3xl overflow-hidden flex flex-col"
          style={{ height: '85vh' }}
          ref={bottomSheetRef}
          data-cart-container="true"
        >
          <div className="flex flex-col flex-shrink-0">
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 bg-ghibli-sand rounded-full" />
            </div>
            
            <div className="flex items-center justify-between px-4 pb-3 border-b border-ghibli-sand/30 bg-gradient-to-r from-ghibli-cream to-ghibli-paper">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-ghibli-moss/10 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-ghibli-moss" />
                </div>
                <div>
                  <h2 className="text-lg font-ghibli text-ghibli-wood">Carrinho</h2>
                  <p className="text-sm text-ghibli-earth">
                    {cartSummary?.itemCount ? `${cartSummary.itemCount} ${cartSummary.itemCount === 1 ? 'item' : 'items'}` : 'Vazio'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-ghibli-sand/20 hover:bg-ghibli-sand/40 flex items-center justify-center transition-colors touch-manipulation"
              >
                <X className="w-5 h-5 text-ghibli-earth" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {cartSummary?.items.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🛒</div>
                  <h3 className="text-lg font-semibold text-ghibli-earth mb-2">
                    Carrinho vazio
                  </h3>
                  <p className="text-ghibli-earth/70 mb-4">
                    Adicione alguns produtos!
                  </p>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-ghibli-moss text-ghibli-moss hover:bg-ghibli-moss/10"
                  >
                    Continuar a Comprar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  <AnimatePresence>
                    {cartSummary?.items.map((item) => (
                      <CartItemCard key={item.id} item={item} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
            
            {cartSummary && cartSummary.itemCount > 0 && (
              <div className="flex-shrink-0 border-t border-ghibli-sand/30 bg-ghibli-cream/20 pb-[env(safe-area-inset-bottom)]">
                <div className="px-4 py-3">
                  {cartSummary.discountAmount && cartSummary.discountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ghibli-earth">Subtotal (original)</span>
                        <span className="text-ghibli-earth line-through">
                          €{(cartSummary.originalSubtotal || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs bg-green-50 rounded-lg px-2 py-1 mb-1.5">
                        <span className="text-green-700 font-medium">
                          🎉 Desconto
                        </span>
                        <span className="text-green-700 font-bold">
                          -€{cartSummary.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-ghibli-earth">Subtotal</span>
                      <span className="font-semibold text-ghibli-wood">
                        €{cartSummary.subtotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-ghibli-earth">Envio</span>
                      {cartSummary.shipping === 0 ? (
                        <span className="text-green-600 font-bold">GRÁTIS! ✨</span>
                      ) : (
                        <span className="font-semibold text-ghibli-wood">
                          €{cartSummary.shipping.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <div className="border-t border-ghibli-sand/50 pt-1.5 mt-1.5">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-ghibli-wood">Total</span>
                        <span className="text-ghibli-moss">
                          €{(cartSummary.subtotal + cartSummary.shipping).toFixed(2)}
                        </span>
                      </div>
                      {cartSummary.originalSubtotal < 40 && cartSummary.shipping > 0 && (
                        <p className="text-xs text-ghibli-earth/70 text-center mt-1">
                          Adiciona €{(40 - cartSummary.originalSubtotal).toFixed(2)} para envio grátis!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="px-4 pb-2 pt-1">
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessingCheckout || !userInfo}
                    className="w-full py-3 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light hover:from-ghibli-moss-light hover:to-ghibli-moss text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation"
                  >
                    {isProcessingCheckout ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                        A processar...
                      </div>
                    ) : !userInfo ? (
                      <>
                        <span className="mr-2">🔐</span>
                        Faça Login para Continuar
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🌟</span>
                        Finalizar Compra
                      </>
                    )}
                  </Button>
                  
                  {userInfo && (
                    <p className="text-xs text-ghibli-earth text-center mt-2">
                      Será redirecionado para o Stripe para pagamento seguro
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 