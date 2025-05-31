import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Sparkles, Crown, Gift, Zap } from 'lucide-react';

interface FirstPurchasePromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptPromo: (promoPackageId: string) => void;
  originalPackage: {
    id: string;
    name: string;
    coins: number;
    price: number;
  };
}

export const FirstPurchasePromoModal: React.FC<FirstPurchasePromoModalProps> = ({
  isOpen,
  onClose,
  onAcceptPromo,
  originalPackage
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  // Oferta especial: 60% de desconto no pacote popular (5€ -> 2€)
  const isPopularPackage = originalPackage.id === 'popular';
  const promoPrice = isPopularPackage ? 2 : Math.ceil(originalPackage.price * 0.4); // 60% desconto
  const savings = originalPackage.price - promoPrice;
  const discountPercent = Math.round((savings / originalPackage.price) * 100);

  const handleAccept = async () => {
    setIsAccepting(true);
    // Criar um ID especial para o pacote promocional
    const promoPackageId = `${originalPackage.id}_first_purchase_promo`;
    onAcceptPromo(promoPackageId);
  };

  const floatingElements = [
    { emoji: '✨', delay: 0, x: 20, y: 30 },
    { emoji: '🌟', delay: 0.5, x: 80, y: 20 },
    { emoji: '⭐', delay: 1, x: 60, y: 50 },
    { emoji: '🎁', delay: 1.5, x: 30, y: 60 },
    { emoji: '💫', delay: 2, x: 70, y: 40 }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl p-0 bg-transparent border-none overflow-hidden mx-2 sm:mx-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-gradient-to-br from-ghibli-cream via-amber-50 to-yellow-100 rounded-2xl md:rounded-3xl border-2 md:border-4 border-amber-300 shadow-2xl overflow-hidden"
        >
          {/* Elementos flutuantes animados */}
          {floatingElements.map((element, index) => (
            <motion.div
              key={index}
              className="absolute text-lg md:text-2xl pointer-events-none z-10"
              style={{ left: `${element.x}%`, top: `${element.y}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.2, 1], 
                opacity: [0, 1, 0.8],
                y: [0, -10, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 2,
                delay: element.delay,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              {element.emoji}
            </motion.div>
          ))}

          {/* Fundo decorativo */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 to-yellow-300/20" />
          
          <div className="relative z-20 p-4 sm:p-6 md:p-8">
            {/* Header com badge especial */}
            <motion.div 
              className="text-center mb-4 md:mb-6"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="inline-flex items-center gap-1 md:gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg mb-3 md:mb-4"
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 4px 20px rgba(245, 158, 11, 0.3)",
                    "0 8px 30px rgba(245, 158, 11, 0.5)",
                    "0 4px 20px rgba(245, 158, 11, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-bold text-sm md:text-base">OFERTA ESPECIAL</span>
                <Gift className="w-4 h-4 md:w-5 md:h-5" />
              </motion.div>
              
              <motion.h2 
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-ghibli font-bold text-ghibli-wood mb-2"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                🎉 Oferta de Boas-Vindas!
              </motion.h2>
              
              <p className="text-sm sm:text-base md:text-lg text-ghibli-earth">
                {isPopularPackage 
                  ? "Pacote Popular por apenas 2€ - 60% de desconto!" 
                  : "Bem-vindo à nossa comunidade de artistas digitais!"
                }
              </p>
            </motion.div>

            {/* Comparação de preços */}
            <motion.div 
              className="bg-white/80 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 mb-4 md:mb-6 border-2 border-amber-200"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 md:gap-4 mb-3 md:mb-4">
                  <div className="text-center">
                    <p className="text-xs md:text-sm text-gray-500 mb-1">Preço Normal</p>
                    <div className="relative">
                      <span className="text-base sm:text-lg md:text-2xl font-bold text-gray-400 line-through">€{originalPackage.price}</span>
                      <motion.div
                        className="absolute inset-0 bg-red-500/20"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                      />
                    </div>
                  </div>
                  
                  <Zap className="text-amber-500 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                  
                  <div className="text-center">
                    <p className="text-xs md:text-sm text-amber-600 mb-1 font-semibold">Preço Especial</p>
                    <motion.div
                      className="text-xl sm:text-2xl md:text-4xl font-bold text-amber-600"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      €{promoPrice}
                    </motion.div>
                  </div>
                </div>
                
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 sm:px-3 md:px-4 py-1.5 md:py-2 rounded-full inline-block"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  <span className="font-bold text-xs sm:text-sm md:text-base">POUPAS €{savings} ({discountPercent}% OFF)</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Detalhes do pacote */}
            <motion.div 
              className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl md:rounded-2xl p-3 sm:p-4 mb-6 md:mb-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-center gap-2 md:gap-3">
                <Star className="text-amber-500 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                <div className="text-center">
                  <p className="text-sm sm:text-base md:text-lg font-semibold text-ghibli-wood">
                    Pacote {originalPackage.name}
                  </p>
                  <p className="text-xs md:text-sm text-ghibli-earth">
                    {originalPackage.coins} {originalPackage.coins === 1 ? 'PicCoin' : 'PicCoins'} para transformações mágicas
                  </p>
                </div>
                <Sparkles className="text-purple-500 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
              </div>
            </motion.div>

            {/* Botão de ação único */}
            <motion.div 
              className="flex justify-center mb-3 md:mb-4"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Button
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full max-w-xs sm:max-w-sm bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 text-sm sm:text-base md:text-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  {isAccepting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                      ACEITAR OFERTA - €{promoPrice}
                    </>
                  )}
                </div>
              </Button>
            </motion.div>

            {/* Disclaimer */}
            <motion.p 
              className="text-xs md:text-sm text-center text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              * Oferta válida apenas para primeira compra. Não acumulável com outras promoções.
            </motion.p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}; 