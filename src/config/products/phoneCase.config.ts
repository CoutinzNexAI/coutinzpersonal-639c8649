import { Shield, Sparkles, Truck, Award } from 'lucide-react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { ImageAdjustments } from '@/types/product';
import { getRealPrice } from '@/lib/fakeDiscounts';

export const phoneCaseConfig = {
  productCategory: 'tecnologia',

  // ✅ NOVO: Função para obter preço original (mesmo que base para capas - sem desconto especial)
  getOriginalPrice: (product: PrintifyProductMapping, _selectedPrintifyVariantId: number | null): number => {
    return 29.95; // ✅ ATUALIZADO: Preço "original" inflacionado para fake discount de 33%
  },

  // ✅ ATUALIZADO: Usar preços com desconto fake
  getBasePrice: (product: PrintifyProductMapping, _selectedPrintifyVariantId: number | null): number => {
    const originalPrice = product.basePrice || 19.95;
    
    // ✅ NOVO: Usar preço real com desconto fake se aplicável
    return getRealPrice(product.id, originalPrice);
  },

  // ✅ REMOVIDO: discountTiers (substituído por descontos fake individuais)

  // ✅ DESCRIÇÃO: Específica para capas de telemóvel - 3 tópicos diretos
  descriptionItems: (_product: PrintifyProductMapping) => [
    { text: 'Proteção com material TPU resistente a quedas', color: 'moss' as const, emoji: '🛡️' },
    { text: 'Impressão HD resistente ao desgaste', color: 'moss' as const, emoji: '🎨' },
    { text: 'Compatível com carregamento wireless', color: 'wood' as const, emoji: '⚡' }
  ],

  // ✅ GARANTIAS: Textos persuasivos para capas
  guaranteeItems: () => [
    { icon: Shield, title: 'Material TPU Resistente' },
    { icon: Sparkles, title: 'Compatível Wireless' },
    { icon: Truck, title: '3-5 dias úteis' },
    { icon: Award, title: 'Garantia 30 dias' }
  ],

  // ✅ COORDENADAS: Configuração para movimento horizontal
  coordinateConfig: { 
    positionType: 'horizontal' as const, 
    positions: ['left', 'center', 'right'] as const 
  },

  // ✅ CÁLCULO DE COORDENADAS: Cover completo com movimento horizontal
  calculatePrintifyCoords: (
    position: string,
    variantId: number,
    imageDimensions: { width: number; height: number },
    product: PrintifyProductMapping
  ): ImageAdjustments => {
    // PASSO 1: ENCONTRAR A VARIANTE SELECIONADA
    const selectedVariant = product.variants?.find(v => v.id === variantId);
    if (!selectedVariant) {
      return { x: 0.5, y: 0.5, scale: 1.0, rotation: 0 };
    }

    // PASSO 2: DIMENSÕES DA ÁREA DE IMPRESSÃO (placeholder da variante)
    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const userImageWidth = imageDimensions.width;
    const userImageHeight = imageDimensions.height;

    // PASSO 3: CALCULAR SCALE PARA "COVER" (preencher completamente)
    const scaleToCover = Math.max(
      placeholderWidth / userImageWidth,
      placeholderHeight / userImageHeight
    );

    // PASSO 4: CALCULAR LARGURA FINAL DA IMAGEM
    const finalImageWidth = userImageWidth * scaleToCover;

    // PASSO 5: CONVERTER PARA ESCALA PRINTIFY
    const printifyScale = finalImageWidth / placeholderWidth;

    // PASSO 6: DEFINIR POSIÇÃO BASEADA NO MOVIMENTO HORIZONTAL
    let finalX = 0.5; // Centro por defeito
    const finalY = 0.5; // Y sempre centrado
    const shiftAmount = 0.35;
    
    if (position === 'left') {
      finalX = 0.5 - shiftAmount;
    } else if (position === 'right') {
      finalX = 0.5 + shiftAmount;
    }

    return {
      x: finalX,
      y: finalY,
      scale: printifyScale,
      rotation: 0
    };
  },

  // ✅ VALIDAÇÃO: Mensagens específicas para capas
  validatePurchase: (
    selectedImageUrl: string,
    selectedImageId: string | null,
    userInfo: unknown,
    selectedPrintifyVariantId: number | null,
    _printifyProductId: string,
    _printifyImageId: string
  ): string | null => {
    if (!userInfo) return 'Precisa de fazer login para personalizar a sua capa.';
    if (!selectedImageUrl) return 'Escolha uma arte para a sua capa personalizada.';
    if (!selectedPrintifyVariantId) return 'Selecione o modelo do seu telemóvel.';
    return null; // Tudo válido
  },

  // ✅ SELETOR DE VARIANTES: Configuração para dropdown encadeado
  variantSelectorConfig: {
    label: '',
    emoji: '📱',
    getCustomSingleVariantText: (_product: PrintifyProductMapping) => {
      const variantCount = _product.variants?.length || 0;
      return `${variantCount} modelos disponíveis`;
    }
  },

  // ✅ COMPONENTE SELETOR: Referência ao componente especializado
  VariantSelectorComponent: 'PhoneCaseVariantSelector'
};

export default phoneCaseConfig; 