import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingCart } from 'lucide-react';

interface ProductQuantityPricingProps {
  // Dados do produto
  basePrice: number;
  
  // Estados
  quantity: number;
  
  // Callbacks
  onQuantityChange: (quantity: number) => void;
  
  // Configurações
  discountTiers?: Array<{ min: number; discount: number; label: string; emoji: string }>;
  className?: string;
  
  // Props para o botão "Adicionar ao Carrinho" compacto
  canPurchase?: boolean;
  onAddToCart?: () => void;
  loading?: boolean;
  userInfo?: { id: string; email: string } | null;
  selectedImageUrl?: string;
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
  selectedImageUrl
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

  // Determina se o botão está disponível
  const isButtonEnabled = canPurchase && !loading && userInfo && selectedImageUrl;

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sand/30 shadow-lg ${className}`}>
      {/* Header com preço E botão compacto */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-ghibli-moss">€{discountedPrice.toFixed(2)}</span>
            {/* Preço original riscado removido - desconto agora está no Total */}
          </div>
          {discount > 0 && (
            <span className="text-xs text-green-600 font-medium">
              Poupa €{savings.toFixed(2)} com {discount}% desconto!
            </span>
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
          <div className="flex items-center gap-2 bg-ghibli-cream/50 rounded-lg p-1">
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

        {/* Destaques de desconto */}
        <div className="space-y-1 text-xs">
          {discountTiers.map((tier, index) => (
            <button
              key={index}
              onClick={() => onQuantityChange(tier.min)}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer hover:scale-105 ${
                quantity >= tier.min
                  ? 'bg-green-100 border border-green-300 text-green-800 hover:bg-green-200' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tier.emoji} {tier.min}+ {tier.label}</span>
              <span className="font-bold">{tier.discount}% OFF</span>
            </button>
          ))}
        </div>

        {/* Total COM desconto movido para aqui */}
        <div className="border-t border-ghibli-sand/30 pt-3 mt-3">
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
      </div>
    </div>
  );
};

export default ProductQuantityPricing; 