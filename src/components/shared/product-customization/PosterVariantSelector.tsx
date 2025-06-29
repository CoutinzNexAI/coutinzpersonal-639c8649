// Componente seletor de variantes específico para Posters
// Gerencia seleção de tamanhos e orientações de posters 

import React from 'react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface PosterVariantSelectorProps {
  product: PrintifyProductMapping;
  selectedVariantId: number | null;
  onVariantChange: (variantId: number) => void;
  label?: string;
  emoji?: string;
  customSingleVariantText?: string;
  customSingleVariantSubtext?: string;
  className?: string;
}

export const PosterVariantSelector: React.FC<PosterVariantSelectorProps> = ({
  product,
  selectedVariantId,
  onVariantChange,
  label = "Tamanho do Poster",
  emoji = "📋",
  customSingleVariantText,
  customSingleVariantSubtext,
  className = ""
}) => {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  // Se há apenas uma variante, mostra informação estática
  if (product.variants.length === 1) {
    const singleVariant = product.variants[0];
    return (
      <div className={`bg-ghibli-cream/30 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ghibli-earth flex items-center gap-2">
            <span>{emoji}</span>
            {label}
          </span>
          <span className="text-xs text-ghibli-earth/70 bg-ghibli-moss/10 px-2 py-1 rounded-full">
            Único tamanho
          </span>
        </div>
        
        <div className="bg-white/80 rounded-lg p-3 border border-ghibli-sand/30">
          <div className="text-sm font-semibold text-ghibli-moss">
            {singleVariant.title}
          </div>
          {customSingleVariantText && (
            <div className="text-xs text-ghibli-earth/70 mt-1">
              {customSingleVariantText}
            </div>
          )}
          {customSingleVariantSubtext && (
            <div className="text-xs text-ghibli-earth/60 mt-1">
              {customSingleVariantSubtext}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Se há múltiplas variantes, mostra seletor
  return (
    <div className={`bg-ghibli-cream/30 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-ghibli-earth flex items-center gap-2">
          <span>{emoji}</span>
          {label}
        </span>
        <span className="text-xs text-ghibli-earth/70 bg-ghibli-moss/10 px-2 py-1 rounded-full">
          {product.variants.length} opções
        </span>
      </div>
      
      <select
        value={selectedVariantId?.toString() || ''}
        onChange={(e) => onVariantChange(parseInt(e.target.value))}
        className="w-full h-12 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium px-4 focus:border-ghibli-moss transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ghibli-moss/20"
      >
        {!selectedVariantId && (
          <option value="" disabled>
            Selecione o tamanho...
          </option>
        )}
        {product.variants.map((variant) => (
          <option key={variant.id} value={variant.id.toString()}>
            {variant.title}
          </option>
        ))}
      </select>
      
      {customSingleVariantSubtext && (
        <div className="text-xs text-ghibli-earth/60 mt-2 text-center">
          {customSingleVariantSubtext}
        </div>
      )}
    </div>
  );
};

export default PosterVariantSelector; 