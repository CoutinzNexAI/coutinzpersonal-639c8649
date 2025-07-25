import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { getFakeDiscountInfo } from '@/lib/fakeDiscounts';

interface ProductQuantityPricingProps {
  basePrice: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  discountTiers?: { min: number; discount: number; label: string; emoji: string; }[];
  className?: string;
  canPurchase?: boolean;
  onAddToCart?: () => void;
  loading?: boolean;
  userInfo?: { id: string; email: string } | null;
  selectedImageUrl?: string;
  productId?: string; // ✅ NOVO: Para identificar o produto e aplicar fake discount
}

export const ProductQuantityPricing: React.FC<ProductQuantityPricingProps> = ({
  basePrice,
  quantity,
  onQuantityChange,
  discountTiers = [
    { min: 2, discount: 10, label: 'produtos', emoji: '💡' },
    { min: 3, discount: 15, label: 'produtos', emoji: '🔥' }
  ],
  className = '',
  canPurchase = false,
  onAddToCart,
  loading = false,
  userInfo,
  selectedImageUrl,
  productId // ✅ NOVO
}) => {
  // Calcula desconto baseado na quantidade
  const calculateDiscount = (qty: number) => {
    const applicableTier = discountTiers
      .slice()
      .reverse()
      .find(tier => qty >= tier.min);
    return applicableTier?.discount || 0;
  };

  const discount = calculateDiscount(quantity);
  const discountedPrice = basePrice * (1 - discount / 100);
  const totalPrice = discountedPrice * quantity;
  const savings = (basePrice * quantity) - totalPrice;

  // ✅ NOVO: Obter informações de fake discount se productId fornecido
  const fakeDiscountInfo = productId ? getFakeDiscountInfo(productId, basePrice) : null;

  // Determina se o botão está disponível
  const isButtonEnabled = canPurchase && !loading && userInfo && selectedImageUrl;

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sand/30 shadow-lg ${className}`}>
      {/* Header com preço E botão compacto */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          {/* ✅ NOVO: Sistema de fake discount mobile */}
          {fakeDiscountInfo && fakeDiscountInfo.hasDiscount ? (
            <div className="flex flex-col">
              {/* Badge de desconto + preço fake riscado */}
              <div className="flex items-center gap-2 mb-1">
                <motion.div 
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-lg"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 2px 4px rgba(239, 68, 68, 0.2)",
                      "0 4px 12px rgba(239, 68, 68, 0.4)",
                      "0 2px 4px rgba(239, 68, 68, 0.2)"
                    ]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {fakeDiscountInfo.discountPercent}% OFF
                </motion.div>
                <div className="text-sm text-gray-500 line-through font-medium">
                  €{(fakeDiscountInfo.fakePrice * quantity).toFixed(2)}
                </div>
              </div>
              
              {/* Preço real (com desconto fake) */}
              <motion.div 
                className="text-xl font-black text-green-600 relative"
                animate={{ 
                  scale: [1, 1.02, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                €{totalPrice.toFixed(2)}
                {/* Sparkle effect compacto */}
                <motion.span
                  className="absolute -top-1 -right-1 text-yellow-400 text-xs"
                  animate={{ 
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.5
                  }}
                >
                  ✨
                </motion.span>
              </motion.div>
            </div>
          ) : (
            // Produto sem fake discount
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-ghibli-moss">€{discountedPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        {/* NOVO: Botão "Adicionar ao Carrinho" compacto */}
        {onAddToCart && (
          <Button
            onClick={onAddToCart}
            disabled={!isButtonEnabled}
            size="sm"
            className={`ml-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              isButtonEnabled 
                ? 'bg-ghibli-moss hover:bg-ghibli-moss/90 text-white shadow-md hover:shadow-lg' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Adicionar</span>
                <span className="sm:hidden">+</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Seletor de Quantidade */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ghibli-earth">Quantidade:</span>
          <div className="flex items-center gap-1 bg-ghibli-cream/50 rounded-md px-2 py-1">
            <Button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-md hover:bg-ghibli-moss/10 disabled:opacity-50"
            >
              <Minus className="w-4 h-4" />
            </Button>
            
            <span className="min-w-[2rem] text-center font-bold text-ghibli-earth">
              {quantity}
            </span>
            
            <Button
              onClick={() => onQuantityChange(quantity + 1)}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-md hover:bg-ghibli-moss/10"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ✅ REMOVIDO: Sistema de desconto de quantidade (obsoleto) */}

        {/* Total */}
        {quantity > 1 && (
          <div className="border-t border-ghibli-sand/30 pt-2 mt-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ghibli-earth">Total:</span>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className="text-xl font-black text-ghibli-moss">€{totalPrice.toFixed(2)}</div>
                  {/* NOVO: Desconto movido para aqui */}
                  {discount > 0 && (
                    <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{discount}%
                    </div>
                  )}
                </div>
                {quantity > 1 && (
                  <div className="text-xs text-ghibli-earth/70">
                    {quantity} × €{discountedPrice.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductQuantityPricing; 