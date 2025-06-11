// src/lib/gelato/gelatoProducts.ts - FLUXO DRAFT ORDER DEFINITIVO

export interface GelatoProduct {
  id: string; // O slug/ID interno do PicTuz (ex: 'canvas_200x200_square_slim_unframed')
  name: string; // Nome amigável do produto
  productUid: string; // O ID do produto na Gelato (para a Order API)
  mockupInitialPath: string; // O teu mockup base para mostrar antes da Gelato gerar
  price: number; // Preço base do produto
  category: 'canvas' | 'apparel' | 'poster' | 'mug' | 'phone-case';

  // Propriedades para GERAÇÃO DO FICHEIRO DE IMPRESSÃO (O Teu Backend)
  printFileBleed: number; // em mm (requisito Gelato, mas não aplicamos no ficheiro)
  printFileResolution: number; // em DPI (padrão Gelato, para saber resolução ideal)
  gelatoPrintDimensionsMm: { width: number; height: number }; // Dimensões REAIS da área de impressão Gelato em MM
  gelatoPrintOffsetsMm: { x: number; y: number }; // Deslocamentos reais da área de impressão Gelato em MM

  // Propriedades para Ajuste Manual (para Canecas/Capas)
  supportsManualAdjustment: boolean; // TRUE para Canecas/Capas, FALSE para Canvas/Poster/T-shirt
  adjustmentLimits?: { minZoom: number; maxZoom: number; allowRotation?: boolean; };
}

export const PIC_TUZ_GELATO_PRODUCT_MAP: Record<string, GelatoProduct> = {
  // CANVAS 20x20cm (Dados confirmados pelo Diogo)
  'canvas_200x200_square_slim_unframed': {
    id: 'canvas_200x200_square_slim_unframed',
    name: 'Quadro Canvas (20x20cm, Sem Moldura Slim)',
    productUid: 'canvas_200x200-mm-8x8-inch_canvas_wood-fsc-slim_4-0_ver',
    mockupInitialPath: '/assets/mockups/canvas/canvas_20x20_unframed_blank_front.png',
    price: 30.00,
    category: 'canvas',
    printFileBleed: 4, // mm
    printFileResolution: 300, // DPI
    gelatoPrintDimensionsMm: { width: 200, height: 200 }, // Dimensões reais de impressão Gelato em MM
    gelatoPrintOffsetsMm: { x: 49, y: 49 }, // Offsets reais de impressão Gelato em MM
    supportsManualAdjustment: false, // Sem ajuste manual para este canvas
  },

  // CANVAS 30x30cm 
  'canvas_300x300_square_slim_unframed': {
    id: 'canvas_300x300_square_slim_unframed',
    name: 'Quadro Canvas (30x30cm, Sem Moldura Slim)',
    productUid: 'canvas_300x300-mm-12x12-inch_canvas_wood-fsc-slim_4-0_ver', // A confirmar UID real
    mockupInitialPath: '/assets/mockups/canvas/canvas_30x30_unframed_blank_front.png',
    price: 45.00,
    category: 'canvas',
    printFileBleed: 4,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 300, height: 300 },
    gelatoPrintOffsetsMm: { x: 49, y: 49 },
    supportsManualAdjustment: false,
  },

  // T-SHIRT UNISSEXO M
  'tshirt_unisex_m_white_crewneck': {
    id: 'tshirt_unisex_m_white_crewneck',
    name: 'T-shirt Unissexo (M, Branco, Gola Redonda)',
    productUid: 'apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_m_gco_white_gpr_4-4',
    mockupInitialPath: '/assets/mockups/tshirt/tshirt_m_white_blank_front.png',
    price: 25.00,
    category: 'apparel',
    printFileBleed: 4,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 270, height: 320 }, // Área do peito M
    gelatoPrintOffsetsMm: { x: 45, y: 45 }, // Offset do centro do peito
    supportsManualAdjustment: false, // T-shirt usa posicionamento automático
  },

  // POSTER A4
  'poster_a4_premium_paper': {
    id: 'poster_a4_premium_paper',
    name: 'Poster A4 (Papel Premium)',
    productUid: 'poster_a4_210x297-mm_premium-paper_0-0', // A confirmar UID real
    mockupInitialPath: '/assets/mockups/poster/poster_a4_blank.png',
    price: 15.00,
    category: 'poster',
    printFileBleed: 4,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 210, height: 297 }, // A4 padrão
    gelatoPrintOffsetsMm: { x: 0, y: 0 }, // Full bleed poster
    supportsManualAdjustment: false,
  },

  // CANECA CERÂMICA (COM AJUSTE MANUAL)
  'mug_ceramic_white_330ml': {
    id: 'mug_ceramic_white_330ml',
    name: 'Caneca Cerâmica (Branca, 330ml)',
    productUid: 'mug_ceramic_white_330ml_product_uid', // A confirmar UID real
    mockupInitialPath: '/assets/mockups/mug/mug_white_blank.png',
    price: 18.00,
    category: 'mug',
    printFileBleed: 2,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 200, height: 120 }, // Área lateral da caneca
    gelatoPrintOffsetsMm: { x: 10, y: 10 }, // Margem da área de impressão
    supportsManualAdjustment: true, // CANECA PRECISA DE AJUSTE MANUAL
    adjustmentLimits: {
      minZoom: 0.8,
      maxZoom: 2.5,
      allowRotation: false // Sem rotação para canecas
    }
  },

  // CAPA IPHONE 15 (COM AJUSTE MANUAL)
  'phone_case_iphone_15_clear': {
    id: 'phone_case_iphone_15_clear',
    name: 'Capa iPhone 15 (Transparente)',
    productUid: 'phone_case_iphone_15_clear_product_uid', // A confirmar UID real
    mockupInitialPath: '/assets/mockups/phone-case/iphone_15_case_blank.png',
    price: 22.00,
    category: 'phone-case',
    printFileBleed: 2,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 70, height: 140 }, // Área traseira iPhone 15
    gelatoPrintOffsetsMm: { x: 5, y: 15 }, // Margem das bordas/camera
    supportsManualAdjustment: true, // CAPA PRECISA DE AJUSTE MANUAL
    adjustmentLimits: {
      minZoom: 0.5,
      maxZoom: 3.0,
      allowRotation: true // Permitir rotação para capas
    }
  }
};

// Função utilitária para obter produto por ID
export const getGelatoProduct = (productId: string): GelatoProduct | null => {
  return PIC_TUZ_GELATO_PRODUCT_MAP[productId] || null;
};

// Função para obter produtos por categoria
export const getGelatoProductsByCategory = (category: GelatoProduct['category']): Record<string, GelatoProduct> => {
  return Object.entries(PIC_TUZ_GELATO_PRODUCT_MAP)
    .filter(([_, product]) => product.category === category)
    .reduce((acc, [key, product]) => ({ ...acc, [key]: product }), {});
};

// Função para obter todos os IDs de produtos disponíveis
export const getAvailableProductIds = (): string[] => {
  return Object.keys(PIC_TUZ_GELATO_PRODUCT_MAP);
};

// Constantes úteis para o fluxo Draft Order
export const GELATO_CONSTANTS = {
  DEFAULT_BLEED_MM: 4,
  DEFAULT_RESOLUTION_DPI: 300,
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILE_SIZE_MB: 50,
  DRAFT_ORDER_PREFIX: 'PICTUZ-DRAFT',
  ORDER_PREFIX: 'PICTUZ-ORDER'
} as const; 