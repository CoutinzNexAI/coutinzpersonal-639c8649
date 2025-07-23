// Ficheiro de configuração para produtos do tipo Canvas
// Define configurações específicas, variantes e comportamentos para canvas 

import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { Shield, Sparkles, Truck, Award } from 'lucide-react';
import { getRealPrice } from '@/lib/fakeDiscounts';

export const canvasConfig = {
  productCategory: 'canvas',

  // ✅ NOVO: Função para obter preço original (mesmo que base para canvas - sem desconto especial)
  getOriginalPrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null): number => {
    const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
    if (!selectedVariant) return product.basePrice || 20.00;
    
    // Canvas Sem Borda: basePrice 20 + priceAdjustment
    if (selectedVariant.id >= 91656 && selectedVariant.id <= 101418) {
      return 20.00 + (selectedVariant.priceAdjustment || 0);
    }
    
    // Canvas com Moldura: basePrice 40 + priceAdjustment
    return 40.00 + (selectedVariant.priceAdjustment || 0);
  },

  getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null): number => {
    const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
    let originalPrice;
    
    if (!selectedVariant) {
      originalPrice = product.basePrice || 20.00;
    } else if (selectedVariant.id >= 91656 && selectedVariant.id <= 101418) {
      // Canvas Sem Borda: basePrice 20 + priceAdjustment
      originalPrice = 20.00 + (selectedVariant.priceAdjustment || 0);
    } else {
      // Canvas com Moldura: basePrice 40 + priceAdjustment
      originalPrice = 40.00 + (selectedVariant.priceAdjustment || 0);
    }
    
    // ✅ NOVO: Usar preço real com desconto fake se aplicável
    return getRealPrice(product.id, originalPrice);
  },

  // ✅ REMOVIDO: discountTiers (substituído por descontos fake individuais)

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
    return 'ProductVariantSelector';
  },
  
  VariantSelectorComponent: 'ProductVariantSelector' // fallback
}; 