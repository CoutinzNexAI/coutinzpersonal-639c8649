// Ficheiro de configuração para produtos do tipo Canvas
// Define configurações específicas, variantes e comportamentos para canvas 

import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { Shield, Sparkles, Truck, Award } from 'lucide-react';

export const canvasConfig = {
  productCategory: 'canvas',

  getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null): number => {
    const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
    if (!selectedVariant) return 24.95; // ✅ NOVO: Canvas 6x6 base

    // Canvas Sem Borda: basePrice €24.95 + priceAdjustment
    if (product.id === 'custom_canvas') {
      return 24.95 + (selectedVariant.priceAdjustment || 0);
    }
    
    // Canvas com Moldura: basePrice €24.95 + priceAdjustment  
    if (product.id === 'framed_canvas') {
      return 24.95 + (selectedVariant.priceAdjustment || 0);
    }

    return 24.95; // ✅ Fallback
  },

  discountTiers: [
    { min: 2, discount: 10, label: '10% OFF', emoji: '🎨' },
    { min: 3, discount: 15, label: '15% OFF', emoji: '🎯' }
  ],

  descriptionItems: (product: PrintifyProductMapping) => {
    const isFramed = product.name.includes('Moldura');
    return [
      {
        text: 'Impressão HD com acabamento artístico',
        emoji: '🎨'
      },
      {
        text: isFramed ? 'Canvas premium com moldura' : 'Canvas esticado premium',
        emoji: '🖼️'
      },
      {
        text: 'Ideal para <span class="font-bold text-ghibli-wood">dar vida a qualquer espaço',
        emoji: '🏠'
      }
    ];
  },

  guaranteeItems: () => [
    {
      icon: Shield,
      title: 'Acabamento Artístico HD'
    },
    {
      icon: Sparkles,
      title: 'Transforma Qualquer Espaço'
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

  // Canvas não suporta ajuste manual de posição - omitindo coordinateConfig
  // Isto desativa automaticamente os controlos de posição no GenericProductPage

  validatePurchase: (selectedImageUrl: string, selectedImageId: string | null, userInfo: unknown, selectedPrintifyVariantId: number | null, printifyProductId: string, printifyImageId: string): string | null => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar o seu canvas!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione as opções do produto.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  },

  variantSelectorConfig: {
    label: 'Tamanho',
    emoji: '📐'
  },

  getVariantSelectorComponent: (product: PrintifyProductMapping) => {
    return product.id === 'framed_canvas' ? 'FramedCanvasVariantSelector' : 'ProductVariantSelector';
  },
  
  VariantSelectorComponent: 'ProductVariantSelector' // fallback
}; 