import React from 'react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface PelucheVariantSelectorProps {
  product: PrintifyProductMapping;
  selectedVariantId: number | null;
  onVariantSelect: (variantId: number) => void;
}

export default function PelucheVariantSelector({
  product,
  selectedVariantId,
  onVariantSelect
}: PelucheVariantSelectorProps) {
  // Mapear as variantes para as opções de animais
  const animalOptions = [
    {
      label: 'Coelho',
      variantId: 77635,
      emoji: '🐰',
      description: 'Peluche coelho'
    },
    {
      label: 'Elefante', 
      variantId: 77636,
      emoji: '🐘',
      description: 'Peluche elefante'
    },
    {
      label: 'Ovelha',
      variantId: 77637,
      emoji: '🐑', 
      description: 'Peluche ovelha'
    },
    {
      label: 'Urso',
      variantId: 77638,
      emoji: '🐻',
      description: 'Peluche urso'
    }
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-ghibli-earth mb-2">
        🧸 Escolha o Animal
      </label>
      
      <div className="grid grid-cols-2 gap-2">
        {animalOptions.map((option) => (
          <button
            key={option.variantId}
            onClick={() => onVariantSelect(option.variantId)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
              selectedVariantId === option.variantId
                ? 'border-ghibli-moss bg-ghibli-moss/10 text-ghibli-moss font-semibold'
                : 'border-ghibli-sand/30 bg-white hover:border-ghibli-moss/50 text-ghibli-earth'
            }`}
          >
            <div className="text-xl mb-1">{option.emoji}</div>
            <div className="text-sm font-medium">{option.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
} 