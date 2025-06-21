// src/lib/printify/printifyProducts.ts - FLUXO PRINTIFY DEFINITIVO

export interface PrintifyProductMapping {
  id: string; // O slug/ID interno do PicTuz (ex: 'canvas_200x200_square_slim_unframed')
  name: string; // Nome amigável do produto
  mockupInitialPath: string; // O teu mockup base para mostrar antes da Printify gerar
  price?: number; // Preço base do produto (opcional para produtos com variantes)
  basePrice?: number; // Preço base em euros (para produtos com variantes)
  category: 'canvas' | 'apparel' | 'poster' | 'mug' | 'phone-case' | 'tecnologia' | 'bags' | 'stationery' | 'office' | 'roupa';

  // PROPRIEDADES NECESSÁRIAS PARA A API PRINTIFY
  printifyBlueprintId?: number; // ID do blueprint Printify
  printifyPrintProviderId?: number; // ID do print provider Printify
  printifyVariantIds?: number[]; // IDs das variantes do produto
  printArea?: string; // Nome da área de impressão (ex: 'front', 'back')

  // VARIANTES PARA PRODUTOS COM MÚLTIPLAS OPÇÕES (ex: capas de telemóvel)
  variants?: {
    id: number;
    title: string;
    placeholderWidth: number;
    placeholderHeight: number;
    isGiftPackaging: boolean;
    priceAdjustment?: number;
  }[];

  // Propriedades para GERAÇÃO DO FICHEIRO DE IMPRESSÃO (O Teu Backend)
  printFileBleed: number; // em mm (requisito Printify, mas não aplicamos no ficheiro)
  printFileResolution: number; // em DPI (padrão Printify, para saber resolução ideal)
  gelatoPrintDimensionsMm: { width: number; height: number }; // Dimensões REAIS da área de impressão em MM
  gelatoPrintOffsetsMm: { x: number; y: number }; // Deslocamentos reais da área de impressão em MM

  // Propriedades para Ajuste Manual (para Canecas/Capas)
  supportsManualAdjustment: boolean; // TRUE para Canecas/Capas, FALSE para Canvas/Poster/T-shirt
  adjustmentLimits?: { minZoom: number; maxZoom: number; allowRotation?: boolean; };

  // Áreas de Impressão (Para produtos complexos como sweats)
  printAreasConfig?: Array<{
    position: string; // 'front', 'back', etc.
    allowsUserImage: boolean;
    staticImageId?: string; // ID Printify para imagens estáticas (logos)
    defaultX: number;
    defaultY: number;
    defaultScale: number;
    defaultAngle: number;
    fitMethod?: 'fit' | 'slice' | 'contain'; // Opcional para permitir uso padrão da Printify
    allowsDynamicText?: boolean; // Para texto dinâmico
    dynamicTextOptions?: Array<{
      text: string;
      id: string;
      positionX: number;
      positionY: number;
    }>;
  }>;

  // Campos legados do Gelato (mantidos para compatibilidade)
  productUid?: string;
  gelatoTemplateId?: string;
  templateVariantId?: string;
}

export const PIC_TUZ_PRINTIFY_PRODUCT_MAP: Record<string, PrintifyProductMapping> = {
  // CANVAS 20x20cm (Dados confirmados pelo Diogo)
  'canvas_200x200_square_slim_unframed': {
    id: 'canvas_200x200_square_slim_unframed',
    name: 'Quadro Canvas (20x20cm, Sem Moldura Slim)',
    productUid: 'canvas_200x200-mm-8x8-inch_canvas_wood-fsc-slim_4-0_ver',
    mockupInitialPath: '/assets/mockups/canvas/canvas_20x20_unframed_blank_front.png',
    price: 30.00,
    category: 'canvas',
    // NOVOS IDs REAIS DA PRINTIFY
    printifyBlueprintId: 937, // Blueprint ID para o Canvas Matte Stretched 0.75"
    printifyPrintProviderId: 105, // Print Provider ID para Jondo
    printifyVariantIds: [82238], // Variant ID para o 14" x 14" / 0.75''
    printArea: 'front', // Posição padrão para Canvas
    // CAMPOS NECESSÁRIOS PARA A API generate-mockup.ts (migração)
    gelatoTemplateId: '1788fb1e-20ee-4ff0-b956-d624f0d5653b', // ID do template Gelato
    templateVariantId: 'ee116b49-394a-4e2a-96cb-9b17521c31ed', // ID da variante do template
    printFileBleed: 4, // mm
    printFileResolution: 300, // DPI
    gelatoPrintDimensionsMm: { width: 200, height: 200 }, // Dimensões reais de impressão em MM
    gelatoPrintOffsetsMm: { x: 49, y: 49 }, // Offsets reais de impressão em MM
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
    printArea: 'front',
    printFileBleed: 4,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 300, height: 300 },
    gelatoPrintOffsetsMm: { x: 49, y: 49 },
    supportsManualAdjustment: false,
  },

  // T-SHIRT UNISSEXO S
    'tshirt_unisex_s_white_crewneck_premium': {
    id: 'tshirt_unisex_s_white_crewneck_premium',
    name: 'T-shirt Unissexo (S, Branco, Gola Redonda Premium)',
    productUid: 'apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_prm_gsi_s_gco_white_gpr_4-0_bella-and-canvas_3001',
    mockupInitialPath: '/assets/mockups/tshirt/tshirt_s_white_blank_front.png', // Adapta ao teu mockup
    price: 28.00,
    category: 'apparel',
    gelatoTemplateId: '65304b9f-3bbe-4e47-ba23-e5ed267a18f5', // Template ID da t-shirt
    templateVariantId: '2878ef11-ecc6-4e9f-9e68-b8b17c1b3727', // <--- ATUALIZA ESTE ID!
    printArea: 'front', // <--- ATUALIZADO para Printify
    printFileBleed: 4,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 256, height: 256 }, // Dimensões do mockup (da camada joaomadalena.png)
    gelatoPrintOffsetsMm: { x: 0, y: 0 }, // Se necessário, ajustar offset
    supportsManualAdjustment: false,
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
    printArea: 'front', // Confirma que a camada no template do poster é 'layer1'
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

  // CAPA DE TELEMÓVEL PERSONALIZADA (COM AJUSTE MANUAL E MÚLTIPLAS VARIANTES)
  'custom_phone_case': {
    id: 'custom_phone_case',
    name: 'Capa de Telemóvel Personalizada',
    mockupInitialPath: '/assets/mockups/phone-case/capa.png', // Imagem base no frontend
    basePrice: 25.00, // Preço de venda em euros
    category: 'tecnologia',
    printifyBlueprintId: 370,
    printifyPrintProviderId: 23,
    variants: [
      // iPhones (13 ao 16)
      { id: 75178, title: 'iPhone 13', placeholderWidth: 914, placeholderHeight: 1795, isGiftPackaging: false },
      { id: 75179, title: 'iPhone 13 Mini', placeholderWidth: 828, placeholderHeight: 1616, isGiftPackaging: false },
      { id: 75180, title: 'iPhone 13 Pro', placeholderWidth: 915, placeholderHeight: 1795, isGiftPackaging: false },
      { id: 75181, title: 'iPhone 13 Pro Max', placeholderWidth: 992, placeholderHeight: 1950, isGiftPackaging: false },
      { id: 101223, title: 'iPhone 14', placeholderWidth: 869, placeholderHeight: 1749, isGiftPackaging: false },
      { id: 101225, title: 'iPhone 14 Plus', placeholderWidth: 945, placeholderHeight: 1913, isGiftPackaging: false },
      { id: 101224, title: 'iPhone 14 Pro', placeholderWidth: 862, placeholderHeight: 1748, isGiftPackaging: false },
      { id: 101226, title: 'iPhone 14 Pro Max', placeholderWidth: 944, placeholderHeight: 1914, isGiftPackaging: false },
      { id: 105310, title: 'iPhone 15', placeholderWidth: 918, placeholderHeight: 1792, isGiftPackaging: false },
      { id: 105312, title: 'iPhone 15 Plus', placeholderWidth: 990, placeholderHeight: 1948, isGiftPackaging: false },
      { id: 105311, title: 'iPhone 15 Pro', placeholderWidth: 906, placeholderHeight: 1780, isGiftPackaging: false },
      { id: 105313, title: 'iPhone 15 Pro Max', placeholderWidth: 978, placeholderHeight: 1937, isGiftPackaging: false },
      { id: 112623, title: 'iPhone 16', placeholderWidth: 918, placeholderHeight: 1790, isGiftPackaging: false },
      { id: 112624, title: 'iPhone 16 Plus', placeholderWidth: 991, placeholderHeight: 1949, isGiftPackaging: false },
      { id: 112621, title: 'iPhone 16 Pro', placeholderWidth: 916, placeholderHeight: 1816, isGiftPackaging: false },
      { id: 112622, title: 'iPhone 16 Pro Max', placeholderWidth: 989, placeholderHeight: 1974, isGiftPackaging: false },

      // Samsung Galaxy (S22 ao S25)
      { id: 80936, title: 'Samsung Galaxy S22', placeholderWidth: 817, placeholderHeight: 1705, isGiftPackaging: false },
      { id: 80937, title: 'Samsung Galaxy S22 Plus', placeholderWidth: 875, placeholderHeight: 1849, isGiftPackaging: false },
      { id: 80938, title: 'Samsung Galaxy S22 Ultra', placeholderWidth: 914, placeholderHeight: 1913, isGiftPackaging: false },
      { id: 101227, title: 'Samsung Galaxy S23', placeholderWidth: 809, placeholderHeight: 1701, isGiftPackaging: false },
      { id: 101228, title: 'Samsung Galaxy S23 Plus', placeholderWidth: 872, placeholderHeight: 1836, isGiftPackaging: false },
      { id: 101229, title: 'Samsung Galaxy S23 Ultra', placeholderWidth: 863, placeholderHeight: 1929, isGiftPackaging: false },
      // IDs e dimensões para S24 (usando S23 como placeholder, ajustar se houver dados reais na Printify)
      { id: 101234, title: 'Samsung Galaxy S24', placeholderWidth: 809, placeholderHeight: 1701, isGiftPackaging: false },
      { id: 101235, title: 'Samsung Galaxy S24 Plus', placeholderWidth: 872, placeholderHeight: 1836, isGiftPackaging: false },
      { id: 101236, title: 'Samsung Galaxy S24 Ultra', placeholderWidth: 863, placeholderHeight: 1929, isGiftPackaging: false },
      { id: 117868, title: 'Samsung Galaxy S25', placeholderWidth: 876, placeholderHeight: 1780, isGiftPackaging: false },
      { id: 117869, title: 'Samsung Galaxy S25 Plus', placeholderWidth: 939, placeholderHeight: 1915, isGiftPackaging: false },
      { id: 117870, title: 'Samsung Galaxy S25 Ultra', placeholderWidth: 961, placeholderHeight: 1967, isGiftPackaging: false },
    ],
    // As propriedades abaixo devem estar SEMPRE presentes no custom_phone_case
    printFileBleed: 2,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 70, height: 140 }, // Mantido como sua referência, não usado diretamente pela Printify
    gelatoPrintOffsetsMm: { x: 5, y: 15 }, // Mantido como sua referência
    supportsManualAdjustment: true,
    adjustmentLimits: { minZoom: 0.5, maxZoom: 3.0, allowRotation: true },
    printAreasConfig: [
      {
        position: 'front', // Posição de impressão para capas
        allowsUserImage: true,
        defaultX: 0.5, // Centrado horizontalmente
        defaultY: 0.5, // Centrado verticalmente no placeholder da Printify
        defaultScale: 1.0, // **Placeholder no código.** Será calculado dinamicamente no frontend.
        defaultAngle: 0, // Sem rotação inicial
        fitMethod: 'slice', // Garante que a imagem preencha a área, cortando o excedente
      }
    ],
  },

  // 1. CANECA CERÂMICA (EU)
  'ceramic_mug': {
    id: 'ceramic_mug',
    name: 'Caneca Cerâmica Personalizada',
    mockupInitialPath: '/assets/mockups/mug/caneca.svg',
    basePrice: 25.00, // Euros
    category: 'mug',
    printifyBlueprintId: 441,
    printifyPrintProviderId: 30, // OPT OnDemand
    variants: [
      { id: 62327, title: '11oz', placeholderWidth: 2717, placeholderHeight: 1146, isGiftPackaging: false },
      { id: 62328, title: '15oz', placeholderWidth: 2811, placeholderHeight: 1276, isGiftPackaging: false },
    ],
    printFileBleed: 2, // Ajustar conforme a Printify, 2mm é um bom default
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 80, height: 95 }, // Valores de referência (pode ser ajustado)
    gelatoPrintOffsetsMm: { x: 0, y: 0 },
    supportsManualAdjustment: false, // Sem ajustes manuais
    printAreasConfig: [{
      position: 'front', // Posição de impressão
      allowsUserImage: true,
      defaultX: 0.5,
      defaultY: 0.5,
      defaultScale: 1.0, // Será dinâmico (slice)
      defaultAngle: 0,
      fitMethod: 'slice', // Preenchimento total
    }],
  },

  // 2. CANECA EM FORMATO DE CORAÇÃO
  'heart_mug': {
    id: 'heart_mug',
    name: 'Caneca Coração Personalizada',
    mockupInitialPath: '/assets/mockups/mug/canecacoracao.svg',
    basePrice: 30.00, // Euros
    category: 'mug',
    printifyBlueprintId: 896,
    printifyPrintProviderId: 30, // OPT OnDemand
    variants: [
      { id: 77224, title: '11oz / White', placeholderWidth: 2362, placeholderHeight: 945, isGiftPackaging: false },
    ],
    printFileBleed: 2, // Ajustar conforme a Printify
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 80, height: 95 }, // Valores de referência
    gelatoPrintOffsetsMm: { x: 0, y: 0 },
    supportsManualAdjustment: false, // Sem ajustes manuais
    printAreasConfig: [{
      position: 'front',
      allowsUserImage: true,
      defaultX: 0.5,
      defaultY: 0.5,
      defaultScale: 1.0, // Será dinâmico (slice)
      defaultAngle: 0,
      fitMethod: 'slice',
    }],
  },

  // 3. SACO TOTE BAG
  'tote_bag': {
    id: 'tote_bag',
    name: 'Saco Tote Bag Personalizado',
    mockupInitialPath: '/assets/mockups/bag/saco.svg',
    basePrice: 25.00, // Euros
    category: 'bags', // Nova categoria
    printifyBlueprintId: 467,
    printifyPrintProviderId: 30, // OPT OnDemand
    variants: [
      { id: 64091, title: 'Natural / One size', placeholderWidth: 3000, placeholderHeight: 3600, isGiftPackaging: false },
      { id: 64177, title: 'Snowwhite / One size', placeholderWidth: 3000, placeholderHeight: 3600, isGiftPackaging: false },
    ],
    printFileBleed: 2, // Ajustar conforme a Printify
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 300, height: 360 }, // Valores de referência
    gelatoPrintOffsetsMm: { x: 0, y: 0 },
    supportsManualAdjustment: false, // Sem ajustes manuais
    printAreasConfig: [{
      position: 'front', // Apenas 'front' para o utilizador
      allowsUserImage: true,
      defaultX: 0.5,
      defaultY: 0.5,
      defaultScale: 1.0, // Será dinâmico (slice)
      defaultAngle: 0,
      fitMethod: 'slice',
    }],
  },

  // 4. CADERNO SPIRAL JOURNAL
  'spiral_journal': {
    id: 'spiral_journal',
    name: 'Caderno Personalizado',
    mockupInitialPath: '/assets/mockups/journal/spiral_journal_blank.svg',
    basePrice: 20.00, // Euros
    category: 'stationery', // Nova categoria
    printifyBlueprintId: 475,
    printifyPrintProviderId: 30, // OPT OnDemand
    variants: [
      { id: 65482, title: 'Blank / One Size', placeholderWidth: 1512, placeholderHeight: 2409, isGiftPackaging: false },
      { id: 65484, title: 'Lined / One Size', placeholderWidth: 1512, placeholderHeight: 2409, isGiftPackaging: false },
    ], // Apenas Blank e Lined
    printFileBleed: 2, // Ajustar conforme a Printify
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 150, height: 240 }, // Valores de referência
    gelatoPrintOffsetsMm: { x: 0, y: 0 },
    supportsManualAdjustment: false, // Sem ajustes manuais
    printAreasConfig: [{
      position: 'front',
      allowsUserImage: true,
      defaultX: 0.5,
      defaultY: 0.5,
      defaultScale: 1.0, // Será dinâmico (slice)
      defaultAngle: 0,
      fitMethod: 'slice',
    }],
  },

  // 5. MOUSE PAD
  'mouse_pad': {
    id: 'mouse_pad',
    name: 'Mouse Pad Personalizado',
    mockupInitialPath: '/assets/mockups/mousepad/mouse_pad_blank.svg',
    basePrice: 30.00, // Euros
    category: 'office', // Nova categoria
    printifyBlueprintId: 442,
    printifyPrintProviderId: 30, // OPT OnDemand
    variants: [
      { id: 62329, title: '9" × 7.5"', placeholderWidth: 2894, placeholderHeight: 2421, isGiftPackaging: false },
    ],
    printFileBleed: 2, // Ajustar conforme a Printify
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 228, height: 190 }, // Valores de referência (9"x7.5" aprox)
    gelatoPrintOffsetsMm: { x: 0, y: 0 },
    supportsManualAdjustment: false, // Sem ajustes manuais
    printAreasConfig: [{
      position: 'front',
      allowsUserImage: true,
      defaultX: 0.5,
      defaultY: 0.5,
      defaultScale: 1.0, // Será dinâmico (slice)
      defaultAngle: 0,
      fitMethod: 'slice',
    }],
  },

  // 6. SWEAT DE CRIANÇA PERSONALIZADA (COM LOGO NA FRENTE E ARTE+FRASE NAS COSTAS)
  'custom_youth_hoodie': {
    id: 'custom_youth_hoodie',
    name: 'Sweat de Criança Personalizada',
    mockupInitialPath: 'https://i.imgur.com/3lGKmJy.png', // Mockup base temporário (PNG)
    basePrice: 40.00, // Euros
    category: 'roupa',
    printifyBlueprintId: 314, // Youth Heavy Blend Hooded Sweatshirt
    printifyPrintProviderId: 87, // Print provider específico
    variants: [
      // White - Todos os tamanhos (IDs corrigidos baseados no log da Printify)
      { id: 43879, title: 'White / S', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43880, title: 'White / M', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43881, title: 'White / L', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43882, title: 'White / XL', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      
      // Red - Todos os tamanhos
      { id: 43930, title: 'Red / S', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43933, title: 'Red / M', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43934, title: 'Red / L', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43935, title: 'Red / XL', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      
      // Royal - Todos os tamanhos
      { id: 94233, title: 'Royal / XS', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 94234, title: 'Royal / S', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 94235, title: 'Royal / M', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 94236, title: 'Royal / L', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 94237, title: 'Royal / XL', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      
      // Sport Grey - Todos os tamanhos
      { id: 43895, title: 'Sport Grey / S', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43896, title: 'Sport Grey / M', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43897, title: 'Sport Grey / L', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43898, title: 'Sport Grey / XL', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      
      // White - Todos os tamanhos (removido duplicação)
      
      // Black - Todos os tamanhos
      { id: 43911, title: 'Black / S', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43914, title: 'Black / M', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43915, title: 'Black / L', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 43916, title: 'Black / XL', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      
      // Forest Green - Todos os tamanhos
      { id: 64296, title: 'Forest Green / XS', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 64299, title: 'Forest Green / S', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 64300, title: 'Forest Green / M', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 64301, title: 'Forest Green / L', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 64302, title: 'Forest Green / XL', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      
      // Kelly Green - Todos os tamanhos
      { id: 64304, title: 'Kelly Green / S', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 64305, title: 'Kelly Green / M', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
      { id: 64306, title: 'Kelly Green / L', placeholderWidth: 2550, placeholderHeight: 3300, isGiftPackaging: false },
    ],
    printFileBleed: 2,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 250, height: 300 }, // Valores de referência
    gelatoPrintOffsetsMm: { x: 0, y: 0 },
    supportsManualAdjustment: false, // Posicionamento fixo
    adjustmentLimits: { minZoom: 1.0, maxZoom: 1.0, allowRotation: false },
    printAreasConfig: [
      // Área 1: LOGO (Frente)
      {
        position: 'front',
        allowsUserImage: false,
        staticImageId: '684d920a45ec86ab347594c5', // ID Printify do logo
        defaultX: 0.5,
        defaultY: 0.25,
        defaultScale: 0.6,
        defaultAngle: 0,
      },
      // Área 2: IMAGEM DO CLIENTE E FRASE (Costas)
      {
        position: 'back',
        allowsUserImage: true,
        defaultX: 0.5, // Para imagem do cliente
        defaultY: 0.5, // Para imagem do cliente
        defaultScale: 1.0, // Para imagem do cliente
        defaultAngle: 0,
        fitMethod: 'slice', // Preenchimento total
        allowsDynamicText: true, // Suporte para texto dinâmico
        dynamicTextOptions: [
          {
            text: 'Sem frase',
            id: '68548b05a7a3520a5d3534c0', // ID da imagem transparente
            positionX: 0.5,
            positionY: 0.85,
          },
          {
            text: 'PicTuz - since 2025',
            id: '68548af2cc947707f0ee650f', // ID da imagem desta frase
            positionX: 0.5,
            positionY: 0.85,
          },
          {
            text: 'Criado com IA',
            id: '68548af3cc947707f0ee651a', // ID da imagem desta frase
            positionX: 0.5,
            positionY: 0.85,
          },
          {
            text: 'Arte Personalizada',
            id: '68548af4cc947707f0ee652b', // ID da imagem desta frase
            positionX: 0.5,
            positionY: 0.85,
          },
          {
            text: 'Feito em Portugal',
            id: '68548af5cc947707f0ee653c', // ID da imagem desta frase
            positionX: 0.5,
            positionY: 0.85,
          },
        ],
      },
    ],
  },
};

// Função utilitária para obter produto por ID
export const getPrintifyProduct = (productId: string): PrintifyProductMapping | null => {
  return PIC_TUZ_PRINTIFY_PRODUCT_MAP[productId] || null;
};

// Função para obter produtos por categoria
export const getPrintifyProductsByCategory = (category: PrintifyProductMapping['category']): Record<string, PrintifyProductMapping> => {
  return Object.entries(PIC_TUZ_PRINTIFY_PRODUCT_MAP)
    .filter(([_, product]) => product.category === category)
    .reduce((acc, [key, product]) => ({ ...acc, [key]: product }), {});
};

// Função para obter todos os IDs de produtos disponíveis
export const getAvailablePrintifyProductIds = (): string[] => {
  return Object.keys(PIC_TUZ_PRINTIFY_PRODUCT_MAP);
};

// Constantes úteis para o fluxo Printify
export const GELATO_CONSTANTS = {
  DEFAULT_BLEED_MM: 4,
  DEFAULT_RESOLUTION_DPI: 300,
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILE_SIZE_MB: 50,
  DRAFT_ORDER_PREFIX: 'PICTUZ-DRAFT',
  ORDER_PREFIX: 'PICTUZ-ORDER'
} as const; 