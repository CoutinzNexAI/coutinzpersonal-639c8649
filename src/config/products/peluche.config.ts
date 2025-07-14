import { ImageAdjustments } from '@/types/product';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { Shield, Sparkles, Truck, Award } from 'lucide-react';

// Ficheiro de configuração para produtos do tipo Peluche com T-Shirt
// Define configurações específicas, variantes e comportamentos para peluches

// Configuração específica para produtos do tipo Peluche
export const pelucheConfig = {
  productCategory: 'peluche',
  
  // Função para obter preço original (para cálculos de entrega grátis)
  getOriginalPrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null) => {
    return 27.95; // Preço do peluche
  },

  // Função para calcular preço base baseado na variante
  getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null) => {
    return 27.95; // Preço fixo para todas as variantes
  },

  // Indicador de produto com desconto especial
  hasSpecialDiscount: (product: PrintifyProductMapping) => {
    return false; // Sem desconto especial por enquanto
  },

  // Regras de desconto para múltiplos peluches
  discountTiers: [
    { min: 2, discount: 10, label: 'peluches', emoji: '🧸' },
    { min: 3, discount: 15, label: 'peluches', emoji: '🎁' }
  ],

  // Itens de descrição do produto
  descriptionItems: (product: PrintifyProductMapping) => [
    { 
      text: 'Peluche <span class="font-bold text-ghibli-moss">super fofo</span> com T-shirt personalizada',
      color: 'moss' as const
    },
    { 
      text: 'Material <span class="font-bold">100% Poliéster</span> na T-shirt',
      color: 'moss' as const
    },
    { 
      text: '<span class="font-bold text-ghibli-wood">Perfeito para oferecer ou decorar</span>',
      color: 'wood' as const,
      emoji: '🎁'
    }
  ],

  // Itens de garantias persuasivos para peluches
  guaranteeItems: () => [
    {
      icon: Shield,
      title: 'Material Premium e Seguro'
    },
    {
      icon: Sparkles,
      title: 'Impressão de Alta Qualidade'
    },
    {
      icon: Truck,
      title: '3-5 dias úteis'
    },
    {
      icon: Award,
      title: 'Garantia 30 dias'
    }
  ],

  // Configuração de coordenadas/posicionamento - peluche não precisa de ajuste
  coordinateConfig: {
    positionType: 'none' as const,
    positions: [] as const
  },

  // Configuração específica para cálculo de coordenadas do peluche
  calculatePrintifyCoords: (position: string | null, variantId: number, imageDimensions: { width: number; height: number }, product: PrintifyProductMapping): ImageAdjustments => {
    // Para peluches, usamos fill to placeholder como pedido
    if (!product || !imageDimensions) {
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }
    
    const selectedVariant = product.variants?.find((v) => v.id === variantId);
    if (!selectedVariant) {
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }

    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const { width: userImageWidth, height: userImageHeight } = imageDimensions;

    // CALCULAR A ESCALA "COVER" para fill to placeholder
    const scaleToCover = Math.max(
      placeholderWidth / userImageWidth,
      placeholderHeight / userImageHeight
    );

    // Escala para a API da Printify
    const finalImageWidth = userImageWidth * scaleToCover;
    const printifyScale = finalImageWidth / placeholderWidth;
    
    return {
      x: 0.5, // Centro
      y: 0.5, // Centro  
      scale: printifyScale,
      rotation: 0
    };
  },

  // Função de validação específica para peluches
  validatePurchase: (selectedImageUrl: string, selectedImageId: string | null, userInfo: unknown, selectedPrintifyVariantId: number | null, printifyProductId: string, printifyImageId: string) => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar o seu peluche!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione o animal do peluche.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  },

  // Configuração específica do seletor de variantes
  variantSelectorConfig: {
    label: "Escolha o Animal",
    emoji: "🧸",
    getCustomSingleVariantText: (product: PrintifyProductMapping) => undefined,
    getCustomSingleVariantSubtext: (product: PrintifyProductMapping) => undefined
  },

  // Componente de seleção de variantes (será importado dinamicamente)
  VariantSelectorComponent: 'PelucheVariantSelector'
}; 