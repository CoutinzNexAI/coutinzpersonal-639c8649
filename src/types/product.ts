import React from 'react';

// Tipos compartilhados para produtos
export interface ImageAdjustments {
  x: number;          // Posição X da imagem dentro da área de impressão (0-1, percentagem)
  y: number;          // Posição Y da imagem dentro da área de impressão (0-1, percentagem)
  scale: number;      // Zoom (escala, 1 = tamanho original)
  rotation?: number;  // Rotação em graus (se suportada pelo produto)
  cropArea?: {        // Área de crop da imagem original
    x: number;        // X do crop em percentagem da imagem original
    y: number;        // Y do crop em percentagem da imagem original
    width: number;    // Largura do crop em percentagem da imagem original
    height: number;   // Altura do crop em percentagem da imagem original
  };
}

// Estrutura de uma variante de produto
export interface ProductVariant {
  id: number;
  title: string;
  priceAdjustment?: number;
  placeholderWidth: number;
  placeholderHeight: number;
  enabled?: boolean;
}

// Estrutura completa de um produto Printify
export interface PrintifyProductMapping {
  id: string;
  name: string;
  category: string;
  basePrice?: number;
  price?: number;
  variants?: ProductVariant[];
  printAreasConfig?: Array<{
    defaultAngle?: number;
    [key: string]: unknown;
  }>;
  defaultDesign?: {
    scale: number;
    x: number;
    y: number;
    angle: number;
    print_on_side?: string;
  };
  [key: string]: unknown;
}

// Props para componentes seletores de variantes
export interface VariantSelectorProps {
  product: PrintifyProductMapping;
  selectedVariantId: number | null;
  onVariantChange: (variantId: number) => void;
}

// Estrutura de um item de descrição
export interface DescriptionItem {
  text: string;
  color?: string;
  emoji?: string;
}

// Estrutura de um item de garantia
export interface GuaranteeItem {
  icon: string;
  title: string;
}

// Estrutura de um tier de desconto
export interface DiscountTier {
  min: number;
  discount: number;
  label: string;
  emoji?: string;
}

// Configuração de coordenadas/posicionamento
export interface CoordinateConfig {
  positionType: 'vertical' | 'horizontal';
  positions: readonly ['top', 'center', 'bottom'] | readonly ['left', 'center', 'right'];
}

// Configuração do seletor de variantes
export interface VariantSelectorConfig {
  label: string;
  emoji: string;
  getCustomSingleVariantText?: (product: PrintifyProductMapping) => string | undefined;
  getCustomSingleVariantSubtext?: (product: PrintifyProductMapping) => string | undefined;
}

// Dimensões de imagem
export interface ImageDimensions {
  width: number;
  height: number;
}

// Interface principal de configuração de produto
export interface ProductConfig {
  productCategory: string;
  
  // Função para calcular preço base (com descontos especiais aplicados)
  getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null) => number;
  
  // ✅ NOVO: Função para obter preço original (sem descontos especiais, para cálculos de entrega grátis)
  getOriginalPrice?: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null) => number;
  
  // Regras de desconto
  discountTiers: DiscountTier[];
  
  // Itens de descrição (função que recebe produto e retorna array)
  descriptionItems: (product: PrintifyProductMapping) => DescriptionItem[];
  
  // Itens de garantias (função que retorna array)
  guaranteeItems: () => GuaranteeItem[];
  
  // Configuração de coordenadas/posicionamento
  coordinateConfig: CoordinateConfig;
  
  // Função para calcular coordenadas Printify
  calculatePrintifyCoords: (
    position: 'top' | 'center' | 'bottom',
    variantId: number,
    imageDimensions: ImageDimensions,
    product: PrintifyProductMapping
  ) => ImageAdjustments;
  
  // Função de validação de compra
  validatePurchase: (
    selectedImageUrl: string,
    selectedImageId: string | null,
    userInfo: unknown,
    selectedPrintifyVariantId: number | null,
    printifyProductId: string,
    printifyImageId: string
  ) => string | null;
  
  // Configuração do seletor de variantes
  variantSelectorConfig: VariantSelectorConfig;
  
  // Componente de seleção de variantes (referência por string para evitar imports circulares)
  VariantSelectorComponent: string;
}

// Props para o GenericProductPage
export interface GenericProductPageProps {
  product: PrintifyProductMapping;
  config: ProductConfig;
}

// Props comuns para páginas de produtos (mantido para compatibilidade)
export interface BaseProductPageProps {
  product: PrintifyProductMapping;
}

// Configuração de animações padronizada
export const PRODUCT_ANIMATIONS = {
  container: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6 }
  },
  sidebar: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, delay: 0.2 }
  },
  button: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: 0.3 }
  }
} as const;

// Classes CSS padronizadas
export const PRODUCT_STYLES = {
  card: "relative overflow-hidden bg-gradient-to-br from-white via-white to-ghibli-cream/20 backdrop-blur-xl border border-ghibli-sand/20 shadow-lg lg:shadow-2xl hover:shadow-xl lg:hover:shadow-3xl transition-all duration-500 rounded-2xl lg:rounded-3xl mx-2 sm:mx-0",
  canvas: "relative w-full h-[400px] sm:h-[500px] lg:h-[700px] bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl overflow-hidden mb-4 lg:mb-6 border border-ghibli-sand/20",
  button: {
    primary: "w-full h-12 sm:h-14 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light text-white font-bold py-3 px-4 sm:px-8 rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 text-sm sm:text-base",
    secondary: "w-full h-10 sm:h-12 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium hover:border-ghibli-moss/60 focus:border-ghibli-moss transition-all duration-200 shadow-sm hover:shadow-md"
  }
} as const; 