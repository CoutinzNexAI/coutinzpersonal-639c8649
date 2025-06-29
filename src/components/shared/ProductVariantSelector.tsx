import React from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface ProductVariantSelectorProps {
  product: PrintifyProductMapping;
  selectedVariantId: number | null;
  onVariantChange: (variantId: number) => void;
  label?: string;
  emoji?: string;
  className?: string;
}

export const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
  product,
  selectedVariantId,
  onVariantChange,
  label = 'Tamanho do Produto',
  emoji = '📏',
  className = ''
}) => {
  // Se há apenas 1 variante, mostra apenas informação (sem dropdown)
  if (!product.variants || product.variants.length <= 1) {
    const singleVariant = product.variants?.[0];
    const isHeartMug = product.id === 'heart_mug';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.75 }}
        className={className}
      >
        <div className="relative p-4 bg-ghibli-cream/30 rounded-xl border border-ghibli-sand/40">
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full bg-ghibli-moss"></div>
            <span className="text-ghibli-earth font-semibold">
              {isHeartMug ? '💝 Tamanho: 330 ml' : `${emoji} ${singleVariant?.title || 'Tamanho único'}`}
            </span>
          </div>
          <p className="text-center text-xs text-ghibli-earth/70 mt-1">
            {isHeartMug ? 'Formato especial de coração' : 'Produto com tamanho único'}
          </p>
        </div>
      </motion.div>
    );
  }

  // Se há múltiplas variantes, mostra dropdown
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.75 }}
      className={className}
    >
      <Card className="bg-white/90 backdrop-blur-sm border-ghibli-sand/40">
        <CardContent className="p-4">
          <div className="relative">
            <Select
              onValueChange={(value) => onVariantChange(parseInt(value))}
              value={selectedVariantId?.toString() || ''}
            >
              <SelectTrigger className="w-full h-12 sm:h-14 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium hover:border-ghibli-moss/60 focus:border-ghibli-moss transition-all duration-200 shadow-sm hover:shadow-md pl-3 sm:pl-4 pr-8 sm:pr-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 rounded-full bg-ghibli-moss shrink-0"></div>
                  <SelectValue placeholder="Escolha o tamanho">
                    <span className="truncate">
                      {product.variants?.find(v => v.id === selectedVariantId)?.title || 'Escolha o tamanho'}
                    </span>
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white text-ghibli-earth border-ghibli-sand max-h-60 shadow-xl">
                {product.variants?.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id.toString()} className="hover:bg-ghibli-cream/50">
                    {variant.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <label className="absolute -top-2 left-2 sm:left-3 px-2 bg-white text-xs font-bold text-ghibli-moss">
              {emoji} {label}
            </label>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductVariantSelector; 