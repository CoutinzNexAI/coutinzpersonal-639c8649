import { Shield, Sparkles, Truck, Award } from 'lucide-react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

export const mousepadConfig = {
  productCategory: 'escritorio',

  getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null): number => {
    // Mousepad tem preço fixo de €30.00 conforme printifyProducts.ts
    return product?.basePrice || 30.00;
  },

  discountTiers: [
    { min: 3, discount: 15, label: '15% OFF para 3+ mousepads', emoji: '🎯' },
    { min: 2, discount: 10, label: '10% OFF para 2+ mousepads', emoji: '🖱️' }
  ],

  descriptionItems: (product: PrintifyProductMapping) => [
    {
      text: 'Mousepad premium com <span class="font-bold text-ghibli-moss">base antiderrapante</span>',
      emoji: '🖱️'
    },
    {
      text: 'Superfície lisa para <span class="font-bold">máxima precisão</span> do rato',
      emoji: '🎯'
    },
    {
      text: 'Impressão HD <span class="font-bold text-ghibli-wood">resistente ao uso diário</span>',
      color: 'wood' as const,
      emoji: '🎨'
    },
    {
      text: 'Tamanho ideal para <span class="font-bold">qualquer secretária</span>',
      emoji: '💻'
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
      title: 'Envio Seguro'
    },
    {
      icon: Award,
      title: 'Qualidade Garantida'
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