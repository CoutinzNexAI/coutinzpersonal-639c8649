import { ImageAdjustments } from '@/types/product';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { Shield, Sparkles, Truck, Award } from 'lucide-react';

// Ficheiro de configuração para produtos do tipo Caneca
// Define configurações específicas, variantes e comportamentos para canecas

// Configuração específica para produtos do tipo Caneca
export const mugConfig = {
  productCategory: 'mug',
  
  // ✅ NOVO: Função para obter preço original (para cálculos de entrega grátis)
  getOriginalPrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null) => {
    if (product?.id === 'heart_mug') {
      return 26.95; // Preço original da Heart mug (SEM desconto)
    }
    
    if (product?.id === 'ceramic_mug' && selectedPrintifyVariantId) {
      return selectedPrintifyVariantId === 62327 ? 18.95 : 22.95;
    }
    
    return product?.basePrice || 26.95;
  },

  // Função para calcular preço base baseado na variante (COM desconto especial aplicado)
  getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null) => {
    if (product?.id === 'heart_mug') {
      // ✅ FIXO: Preço exato com desconto de 10% na caneca coração
      return 24.26; // Fixo para garantir consistência (26.95 * 0.9 = 24.255 → 24.26)
    }
    
    if (product?.id === 'ceramic_mug' && selectedPrintifyVariantId) {
      // 330ml (id: 62327) = €18.95, 450ml (id: 62328) = €22.95 ✅ ATUALIZADO
      return selectedPrintifyVariantId === 62327 ? 18.95 : 22.95;
    }
    
    return product?.basePrice || 26.95; // Fallback atualizado
  },

  // ✅ NOVO: Indicador de produto com desconto especial
  hasSpecialDiscount: (product: PrintifyProductMapping) => {
    return product?.id === 'heart_mug';
  },

  // ✅ ATUALIZADO: Regras de desconto para múltiplas canecas
  // NOTA: Para caneca coração, estes descontos são ADICIONAIS ao desconto base de 10%
  discountTiers: [
    { min: 2, discount: 10, label: 'canecas', emoji: '💡' },
    { min: 3, discount: 15, label: 'canecas', emoji: '🔥' }
  ],

  // Itens de descrição do produto
  descriptionItems: (product: PrintifyProductMapping) => [
    { 
      text: `Caneca de <span class="font-bold text-ghibli-moss">cerâmica premium</span> ${product.id === 'heart_mug' ? 'em formato de coração' : 'resistente'}`,
      color: 'moss' as const
    },
    { 
      text: 'Impressão nítida e <span class="font-bold">resistente à lavagem</span>',
      color: 'moss' as const
    },
    { 
      text: `<span class="font-bold text-ghibli-wood">${product.id === 'heart_mug' ? 'Perfeita para oferecer a quem mais gosta' : 'Perfeita para todas as ocasiões'}</span>`,
      color: 'wood' as const,
      emoji: product.id === 'heart_mug' ? '❤️' : undefined
    }
  ],

  // Itens de garantias persuasivos para canecas
  guaranteeItems: () => [
    {
      icon: Shield,
      title: 'Cerâmica Premium Resistente'
    },
    {
      icon: Sparkles,
      title: 'Perfeita para Todas Ocasiões'
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

  // Configuração de coordenadas/posicionamento
  coordinateConfig: {
    positionType: 'vertical' as const,
    positions: ['top', 'center', 'bottom'] as const
  },

  // Configuração específica para cálculo de coordenadas das canecas
  calculatePrintifyCoords: (position: 'top' | 'center' | 'bottom', variantId: number, imageDimensions: { width: number; height: number }, product: PrintifyProductMapping): ImageAdjustments => {
    if (!product || !imageDimensions) {
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }
    
    const selectedVariant = product.variants?.find((v) => v.id === variantId);
    if (!selectedVariant) {
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }

    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const { width: userImageWidth, height: userImageHeight } = imageDimensions;

    // PASSO 1: CALCULAR A ESCALA "COVER"
    const scaleToCover = Math.max(
      placeholderWidth / userImageWidth,
      placeholderHeight / userImageHeight
    );

    // PASSO 2: CALCULAR A ESCALA PARA A API DA PRINTIFY
    const finalImageWidth = userImageWidth * scaleToCover;
    const printifyScale = finalImageWidth / placeholderWidth;
    
    // PASSO 3: CALCULAR O MOVIMENTO MÁXIMO PERMITIDO
    const scaledImageWidth = userImageWidth * scaleToCover;
    const scaledImageHeight = userImageHeight * scaleToCover;
    
    const overflowX = Math.max(0, scaledImageWidth - placeholderWidth);
    const overflowY = Math.max(0, scaledImageHeight - placeholderHeight);
    
    const _maxOffsetX = (overflowX / 2) / placeholderWidth;
    const maxOffsetY = (overflowY / 2) / placeholderHeight;

    // PASSO 4: DEFINIR A POSIÇÃO FINAL COM BASE NO BOTÃO
    const finalX = 0.5; // Para canecas, X fica sempre centrado
    let finalY = 0.5;
    const shiftAmount = 0.35; // Reduzido para um ajuste mais suave

    if (position === 'top') {
      finalY = 0.5 - (maxOffsetY * shiftAmount);
    } else if (position === 'bottom') {
      finalY = 0.5 + (maxOffsetY * shiftAmount);
    }
    
    return {
      x: finalX,
      y: finalY,
      scale: printifyScale,
      rotation: 0
    };
  },

  // Função de validação específica para canecas
  validatePurchase: (selectedImageUrl: string, selectedImageId: string | null, userInfo: unknown, selectedPrintifyVariantId: number | null, printifyProductId: string, printifyImageId: string) => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar a sua caneca!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione o tamanho da caneca.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  },

  // Configuração específica do seletor de variantes
  variantSelectorConfig: {
    label: "Tamanho da Caneca",
    emoji: "☕",
    getCustomSingleVariantText: (product: PrintifyProductMapping) => product.id === 'heart_mug' ? 'Tamanho 330ml' : undefined,
    getCustomSingleVariantSubtext: (product: PrintifyProductMapping) => product.id === 'heart_mug' ? 'Formato especial de coração' : undefined
  },

  // Componente de seleção de variantes (será importado dinamicamente)
  VariantSelectorComponent: 'MugVariantSelector'
}; 