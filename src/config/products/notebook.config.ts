import { Shield, Sparkles, Truck, Award } from 'lucide-react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { ImageAdjustments } from '@/types/product';

export const notebookConfig = {
  productCategory: 'escritorio',

  getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null): number => {
    // Caderno tem preço fixo de €20.00 conforme printifyProducts.ts
    return product?.basePrice || 20.00;
  },

  discountTiers: [
    { min: 3, discount: 15, label: '15% OFF para 3+ cadernos', emoji: '🎯' },
    { min: 2, discount: 10, label: '10% OFF para 2+ cadernos', emoji: '📝' }
  ],

  descriptionItems: (product: PrintifyProductMapping) => [
    {
      text: 'Caderno personalizado de <span class="font-bold text-ghibli-moss">alta qualidade</span>',
      emoji: '📝'
    },
    {
      text: 'Capa resistente com <span class="font-bold">impressão HD durável</span>',
      emoji: '🎨'
    },
    {
      text: 'Perfeito para <span class="font-bold text-ghibli-wood">anotações e criatividade</span>',
      color: 'wood' as const,
      emoji: '✨'
    },
    {
      text: 'Formato prático e <span class="font-bold">fácil de transportar</span>',
      emoji: '🎒'
    }
  ],

  guaranteeItems: () => [
    {
      icon: Shield,
      title: 'Qualidade Premium'
    },
    {
      icon: Sparkles,
      title: 'Impressão HD'
    },
    {
      icon: Truck,
      title: 'Envio Seguro'
    },
    {
      icon: Award,
      title: 'Satisfação 100%'
    }
  ],

  // Configuração de coordenadas horizontais para cadernos
  coordinateConfig: {
    positionType: 'horizontal' as const,
    positions: ['left', 'center', 'right'] as const
  },

  // Cálculo de coordenadas específico para cadernos (adaptado dos posters)
  calculatePrintifyCoords: (
    position: 'left' | 'center' | 'right',
    variantId: number,
    imageDimensions: { width: number; height: number },
    product: PrintifyProductMapping
  ): ImageAdjustments => {
    if (!product || !imageDimensions) {
      return { x: 0.5, y: 0.5, scale: 1.1, rotation: 0 };
    }
    
    const selectedVariant = product.variants?.find((v) => v.id === variantId);
    if (!selectedVariant) {
      return { x: 0.5, y: 0.5, scale: 1.1, rotation: 0 };
    }

    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const { width: userImageWidth, height: userImageHeight } = imageDimensions;

    // PASSO 1: CALCULAR A ESCALA "COVER" para preencher toda a área
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
    
    const maxOffsetX = (overflowX / 2) / placeholderWidth;
    const maxOffsetY = (overflowY / 2) / placeholderHeight;

    // PASSO 4: DEFINIR A POSIÇÃO FINAL COM BASE NO BOTÃO (horizontal)
    const finalY = 0.5; // Para cadernos, Y fica sempre centrado
    let finalX = 0.5;
    const shiftAmount = 0.35; // Movimento horizontal

    if (position === 'left') {
      finalX = 0.5 - (maxOffsetX * shiftAmount);
    } else if (position === 'right') {
      finalX = 0.5 + (maxOffsetX * shiftAmount);
    }
    
    return {
      x: finalX,
      y: finalY,
      scale: printifyScale,
      rotation: 0
    };
  },

  validatePurchase: (selectedImageUrl: string, selectedImageId: string | null, userInfo: unknown, selectedPrintifyVariantId: number | null, printifyProductId: string, printifyImageId: string): string | null => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar o seu caderno!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione o tipo de caderno.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  },

  variantSelectorConfig: {
    label: 'Tipo de Caderno',
    emoji: '📝'
  },

  VariantSelectorComponent: 'ProductVariantSelector'
}; 