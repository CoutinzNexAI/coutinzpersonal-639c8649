import React from 'react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface NotebookVariantSelectorProps {
  product: PrintifyProductMapping;
  selectedVariantId: number | null;
  onVariantSelect: (variantId: number) => void;
}

export default function NotebookVariantSelector({
  product,
  selectedVariantId,
  onVariantSelect
}: NotebookVariantSelectorProps) {
  // Mapear as variantes para as opções de tipo
  const typeOptions = [
    {
      label: 'Branco',
      variantId: product.variants?.find(v => v.title.includes('Blank'))?.id || null,
      description: 'Páginas em branco'
    },
    {
      label: 'Com Linhas',
      variantId: product.variants?.find(v => v.title.includes('Lined'))?.id || null,
      description: 'Páginas com linhas'
    }
  ].filter(option => option.variantId !== null);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-ghibli-earth mb-2">
        📓 Tipo de Caderno
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        {typeOptions.map((option) => (
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
    </div>
  );
} 