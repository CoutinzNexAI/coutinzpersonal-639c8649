import { Shield, Sparkles, Truck, Award } from 'lucide-react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

export const bagConfig = {
  // ✅ CATEGORIA: Sacos/Bags
  productCategory: 'bags',

  // ✅ PREÇO: Base para sacos
  getBasePrice: (product: PrintifyProductMapping, _selectedPrintifyVariantId: number | null) => {
    return product.basePrice || 18; // €18 preço base para sacos
  },

  // ✅ DESCONTOS: Escalonados por quantidade
  discountTiers: [
    { min: 2, discount: 10, label: 'sacos', emoji: '💡' },
    { min: 3, discount: 15, label: 'sacos', emoji: '🔥' }
  ],

  // ✅ DESCRIÇÃO: Específica para sacos - 3 tópicos diretos
  descriptionItems: (_product: PrintifyProductMapping) => [
    { text: 'Material algodão 100% sustentável', color: 'moss' as const },
    { text: 'Impressão HD duradoura e resistente', color: 'moss' as const },
    { text: 'Alças reforçadas para uso diário', color: 'wood' as const }
  ],

  // ✅ GARANTIAS: Ícones de qualidade
  guaranteeItems: () => [
    { icon: Shield, title: 'Qualidade Premium' },
    { icon: Sparkles, title: 'Impressão HD' },
    { icon: Truck, title: 'Envio Rápido' },
    { icon: Award, title: 'Garantia Total' }
  ],

  // ✅ VALIDAÇÃO: Específica para sacos
  validatePurchase: (selectedImageUrl: string, selectedImageId: string | null, userInfo: unknown, selectedPrintifyVariantId: number | null, printifyProductId: string, printifyImageId: string) => {
    if (!selectedImageUrl) return 'Por favor, escolha uma arte para o seu saco.';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione uma variante do saco.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  },

  // ✅ SELETOR DE VARIANTES: Configuração padrão
  variantSelectorConfig: {
    label: 'Tipo de Saco',
    emoji: '🛍️'
  },

  // Componente de seleção de variantes
  VariantSelectorComponent: 'ToteBagVariantSelector',

  // 🎯 A MAGIA ACONTECE AQUI:
  // Ao OMITIR `coordinateConfig` e `calculatePrintifyCoords`, o GenericProductPage
  // irá automaticamente esconder TODOS os controlos de posição (Cima/Baixo/Centro, etc.)
  // para este tipo de produto, tanto em mobile como em desktop.
  // O Templo adapta-se ao produto.
}; 