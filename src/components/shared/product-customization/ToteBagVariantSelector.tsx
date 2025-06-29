import React from 'react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface ToteBagVariantSelectorProps {
  product: PrintifyProductMapping;
  selectedVariantId: number | null;
  onVariantSelect: (variantId: number) => void;
}

export default function ToteBagVariantSelector({
  product,
  selectedVariantId,
  onVariantSelect
}: ToteBagVariantSelectorProps) {
  // Mapear as variantes para as opções de cor
  const colorOptions = [
    {
      label: 'Bege',
      variantId: product.variants?.find(v => v.title.includes('Natural'))?.id || null,
      description: 'Natural'
    },
    {
      label: 'Branco',
      variantId: product.variants?.find(v => v.title.includes('Snowwhite'))?.id || null,
      description: 'Snowwhite'
    }
  ].filter(option => option.variantId !== null);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-ghibli-earth mb-2">
        🛍️ Cor do Saco
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        {colorOptions.map((option) => (
          <button
            key={option.variantId}
            onClick={() => option.variantId && onVariantSelect(option.variantId)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-center ${
              selectedVariantId === option.variantId
                ? 'border-ghibli-moss bg-ghibli-moss/10 text-ghibli-moss font-semibold'
                : 'border-ghibli-sand/30 bg-white hover:border-ghibli-moss/50 text-ghibli-earth'
            }`}
          >
            <div className="text-lg font-medium">{option.label}</div>
            <div className="text-xs text-ghibli-earth/60 mt-1">{option.description}</div>
          </button>
        ))}
      </div>

      {/* Preço do produto */}
      <div className="mt-4 p-3 bg-ghibli-cream/30 rounded-lg">
        <div className="text-sm text-ghibli-earth/70">
          Preço: <span className="font-semibold text-ghibli-earth">
            €{(product.basePrice || 25).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
} 