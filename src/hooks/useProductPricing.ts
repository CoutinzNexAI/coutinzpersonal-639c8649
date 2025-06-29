import { useMemo } from 'react';

export interface DiscountTier {
  min: number;
  discount: number;
  label: string;
  emoji: string;
}

export interface ProductPricingOptions {
  basePrice: number;
  quantity: number;
  discountTiers?: DiscountTier[];
}

export interface ProductPricingResult {
  discount: number;
  discountedPrice: number;
  totalPrice: number;
  savings: number;
  calculateDiscount: (qty: number) => number;
}

/**
 * Hook genérico para cálculo de preços e descontos
 * Usado em todos os produtos (canecas, posters, canvas, etc.)
 */
export const useProductPricing = ({
  basePrice,
  quantity,
  discountTiers = [
    { min: 2, discount: 10, label: 'produtos', emoji: '💡' },
    { min: 3, discount: 15, label: 'produtos', emoji: '🔥' }
  ]
}: ProductPricingOptions): ProductPricingResult => {
  
  const calculateDiscount = useMemo(() => {
    return (qty: number) => {
      const applicableTier = discountTiers
        .slice()
        .reverse()
        .find(tier => qty >= tier.min);
      return applicableTier?.discount || 0;
    };
  }, [discountTiers]);

  const discount = calculateDiscount(quantity);
  const discountedPrice = basePrice * (1 - discount / 100);
  const totalPrice = discountedPrice * quantity;
  const savings = (basePrice * quantity) - totalPrice;

  return {
    discount,
    discountedPrice,
    totalPrice,
    savings,
    calculateDiscount
  };
}; 