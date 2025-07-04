import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { CartItem, CartSummary } from '@/lib/cart/cartTypes';
import Image from 'next/image';

interface CartBottomSheetProps {
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

export const CartBottomSheet: React.FC<CartBottomSheetProps> = ({
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
  // Sempre expandido quando aberto - sem estado médio
  const isExpanded = true;

  // Bloquear scroll do body quando carrinho está aberto no mobile
  useEffect(() => {
    if (isOpen) {
      // Bloquear scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Restaurar scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup quando componente desmonta
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

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
        // Fechar bottom sheet antes de redirecionar
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

  // Componente para cada item do carrinho (versão mobile compacta)
  const CartItemCard = ({ item }: { item: CartItem }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl p-3 border border-ghibli-sand/30 shadow-sm"
    >
      <div className="flex gap-3">
        {/* Imagem do produto */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-ghibli-cream shadow-sm flex-shrink-0">
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
          
          {/* Variante e posição numa só linha */}
          <div className="text-xs text-ghibli-earth space-y-0.5">
            {item.customizations?.variant && (
              <p><span className="font-medium">Variante:</span> {item.customizations.variant}</p>
            )}
            {item.customizations?.position && (
              <p><span className="font-medium">Posição:</span> {item.customizations.position}</p>
            )}
          </div>
        </div>
        
        {/* Controlos de quantidade e preço */}
        <div className="flex flex-col items-end gap-2">
          {/* Preço */}
          <div className="text-right">
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
                  <div className="text-right">
                    <p className="text-xs text-red-500 line-through">
                      €{originalPrice.toFixed(2)}
                    </p>
                    <p className="text-sm font-bold text-ghibli-moss">
                      €{discountedPrice.toFixed(2)}
                    </p>
                  </div>
                );
              } else {
                return (
                  <p className="text-sm font-bold text-ghibli-moss">
                    €{originalPrice.toFixed(2)}
                  </p>
                );
              }
            })()}
          </div>
          
          {/* Controlos de quantidade */}
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '5%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white z-[70] shadow-2xl border-t border-ghibli-sand/20 lg:hidden rounded-t-3xl overflow-hidden flex flex-col"
            style={{ height: '95vh' }}
          >
            {/* Header com handle - altura fixa */}
            <div className="flex flex-col flex-shrink-0">
              {/* Handle visual */}
              <div className="flex justify-center py-2">
                <div className="w-12 h-1 bg-ghibli-sand rounded-full" />
              </div>
              
              {/* Cabeçalho */}
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
            
            {/* Conteúdo scrollável - área que cresce */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {/* Lista de produtos - área scrollável */}
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
              
              {/* Footer fixo com preços e checkout */}
              {cartSummary && cartSummary.itemCount > 0 && (
                <div className="flex-shrink-0 border-t border-ghibli-sand/30 bg-ghibli-cream/20">
                  {/* Resumo de preços compacto para mobile */}
                  <div className="px-4 py-3">
                    {/* Subtotal original e desconto (se houver) */}
                    {cartSummary.discountAmount && cartSummary.discountAmount > 0 && (
                      <>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-ghibli-earth">Subtotal (original)</span>
                          <span className="text-ghibli-earth line-through">
                            €{(cartSummary.originalSubtotal || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs bg-green-50 rounded-lg px-2 py-1 mb-2">
                          <span className="text-green-700 font-medium">
                            🎉 Desconto
                          </span>
                          <span className="text-green-700 font-bold">
                            -€{cartSummary.discountAmount.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {/* Lista de preços compacta */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-ghibli-earth">Subtotal</span>
                        <span className="font-semibold text-ghibli-wood">
                          €{cartSummary.subtotal.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-ghibli-earth">Envio</span>
                        <span className="text-green-600 font-bold">GRÁTIS! ✨</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-ghibli-earth">IVA (23%)</span>
                        <span className="font-semibold text-ghibli-wood">
                          €{cartSummary.tax.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="border-t border-ghibli-sand/50 pt-2 mt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-ghibli-wood">Total</span>
                          <span className="text-ghibli-moss">
                            €{(cartSummary.subtotal + cartSummary.tax).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botão de checkout */}
                  <div className="px-4 pb-4">
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
        </>
      )}
    </AnimatePresence>
  );
}; 