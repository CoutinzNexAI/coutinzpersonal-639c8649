import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { CartItem, CartSummary } from '@/lib/cart/cartTypes';
import { CartBottomSheet } from './CartBottomSheet';
import Image from 'next/image';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartSummary: CartSummary | null;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onClearCart: () => void;
}

interface UserData {
  full_name: string;
  email: string;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  cartSummary,
  onRemoveItem,
  onUpdateQuantity,
  onClearCart
}) => {
  const { userInfo } = useAuth();
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Carregar dados do utilizador quando necessário
  const loadUserData = async () => {
    if (!userInfo?.id || userData) return userData;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', userInfo.id)
        .single();

      if (error) {
        console.error('Erro ao carregar dados do utilizador:', error);
        toast.error('Erro ao carregar dados do perfil');
        return null;
      }

      setUserData(data);
      return data;
    } catch (error) {
      console.error('Erro inesperado ao carregar dados:', error);
      toast.error('Erro ao carregar dados do perfil');
      return null;
    }
  };

  // Lógica de checkout (reutilizando a lógica existente)
  const handleCheckout = async () => {
    if (!cartSummary || !userInfo) {
      toast.error('Dados incompletos para finalizar compra');
      return;
    }

    setIsProcessingCheckout(true);

    try {
      // Carregar dados do user se necessário
      const currentUserData = await loadUserData();
      if (!currentUserData) {
        toast.error('Erro ao carregar dados do perfil');
        return;
      }

      // 1. Validar carrinho (usando a mesma lógica)
      if (cartSummary.itemCount === 0) {
        toast.error('Carrinho vazio!');
        return;
      }

      // 2. Calcular total final (envio grátis)
      const shippingPrice = 0; // Envio sempre grátis
      const finalTotal = cartSummary.subtotal + cartSummary.tax;

      toast.info('A preparar sessão de pagamento...', { duration: 2000 });

      // 3. Criar sessão de pagamento Stripe (mesma API)
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartSummary.items,
          shippingMethod: {
            uid: 'free_shipping',
            name: 'Envio Grátis',
            price: shippingPrice,
            deliveryDaysMin: 4,
            deliveryDaysMax: 7,
            description: 'Envio gratuito em 4-7 dias úteis'
          },
          userId: userInfo.id,
          userName: currentUserData.full_name,
          userEmail: currentUserData.email,
          subtotal: cartSummary.subtotal,
          originalSubtotal: cartSummary.originalSubtotal,
          discountAmount: cartSummary.discountAmount,
          shipping: shippingPrice,
          tax: cartSummary.tax,
          total: finalTotal
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar sessão de pagamento');
      }

      const result = await response.json();
      
      if (result.url) {
        // Fechar sidebar antes de redirecionar
        onClose();
        // Redirecionar para Stripe Checkout
        window.location.href = result.url;
      } else {
        throw new Error('URL de pagamento não recebida');
      }
      
    } catch (error) {
      console.error('Erro no checkout:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao processar compra: ' + errorMessage);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Componente para cada item do carrinho
  const CartItemCard = ({ item }: { item: CartItem }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-ghibli-cream/30 rounded-xl p-4 border border-ghibli-sand/40"
    >
      <div className="flex gap-3">
        {/* Imagem do produto */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white shadow-sm">
          <Image
            src={item.userImageUrl}
            alt={item.productName}
            fill
            className="object-cover"
          />
        </div>
        
        {/* Detalhes do produto */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-ghibli-wood text-sm truncate mb-1">
            {item.productName}
          </h4>
          
          {/* Variante/tamanho */}
          {item.customizations?.variant && (
            <p className="text-xs text-ghibli-earth mb-1">
              <span className="font-medium">Variante:</span> {item.customizations.variant}
            </p>
          )}
          
          {/* Posição da foto */}
          {item.customizations?.position && (
            <p className="text-xs text-ghibli-earth mb-1">
              <span className="font-medium">Posição:</span> {item.customizations.position}
            </p>
          )}
          
          {/* Controles de quantidade */}
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
        
        {/* Preço */}
        <div className="text-right">
          {/* Verificar se há desconto para este item */}
          {(() => {
            // Calcular desconto baseado na quantidade do mesmo produto
            const sameProductItems = cartSummary?.items.filter(cartItem => cartItem.productId === item.productId) || [];
            const totalSameProductQty = sameProductItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
            
            let discountPercent = 0;
            if (totalSameProductQty >= 3) {
              discountPercent = 15;
            } else if (totalSameProductQty >= 2) {
              discountPercent = 10;
            }
            
            const originalPrice = item.price * item.quantity;
            const discountedPrice = originalPrice * (1 - discountPercent / 100);
            
            if (discountPercent > 0) {
              return (
                <div>
                  <p className="text-xs text-red-500 line-through">
                    €{originalPrice.toFixed(2)}
                  </p>
                  <p className="font-bold text-ghibli-moss">
                    €{discountedPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600">
                    -{discountPercent}%
                  </p>
                </div>
              );
            } else {
              return (
                <p className="font-bold text-ghibli-moss">
                  €{originalPrice.toFixed(2)}
                </p>
              );
            }
          })()}
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <CartBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        cartSummary={cartSummary}
        onRemoveItem={onRemoveItem}
        onUpdateQuantity={onUpdateQuantity}
        onClearCart={onClearCart}
      />
      
      {/* Desktop: Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay - só no desktop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 hidden lg:block"
            />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[480px] bg-white z-50 shadow-2xl border-l border-ghibli-sand/20 hidden lg:flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-ghibli-sand/30 bg-gradient-to-r from-ghibli-cream to-ghibli-paper">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-ghibli-moss/10 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-ghibli-moss" />
                </div>
                <div>
                  <h2 className="text-xl font-ghibli text-ghibli-wood">Carrinho</h2>
                  <p className="text-sm text-ghibli-earth">
                    {cartSummary?.itemCount || 0} {(cartSummary?.itemCount || 0) === 1 ? 'item' : 'items'}
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
            
            {/* Conteúdo */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Lista de produtos */}
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
              
              {/* Footer com preços e checkout */}
              {cartSummary && cartSummary.itemCount > 0 && (
                <div className="border-t border-ghibli-sand/30 p-6 bg-ghibli-cream/20">
                  {/* Breakdown de preços */}
                  <div className="space-y-3 mb-6">
                    {/* Subtotal original (se houver desconto) */}
                    {cartSummary.originalSubtotal && cartSummary.discountAmount && cartSummary.discountAmount > 0 && cartSummary.originalSubtotal > cartSummary.subtotal && (
                      <div className="flex justify-between text-sm">
                        <span className="text-ghibli-earth">Subtotal (original)</span>
                        <span className="text-ghibli-earth line-through">
                          €{cartSummary.originalSubtotal.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* Desconto */}
                    {cartSummary.discountAmount && cartSummary.discountAmount > 0 && (
                      <div className="flex justify-between text-sm bg-green-50 rounded-lg px-3 py-2">
                        <span className="text-green-700 font-medium">
                          🎉 Desconto por quantidade
                        </span>
                        <span className="text-green-700 font-bold">
                          -€{cartSummary.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-ghibli-earth">Subtotal</span>
                      <span className="font-semibold text-ghibli-wood">
                        €{cartSummary.subtotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-ghibli-earth">Envio</span>
                        <p className="text-xs text-ghibli-earth/70">Entrega em 4-7 dias úteis</p>
                      </div>
                      <span className="text-green-600 font-bold text-sm">GRÁTIS! ✨</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-ghibli-earth">IVA (23%)</span>
                      <span className="font-semibold text-ghibli-wood">
                        €{cartSummary.tax.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="border-t border-ghibli-sand/50 pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-ghibli-wood">Total</span>
                        <span className="text-ghibli-moss">
                          €{(cartSummary.subtotal + cartSummary.tax).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botão de checkout */}
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessingCheckout || !userInfo}
                    className="w-full py-4 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light hover:from-ghibli-moss-light hover:to-ghibli-moss text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
        </>
      )}
    </AnimatePresence>
    </>
  );
};
 