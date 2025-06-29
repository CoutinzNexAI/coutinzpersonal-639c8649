import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { ImageAdjustments } from '@/types/product';

export interface CoordinateCalculationOptions {
  position: 'top' | 'center' | 'bottom' | 'left' | 'right';
  variantId: number;
  imageDimensions: { width: number; height: number };
  product: PrintifyProductMapping;
  /** 
   * Tipo de movimento da imagem:
   * - 'vertical': move top/center/bottom (ex: canecas, posters horizontais)
   * - 'horizontal': move left/center/right (ex: capas, posters verticais)
   */
  positionType: 'vertical' | 'horizontal';
  shiftAmount?: number;
}

/**
 * Hook genérico para cálculo de coordenadas Printify
 * Usado em produtos que permitem posicionamento (canecas, capas, etc.)
 */
export const useProductCoordinates = () => {
  
  const calculatePrintifyCoords = ({
    position,
    variantId,
    imageDimensions,
    product,
    positionType,
    shiftAmount = 0.35
  }: CoordinateCalculationOptions): ImageAdjustments => {
    
    if (!product || !imageDimensions) {
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }
    
    const selectedVariant = product.variants?.find(v => v.id === variantId);
    if (!selectedVariant) {
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }

    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const { width: userImageWidth, height: userImageHeight } = imageDimensions;

    // --- PASSO 1: CALCULAR A ESCALA "COVER" ---
    const scaleToCover = Math.max(
      placeholderWidth / userImageWidth,
      placeholderHeight / userImageHeight
    );

    // --- PASSO 2: CALCULAR A ESCALA PARA A API DA PRINTIFY ---
    const finalImageWidth = userImageWidth * scaleToCover;
    const printifyScale = finalImageWidth / placeholderWidth;
    
    // --- PASSO 3: CALCULAR O MOVIMENTO MÁXIMO PERMITIDO ---
    const scaledImageWidth = userImageWidth * scaleToCover;
    const scaledImageHeight = userImageHeight * scaleToCover;
    
    const overflowX = Math.max(0, scaledImageWidth - placeholderWidth);
    const overflowY = Math.max(0, scaledImageHeight - placeholderHeight);
    
    // O MÁXIMO QUE O CENTRO (0.5) PODE ANDAR
    const maxOffsetX = (overflowX / 2) / placeholderWidth;
    const maxOffsetY = (overflowY / 2) / placeholderHeight;

    // --- PASSO 4: DEFINIR A POSIÇÃO FINAL COM BASE NO TIPO E POSIÇÃO ---
    let finalX = 0.5;
    let finalY = 0.5;

    if (positionType === 'vertical') {
      // Para canecas, posters horizontais (movimento vertical - cima/baixo)
      finalX = 0.5; // X sempre centrado
      if (position === 'top') {
        finalY = 0.5 - (maxOffsetY * shiftAmount);
      } else if (position === 'bottom') {
        finalY = 0.5 + (maxOffsetY * shiftAmount);
      }
    } else if (positionType === 'horizontal') {
      // Para capas, posters verticais (movimento horizontal - esquerda/direita)
      finalY = 0.5; // Y sempre centrado
      if (position === 'left') {
        finalX = 0.5 - (maxOffsetX * shiftAmount);
      } else if (position === 'right') {
        finalX = 0.5 + (maxOffsetX * shiftAmount);
      }
    }
    
    // --- PASSO 5: RETORNAR O OBJETO COMPLETO ---
    const finalAdjustments = {
      x: finalX,
      y: finalY,
      scale: printifyScale,
      rotation: 0
    };

    console.log('🎯 [COORDINATES] Coordenadas calculadas:', {
      position,
      positionType,
      variantId,
      placeholderDimensions: { placeholderWidth, placeholderHeight },
      userImageDimensions: { userImageWidth, userImageHeight },
      scaleToCover,
      scaledImageWidth,
      scaledImageHeight,
      overflowX,
      overflowY,
      maxOffsetX,
      maxOffsetY,
      shiftAmount,
      finalX,
      finalY,
      printifyScale,
      finalAdjustments
    });

    return finalAdjustments;
  };

  return {
    calculatePrintifyCoords
  };
}; 