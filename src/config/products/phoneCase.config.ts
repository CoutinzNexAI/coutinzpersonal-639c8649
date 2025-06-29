import { Shield, Sparkles, Truck, Award } from 'lucide-react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { ImageAdjustments } from '@/types/product';

export const phoneCaseConfig = {
  productCategory: 'tecnologia',

  // ✅ PREÇOS: Preço fixo para todas as capas
  getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null): number => {
    return product.basePrice || 25; // €25 por capa, independente do modelo
  },

  // ✅ DESCONTOS: Para múltiplas capas
  discountTiers: [
    { min: 2, discount: 10, label: 'capas', emoji: '📱' },
    { min: 3, discount: 15, label: 'capas', emoji: '🔥' }
  ],

  // ✅ DESCRIÇÃO: Específica para capas de telemóvel
  descriptionItems: (product: PrintifyProductMapping) => [
    { text: 'Compatível com carregamento wireless', color: 'moss' as const, emoji: '⚡' },
    { text: 'Material TPU flexível e resistente', color: 'moss' as const, emoji: '🛡️' },
    { text: 'Impressão HD com cores vibrantes', color: 'moss' as const, emoji: '🎨' },
    { text: 'Proteção total para câmara e ecrã', color: 'moss' as const, emoji: '📸' },
    { text: 'Acabamento mate anti-impressões digitais', color: 'wood' as const, emoji: '✨' }
  ],

  // ✅ GARANTIAS: Ícones de confiança para capas
  guaranteeItems: () => [
    { icon: Shield, title: 'Proteção Garantida' },
    { icon: Sparkles, title: 'Qualidade Premium' },
    { icon: Truck, title: 'Envio Rápido' },
    { icon: Award, title: 'Satisfação 100%' }
  ],

  // ✅ COORDENADAS: Lógica de "cover" para preencher totalmente a área
  coordinateConfig: {
    positionType: 'manual', // Capas usam ajuste manual completo (zoom, posição, rotação)
    positions: ['manual'] as const
  },

  // ✅ CÁLCULO DE COORDENADAS: Cover completo com ajuste manual
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
    const printAreaWidth = selectedVariant.placeholderWidth;
    const printAreaHeight = selectedVariant.placeholderHeight;

    // PASSO 3: CALCULAR SCALE PARA "COVER" (preencher completamente)
    const scaleX = printAreaWidth / imageDimensions.width;
    const scaleY = printAreaHeight / imageDimensions.height;
    const coverScale = Math.max(scaleX, scaleY); // Usa o maior para garantir cobertura total

    // PASSO 4: POSIÇÃO SEMPRE CENTRADA (capas usam ajuste manual)
    const finalX = 0.5; // Centro horizontal
    const finalY = 0.5; // Centro vertical

    return {
      x: finalX,
      y: finalY,
      scale: coverScale,
      rotation: 0 // Sem rotação inicial
    };
  },

  // ✅ VALIDAÇÃO: Mensagens específicas para capas
  validatePurchase: (
    selectedImageUrl: string,
    selectedImageId: string | null,
    userInfo: unknown,
    selectedPrintifyVariantId: number | null,
    printifyProductId: string,
    printifyImageId: string
  ): string | null => {
    if (!userInfo) return 'Precisa de fazer login para personalizar a sua capa.';
    if (!selectedImageUrl) return 'Escolha uma arte para a sua capa personalizada.';
    if (!selectedPrintifyVariantId) return 'Selecione o modelo do seu telemóvel.';
    return null; // Tudo válido
  },

  // ✅ SELETOR DE VARIANTES: Configuração para dropdown encadeado
  variantSelectorConfig: {
    label: 'Modelo do Telemóvel',
    emoji: '📱',
    getCustomSingleVariantText: (product: PrintifyProductMapping) => {
      const variantCount = product.variants?.length || 0;
      return `${variantCount} modelos disponíveis`;
    },
    getCustomSingleVariantSubtext: (product: PrintifyProductMapping) => {
      return 'iPhone e Samsung Galaxy';
    }
  },

  // ✅ COMPONENTE SELETOR: Referência ao componente especializado
  VariantSelectorComponent: 'PhoneCaseVariantSelector'
};

export default phoneCaseConfig; 