import React, { useState, useEffect } from 'react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface FramedCanvasVariantSelectorProps {
  product: PrintifyProductMapping;
  selectedVariantId: number | null;
  onVariantSelect: (variantId: number) => void;
}

export default function FramedCanvasVariantSelector({
  product,
  selectedVariantId,
  onVariantSelect
}: FramedCanvasVariantSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Extrair tamanhos únicos e cores únicas das variantes
  const sizes = Array.from(new Set(
    product.variants?.map(v => v.title.split(' / ')[0]) || []
  ));
  
  const colors = Array.from(new Set(
    product.variants?.map(v => v.title.split(' / ')[1]) || []
  ));

  // Encontrar variante baseada na combinação tamanho + cor
  useEffect(() => {
    if (selectedSize && selectedColor) {
      const targetVariant = product.variants?.find(v => 
        v.title.includes(selectedSize) && v.title.includes(selectedColor)
      );
      if (targetVariant) {
        onVariantSelect(targetVariant.id);
      }
    }
  }, [selectedSize, selectedColor, product.variants, onVariantSelect]);

  // Sincronizar com variante selecionada externamente
  useEffect(() => {
    if (selectedVariantId) {
      const variant = product.variants?.find(v => v.id === selectedVariantId);
      if (variant) {
        const parts = variant.title.split(' / ');
        setSelectedSize(parts[0] || '');
        setSelectedColor(parts[1] || '');
      }
    }
  }, [selectedVariantId, product.variants]);

  return (
    <div className="space-y-4">
      {/* Seletor de Tamanho */}
      <div>
        <label className="block text-sm font-medium text-ghibli-earth mb-2">
          📐 Tamanho
        </label>
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          className="w-full p-3 border border-ghibli-sand/30 rounded-lg bg-white text-ghibli-earth focus:outline-none focus:ring-2 focus:ring-ghibli-moss/20 focus:border-ghibli-moss"
        >
          <option value="">Selecione o tamanho</option>
          {sizes.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Seletor de Cor da Moldura */}
      <div>
        <label className="block text-sm font-medium text-ghibli-earth mb-2">
          🎨 Cor da Moldura
        </label>
        <select
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          className="w-full p-3 border border-ghibli-sand/30 rounded-lg bg-white text-ghibli-earth focus:outline-none focus:ring-2 focus:ring-ghibli-moss/20 focus:border-ghibli-moss"
          disabled={!selectedSize}
        >
          <option value="">Selecione a cor</option>
          {colors.map(color => (
            <option key={color} value={color}>
              {color === 'Black' ? 'Preto' : 
               color === 'White' ? 'Branco' : 
               color === 'Espresso' ? 'Castanho' : color}
            </option>
          ))}
        </select>
      </div>

      {/* Preço da variante selecionada */}
      {selectedVariantId && (
        <div className="mt-4 p-3 bg-ghibli-cream/30 rounded-lg">
          <div className="text-sm text-ghibli-earth/70">
            Preço: <span className="font-semibold text-ghibli-earth">
              €{(() => {
                const variant = product.variants?.find(v => v.id === selectedVariantId);
                const basePrice = 40.00; // Canvas com moldura
                const adjustment = variant?.priceAdjustment || 0;
                return (basePrice + adjustment).toFixed(2);
              })()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 