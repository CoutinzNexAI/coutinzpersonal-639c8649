// Constantes temporárias durante a migração (serão substituídas por constantes Printify específicas)
export const GELATO_CONSTANTS = {
  DRAFT_ORDER_PREFIX: 'PICTUZ-DRAFT',
  // Adicionar mais constantes conforme necessário
};

// Interface temporária para produto Printify (será expandida)
export interface PrintifyProductMapping {
  id: string;
  name: string;
  category: string;
  price: number;
  printifyBlueprintId?: number;
  printifyPrintProviderId?: number;
  printifyVariantIds?: number[];
  printArea?: string; // Mapeamento da posição (ex: 'front', 'back')
  supportsManualAdjustment?: boolean;
}

// Mapeamento temporário - será expandido com dados reais da Printify
const PRINTIFY_PRODUCT_MAP: Record<string, PrintifyProductMapping> = {
  'canvas_200x200_square_slim_unframed': {
    id: 'canvas_200x200_square_slim_unframed',
    name: 'Canvas 200x200mm Square Slim Unframed',
    category: 'canvas',
    price: 25.99,
    printifyBlueprintId: 384, // Exemplo - Canvas blueprint ID na Printify
    printifyPrintProviderId: 1, // Exemplo - Print provider ID
    printifyVariantIds: [1], // Exemplo - Array de variant IDs
    printArea: 'front',
    supportsManualAdjustment: true
  },
  // Adicionar mais produtos conforme necessário
};

// Função para obter produto Printify por ID
export function getPrintifyProduct(productId: string): PrintifyProductMapping | null {
  return PRINTIFY_PRODUCT_MAP[productId] || null;
}

// Função para obter todos os produtos Printify
export function getAllPrintifyProducts(): PrintifyProductMapping[] {
  return Object.values(PRINTIFY_PRODUCT_MAP);
} 