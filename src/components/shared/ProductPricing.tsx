import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface ProductPricingProps {
  basePrice: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  discount: number;
  totalPrice: number;
  savings: number;
  productName: string;
  variant?: 'mobile' | 'desktop';
}

export const ProductPricing: React.FC<ProductPricingProps> = ({
  basePrice,
  quantity,
  onQuantityChange,
  discount,
  totalPrice,
  savings,
  productName,
  variant = 'mobile'
}) => {
  const discountedPrice = basePrice * (1 - discount / 100);
  
  if (variant === 'mobile') {
    return (
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
          <div className={`flex items-center justify-between p-2 rounded-lg transition-all ${
            quantity >= 2 
              ? 'bg-green-100 border border-green-300 text-green-800' 
              : 'bg-gray-50 text-gray-600'
          }`}>
            <span>🎯 2+ {productName.toLowerCase()}s</span>
            <span className="font-bold">10% OFF</span>
          </div>
          <div className={`flex items-center justify-between p-2 rounded-lg transition-all ${
            quantity >= 3 
              ? 'bg-green-100 border border-green-300 text-green-800' 
              : 'bg-gray-50 text-gray-600'
          }`}>
            <span>🔥 3+ {productName.toLowerCase()}s</span>
            <span className="font-bold">15% OFF</span>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-ghibli-sand/30 pt-3 mt-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-ghibli-earth">Total:</span>
            <div className="text-right">
              <div className="text-xl font-black text-ghibli-moss">€{totalPrice.toFixed(2)}</div>
              {quantity > 1 && (
                <div className="text-xs text-ghibli-earth/70">
                  {quantity} × €{discountedPrice.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div className="space-y-1">
      <div className="inline-block">
        <div className="text-2xl sm:text-3xl font-black text-ghibli-moss">
          €{discountedPrice.toFixed(2)}
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="line-through text-ghibli-earth/50">€{basePrice.toFixed(2)}</span>
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
              -{discount}%
            </span>
          </div>
        )}
      </div>
      
      {/* Quantidade */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="w-8 h-8 p-0 border-ghibli-sand"
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-16 text-center font-semibold text-ghibli-earth">
          {quantity} {quantity === 1 ? productName.toLowerCase() : `${productName.toLowerCase()}s`}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onQuantityChange(quantity + 1)}
          className="w-8 h-8 p-0 border-ghibli-sand"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Total e poupança */}
      {quantity > 1 && (
        <div className="text-xs text-ghibli-earth/70 space-y-1">
          <div>Total: <span className="font-bold text-ghibli-moss">€{totalPrice.toFixed(2)}</span></div>
          {savings > 0 && (
            <div className="text-green-600 font-medium">
              Poupa €{savings.toFixed(2)}!
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 