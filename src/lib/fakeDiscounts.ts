// Sistema de descontos fake - preços inflacionados com desconto aplicado
// O objetivo é mostrar preço "original" mais alto riscado e preço real como desconto

export interface FakeDiscountProduct {
  realPrice: number;        // Preço que o cliente paga
  fakePrice: number;        // Preço "original" inflacionado 
  discountPercent: number;  // Percentagem de desconto fake
  badge: string;           // Badge a mostrar (ex: "40% OFF")
  hasDiscount: boolean;    // Se tem desconto fake ativo
}

// Configuração de produtos com desconto fake
export const FAKE_DISCOUNT_PRODUCTS: Record<string, FakeDiscountProduct> = {
  // 40% OFF - Canvas, Capa Telemóvel, Posters
  'custom_canvas': {
    realPrice: 24.95,
    fakePrice: 41.58,  // 24.95 / 0.6 = 41.58
    discountPercent: 40,
    badge: '🔥 40% OFF',
    hasDiscount: true
  },
  'custom_phone_case': {
    realPrice: 19.95,
    fakePrice: 33.25,  // 19.95 / 0.6 = 33.25
    discountPercent: 40,
    badge: '🔥 40% OFF',
    hasDiscount: true
  },
  'poster_vertical_semi_glossy': {
    realPrice: 17.95,
    fakePrice: 29.92,  // 17.95 / 0.6 = 29.92
    discountPercent: 40,
    badge: '🔥 40% OFF',
    hasDiscount: true
  },
  'poster_horizontal_semi_glossy': {
    realPrice: 17.95,
    fakePrice: 29.92,  // 17.95 / 0.6 = 29.92
    discountPercent: 40,
    badge: '🔥 40% OFF',
    hasDiscount: true
  },
  // IDs adicionais para páginas shop
  'poster_vertical': {
    realPrice: 17.95,
    fakePrice: 29.92,  // 17.95 / 0.6 = 29.92
    discountPercent: 40,
    badge: '🔥 40% OFF',
    hasDiscount: true
  },
  'poster_horizontal': {
    realPrice: 17.95,
    fakePrice: 29.92,  // 17.95 / 0.6 = 29.92
    discountPercent: 40,
    badge: '🔥 40% OFF',
    hasDiscount: true
  },

  // 20% OFF - Canecas, Caderno, Tote Bag
  'heart_mug': {
    realPrice: 24.26,
    fakePrice: 30.33,  // 24.26 / 0.8 = 30.33
    discountPercent: 20,
    badge: '💡 20% OFF',
    hasDiscount: true
  },
  'ceramic_mug': {
    realPrice: 18.95,
    fakePrice: 23.69,  // 18.95 / 0.8 = 23.69
    discountPercent: 20,
    badge: '💡 20% OFF',
    hasDiscount: true
  },
  'spiral_journal': {
    realPrice: 17.95,
    fakePrice: 22.44,  // 17.95 / 0.8 = 22.44
    discountPercent: 20,
    badge: '💡 20% OFF',
    hasDiscount: true
  },
  'tote_bag': {
    realPrice: 19.95,
    fakePrice: 24.94,  // 19.95 / 0.8 = 24.94
    discountPercent: 20,
    badge: '💡 20% OFF',
    hasDiscount: true
  }
};

// Função para obter informação de desconto fake de um produto
export const getFakeDiscountInfo = (productId: string): FakeDiscountProduct | null => {
  return FAKE_DISCOUNT_PRODUCTS[productId] || null;
};

// Função para verificar se um produto tem desconto fake
export const hasFakeDiscount = (productId: string): boolean => {
  const discountInfo = getFakeDiscountInfo(productId);
  return discountInfo?.hasDiscount || false;
};

// Função para obter preço real (que o cliente paga)
export const getRealPrice = (productId: string, fallbackPrice: number): number => {
  const discountInfo = getFakeDiscountInfo(productId);
  return discountInfo?.realPrice || fallbackPrice;
};

// Função para obter preço fake (inflacionado)
export const getFakePrice = (productId: string, fallbackPrice: number): number => {
  const discountInfo = getFakeDiscountInfo(productId);
  return discountInfo?.fakePrice || fallbackPrice;
};

// Função para calcular poupança
export const calculateSavings = (productId: string): number => {
  const discountInfo = getFakeDiscountInfo(productId);
  if (!discountInfo?.hasDiscount) return 0;
  
  return discountInfo.fakePrice - discountInfo.realPrice;
}; 