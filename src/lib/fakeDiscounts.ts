// 🚀 SISTEMA DE DESCONTOS FAKE DINÂMICO - CORRIGIDO PARA CALCULAR POR VARIANTE
// O objetivo é mostrar preço "original" mais alto riscado e preço real como desconto
// AGORA CALCULA DINAMICAMENTE baseado no preço real de cada tamanho/variante

export interface FakeDiscountConfig {
  discountPercent: number;  // Percentagem de desconto fake (40%, 20%, etc.)
  badge: string;           // Badge a mostrar (ex: "40% OFF")
  hasDiscount: boolean;    // Se tem desconto fake ativo
}

export interface FakeDiscountResult {
  realPrice: number;        // Preço que o cliente paga (calculado dinamicamente)
  fakePrice: number;        // Preço "original" inflacionado (calculado dinamicamente)
  discountPercent: number;  // Percentagem de desconto fake
  badge: string;           // Badge a mostrar (ex: "40% OFF")
  hasDiscount: boolean;    // Se tem desconto fake ativo
}

// 🎯 CONFIGURAÇÃO DE DESCONTOS POR PRODUTO (sem preços fixos)
export const FAKE_DISCOUNT_CONFIG: Record<string, FakeDiscountConfig> = {
  // 40% OFF - Canvas, Capa Telemóvel, Posters
  'custom_canvas': {
    discountPercent: 40,
    badge: '🔥 40% OFF',
    hasDiscount: true
  },
  'custom_phone_case': {
    discountPercent: 33, // Mantém os 33% que já estava
    badge: '🔥 33% OFF',
    hasDiscount: true
  },
  'poster_vertical_semi_glossy': {
    discountPercent: 40,
    badge: '🔥 40% OFF',
    hasDiscount: true
  },
  'poster_horizontal_semi_glossy': {
    discountPercent: 40,
    badge: '🔥 40% OFF',
    hasDiscount: true
  },
  // IDs adicionais para páginas shop
  'poster_vertical': {
    discountPercent: 40,
    badge: '🔥 40% OFF',
    hasDiscount: true
  },
  'poster_horizontal': {
    discountPercent: 40,
    badge: '🔥 40% OFF',
    hasDiscount: true
  },

  // 20% OFF - Canecas, Caderno, Tote Bag
  'heart_mug': {
    discountPercent: 20,
    badge: '💡 20% OFF',
    hasDiscount: true
  },
  'ceramic_mug': {
    discountPercent: 20,
    badge: '💡 20% OFF',
    hasDiscount: true
  },
  'spiral_journal': {
    discountPercent: 20,
    badge: '💡 20% OFF',
    hasDiscount: true
  },
  'tote_bag': {
    discountPercent: 20,
    badge: '💡 20% OFF',
    hasDiscount: true
  }
};

// 🚀 NOVA FUNÇÃO PRINCIPAL: Calcula desconto fake dinamicamente baseado no preço real
export const getFakeDiscountInfo = (productId: string, realPrice: number): FakeDiscountResult | null => {
  const config = FAKE_DISCOUNT_CONFIG[productId];
  if (!config || !config.hasDiscount) return null;

  // Calcular preço fake inflacionado baseado na percentagem
  // Se desconto é 40%, o preço real representa 60% do preço fake
  // Então: preço_fake = preço_real / (1 - desconto/100)
  const discountMultiplier = 1 - (config.discountPercent / 100);
  const calculatedFakePrice = realPrice / discountMultiplier;
  
  // ✅ ARREDONDAR PARA CIMA (ceiling) para número inteiro mais limpo
  const fakePrice = Math.ceil(calculatedFakePrice);

  return {
    realPrice: realPrice,
    fakePrice: fakePrice, // Agora é sempre um número inteiro arredondado para cima
    discountPercent: config.discountPercent,
    badge: config.badge,
    hasDiscount: true
  };
};

// Função para verificar se um produto tem desconto fake
export const hasFakeDiscount = (productId: string): boolean => {
  const config = FAKE_DISCOUNT_CONFIG[productId];
  return config?.hasDiscount || false;
};

// 🔄 FUNÇÃO RETROCOMPATÍVEL: Mantém a interface antiga mas usa preço fornecido
export const getRealPrice = (productId: string, originalPrice: number): number => {
  // Esta função agora simplesmente retorna o preço original
  // O desconto fake é calculado dinamicamente na UI
  return originalPrice;
};

// 🔄 FUNÇÃO RETROCOMPATÍVEL: Calcula preço fake baseado no real
export const getFakePrice = (productId: string, realPrice: number): number => {
  const discountInfo = getFakeDiscountInfo(productId, realPrice);
  return discountInfo?.fakePrice || realPrice;
};

// Função para calcular poupança dinâmica
export const calculateSavings = (productId: string, realPrice: number): number => {
  const discountInfo = getFakeDiscountInfo(productId, realPrice);
  if (!discountInfo?.hasDiscount) return 0;
  
  return discountInfo.fakePrice - discountInfo.realPrice;
}; 