// Configuração específica para Peluche com T-Shirt Personalizável
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { Truck, Shield, Award, Sparkles } from 'lucide-react';

export const pelucheConfig = {
  productCategory: 'peluche',
  
  // Preço original para cálculos (mesmo que base para peluches)
  getOriginalPrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null): number => {
    return 24.95; // €24.95 para todas as variantes
  },

  // Preço base do produto
  getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null): number => {
    return 24.95; // €24.95 para todas as variantes
  },

  // Descontos por quantidade
  discountTiers: [
    { min: 2, discount: 10, label: '2+ peluches', emoji: '' },
    { min: 3, discount: 15, label: '3+ peluches', emoji: '' }
  ],

  // Descrições específicas do produto
  descriptionItems: (product: PrintifyProductMapping) => [
    { 
      text: 'Peluche super fofo e macio com t-shirt 100% algodão personalizável', 
      color: 'moss' as const,
      emoji: '🧸'
    },
    { 
      text: 'Transformação AI única aplicada na t-shirt do seu animal favorito', 
      color: 'wood' as const,
      emoji: '✨'
    },
    { 
      text: 'Perfeito para presentes únicos e momentos especiais', 
      color: 'moss' as const,
      emoji: '🎁'
    }
  ],

  // Garantias específicas para peluche
  guaranteeItems: () => [
    { icon: Sparkles, title: 'Peluche de Qualidade Premium' },
    { icon: Award, title: 'T-Shirt 100% Algodão Macio' },
    { icon: Shield, title: 'Garantia 30 dias' },
    { icon: Truck, title: '3-5 dias úteis' }
  ],

  // Validação de compra
  validatePurchase: (
    selectedImageUrl: string,
    selectedImageId: string | null,
    userInfo: unknown,
    selectedPrintifyVariantId: number | null,
    printifyProductId: string,
    printifyImageId: string
  ): string | null => {
    if (!selectedImageUrl) {
      return 'Por favor, escolha uma transformação para personalizar o seu peluche.';
    }
    if (!selectedPrintifyVariantId) {
      return 'Por favor, escolha o animal do peluche.';
    }
    if (!userInfo) {
      return 'Por favor, faça login para continuar.';
    }
    return null; // Sucesso
  },

  // Configuração específica do seletor de variantes
  variantSelectorConfig: {
    label: 'Animal do Peluche',
    emoji: '🧸'
  },

  // Componente de seleção de variantes
  VariantSelectorComponent: 'PelucheVariantSelector',

  // Configuração para não mostrar controlos de posição
  positionControls: {
    showPositionControls: false,
    allowVertical: false,
    allowHorizontal: false,
    showRotation: false
  }
}; 