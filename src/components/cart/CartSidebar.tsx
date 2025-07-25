import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { supabase } from '@/lib/supabase/client';
import { CartItem, CartSummary } from '@/lib/cart/cartTypes';
import { CartBottomSheet } from './CartBottomSheet';
import { getFakeDiscountInfo } from '@/lib/fakeDiscounts';
import { trackCheckoutStarted } from '@/lib/posthog';
import * as fpixel from '@/lib/fpixel';
import Image from 'next/image';

interface CartSidebarProps {
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

// ✅ REMOVIDO: Sistema de desconto de quantidade (substituído por descontos fake individuais)

export const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  cartSummary,
  onRemoveItem,
  onUpdateQuantity
}) => {
  const { userInfo } = useAuth();
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Hook para fechar carrinho quando clicar fora (apenas no desktop)
  const sidebarRef = useOutsideClick<HTMLDivElement>(() => {
    if (isOpen) {
      onClose();
    }
  }, isOpen);

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

  // Lógica de checkout (consistente com CartBottomSheet)
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
        discount_amount: 0, // Fake discounts são aplicados no preço do item
        shipping_cost: cartSummary.shipping,
        total_amount: cartSummary.subtotal + cartSummary.shipping,
        checkout_source: 'cart_sidebar',
        items_by_category: itemsByCategory
      });

      // 🚀 FACEBOOK PIXEL: InitiateCheckout event
      fpixel.trackInitiateCheckout({
        content_ids: cartSummary.items.map(item => item.productId),
        contents: cartSummary.items.map(item => ({
          id: item.productId,
          quantity: item.quantity,
          item_price: item.price
        })),
        value: cartSummary.subtotal + cartSummary.shipping,
        currency: 'EUR',
        num_items: cartSummary.itemCount
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
                  originalSubtotal: cartSummary.subtotal, // Mesmo valor pois desconto fake já aplicado
        discountAmount: 0, // Fake discounts são aplicados no preço do item
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
                    const fakeDiscountInfo = getFakeDiscountInfo(item.productId, item.price);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-ghibli-cream/30 rounded-xl p-4 border border-ghibli-sand/40"
      >
        <div className="flex gap-3">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white shadow-sm">
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
            
            {item.customizations?.variant && (
              <p className="text-xs text-ghibli-earth mb-1">
                <span className="font-medium">Variante:</span> {item.customizations.variant}
              </p>
            )}
            
            {item.customizations?.position && (
              <p className="text-xs text-ghibli-earth mb-1">
                <span className="font-medium">Posição:</span> {item.customizations.position}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
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
              </div>
              
              <button
                onClick={() => onRemoveItem(item.id)}
                className="text-ghibli-poppy hover:text-red-700 transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="text-right">
            {fakeDiscountInfo && fakeDiscountInfo.hasDiscount ? (
              <div>
                <p className="text-xs text-gray-500 line-through">
                  €{(fakeDiscountInfo.fakePrice * item.quantity).toFixed(2)}
                </p>
                <p className="font-bold text-red-600">
                  €{(item.price * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-red-600">
                  -{fakeDiscountInfo.discountPercent}%
                </p>
              </div>
            ) : (
              <p className="font-bold text-ghibli-moss">
                €{(item.price * item.quantity).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <CartBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        cartSummary={cartSummary}
        onRemoveItem={onRemoveItem}
        onUpdateQuantity={onUpdateQuantity}
      />
      
      {/* Desktop: Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[480px] bg-white z-[70] shadow-2xl border-l border-ghibli-sand/20 hidden lg:flex flex-col"
            ref={sidebarRef}
            data-cart-container="true"
          >
            <div className="flex items-center justify-between p-6 border-b border-ghibli-sand/30 bg-gradient-to-r from-ghibli-cream to-ghibli-paper">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-ghibli-moss/10 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-ghibli-moss" />
                </div>
                <div>
                  <h2 className="text-xl font-ghibli text-ghibli-wood">Carrinho</h2>
                  <p className="text-sm text-ghibli-earth">
                    {cartSummary?.itemCount ? `${cartSummary.itemCount} ${cartSummary.itemCount === 1 ? 'item' : 'items'}` : 'Vazio'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-ghibli-sand/20 hover:bg-ghibli-sand/40 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-ghibli-earth" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartSummary?.items.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛒</div>
                    <h3 className="text-lg font-semibold text-ghibli-earth mb-2">
                      Carrinho vazio
                    </h3>
                    <p className="text-ghibli-earth/70 mb-4">
                      Adicione alguns produtos incríveis!
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
                  <AnimatePresence>
                    {cartSummary?.items.map((item) => (
                      <CartItemCard key={item.id} item={item} />
                    ))}
                  </AnimatePresence>
                )}
              </div>
              
              {cartSummary && cartSummary.itemCount > 0 && (
                <div className="border-t border-ghibli-sand/30 p-6 bg-ghibli-cream/20">
                  <div className="bg-ghibli-sand/30 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-ghibli-earth">Subtotal</span>
                      <span className="font-semibold text-ghibli-wood">
                        €{cartSummary.subtotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-ghibli-earth">Envio</span>
                        {cartSummary.shipping === 0 && cartSummary.subtotal < 40 && (
                          <p className="text-xs text-ghibli-earth/70">Grátis em compras de €40+</p>
                        )}
                        {cartSummary.shipping === 0 && cartSummary.subtotal >= 40 && (
                          <p className="text-xs text-ghibli-earth/70">Envio gratuito!</p>
                        )}
                        {cartSummary.shipping > 0 && (
                          <p className="text-xs text-ghibli-earth/70">Grátis em compras de €40+</p>
                        )}
                      </div>
                      {cartSummary.shipping === 0 ? (
                        <span className="text-green-600 font-bold text-sm">GRÁTIS! ✨</span>
                      ) : (
                        <span className="font-semibold text-ghibli-wood">
                          €{cartSummary.shipping.toFixed(2)}
                        </span>
                      )}
                    </div>
                    
                    <div className="border-t border-ghibli-sand/50 pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-ghibli-wood">Total</span>
                        <span className="text-ghibli-moss">
                          €{(cartSummary.subtotal + cartSummary.shipping).toFixed(2)}
                        </span>
                      </div>
                      {cartSummary.subtotal < 40 && cartSummary.shipping > 0 && (
                        <p className="text-xs text-ghibli-earth/70 text-right mt-1">
                          Adiciona €{(40 - cartSummary.subtotal).toFixed(2)} para envio grátis!
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessingCheckout || !userInfo}
                    className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
                    <p className="text-xs text-ghibli-earth text-center mt-3">
                      Será redirecionado para o Stripe para pagamento seguro
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
 