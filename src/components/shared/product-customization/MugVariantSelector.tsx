import React from 'react';
import ProductVariantSelector from '@/components/shared/ProductVariantSelector';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface MugVariantSelectorProps {
  product: PrintifyProductMapping;
  selectedVariantId: number | null;
  onVariantChange: (variantId: number) => void;
}

// Componente seletor de variantes específico para Canecas
// Gerencia seleção de tipos, cores e tamanhos de canecas
const MugVariantSelector: React.FC<MugVariantSelectorProps> = ({
  product,
  selectedVariantId,
  onVariantChange
}) => {
  return (
    <ProductVariantSelector
      product={product}
      selectedVariantId={selectedVariantId}
      onVariantChange={onVariantChange}
      label="Tamanho da Caneca"
      emoji="☕"
      customSingleVariantText={product.id === 'heart_mug' ? 'Tamanho 330ml' : undefined}
      customSingleVariantSubtext={product.id === 'heart_mug' ? 'Formato especial de coração' : undefined}
    />
  );
};

export default MugVariantSelector; 