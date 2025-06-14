// Constantes temporárias durante a migração (serão substituídas por constantes Printify específicas)
export const GELATO_CONSTANTS = {
  DRAFT_ORDER_PREFIX: 'PICTUZ-DRAFT',
  // Adicionar mais constantes conforme necessário
};

// Interface expandida para produto Printify
export interface PrintifyProductMapping {
  id: string;
  name: string;
  mockupInitialPath?: string;
  price: number;
  category: string;
  // IDs Printify
  printifyBlueprintId?: number;
  printifyPrintProviderId?: number;
  printifyVariantIds?: number[];
  printArea?: string; // Mapeamento da posição (ex: 'front', 'back')
  // Propriedades de impressão
  printFileBleed?: number;
  printFileResolution?: number;
  gelatoPrintDimensionsMm?: { width: number; height: number };
  gelatoPrintOffsetsMm?: { x: number; y: number };
  supportsManualAdjustment?: boolean;
}

// Mapeamento oficial dos produtos PicTuz para Printify
export const PIC_TUZ_PRINTIFY_PRODUCT_MAP: Record<string, PrintifyProductMapping> = {
  // CANVAS 20x20cm
  'canvas_200x200_square_slim_unframed': {
    id: 'canvas_200x200_square_slim_unframed',
    name: 'Quadro Canvas (20x20cm, Sem Moldura Slim)',
    mockupInitialPath: '/assets/mockups/canvas/canvas_20x20_unframed_blank_front.png',
    price: 30.00,
    category: 'canvas',
    // NOVOS IDs REAIS DA PRINTIFY AQUI
    printifyBlueprintId: 937, // Blueprint ID para o Canvas Matte Stretched 0.75"
    printifyPrintProviderId: 105, // Print Provider ID para Jondo
    printifyVariantIds: [82238], // Variant ID para o 14" x 14" / 0.75''
    printArea: 'front', // Assumindo 'front' é a posição padrão para Canvas
    printFileBleed: 4,
    printFileResolution: 300,
    gelatoPrintDimensionsMm: { width: 200, height: 200 },
    gelatoPrintOffsetsMm: { x: 49, y: 49 },
    supportsManualAdjustment: false,
  },
  // Adicionar mais produtos conforme necessário
};

// Função para obter produto Printify por ID
export function getPrintifyProduct(productId: string): PrintifyProductMapping | null {
  return PIC_TUZ_PRINTIFY_PRODUCT_MAP[productId] || null;
}

// Função para obter todos os produtos Printify
export function getAllPrintifyProducts(): PrintifyProductMapping[] {
  return Object.values(PIC_TUZ_PRINTIFY_PRODUCT_MAP);
} 