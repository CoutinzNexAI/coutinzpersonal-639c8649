export interface DiscountCode {
  code: string;
  discountPercent: number;
  minOrderValue?: number;
  maxDiscount?: number;
  isActive: boolean;
  description: string;
}

export const DISCOUNT_CODES: Record<string, DiscountCode> = {
  'TESTE1': {
    code: 'TESTE1',
    discountPercent: 90,
    isActive: true,
    description: '90% de desconto para teste'
  }
};

export const validateDiscountCode = (code: string, orderValue: number): { valid: boolean; discount?: DiscountCode; error?: string } => {
  const upperCode = code.toUpperCase();
  const discount = DISCOUNT_CODES[upperCode];
  
  if (!discount) {
    return { valid: false, error: 'Código inválido' };
  }
  
  if (!discount.isActive) {
    return { valid: false, error: 'Código expirado' };
  }
  
  if (discount.minOrderValue && orderValue < discount.minOrderValue) {
    return { valid: false, error: `Valor mínimo €${discount.minOrderValue.toFixed(2)}` };
  }
  
  return { valid: true, discount };
};

export const calculateDiscountAmount = (discount: DiscountCode, orderValue: number): number => {
  const discountAmount = (orderValue * discount.discountPercent) / 100;
  
  if (discount.maxDiscount) {
    return Math.min(discountAmount, discount.maxDiscount);
  }
  
  return discountAmount;
}; 