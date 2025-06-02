import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Zap, Gift } from 'lucide-react';

interface FirstPurchasePromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptPromo: (promoPackageId: string) => void;
}

export const FirstPurchasePromoModal: React.FC<FirstPurchasePromoModalProps> = ({
  isOpen,
  onClose,
  onAcceptPromo,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  // Pacote popular com desconto especial
  const originalPrice = 5;
  const promoPrice = 2;
  const savings = originalPrice - promoPrice;
  const discountPercent = Math.round((savings / originalPrice) * 100);
  const coins = 3;

  const handleAccept = async () => {
    setIsAccepting(true);
    const promoPackageId = 'popular_first_purchase_promo';
    onAcceptPromo(promoPackageId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-transparent border-none overflow-hidden">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-amber-200"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-4">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            
            <div className="text-center text-white">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block mb-2"
              >
                🎁
              </motion.div>
              <h2 className="text-xl font-bold mb-1">Ficaste sem PicCoins?</h2>
              <p className="text-amber-100 text-sm">Oferta especial só para ti!</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Discount showcase */}
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Preço normal vs. Oferta especial</p>
                
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="relative">
                      <span className="text-2xl font-bold text-gray-400 line-through">€{originalPrice}</span>
                      <motion.div
                        className="absolute inset-0 bg-red-500/10 rounded"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      />
                    </div>
                  </div>
                  
                  <Zap className="text-amber-500 w-6 h-6" />
                  
                  <div className="text-center">
                    <motion.div
                      className="text-3xl font-bold text-amber-600"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      €{promoPrice}
                    </motion.div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    POUPAS €{savings} ({discountPercent}% OFF)
                  </span>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-3 mb-4">
                <p className="text-purple-800 font-medium">
                  {coins} PicCoins para transformações mágicas ✨
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-center justify-center gap-2">
                {isAccepting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Gift className="w-5 h-5" />
                    </motion.div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    APROVEITAR DESCONTO - €{promoPrice}
                  </>
                )}
              </div>
            </Button>

            {/* Disclaimer */}
            <p className="text-xs text-center text-gray-500 mt-3">
              * Oferta válida apenas para primeira compra. Não acumulável com outras promoções.
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}; 