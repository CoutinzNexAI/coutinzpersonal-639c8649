import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CartSummary } from '@/lib/cart/cartTypes';
import { MobileProductCard } from './MobileProductCard';
import { ChevronUp, ChevronDown, ShoppingBag, CreditCard } from 'lucide-react';

interface MobileCheckoutSummaryProps {
  cartSummary: CartSummary;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  loadingPayment: boolean;
  className?: string;
}

export const MobileCheckoutSummary: React.FC<MobileCheckoutSummaryProps> = ({
  cartSummary,
  onRemoveItem,
  onCheckout,
  loadingPayment,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const total = cartSummary.subtotal + cartSummary.tax;

  return (
    <div className={`lg:hidden ${className}`}>
      {/* Fixed Bottom Summary */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-ghibli-moss/20 shadow-2xl"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 500 }}
      >
        {/* Collapsible Header */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex justify-between items-center hover:bg-ghibli-cream/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-ghibli-wood">
                {cartSummary.itemCount} {cartSummary.itemCount === 1 ? 'Item' : 'Items'}
              </p>
              <p className="text-sm text-ghibli-earth">
                Ver resumo da compra
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-bold text-lg text-ghibli-moss">
                €{total.toFixed(2)}
              </div>
              {cartSummary.discountAmount && cartSummary.discountAmount > 0 && (
                <div className="text-xs text-green-600">
                  -€{cartSummary.discountAmount.toFixed(2)} desconto
                </div>
              )}
            </div>
            
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronUp className="w-5 h-5 text-ghibli-earth" />
            </motion.div>
          </div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden border-t border-ghibli-sand/30"
            >
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {/* Discount Banner */}
                  {cartSummary.discountAmount && cartSummary.discountAmount > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 border border-green-200 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎉</span>
                        <div>
                          <p className="font-bold text-green-700 text-sm">
                            Desconto por Quantidade!
                          </p>
                          <p className="text-xs text-green-600">
                            Poupou €{cartSummary.discountAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Product List */}
                  <div className="space-y-3">
                    {cartSummary.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <MobileProductCard
                          item={item}
                          onRemove={onRemoveItem}
                          className="bg-ghibli-cream/30"
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-ghibli-cream/50 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-ghibli-wood flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      Resumo Financeiro
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      {/* Original Subtotal */}
                      {cartSummary.originalSubtotal && cartSummary.discountAmount && cartSummary.discountAmount > 0 && (
                        <div className="flex justify-between text-ghibli-earth">
                          <span>Subtotal (original)</span>
                          <span className="line-through">€{cartSummary.originalSubtotal.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {/* Discount */}
                      {cartSummary.discountAmount && cartSummary.discountAmount > 0 && (
                        <div className="flex justify-between text-green-700 font-medium">
                          <span>🎉 Desconto por quantidade</span>
                          <span>-€{cartSummary.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-ghibli-earth">Subtotal</span>
                        <span className="text-ghibli-wood font-semibold">€{cartSummary.subtotal.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <div>
                          <span className="text-ghibli-earth">Envio</span>
                          <div className="text-xs text-ghibli-earth/70">5-8 dias úteis</div>
                        </div>
                        <span className="text-green-600 font-bold">GRÁTIS! ✨</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-ghibli-earth">IVA (23%)</span>
                        <span className="text-ghibli-wood font-semibold">€{cartSummary.tax.toFixed(2)}</span>
                      </div>
                      
                      <div className="border-t border-ghibli-sand/50 pt-2 mt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-ghibli-wood">Total</span>
                          <span className="text-ghibli-moss">€{total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Info */}
                  <div className="bg-blue-50/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🛡️</span>
                      <span className="font-bold text-blue-700 text-sm">Compra Segura</span>
                    </div>
                    <div className="space-y-1 text-xs text-blue-600">
                      <div className="flex items-center gap-2">
                        <span>🔒</span>
                        <span>Pagamento pelo Stripe</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💳</span>
                        <span>SSL & Dados protegidos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="p-4 bg-ghibli-cream/30 border-t border-ghibli-sand/30">
                <Button
                  onClick={onCheckout}
                  disabled={loadingPayment}
                  className="w-full bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light hover:from-ghibli-moss-light hover:to-ghibli-moss text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loadingPayment ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                      <span>A processar...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Finalizar Compra</span>
                    </div>
                  )}
                </Button>
                
                <p className="text-xs text-ghibli-earth text-center mt-2">
                  Será redirecionado para o Stripe para pagamento seguro
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Spacer to prevent content overlap */}
      <div className={`h-20 ${isExpanded ? 'h-96' : ''}`} />
    </div>
  );
}; 