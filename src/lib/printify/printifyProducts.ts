// src/lib/printify/printifyProducts.ts - FLUXO PRINTIFY DEFINITIVO

import { unstable_cache } from 'next/cache';
import { printifyFetch } from './printifyApi';

export interface DefaultDesignConfig {
  scale: number; // O scale correto para este produto específico (ex: 1.05 para canvas com fill)
  x: number; // Posição X padrão (0.5 = centro)
  y: number; // Posição Y padrão (0.5 = centro) 
  angle: number; // Rotação padrão (0 = sem rotação)
  print_on_side?: 'mirror' | 'regular' | 'off'; // Para produtos que suportam print details (canvas)
}

export interface PrintifyProductMapping {
  id: string; // O slug/ID interno do PicTuz (ex: 'canvas_200x200_square_slim_unframed')
  name: string; // Nome amigável do produto
  mockupInitialPath: string; // O teu mockup base para mostrar antes da Printify gerar
  price?: number; // Preço base do produto (opcional para produtos com variantes)
  basePrice?: number; // Preço base em euros (para produtos com variantes)
  category: 'canvas' | 'apparel' | 'poster' | 'mug' | 'phone-case' | 'tecnologia' | 'bags' | 'stationery' | 'office' | 'escritorio';

  // ✅ NOVA PROPRIEDADE: A "receita" de design para este produto
  defaultDesign: DefaultDesignConfig;

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
    price?: number; // Preço em cêntimos para variantes específicas
  }[];

  // Propriedades para GERAÇÃO DO FICHEIRO DE IMPRESSÃO (O Teu Backend) - Opcional para produtos Printify
  printFileBleed?: number; // em mm (requisito Printify, mas não aplicamos no ficheiro)
  printFileResolution?: number; // em DPI (padrão Printify, para saber resolução ideal)
  gelatoPrintDimensionsMm?: { width: number; height: number }; // Dimensões REAIS da área de impressão em MM
  gelatoPrintOffsetsMm?: { x: number; y: number }; // Deslocamentos reais da área de impressão em MM

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

  // Opções de Print Details (para Canvas)
  allowsPrintDetails?: boolean;
  printDetailsOptions?: Array<{
    label: string;
    value: string;
  }>;

  // Campos legados do Gelato (mantidos para compatibilidade)
  productUid?: string;
  gelatoTemplateId?: string;
  templateVariantId?: string;
}

export const PIC_TUZ_PRINTIFY_PRODUCT_MAP: Record<string, PrintifyProductMapping> = {
  // CANVAS SEM BORDA (Printify Real)
  'custom_canvas': {
    id: 'custom_canvas',
    name: 'Canvas',
    mockupInitialPath: '/mockupproduto/canva.png',
    basePrice: 20.00,
    category: 'canvas',
    // ✅ CONFIGURAÇÃO DE DESIGN: Canvas com fill e borda espelhada por padrão
    defaultDesign: {
      scale: 1.05, // Um pouco de zoom para garantir que cobre tudo (efeito fill)
      x: 0.5, // Centro
      y: 0.5, // Centro
      angle: 0, // Sem rotação
      print_on_side: 'mirror' // A regra especial para canvas - borda espelhada
    },
    printifyBlueprintId: 1159, // Canvas Stretched 0.75"
    printifyPrintProviderId: 105, // Jondo
    variants: [
      { id: 101418, title: '6" x 6" (15cm x 15cm)', placeholderWidth: 1800, placeholderHeight: 1800, isGiftPackaging: false, priceAdjustment: 4.95 }, // €24,95
      { id: 91656, title: '10″ x 10″ (25cm x 25cm)', placeholderWidth: 3000, placeholderHeight: 3000, isGiftPackaging: false, priceAdjustment: 12.95 }, // €32,95
      { id: 91657, title: '12″ x 12″ (30cm x 30cm)', placeholderWidth: 3600, placeholderHeight: 3600, isGiftPackaging: false, priceAdjustment: 16.95 }, // €36,95
      { id: 91658, title: '14" x 14" (36cm x 36cm)', placeholderWidth: 4200, placeholderHeight: 4200, isGiftPackaging: false, priceAdjustment: 18.95 }, // €38,95
      { id: 91659, title: '16″ x 16″ (41cm x 41cm)', placeholderWidth: 4800, placeholderHeight: 4800, isGiftPackaging: false, priceAdjustment: 25.95 }, // €45,95
      { id: 91660, title: '20″ x 20″ (51cm x 51cm)', placeholderWidth: 6000, placeholderHeight: 6000, isGiftPackaging: false, priceAdjustment: 34.95 }, // €54,95
      { id: 91661, title: '24″ x 24″ (61cm x 61cm)', placeholderWidth: 7200, placeholderHeight: 7200, isGiftPackaging: false, priceAdjustment: 44.95 }, // €64,95
    ],
    printAreasConfig: [{
      position: 'front',
      allowsUserImage: true,
      defaultX: 0.5,
      defaultY: 0.5,
      defaultScale: 1.0,
      defaultAngle: 0,
      fitMethod: 'slice',
    }],
    allowsPrintDetails: true,
    printDetailsOptions: [
      { label: 'Borda Regular', value: 'regular' },
      { label: 'Borda Espelhada', value: 'mirror' },
      { label: 'Sem Borda', value: 'off' },
    ],
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
    // ✅ CONFIGURAÇÃO DE DESIGN: T-shirt com imagem menor no peito
    defaultDesign: {
      scale: 0.4, // Numa t-shirt, a imagem é mais pequena
      x: 0.5, // Centro
      y: 0.4, // Um pouco mais para cima no peito
      angle: 0, // Sem rotação
    },
    gelatoTemplateId: '65304b9f-3bbe-4e47-ba23-e5ed267a18f5', // Template ID da t-shirt
    templateVariantId: '2878ef11-ecc6-4e9f-9e68-b8b17c1b3727', // <--- ATUALIZA ESTE ID!
    printArea: 'front', // <--- ATUALIZADO para Printify
    printFileBleed: 4,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 256, height: 256 }, // Dimensões do mockup (da camada joaomadalena.png)
    gelatoPrintOffsetsMm: { x: 0, y: 0 }, // Se necessário, ajustar offset
    supportsManualAdjustment: false,
  },

  // CAPA DE TELEMÓVEL PERSONALIZADA (COM AJUSTE MANUAL E MÚLTIPLAS VARIANTES)
  'custom_phone_case': {
    id: 'custom_phone_case',
    name: 'Capa de Telemóvel',
    mockupInitialPath: '/mockupproduto/telemovel.png', // Imagem base no frontend
    basePrice: 19.95, // Preço de venda em euros ✅ ATUALIZADO
    category: 'tecnologia',
    // ✅ CONFIGURAÇÃO DE DESIGN: Capa com ajuste manual, scale dinâmico
    defaultDesign: {
      scale: 1.0, // Scale será calculado dinamicamente
      x: 0.5, // Centro
      y: 0.5, // Centro
      angle: 0, // Sem rotação inicial
    },
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
    name: 'Caneca',
    mockupInitialPath: '/mockupproduto/canecapersonalizada.png',
    basePrice: 18.95, // Euros - 330ml base ✅ ATUALIZADO
    category: 'mug',
    // ✅ CONFIGURAÇÃO DE DESIGN: Caneca com fill completo + ajustes ligeiros
    defaultDesign: {
      scale: 1.1, // Escala para cobrir completamente (lógica Math.max original)
      x: 0.5, // Centro horizontal
      y: 0.5, // Centro vertical (com pequenos ajustes disponíveis)
      angle: 0, // Sem rotação
    },
    printifyBlueprintId: 441,
    printifyPrintProviderId: 30, // OPT OnDemand
    variants: [
      { id: 62327, title: 'Padrão (330ml)', placeholderWidth: 2717, placeholderHeight: 1146, isGiftPackaging: false },
      { id: 62328, title: 'Grande (450ml)', placeholderWidth: 2811, placeholderHeight: 1276, isGiftPackaging: false },
    ],
    printFileBleed: 2, // Ajustar conforme a Printify, 2mm é um bom default
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 80, height: 95 }, // Valores de referência (pode ser ajustado)
    gelatoPrintOffsetsMm: { x: 0, y: 0 },
    supportsManualAdjustment: true, // ✅ ATIVADO: Suporte ao posicionamento manual
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

  // 2. CANECA CORAÇÃO (EU)
  'heart_mug': {
    id: 'heart_mug',
    name: 'Caneca Coração',
    mockupInitialPath: '/mockupproduto/canecacoracao.png',
    basePrice: 26.95, // Euros (preço único) ✅ ATUALIZADO
    category: 'mug',
    // ✅ CONFIGURAÇÃO DE DESIGN: Caneca coração com fill completo + ajustes ligeiros
    defaultDesign: {
      scale: 1.1, // Escala para cobrir completamente (lógica Math.max original)
      x: 0.5, // Centro horizontal
      y: 0.5, // Centro vertical (com pequenos ajustes disponíveis)
      angle: 0, // Sem rotação
    },
    printifyBlueprintId: 896,
    printifyPrintProviderId: 30, // OPT OnDemand
    variants: [
      { id: 77224, title: '11oz / White', placeholderWidth: 2362, placeholderHeight: 945, isGiftPackaging: false },
    ],
    printFileBleed: 2, // Ajustar conforme a Printify
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 80, height: 95 }, // Valores de referência
    gelatoPrintOffsetsMm: { x: 0, y: 0 },
    supportsManualAdjustment: true, // ✅ ATIVADO: Suporte ao posicionamento manual
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
    name: 'Saco Tote Bag',
    mockupInitialPath: '/mockupproduto/saco.png',
    basePrice: 19.95, // Euros ✅ ATUALIZADO
    category: 'bags', // Nova categoria
    // ✅ CONFIGURAÇÃO DE DESIGN: Saco tote com imagem centrada
    defaultDesign: {
      scale: 0.8, // Imagem média no saco
      x: 0.5, // Centro
      y: 0.45, // Um pouco acima do centro
      angle: 0, // Sem rotação
    },
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
    supportsManualAdjustment: true, // ✅ ATIVADO: Suporte ao posicionamento horizontal (igual às capas)
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
    name: 'Caderno',
    mockupInitialPath: '/mockupproduto/caderno.png',
    basePrice: 18.95, // Euros ✅ ATUALIZADO
    category: 'escritorio', // ✅ MUDANÇA: escritorio em vez de stationery
    // ✅ CONFIGURAÇÃO DE DESIGN: Caderno com fill para cobertura completa
    defaultDesign: {
      scale: 1.1, // O scale necessário para fazer "fill" (efeito cobrir tudo)
      x: 0.5, // Centro
      y: 0.5, // Centro
      angle: 0, // Sem rotação
    },
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
    supportsManualAdjustment: true, // ✅ ATIVADO: Suporte ao posicionamento horizontal (igual às capas)
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
    name: 'Mouse Pad',
    mockupInitialPath: '/mockupproduto/mousepad.png',
    basePrice: 24.95, // Euros ✅ ATUALIZADO
    category: 'escritorio', // ✅ MUDANÇA: escritorio em vez de office
    // ✅ CONFIGURAÇÃO DE DESIGN: Mouse pad com fill
    defaultDesign: {
      scale: 1.1, // Fill para cobrir toda a área
      x: 0.5, // Centro
      y: 0.5, // Centro
      angle: 0, // Sem rotação
    },
    printifyBlueprintId: 442,
    printifyPrintProviderId: 30, // OPT OnDemand
    variants: [
      { id: 62329, title: '9" × 7.5"', placeholderWidth: 2894, placeholderHeight: 2421, isGiftPackaging: false },
    ],
    printFileBleed: 2, // Ajustar conforme a Printify
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 228, height: 190 }, // Valores de referência (9"x7.5" aprox)
    gelatoPrintOffsetsMm: { x: 0, y: 0 },
    supportsManualAdjustment: true, // ✅ ATIVADO: Suporte ao posicionamento horizontal (igual às capas)
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

  // POSTER HORIZONTAL (SEMI BRILHO)
  'poster_horizontal_semi_glossy': {
    id: 'poster_horizontal_semi_glossy',
    name: 'Poster Horizontal',
    mockupInitialPath: '/mockupproduto/posterhorizontal.png',
    basePrice: 20.00,
    category: 'poster',
    // ✅ CONFIGURAÇÃO DE DESIGN: Poster com fill para cobertura completa
    defaultDesign: {
      scale: 1.05, // Fill para cobrir toda a área do poster
      x: 0.5, // Centro
      y: 0.5, // Centro
      angle: 0, // Sem rotação
    },
    printifyBlueprintId: 1220,
    printifyPrintProviderId: 105,
    variants: [
      { id: 92369, title: '7" x 5" (17,78 x 12,7 cm)', placeholderWidth: 2100, placeholderHeight: 1500, isGiftPackaging: false, price: 1795 }, // 17,95€
      { id: 101854, title: '11" x 9" (27,94 x 22,86 cm)', placeholderWidth: 3300, placeholderHeight: 2700, isGiftPackaging: false, price: 1795 }, // 17,95€
      { id: 92375, title: '14" x 11" (35,56 x 27,94 cm)', placeholderWidth: 4200, placeholderHeight: 3300, isGiftPackaging: false, price: 1895 }, // 18,95€
      { id: 92377, title: '18" x 12" (45,72 x 30,48 cm)', placeholderWidth: 5400, placeholderHeight: 3600, isGiftPackaging: false, price: 1995 }, // 19,95€
      { id: 92379, title: '20" x 16" (50,8 x 40,64 cm)', placeholderWidth: 6000, placeholderHeight: 4800, isGiftPackaging: false, price: 2195 }, // 21,95€
      { id: 101834, title: '24" x 16" (60,96 x 40,64 cm)', placeholderWidth: 7200, placeholderHeight: 4800, isGiftPackaging: false, price: 2395 }, // 23,95€
      { id: 92381, title: '24" x 18" (60,96 x 45,72 cm)', placeholderWidth: 7200, placeholderHeight: 5400, isGiftPackaging: false, price: 2395 }, // 23,95€
      { id: 92383, title: '30" x 20" (76,2 x 50,8 cm)', placeholderWidth: 9000, placeholderHeight: 6000, isGiftPackaging: false, price: 2495 }, // 24,95€
      { id: 101846, title: '34" x 22" (86,36 x 55,88 cm)', placeholderWidth: 10200, placeholderHeight: 6600, isGiftPackaging: false, price: 2995 }, // 29,95€
      { id: 92387, title: '36" x 24" (91,44 x 60,96 cm)', placeholderWidth: 10800, placeholderHeight: 7200, isGiftPackaging: false, price: 2995 }, // 29,95€
    ],
    printAreasConfig: [{
      position: 'front',
      allowsUserImage: true,
      defaultX: 0.5,
      defaultY: 0.5,
      defaultScale: 1.0,
      defaultAngle: 0,
      fitMethod: 'slice',
    }],
    allowsPrintDetails: false,
    supportsManualAdjustment: true, // ✅ CORRIGIDO: Ativar movimento top/center/bottom
  },

  // POSTER VERTICAL (SEMI BRILHO)
  'poster_vertical_semi_glossy': {
    id: 'poster_vertical_semi_glossy',
    name: 'Poster Vertical',
    mockupInitialPath: '/mockupproduto/postervertical.png',
    basePrice: 20.00,
    category: 'poster',
    // ✅ CONFIGURAÇÃO DE DESIGN: Poster vertical com fill para cobertura completa
    defaultDesign: {
      scale: 1.05, // Fill para cobrir toda a área do poster
      x: 0.5, // Centro
      y: 0.5, // Centro
      angle: 0, // Sem rotação
    },
    printifyBlueprintId: 1220,
    printifyPrintProviderId: 105,
    variants: [
      { id: 92389, title: '5" x 7" (12,7 x 17,8 cm)', placeholderWidth: 1500, placeholderHeight: 2100, isGiftPackaging: false, price: 1795 }, // 17,95€
      { id: 101856, title: '9" x 11" (22,9 x 27,9 cm)', placeholderWidth: 2700, placeholderHeight: 3300, isGiftPackaging: false, price: 1795 }, // 17,95€
      { id: 92395, title: '11" x 14" (27,9 x 35,6 cm)', placeholderWidth: 3300, placeholderHeight: 4200, isGiftPackaging: false, price: 1895 }, // 18,95€
      { id: 92397, title: '12" x 18" (30,5 x 45,7 cm)', placeholderWidth: 3600, placeholderHeight: 5400, isGiftPackaging: false, price: 1995 }, // 19,95€
      { id: 92399, title: '16" x 20" (40,6 x 50,8 cm)', placeholderWidth: 4800, placeholderHeight: 6000, isGiftPackaging: false, price: 2195 }, // 21,95€
      { id: 101836, title: '16" x 24" (40,6 x 61,0 cm)', placeholderWidth: 4800, placeholderHeight: 7200, isGiftPackaging: false, price: 2395 }, // 23,95€
      { id: 92401, title: '18" x 24" (45,7 x 61,0 cm)', placeholderWidth: 5400, placeholderHeight: 7200, isGiftPackaging: false, price: 2395 }, // 23,95€
      { id: 92403, title: '20" x 30" (50,8 x 76,2 cm)', placeholderWidth: 6000, placeholderHeight: 9000, isGiftPackaging: false, price: 2495 }, // 24,95€
      { id: 101848, title: '22" x 34" (55,9 x 86,4 cm)', placeholderWidth: 6600, placeholderHeight: 10200, isGiftPackaging: false, price: 2995 }, // 29,95€
      { id: 92407, title: '24" x 36" (61,0 x 91,4 cm)', placeholderWidth: 7200, placeholderHeight: 10800, isGiftPackaging: false, price: 2995 }, // 29,95€
    ],
    printAreasConfig: [{
      position: 'front',
      allowsUserImage: true,
      defaultX: 0.5,
      defaultY: 0.5,
      defaultScale: 1.0, // Mantenha como 1.0; o cálculo real será no frontend
      defaultAngle: 0,
      fitMethod: 'slice', // Alterado para 'slice' para Posters Verticais
    }],
    allowsPrintDetails: false,
    supportsManualAdjustment: true, // ✅ CORRIGIDO: Ativar movimento left/center/right
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

// Cache do catálogo Printify por 1 hora (3600 segundos)
export const getCachedPrintifyVariants = unstable_cache(
  async (blueprintId: string, printProviderId: string) => {
    // Verificar se está em build time
    if (typeof window === 'undefined' && !process.env.PRINTIFY_API_TOKEN) {
      console.warn('Cache de variantes Printify não disponível durante build');
      return { variants: [] };
    }
    
    const response = await printifyFetch(
      `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json?show-out-of-stock=1`
    );
    return response;
  },
  ['printify-variants'],
  {
    revalidate: 3600, // 1 hora
    tags: ['printify-catalog']
  }
);

// Cache das shops Printify por 24 horas
export const getCachedPrintifyShops = unstable_cache(
  async () => {
    // Verificar se está em build time
    if (typeof window === 'undefined' && !process.env.PRINTIFY_API_TOKEN) {
      console.warn('Cache de shops Printify não disponível durante build');
      return { shops: [] };
    }
    
    const response = await printifyFetch('shops.json');
    return response;
  },
  ['printify-shops'],
  {
    revalidate: 86400, // 24 horas
    tags: ['printify-catalog']
  }
);

// Constantes úteis para o fluxo Printify
export const GELATO_CONSTANTS = {
  DEFAULT_BLEED_MM: 4,
  DEFAULT_RESOLUTION_DPI: 300,
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILE_SIZE_MB: 50,
  DRAFT_ORDER_PREFIX: 'PICTUZ-DRAFT',
  ORDER_PREFIX: 'PICTUZ-ORDER'
} as const; 