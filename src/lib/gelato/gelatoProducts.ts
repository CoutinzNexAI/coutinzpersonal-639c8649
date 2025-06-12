// src/lib/gelato/gelatoProducts.ts - FLUXO DRAFT ORDER DEFINITIVO

export interface GelatoProduct {
  id: string; // O slug/ID interno do PicTuz (ex: 'canvas_200x200_square_slim_unframed')
  name: string; // Nome amigável do produto
  productUid: string; // O ID do produto na Gelato (para a Order API)
  mockupInitialPath: string; // O teu mockup base para mostrar antes da Gelato gerar
  price: number; // Preço base do produto
  category: 'canvas' | 'apparel' | 'poster' | 'mug' | 'phone-case';

  // PROPRIEDADES NECESSÁRIAS PARA A API products:create-from-template (DO FLUXO DRAFT ORDER)
  gelatoTemplateId?: string; // ID do template Gelato (obrigatório para produtos que usam generate-mockup)
  templateVariantId?: string; // ID da variante do template (obrigatório para produtos que usam generate-mockup)
  printArea?: string; // Nome da camada no template (obrigatório para produtos que usam generate-mockup)

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
    // CAMPOS NECESSÁRIOS PARA A API generate-mockup.ts
    gelatoTemplateId: '1788fb1e-20ee-4ff0-b956-d624f0d5653b', // ID do template Gelato
    templateVariantId: 'ee116b49-394a-4e2a-96cb-9b17521c31ed', // ID da variante do template
    printArea: 'layer1', // Nome da camada no template
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
    // CAMPOS PARA MOCKUP GENERATION (se necessário)
    gelatoTemplateId: '686a0861-5ac4-4510-82bd-f2611ab7c9e0', // Mesmo template, variante diferente
    templateVariantId: '2b1c42ff-226d-5f9e-bgg9-e982b7b69229', // ID da variante 30x30 (exemplo)
    printArea: 'design_principal',
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
    // CAMPOS PARA MOCKUP GENERATION T-SHIRT
    gelatoTemplateId: 'f97b1972-6bd5-4621-93cf-e2722ba8c9f1', // Template T-shirt (exemplo)
    templateVariantId: '3c2d53ff-337e-6a0f-cii0-f093c8c70330', // Variante M branco (exemplo)
    printArea: 'design_front',
    printFileBleed: 4,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 270, height: 320 }, // Área do peito M
    gelatoPrintOffsetsMm: { x: 45, y: 45 }, // Offset do centro do peito
    supportsManualAdjustment: false, // T-shirt usa posicionamento automático
  },

  // POSTER A4
  'fine_arts_poster_250x250_simplified': {
    id: 'fine_arts_poster_250x250_simplified',
    name: 'Poster Fine Art (25x25cm)',
    productUid: 'fine_arts_poster_geo_simplified_product_12-0_ver_250x250-mm-10x10-inch_200-gsm-80lb-enhanced-uncoated',
    mockupInitialPath: '/assets/mockups/poster/poster_25x25_blank_front.png', // Adapta para o teu mockup local
    price: 25.00, // Preço de exemplo, adapta
    category: 'poster',
    gelatoTemplateId: '2e876b51-c44b-4a66-8be5-20cae7f41fa8', // O NOVO template ID para este Poster
    templateVariantId: '2e876b51-c44b-4a66-8be5-20cae7f41fa8', // <-- ***MUITO IMPORTANTE: SUBSTITUIR ESTE ID***
    printArea: 'layer1', // Confirma que a camada no template do poster é 'layer1'
    printFileBleed: 3, // Bleed típico para posters, confirma na doc ou template
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 250, height: 250 },
    gelatoPrintOffsetsMm: { x: 0, y: 0 }, // Posters geralmente não têm offset
    supportsManualAdjustment: false, // Posters geralmente não precisam de ajuste manual
  },

  // CANECA CERÂMICA (COM AJUSTE MANUAL) - SEM MOCKUP GELATO POR ENQUANTO
  'mug_ceramic_white_330ml': {
    id: 'mug_ceramic_white_330ml',
    name: 'Caneca Cerâmica (Branca, 330ml)',
    productUid: 'mug_ceramic_white_330ml_product_uid', // A confirmar UID real
    mockupInitialPath: '/assets/mockups/mug/mug_white_blank.png',
    price: 18.00,
    category: 'mug',
    // SEM gelatoTemplateId/templateVariantId/printArea - usa apenas ajuste manual local
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

  // CAPA IPHONE 15 (COM AJUSTE MANUAL) - SEM MOCKUP GELATO POR ENQUANTO
  'phone_case_iphone_15_clear': {
    id: 'phone_case_iphone_15_clear',
    name: 'Capa iPhone 15 (Transparente)',
    productUid: 'phone_case_iphone_15_clear_product_uid', // A confirmar UID real
    mockupInitialPath: '/assets/mockups/phone-case/iphone_15_case_blank.png',
    price: 22.00,
    category: 'phone-case',
    // SEM gelatoTemplateId/templateVariantId/printArea - usa apenas ajuste manual local
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