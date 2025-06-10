// src/lib/gelato/gelatoProducts.ts

export interface GelatoProduct {
  name: string;
  productUid: string;
  gelatoTemplateId?: string;
  printArea: string;
  mockupPath: string;
  mockupDimensions: { width: number; height: number };
  printAreaCoords: { x: number; y: number; width: number; height: number };
  printFileBleed: number; // em mm
  printFileResolution: number; // em DPI
  price?: number; // Preço em EUR (opcional, pode vir da Gelato API)
  category: 'canvas' | 'apparel' | 'poster' | 'mug' | 'phone-case';
  // CAMPOS CRUCIAIS PARA GELATO:
  gelatoPrintDimensionsMm: { width: number; height: number }; // Dimensões reais de impressão Gelato em MM
  gelatoPrintOffsetsMm: { x: number; y: number }; // Deslocamentos reais de impressão Gelato em MM
  // NOVO: Suporte para ajuste manual da imagem pelo utilizador
  supportsManualAdjustment?: boolean;
  adjustmentLimits?: {
    minZoom: number;
    maxZoom: number;
    allowRotation?: boolean;
  };
}

export const PIC_TUZ_GELATO_PRODUCT_MAP: Record<string, GelatoProduct> = {
  // CANVAS PRODUCTS - DADOS CONFIRMADOS PELO DIOGO!
  'canvas_200x200_square_slim_unframed': {
    name: 'Quadro Canvas (20x20cm, Sem Moldura Slim)',
    productUid: 'canvas_200x200-mm-8x8-inch_canvas_wood-fsc-slim_4-0_ver', // UID confirmado da Gelato
    gelatoTemplateId: 'c676339d-76bc-49f0-932b-bbdb7cb10f79', // Template ID confirmado
    printArea: 'default', // Para full print em canvas, 'default' é o tipo comum para a Order API
    mockupPath: '/assets/mockups/canvas/canvas_20x20_unframed_blank_front.png', // Mockup do Diogo
    mockupDimensions: { width: 400, height: 400 }, // Medidas confirmadas do mockup
    printAreaCoords: { x: 25, y: 25, width: 355, height: 346 }, // Área da imagem no mockup confirmada
    printFileBleed: 4, // mm (padrão Gelato)
    printFileResolution: 300, // DPI (padrão Gelato)
    category: 'canvas',
    // DIMENSÕES REAIS GELATO CONFIRMADAS:
    gelatoPrintDimensionsMm: { width: 200, height: 200 }, // Dimensões reais de impressão Gelato em MM
    gelatoPrintOffsetsMm: { x: 49, y: 49 }, // Offsets reais de impressão Gelato em MM confirmados
    price: 30.00, // Preço base para o cliente
    supportsManualAdjustment: false // Sem ajuste manual para este canvas
  },

  'canvas_300x400_portrait_slim_wood_frame': {
    name: 'Quadro Canvas (30x40cm, Moldura Fina de Madeira)',
    productUid: 'canvas_300x400-mm-12x16-inch_canvas_wood-fsc-slim_4-0_ver', // A confirmar UID real
    gelatoTemplateId: '',
    printArea: 'full_canvas_print',
    mockupPath: '/assets/mockups/canvas/canvas_30x40_mockup_blank_front.png',
    mockupDimensions: { width: 600, height: 800 },
    printAreaCoords: { x: 50, y: 50, width: 500, height: 700 },
    printFileBleed: 4,
    printFileResolution: 300,
    category: 'canvas',
    // DIMENSÕES REAIS GELATO (confirmar estes valores no Gelato Dashboard):
    gelatoPrintDimensionsMm: { width: 300, height: 400 }, // Canvas 30x40cm
    gelatoPrintOffsetsMm: { x: 0, y: 0 }, // Full bleed canvas, sem offset
    supportsManualAdjustment: false // Canvas não precisa de ajuste manual
  },

  // T-SHIRT PRODUCTS
  'tshirt_unisex_s_white_crewneck': {
    name: 'T-shirt Unissexo (S, Branco, Gola Redonda)',
    productUid: 'apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_s_gco_white_gpr_4-4',
    gelatoTemplateId: '',
    printArea: 'chest-center',
    mockupPath: '/assets/mockups/tshirt/tshirt_s_white_mockup_front.png',
    mockupDimensions: { width: 800, height: 1200 },
    printAreaCoords: { x: 250, y: 350, width: 300, height: 250 },
    printFileBleed: 4,
    printFileResolution: 300,
    category: 'apparel',
    // DIMENSÕES REAIS GELATO (confirmar no Dashboard):
    gelatoPrintDimensionsMm: { width: 250, height: 300 }, // Área do peito S
    gelatoPrintOffsetsMm: { x: 50, y: 50 }, // Offset do centro do peito
    supportsManualAdjustment: false // T-shirt usa posicionamento automático
  },

  'tshirt_unisex_m_white_crewneck': {
    name: 'T-shirt Unissexo (M, Branco, Gola Redonda)',
    productUid: 'apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_m_gco_white_gpr_4-4',
    gelatoTemplateId: '',
    printArea: 'chest-center',
    mockupPath: '/assets/mockups/tshirt/tshirt_m_white_mockup_front.png',
    mockupDimensions: { width: 800, height: 1200 },
    printAreaCoords: { x: 240, y: 340, width: 320, height: 270 },
    printFileBleed: 4,
    printFileResolution: 300,
    category: 'apparel',
    // DIMENSÕES REAIS GELATO (confirmar no Dashboard):
    gelatoPrintDimensionsMm: { width: 270, height: 320 }, // Área do peito M
    gelatoPrintOffsetsMm: { x: 45, y: 45 }, // Offset do centro do peito
    supportsManualAdjustment: false // T-shirt usa posicionamento automático
  },

  // POSTER PRODUCTS
  'poster_a4_premium_paper': {
    name: 'Poster A4 (Papel Premium)',
    productUid: 'poster_a4_210x297-mm_premium-paper_0-0', // A confirmar UID real
    gelatoTemplateId: '',
    printArea: 'full_poster',
    mockupPath: '/assets/mockups/poster/poster_a4_mockup_blank.png',
    mockupDimensions: { width: 600, height: 848 },
    printAreaCoords: { x: 0, y: 0, width: 600, height: 848 },
    printFileBleed: 4,
    printFileResolution: 300,
    category: 'poster',
    // DIMENSÕES REAIS GELATO:
    gelatoPrintDimensionsMm: { width: 210, height: 297 }, // A4 padrão
    gelatoPrintOffsetsMm: { x: 0, y: 0 }, // Full bleed poster
    supportsManualAdjustment: false // Poster usa posicionamento automático
  },

  // MUG PRODUCTS - SUPORTA AJUSTE MANUAL
  'mug_ceramic_white_330ml': {
    name: 'Caneca Cerâmica (Branca, 330ml)',
    productUid: 'mug_ceramic_white_330ml_product_uid', // A confirmar UID real
    gelatoTemplateId: '',
    printArea: 'mug_print_area',
    mockupPath: '/assets/mockups/mug/mug_white_mockup_blank.png',
    mockupDimensions: { width: 800, height: 600 },
    printAreaCoords: { x: 200, y: 150, width: 400, height: 300 },
    printFileBleed: 2,
    printFileResolution: 300,
    category: 'mug',
    // DIMENSÕES REAIS GELATO (confirmar no Dashboard):
    gelatoPrintDimensionsMm: { width: 200, height: 120 }, // Área lateral da caneca
    gelatoPrintOffsetsMm: { x: 10, y: 10 }, // Margem da área de impressão
    supportsManualAdjustment: true, // CANECA PRECISA DE AJUSTE MANUAL
    adjustmentLimits: {
      minZoom: 0.8,
      maxZoom: 2.5,
      allowRotation: false // Sem rotação para canecas
    }
  },

  // PHONE CASE PRODUCTS - SUPORTA AJUSTE MANUAL
  'phone_case_iphone_15_clear': {
    name: 'Capa iPhone 15 (Transparente)',
    productUid: 'phone_case_iphone_15_clear_product_uid', // A confirmar UID real
    gelatoTemplateId: '',
    printArea: 'back_print',
    mockupPath: '/assets/mockups/phone-case/iphone_15_case_mockup_blank.png',
    mockupDimensions: { width: 400, height: 800 },
    printAreaCoords: { x: 50, y: 100, width: 300, height: 600 },
    printFileBleed: 2,
    printFileResolution: 300,
    category: 'phone-case',
    // DIMENSÕES REAIS GELATO (confirmar no Dashboard):
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

// Constantes úteis
export const GELATO_CONSTANTS = {
  DEFAULT_BLEED_MM: 4,
  DEFAULT_RESOLUTION_DPI: 300,
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILE_SIZE_MB: 50
} as const; 