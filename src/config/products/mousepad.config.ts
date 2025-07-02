import { Shield, Sparkles, Truck, Award } from 'lucide-react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

export const mousepadConfig = {
  productCategory: 'escritorio',

  getBasePrice: (product: PrintifyProductMapping, _selectedPrintifyVariantId: number | null): number => {
    // Mousepad tem preço fixo de €30.00 conforme printifyProducts.ts
    return product?.basePrice || 30.00;
  },

  discountTiers: [
    { min: 2, discount: 10, label: 'mousepads', emoji: '🖱️' },
    { min: 3, discount: 15, label: 'mousepads', emoji: '🎯' }
  ],

  descriptionItems: (_product: PrintifyProductMapping) => [
    {
      text: 'Mousepad premium com <span class="font-bold text-ghibli-moss">base antiderrapante</span>',
      emoji: '🖱️'
    },
    {
      text: 'Superfície lisa para <span class="font-bold">máxima precisão</span> do rato',
      emoji: '🎯'
    },
    {
      text: 'Tamanho <span class="font-bold text-ghibli-moss">23 x 19 cm</span> ideal para qualquer secretária',
      emoji: '📏'
    }
  ],

  guaranteeItems: () => [
    {
      icon: Shield,
      title: 'Base Antiderrapante'
    },
    {
      icon: Sparkles,
      title: 'Superfície Premium'
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

  // ✅ ESTRATÉGICO: OMISSÃO dos coordinateConfig e calculatePrintifyCoords
  // Isto desativa automaticamente os controlos de posição no GenericProductPage

  validatePurchase: (selectedImageUrl: string, selectedImageId: string | null, userInfo: unknown, selectedPrintifyVariantId: number | null, printifyProductId: string, printifyImageId: string): string | null => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar o seu mousepad!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione o tamanho do mousepad.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  },

  variantSelectorConfig: {
    label: 'Tamanho do Mousepad',
    emoji: '📐'
  },

  VariantSelectorComponent: 'ProductVariantSelector'
}; 