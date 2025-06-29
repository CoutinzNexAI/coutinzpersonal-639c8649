// Ficheiro de configuração para produtos do tipo Poster
// Define configurações específicas, variantes e comportamentos para posters 

import { Shield, Sparkles, Truck, Award } from 'lucide-react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { ImageAdjustments } from '@/types/product';

export const posterConfig = {
  productCategory: 'poster',

  // ✅ PREÇOS: baseado na variante selecionada
  getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null): number => {
    const selectedVariant = product?.variants?.find(v => v.id === selectedPrintifyVariantId);
    // O preço na nossa base de dados está em cêntimos. Convertemos para euros.
    // O fallback de 20 é para o caso de algo falhar.
    return selectedVariant?.price ? selectedVariant.price / 100 : 20;
  },

  // ✅ DESCONTOS: Para múltiplos posters
  discountTiers: [
    { min: 2, discount: 10, label: 'posters', emoji: '🖼️' },
    { min: 3, discount: 15, label: 'posters', emoji: '🔥' }
  ],

  // ✅ DESCRIÇÃO: Específica para posters
  descriptionItems: (_product: PrintifyProductMapping) => [
    { 
      text: 'Poster de <span class="font-bold text-ghibli-moss">máxima qualidade</span> em papel premium',
      emoji: '🎨'
    },
    { 
      text: 'Impressão de <span class="font-bold">altíssima resolução</span> resistente',
      emoji: '📸'
    },
    { 
      text: '<span class="font-bold text-ghibli-wood">Perfeito para decorar qualquer espaço</span>', 
      color: 'wood' as const,
      emoji: '🏠'
    }
  ],

  // ✅ GARANTIAS: Ícones específicos para posters
  guaranteeItems: () => [
    { icon: Shield, title: 'Máxima Qualidade' },
    { icon: Sparkles, title: 'Impressão HD' },
    { icon: Truck, title: 'Envio Seguro' },
    { icon: Award, title: 'Garantia Total' }
  ],

  // ✅ COORDENADAS: Configuração específica para posters
  getCoordinateConfig: (product: PrintifyProductMapping) => {
    if (product.id === 'poster_horizontal_semi_glossy') {
      return { positionType: 'vertical' as const, positions: ['top', 'center', 'bottom'] as const };
    }
    return { positionType: 'horizontal' as const, positions: ['left', 'center', 'right'] as const };
  },

  // ✅ CÁLCULO DE COORDENADAS: Lógica específica para posters
  calculatePrintifyCoords: (
    position: string,
    variantId: number,
    imageDimensions: { width: number; height: number },
    product: PrintifyProductMapping
  ): ImageAdjustments => {
    const selectedVariant = product.variants?.find(v => v.id === variantId);
    if (!selectedVariant) {
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }

    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const userImageWidth = imageDimensions.width;
    const userImageHeight = imageDimensions.height;

    // PASSO 1: CALCULAR ESCALA PARA COBRIR TODA A ÁREA
    const scaleToCover = Math.max(
      placeholderWidth / userImageWidth,
      placeholderHeight / userImageHeight
    );

    // PASSO 2: CALCULAR LARGURA FINAL DA IMAGEM
    const finalImageWidth = userImageWidth * scaleToCover;

    // PASSO 3: CONVERTER PARA ESCALA PRINTIFY
    const printifyScale = finalImageWidth / placeholderWidth;

    // PASSO 4: DEFINIR POSIÇÃO BASEADA NO TIPO DE POSTER
    let finalX = 0.5;
    let finalY = 0.5;
    
    // Determinar tipo de movimento baseado no produto
    const isVerticalPoster = product.id === 'poster_vertical_semi_glossy';
    const shiftAmount = 0.15; // 15% para movimento mais subtil
    
    if (isVerticalPoster) {
      // Poster Vertical: move left/center/right (horizontal) - mexe no X
      if (position === 'left') {
        finalX = 0.5 - shiftAmount;
      } else if (position === 'right') {
        finalX = 0.5 + shiftAmount;
      }
    } else if (product.id === 'poster_horizontal_semi_glossy') {
      // Poster Horizontal: move top/center/bottom (vertical) - mexe no Y
      if (position === 'top') {
        finalY = 0.5 - shiftAmount;
      } else if (position === 'bottom') {
        finalY = 0.5 + shiftAmount;
      }
    }

    return {
      x: finalX,
      y: finalY,
      scale: printifyScale,
      rotation: 0
    };
  },

  // ✅ VALIDAÇÃO: Específica para posters
  validatePurchase: (
    selectedImageUrl: string,
    selectedImageId: string | null,
    userInfo: unknown,
    selectedPrintifyVariantId: number | null,
    _printifyProductId: string,
    _printifyImageId: string
  ): string | null => {
    if (!userInfo) return 'Faça Login para Continuar';
    if (!selectedImageUrl) return 'Escolha uma Arte Primeiro';
    if (!selectedPrintifyVariantId) return 'Selecione o Tamanho';
    if (!_printifyProductId || !_printifyImageId) return 'Aguarde o processamento...';
    return null;
  },

  // ✅ SELETOR DE VARIANTES: Configuração específica
  variantSelectorConfig: {
    label: 'Tamanho do Poster',
    emoji: '📋',
    getCustomSingleVariantText: (_product: PrintifyProductMapping) => 'Tamanhos disponíveis',
    getCustomSingleVariantSubtext: (_product: PrintifyProductMapping) => 'Desde 5"x7" até 24"x36"'
  },

  // ✅ COMPONENTE DE VARIANTES: Usar o PosterVariantSelector
  VariantSelectorComponent: 'PosterVariantSelector'
};

export default posterConfig; 