import React from 'react';
import { ProductArtStatus } from './ProductArtStatus';
import { ProductVariantSelector } from './ProductVariantSelector';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface ProductMobileInfoProps {
  // Dados necessários
  selectedImageUrl: string;
  product: PrintifyProductMapping;
  selectedVariantId: number | null;
  
  // Callbacks
  onOpenGallery: () => void;
  onVariantChange: (variantId: number) => void;
  
  // Configurações opcionais
  variantLabel?: string;
  variantEmoji?: string;
  className?: string;
}

export const ProductMobileInfo: React.FC<ProductMobileInfoProps> = ({
  selectedImageUrl,
  product,
  selectedVariantId,
  onOpenGallery,
  onVariantChange,
  variantLabel = 'Tamanho do Produto',
  variantEmoji = '📏',
  className = ''
}) => {
  return (
    <div className={className}>
      {/* Status Arte Mobile */}
      <ProductArtStatus 
        selectedImageUrl={selectedImageUrl}
        onOpenGallery={onOpenGallery}
        className="mb-6"
      />

      {/* Seletor de Variantes Mobile */}
      <ProductVariantSelector
        product={product}
        selectedVariantId={selectedVariantId}
        onVariantChange={onVariantChange}
        label={variantLabel}
        emoji={variantEmoji}
        className="mb-4"
      />
    </div>
  );
};

export default ProductMobileInfo; 