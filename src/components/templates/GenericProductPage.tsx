// Template genérico para páginas de produto - Loja PicTuz
// Este componente será usado como base para todas as páginas de produto específicas 

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, ChevronLeft, ChevronRight, RotateCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PromotionalBanner from '@/components/landing/PromotionalBanner';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/providers/CartProvider';
import { ImageAdjustments, PRODUCT_ANIMATIONS, PRODUCT_STYLES } from '@/types/product';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { GlobalRateLimiter } from '@/lib/utils/rateLimiter';
import { 
  trackProductView, 
  trackVariantSelection, 
  trackImageCustomization, 
  trackMockupGeneration,
  trackPersonalizationStart,
  trackPersonalizationComplete,
  trackAddToCart 
} from '@/lib/posthog';
import { getFakeDiscountInfo } from '@/lib/fakeDiscounts';
import * as fpixel from '@/lib/fpixel';

// Componentes compartilhados
import ProductQuantityPricing from '@/components/shared/ProductQuantityPricing';
import ProductArtStatus from '@/components/shared/ProductArtStatus';
import ProductGuarantees from '@/components/shared/ProductGuarantees';

import ProductVariantSelector from '@/components/shared/ProductVariantSelector';
import ProductAddToCartButton from '@/components/shared/ProductAddToCartButton';
import ProductMobileControls from '@/components/shared/ProductMobileControls';
import ProductCardDecorations from '@/components/shared/ProductCardDecorations';
import PhoneCaseVariantSelector from '@/components/shared/product-customization/PhoneCaseVariantSelector';
import FramedCanvasVariantSelector from '@/components/shared/product-customization/FramedCanvasVariantSelector';
import ToteBagVariantSelector from '@/components/shared/product-customization/ToteBagVariantSelector';
import NotebookVariantSelector from '@/components/shared/product-customization/NotebookVariantSelector';
import PelucheVariantSelector from '@/components/shared/product-customization/PelucheVariantSelector';

interface GenericProductPageProps {
  product: PrintifyProductMapping;
  config: {
    productCategory: string;
    getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null) => number;
    // ✅ REMOVIDO: discountTiers (substituído por sistema fake)
    descriptionItems: (product: PrintifyProductMapping) => Array<{ text: string; color?: 'moss' | 'wood'; emoji?: string; }>;
    guaranteeItems: () => Array<{ icon: React.ComponentType<{ className?: string }>; title: string; }>;
    coordinateConfig?: { positionType: string; positions: readonly string[]; };
    getCoordinateConfig?: (product: PrintifyProductMapping) => { positionType: string; positions: readonly string[]; };
    calculatePrintifyCoords?: (position: string, variantId: number, imageDimensions: { width: number; height: number }, product: PrintifyProductMapping) => ImageAdjustments;
    validatePurchase: (selectedImageUrl: string, selectedImageId: string | null, userInfo: unknown, selectedPrintifyVariantId: number | null, printifyProductId: string, printifyImageId: string) => string | null;
    positionControls?: { showPositionControls: boolean; allowVertical: boolean; allowHorizontal: boolean; showRotation: boolean; };
    variantSelectorConfig: { label: string; emoji: string; getCustomSingleVariantText?: (product: PrintifyProductMapping) => string | undefined; getCustomSingleVariantSubtext?: (product: PrintifyProductMapping) => string | undefined; };
    getVariantSelectorComponent?: (product: PrintifyProductMapping) => string;
    VariantSelectorComponent: string;
  };
}

const GenericProductPage: React.FC<GenericProductPageProps> = ({ product, config }) => {
  const router = useRouter();
  const { userInfo } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  
  // Resolver coordinateConfig dinamicamente
  const coordinateConfig = config.getCoordinateConfig ? config.getCoordinateConfig(product) : config.coordinateConfig;
  
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  
  // Estados para Printify
  const [printifyPreviewUrls, setPrintifyPreviewUrls] = useState<string[]>([]);
  const [printifyImageId, setPrintifyImageId] = useState<string>('');
  const [printifyProductId, setPrintifyProductId] = useState<string>('');
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState<number | null>(null);

  // Estados específicos do produto
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imagePosition, setImagePosition] = useState<'top' | 'center' | 'bottom' | 'left' | 'right'>('center');
  const [currentMockupUrls, setCurrentMockupUrls] = useState<string[]>([]);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState<boolean>(false);
  const [quantity, setQuantity] = useState(1);

  // ✅ ESTADOS PARTILHADOS PARA CONTROLAR GERAÇÃO DE MOCKUPS
  const [hasGenerated, setHasGenerated] = useState(false);
  const [mockupGenerationKey, setMockupGenerationKey] = useState('');
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // ✅ SIMPLIFICADO: Cálculos de preço sem descontos de quantidade
  const basePrice = config.getBasePrice(product, selectedPrintifyVariantId);
  const totalPrice = basePrice * quantity;

  // Track product view on component mount
  useEffect(() => {
    if (product && userInfo?.id) {
      trackProductView({
        user_id: userInfo.id,
        product_id: product.id,
        product_name: product.name,
        product_category: product.category || config.productCategory,
        product_price: config.getBasePrice(product, selectedPrintifyVariantId),
        view_source: 'direct_link',
        has_selected_image: !!selectedImageUrl,
        referrer_product: document.referrer.includes('/shop/') ? 'shop_listing' : undefined
      });

      // 🚀 FACEBOOK PIXEL: ViewContent event
      fpixel.trackViewContent({
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: config.getBasePrice(product, selectedPrintifyVariantId),
        currency: 'EUR',
        content_category: config.productCategory
      });
    }
  }, [product, userInfo?.id]); // Only track once per user/product

  // Setup inicial do produto
  useEffect(() => {
    if (product?.variants?.length) {
      // Para poster vertical, usar o tamanho 18" x 24" (45,7 x 61,0 cm) como padrão
      if (product.id === 'poster_vertical_semi_glossy') {
        const targetVariant = product.variants.find(v => v.id === 92401); // 18" x 24" (45,7 x 61,0 cm)
        if (targetVariant) {
          setSelectedPrintifyVariantId(targetVariant.id);
        } else {
          setSelectedPrintifyVariantId(product.variants[0].id); // Fallback para primeira
        }
      }
      // Para poster horizontal, usar o tamanho 24" x 18" (60,96 x 45,72 cm) como padrão
      else if (product.id === 'poster_horizontal_semi_glossy') {
        const targetVariant = product.variants.find(v => v.id === 92381); // 24" x 18" (60,96 x 45,72 cm)
        if (targetVariant) {
          setSelectedPrintifyVariantId(targetVariant.id);
      } else {
          setSelectedPrintifyVariantId(product.variants[0].id); // Fallback para primeira
        }
      }
      // Para canvas, usar o tamanho 14" x 14" (36cm x 36cm) como padrão
      else if (product.id === 'custom_canvas') {
        const targetVariant = product.variants.find(v => v.id === 91658); // 14" x 14" (36cm x 36cm)
        if (targetVariant) {
          setSelectedPrintifyVariantId(targetVariant.id);
        } else {
          setSelectedPrintifyVariantId(product.variants[0].id); // Fallback para primeira
        }
      }
      else {
        const firstVariant = product.variants[0];
        setSelectedPrintifyVariantId(firstVariant.id);
      }
    }
  }, [product]);

  // Track variant selection
  useEffect(() => {
    if (selectedPrintifyVariantId && userInfo?.id && product) {
      const variant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
      if (variant) {
        const basePrice = config.getBasePrice(product, selectedPrintifyVariantId);
        const defaultPrice = config.getBasePrice(product, null);
        trackVariantSelection({
          user_id: userInfo.id,
          product_id: product.id,
          variant_id: selectedPrintifyVariantId,
          variant_name: variant.title,
          price_change: basePrice - defaultPrice,
          selection_method: 'dropdown',
          previous_variant_id: undefined,
          time_to_select: 2
        });
      }
    }
  }, [selectedPrintifyVariantId, userInfo?.id, product]);

  // Track image selection and personalization start
  useEffect(() => {
    if (selectedImageUrl && userInfo?.id && product) {
      trackPersonalizationStart({
        user_id: userInfo.id,
        product_id: product.id,
        starting_configuration: {
          image_url: selectedImageUrl,
          position: imagePosition,
          variant_id: selectedPrintifyVariantId
        },
        entry_point: 'product_page'
      });
    }
  }, [selectedImageUrl, userInfo?.id, product]);

  // Track image customization when position changes
  useEffect(() => {
    if (imagePosition && userInfo?.id && product && selectedImageUrl) {
      trackImageCustomization({
        user_id: userInfo.id,
        product_id: product.id,
        action: 'position_change',
        from_value: 'center',
        to_value: imagePosition,
        adjustment_count: 1,
        total_time_customizing: 30
      });
    }
  }, [imagePosition, userInfo?.id, product, selectedImageUrl, selectedPrintifyVariantId]);

  // ✅ LER QUERY PARAMETERS PARA IMAGEM AUTOMÁTICA (vinda das transformações)
  useEffect(() => {
    const { imageUrl, imageId, fromTransformation } = router.query;
    
    if (imageUrl && typeof imageUrl === 'string' && !selectedImageUrl) {
      setSelectedImageUrl(imageUrl);
      setSelectedImageId((imageId as string) || null);
      
      // Reset estados para nova imagem
      setPrintifyPreviewUrls([]);
      setPrintifyImageId('');
      setPrintifyProductId('');
      setImageAdjustments(undefined);
      setHasGenerated(false);
      
      // Arte aplicada automaticamente - visual feedback é suficiente
    }
  }, [router.query, selectedImageUrl]);

  // ✅ CONTROLO ÚNICO DE MOCKUP GENERATION KEY
  useEffect(() => {
    if (selectedImageUrl && selectedPrintifyVariantId) {
      const newKey = `${selectedImageId || 'no-id'}-${selectedPrintifyVariantId}-${imagePosition}`;
      // ✅ FIXED: Only update if key actually changed to avoid unnecessary re-renders
      if (mockupGenerationKey !== newKey) {
        setMockupGenerationKey(newKey);
        // 🚀 CORREÇÃO: Reset hasGenerated quando key muda para permitir nova geração
        setHasGenerated(false);
      }
    }
  }, [selectedImageUrl, selectedPrintifyVariantId, selectedImageId, imagePosition, mockupGenerationKey]);

  // ✅ RESET PREVIEW INDEX QUANDO URLS MUDAM
  useEffect(() => {
    if (printifyPreviewUrls.length > 0) {
      setCurrentPreviewIndex(0);
    }
  }, [printifyPreviewUrls]);

  // Calcular imageAdjustments usando a configuração
  useEffect(() => {
    if (selectedImageUrl && product && selectedPrintifyVariantId && userImageDimensions) {
      const selectedVariant = product.variants?.find((v) => v.id === selectedPrintifyVariantId);
      if (!selectedVariant) {
        return;
      }

      let newAdjustments: ImageAdjustments;

      // ✅ USAR A FUNÇÃO calculatePrintifyCoords DO CONFIG SE DISPONÍVEL
      if (config.calculatePrintifyCoords && coordinateConfig) {
        newAdjustments = config.calculatePrintifyCoords(
          imagePosition,
          selectedPrintifyVariantId,
          userImageDimensions,
          product
        );
      } else {
        // ✅ FALLBACK PARA CÁLCULO MANUAL CORRETO
        const { placeholderWidth, placeholderHeight } = selectedVariant;
        const { width: userImageWidth, height: userImageHeight } = userImageDimensions;

        const scaleToCover = Math.max(
          placeholderWidth / userImageWidth,
          placeholderHeight / userImageHeight
        );

        const finalImageWidth = userImageWidth * scaleToCover;
        const printifyScale = finalImageWidth / placeholderWidth;
        
        // ✅ APLICAR POSIÇÃO CORRETA BASEADA NO TIPO
        let xPosition = 0.5;
        let yPosition = 0.5;
        
        if (coordinateConfig?.positionType === 'vertical') {
          // Para canecas, posters horizontais (movimento vertical)
          if (imagePosition === 'top') yPosition = 0.35;
          else if (imagePosition === 'bottom') yPosition = 0.65;
        } else if (coordinateConfig?.positionType === 'horizontal') {
          // Para capas, posters verticais (movimento horizontal)
          if (imagePosition === 'left') xPosition = 0.35;
          else if (imagePosition === 'right') xPosition = 0.65;
        }
        
        newAdjustments = {
          x: xPosition,
          y: yPosition,
          scale: printifyScale,
          rotation: 0
        };

      }
      
      // ✅ FIXED: Only update if the adjustments actually changed
      if (!imageAdjustments || 
          imageAdjustments.x !== newAdjustments.x ||
          imageAdjustments.y !== newAdjustments.y ||
          imageAdjustments.scale !== newAdjustments.scale ||
          imageAdjustments.rotation !== newAdjustments.rotation) {
        
        setImageAdjustments(newAdjustments);
      }
    }
  }, [selectedImageUrl, product?.id, selectedPrintifyVariantId, imagePosition, userImageDimensions, imageAdjustments]); // ✅ FIXED: Removed config and coordinateConfig dependencies

  // Detectar dimensões da imagem
  useEffect(() => {
    if (selectedImageUrl) {
      const img = new Image();
      img.onload = () => {
        setUserImageDimensions({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        setUserImageDimensions({ width: 1016, height: 1016 });
      };
      img.src = selectedImageUrl;
    } else {
      setUserImageDimensions(null);
    }
  }, [selectedImageUrl]);

  // Handlers
  const handlePreviewReady = useCallback((data: {
    previewUrls: string[];
    printifyImageId?: string;
    printifyProductId: string;
    customerPrintifyImageId?: string;
    dynamicPhrasePrintifyImageId?: string;
  }) => {
    // ✅ CONTROLO PARTILHADO: Só atualizar se ainda não foi gerado
    if (!hasGenerated && data.previewUrls.length > 0) {
      setPrintifyPreviewUrls(data.previewUrls);
      setPrintifyImageId(data.printifyImageId || '');
      setPrintifyProductId(data.printifyProductId);
      setHasGenerated(true);
      
      // 🚀 CORREÇÃO: Resetar loading quando novos previews chegam
      setIsGeneratingMockup(false);
      
      if (currentMockupUrls.length === 0) {
        setCurrentMockupUrls(data.previewUrls);
      }
    }
  }, [hasGenerated, currentMockupUrls]); // ✅ Removido mockupGenerationKey para evitar re-creations

  // Track mockup generation
  const handleMockupGenerated = useCallback(() => {
    if (userInfo?.id && product && selectedImageUrl) {
      trackMockupGeneration({
        user_id: userInfo.id,
        product_id: product.id,
        variant_id: selectedPrintifyVariantId,
        generation_trigger: 'position_change',
        generation_time_ms: 2000,
        success: true,
        mockup_count: 1
      });
    }
    
    // 🚀 CORREÇÃO: Sempre resetar loading quando mockup é gerado
    setHasGenerated(true);
    setIsGeneratingMockup(false);
  }, [userInfo?.id, product, selectedImageUrl, selectedPrintifyVariantId]);

  // Handle gallery modal
  const handleOpenGallery = useCallback(() => {
    setIsGalleryModalOpen(true);
  }, []);

  // Handle image selection from gallery
  const handleSelectImageFromGallery = useCallback((imageUrl: string, imageId: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    setIsGalleryModalOpen(false);
    
    // Reset states for new image
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    setImageAdjustments(undefined);
    setHasGenerated(false);
  }, []);

  // Handle adjustments (position and size)
  const handleAdjustment = useCallback(async (type: 'position' | 'size', value: string | number) => {
    // Rate limiting check
    const { allowed, message } = GlobalRateLimiter.checkRequestLimit();
    if (!allowed) {
      toast.error(message);
      return;
    }

    // Only check userImageDimensions for position changes
    if (type === 'position' && !userImageDimensions) {
      toast.error('Aguarde o carregamento da imagem');
      return;
    }

    let newPosition = imagePosition;
    let newVariantId = selectedPrintifyVariantId;

    if (type === 'position' && typeof value === 'string') {
      newPosition = value as 'top' | 'center' | 'bottom' | 'left' | 'right';
      
      // 🚀 CORREÇÃO: Ativar loading IMEDIATAMENTE quando muda posição
      setIsGeneratingMockup(true);
      
      setImagePosition(newPosition);
      // ✅ RESET hasGenerated para permitir nova geração
      setHasGenerated(false);
    } else if (type === 'size' && typeof value === 'number') {
      newVariantId = value;
      
      // 🚀 CORREÇÃO: Ativar loading IMEDIATAMENTE quando muda tamanho
      setIsGeneratingMockup(true);
      
      setSelectedPrintifyVariantId(newVariantId);
      // Reset position when variant changes
      setImagePosition('center');
      newPosition = 'center';
      // ✅ RESET hasGenerated para permitir nova geração
      setHasGenerated(false);
    }

    // Record the request
    GlobalRateLimiter.recordRequest();

    // 🚀 CORREÇÃO: Timeout de segurança para resetar loading se não houver resposta
    const safetyTimeout = setTimeout(() => {
      setIsGeneratingMockup(false);
    }, 15000); // 15 segundos timeout

    // Limpar timeout se o componente desmontar ou houver nova mudança
    return () => clearTimeout(safetyTimeout);
  }, [imagePosition, selectedPrintifyVariantId, userImageDimensions, selectedImageUrl]);

  // Handle add to cart
  const handleAddToCart = useCallback(async () => {
    const validationError = config.validatePurchase(
      selectedImageUrl,
      selectedImageId,
      userInfo,
      selectedPrintifyVariantId,
      printifyProductId,
      printifyImageId
    );
    
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const variant = product.variants?.find((v) => v.id === selectedPrintifyVariantId);

      // Convert position to readable text
      const getPositionText = (position: string) => {
        const positionMap: Record<string, string> = {
          'center': 'Centro',
          'top': 'Cima',
          'bottom': 'Baixo',
          'left': 'Esquerda',
          'right': 'Direita'
        };
        return positionMap[position] || 'Centro';
      };

      // Track personalization complete before adding to cart
      if (userInfo?.id) {
        trackPersonalizationComplete({
          user_id: userInfo.id,
          product_id: product.id,
          final_configuration: {
            position: imagePosition,
            variant_id: selectedPrintifyVariantId,
            image_url: selectedImageUrl,
            adjustments: imageAdjustments
          },
          total_adjustments: 1,
          time_spent_personalizing: 30, // Approximate
          satisfaction_indicators: {
            mockup_views: hasGenerated ? 1 : 0,
            position_adjustments: 1,
            variant_changes: 1
          }
        });
      }

      const success = addToCart({
        productId: product.id,
        productName: product.name,
        productCategory: product.category || config.productCategory,
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId!,
        price: basePrice,
        quantity: quantity,
        customizations: {
          variantId: selectedPrintifyVariantId!,
          variant: variant?.title || 'Variante não encontrada',
          scale: imageAdjustments?.scale || 1,
          x: imageAdjustments?.x || 0.5,
          y: imageAdjustments?.y || 0.5,
          angle: imageAdjustments?.rotation || 0,
          position: getPositionText(imagePosition),
        },
        imageAdjustments,
      });

      if (success) {
        setIsCartOpen(true);
      }
    } catch (error) {
      toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [
    config, selectedImageUrl, selectedImageId, userInfo, selectedPrintifyVariantId, 
    printifyProductId, printifyImageId, product, basePrice, quantity, imageAdjustments, 
    imagePosition, hasGenerated, addToCart, setIsCartOpen
  ]);

  // Track product view on component mount
  useEffect(() => {
    if (product && userInfo?.id) {
      trackProductView({
        user_id: userInfo.id,
        product_id: product.id,
        product_name: product.name,
        product_category: product.category || config.productCategory,
        product_price: config.getBasePrice(product, selectedPrintifyVariantId),
        view_source: 'direct_link',
        has_selected_image: !!selectedImageUrl,
        referrer_product: document.referrer.includes('/shop/') ? 'shop_listing' : undefined
      });
    }
  }, [product, userInfo?.id]); // Only track once per user/product

  // Track variant selection
  useEffect(() => {
    if (selectedPrintifyVariantId && userInfo?.id && product) {
      const variant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
      if (variant) {
        const basePrice = config.getBasePrice(product, selectedPrintifyVariantId);
        const defaultPrice = config.getBasePrice(product, null);
        trackVariantSelection({
          user_id: userInfo.id,
          product_id: product.id,
          variant_id: selectedPrintifyVariantId,
          variant_name: variant.title,
          price_change: basePrice - defaultPrice,
          selection_method: 'dropdown',
          previous_variant_id: undefined,
          time_to_select: 2
        });
      }
    }
  }, [selectedPrintifyVariantId, userInfo?.id, product]);

  // Track image customization when position changes
  useEffect(() => {
    if (imagePosition && userInfo?.id && product && selectedImageUrl) {
      trackImageCustomization({
        user_id: userInfo.id,
        product_id: product.id,
        action: 'position_change',
        from_value: 'center',
        to_value: imagePosition,
        adjustment_count: 1,
        total_time_customizing: 30
      });
    }
  }, [imagePosition, userInfo?.id, product, selectedImageUrl, selectedPrintifyVariantId]);

  // Condições auxiliares
  const isProcessingMockup = (!printifyProductId || !printifyImageId) && selectedImageUrl;
  const canPurchase = selectedImageUrl && printifyProductId && printifyImageId && selectedPrintifyVariantId && userInfo;

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-ghibli-moss border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ghibli-earth">A carregar produto...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name} - Loja PicTuz</title>
        <meta name="description" content={`Personalize a sua ${product.name} com as suas criações AI.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        {/* Banner Promocional */}
        <PromotionalBanner />

        {/* Header com margem ajustada */}
        <div className="relative z-40">
          <Header />
        </div>
        
        <main className="container mx-auto px-2 sm:px-4 pt-24 pb-6 sm:pt-24 sm:pb-8 lg:pt-28 lg:pb-8">
          {/* ✅ TÍTULO - MOBILE ONLY */}
          <div className="block lg:hidden">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6 px-4"
            >
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-ghibli-earth via-ghibli-wood to-ghibli-moss bg-clip-text text-transparent leading-tight tracking-tight">
                {product.name}
              </h1>
            </motion.div>
          </div>

          {/* ✅ MOCKUP MOBILE ONLY - Display das imagens */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 block lg:hidden"
          >
            <div className={`relative w-full h-[350px] ${printifyPreviewUrls.length > 0 ? 'bg-transparent' : 'bg-white'} rounded-2xl shadow-xl overflow-hidden border border-ghibli-sand/20`}>
              {/* ✅ MOBILE: SÓ MOSTRA IMAGENS (não gera) */}
              {printifyPreviewUrls.length > 0 ? (
                <div className="relative w-full h-full flex items-center justify-center bg-transparent">
                  <img
                    src={printifyPreviewUrls[currentPreviewIndex] || printifyPreviewUrls[0]}
                    alt="Preview mockup"
                    className="max-w-full max-h-full object-contain drop-shadow-2xl"
                    style={{ maxHeight: '90%' }}
                  />
                  
                  {printifyPreviewUrls.length > 1 && (
                    <>
                      <Button
                        onClick={() => setCurrentPreviewIndex(prev => prev === 0 ? printifyPreviewUrls.length - 1 : prev - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-ghibli-earth shadow-lg border border-ghibli-sand/30"
                        size="sm"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      
                      <Button
                        onClick={() => setCurrentPreviewIndex(prev => prev === printifyPreviewUrls.length - 1 ? 0 : prev + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-ghibli-earth shadow-lg border border-ghibli-sand/30"
                        size="sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </>
                  )}
                </div>
              ) : selectedImageUrl ? (
                <div className="relative w-full h-full flex items-center justify-center bg-white">
                  <div className="relative">
                    <div className="w-16 h-16 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RotateCw className="w-8 h-8 animate-spin text-ghibli-moss" />
                    </div>
                    <div className="text-center">
                      <p className="text-ghibli-earth font-semibold text-lg">A gerar...</p>
                      <p className="text-ghibli-earth/60 text-sm mt-1">A reposicionar arte</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
                  {/* ✅ MOBILE: Layout igual ao desktop com imagem específica do produto */}
                  <div className="mb-4">
                    {/* Imagem específica baseada no produto */}
                    {product.id === 'custom_phone_case' && (
                      <img
                        src="/mockupproduto/telemovel.png"
                        alt="Capa de Telemóvel Personalizada"
                        className="w-32 h-32 object-contain opacity-60"
                      />
                    )}
                    {product.id === 'custom_canvas' && (
                      <img
                        src="/mockupproduto/canva.png"
                        alt="Canvas Personalizado"
                        className="w-32 h-32 object-contain opacity-60"
                      />
                    )}

                    {product.id === 'ceramic_mug' && (
                      <img
                        src="/mockupproduto/canecapersonalizada.png"
                        alt="Caneca Personalizada"
                        className="w-32 h-32 object-contain opacity-60"
                      />
                    )}
                    {product.id === 'heart_mug' && (
                      <img
                        src="/mockupproduto/canecacoracao.png"
                        alt="Caneca de Coração"
                        className="w-32 h-32 object-contain opacity-60"
                      />
                    )}
                    {product.id === 'poster_horizontal_semi_glossy' && (
                      <img
                        src="/mockupproduto/posterhorizontal.png"
                        alt="Poster Horizontal"
                        className="w-32 h-32 object-contain opacity-60"
                      />
                    )}
                    {product.id === 'poster_vertical_semi_glossy' && (
                      <img
                        src="/mockupproduto/postervertical.png"
                        alt="Poster Vertical"
                        className="w-32 h-32 object-contain opacity-60"
                      />
                    )}
                    {product.id === 'tote_bag' && (
                      <img
                        src="/mockupproduto/saco.png"
                        alt="Saco Personalizado"
                        className="w-32 h-32 object-contain opacity-60"
                      />
                    )}
                    {product.id === 'spiral_journal' && (
                      <img
                        src="/mockupproduto/caderno.png"
                        alt="Caderno Personalizado"
                        className="w-32 h-32 object-contain opacity-60"
                      />
                    )}
                    {product.id === 'mouse_pad' && (
                      <img
                        src="/mockupproduto/mousepad.png"
                        alt="Mouse Pad Personalizado"
                        className="w-32 h-32 object-contain opacity-60"
                      />
                    )}
                    {product.id === 'plush_toy_tshirt' && (
                      <img
                        src="/mockupproduto/peluche.png"
                        alt="Peluche com T-Shirt Personalizada"
                        className="w-32 h-32 object-contain opacity-60"
                      />
                    )}
                    {/* Fallback para produtos não especificados */}
                    {!['custom_phone_case', 'custom_canvas', 'ceramic_mug', 'heart_mug', 'poster_horizontal_semi_glossy', 'poster_vertical_semi_glossy', 'tote_bag', 'spiral_journal', 'mouse_pad', 'plush_toy_tshirt'].includes(product.id) && (
                      <div className="w-32 h-32 bg-ghibli-cream/50 rounded-xl border-2 border-dashed border-ghibli-sand flex items-center justify-center">
                        <span className="text-4xl opacity-40">📷</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Texto personalizado baseado no produto */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-ghibli-earth mb-2">
                      {product.id === 'custom_phone_case' && 'Capa de Telemóvel Personalizada'}
                      {product.id === 'custom_canvas' && 'Canvas Personalizável'}

                      {product.id === 'ceramic_mug' && 'Caneca Personalizada'}
                      {product.id === 'heart_mug' && 'Caneca de Coração Personalizada'}
                      {product.id === 'poster_horizontal_semi_glossy' && 'Poster Horizontal Personalizado'}
                      {product.id === 'poster_vertical_semi_glossy' && 'Poster Vertical Personalizado'}
                      {product.id === 'tote_bag' && 'Saco Personalizado'}
                      {product.id === 'spiral_journal' && 'Caderno Personalizado'}
                      {product.id === 'mouse_pad' && 'Mouse Pad Personalizado'}
                      {product.id === 'plush_toy_tshirt' && 'Peluche com T-Shirt Personalizada'}
                      {!['custom_phone_case', 'custom_canvas', 'ceramic_mug', 'heart_mug', 'poster_horizontal_semi_glossy', 'poster_vertical_semi_glossy', 'tote_bag', 'spiral_journal', 'mouse_pad', 'plush_toy_tshirt'].includes(product.id) && 'Escolha uma Foto'}
                    </h3>
                    <p className="text-ghibli-earth/70 text-sm leading-relaxed">
                      {product.id === 'custom_phone_case' && 'Escolha uma foto e veja a sua capa personalizada ganhar vida.'}
                      {product.id === 'custom_canvas' && 'Escolha uma foto e veja o seu canvas personalizado ganhar vida.'}

                      {product.id === 'ceramic_mug' && 'Escolha uma foto e veja a sua caneca personalizada ganhar vida.'}
                      {product.id === 'heart_mug' && 'Escolha uma foto e veja a sua caneca personalizada ganhar vida.'}
                      {product.id === 'poster_horizontal_semi_glossy' && 'Escolha uma foto e veja o seu poster horizontal ganhar vida.'}
                      {product.id === 'poster_vertical_semi_glossy' && 'Escolha uma foto e veja o seu poster vertical ganhar vida.'}
                      {product.id === 'tote_bag' && 'Escolha uma foto e veja o seu saco sustentável ganhar vida.'}
                      {product.id === 'spiral_journal' && 'Escolha uma foto e veja o seu caderno personalizado ganhar vida.'}
                      {product.id === 'mouse_pad' && 'Escolha uma foto e veja o seu mouse pad personalizado ganhar vida.'}
                      {product.id === 'plush_toy_tshirt' && 'Escolha uma foto e veja o seu peluche fofo com T-shirt personalizada ganhar vida.'}
                      {!['custom_phone_case', 'custom_canvas', 'ceramic_mug', 'heart_mug', 'poster_horizontal_semi_glossy', 'poster_vertical_semi_glossy', 'tote_bag', 'spiral_journal', 'mouse_pad', 'plush_toy_tshirt'].includes(product.id) && 'Selecione uma das suas transformações AI para personalizar.'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* ✅ OVERLAY MOBILE para mudança de posição - SÓ quando há imagem, está a gerar E não há previews */}
              {isGeneratingMockup && selectedImageUrl && printifyPreviewUrls.length === 0 && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RotateCw className="w-8 h-8 animate-spin text-ghibli-moss" />
                    </div>
                    <p className="text-ghibli-earth font-semibold text-lg">A gerar...</p>
                    <p className="text-ghibli-earth/60 text-sm mt-1">A reposicionar arte</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Layout Mobile */}
          <div className="block lg:hidden">

            {/* ✅ CONTROLOS MOBILE */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-6"
            >
              {/* Controlos de Trocar Arte + Posição - PRIMEIRO */}
              <ProductMobileControls
                selectedImageUrl={selectedImageUrl}
                userImageDimensions={userImageDimensions}
                product={product}
                imagePosition={imagePosition}
                isGeneratingMockup={isGeneratingMockup}
                userInfo={userInfo}
                onOpenGallery={handleOpenGallery}
                onAdjustPosition={(position) => handleAdjustment('position', position)}
                            positionType={(coordinateConfig?.positionType as 'vertical' | 'horizontal') || 'vertical'}
            showPositionControls={config.positionControls?.showPositionControls !== false && !!coordinateConfig}
              />

              {/* Seletor de Variantes Mobile - DEPOIS */}
              <div className="px-4 mb-4 mt-4">
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sand/30">
                  {(config.getVariantSelectorComponent?.(product) || config.VariantSelectorComponent) === 'PhoneCaseVariantSelector' ? (
                    <PhoneCaseVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantChange={(variantId) => handleAdjustment('size', variantId)}
                      label={config.variantSelectorConfig?.label || "Modelo do Telemóvel"}
                      emoji={config.variantSelectorConfig?.emoji || "📱"}
                      customSingleVariantText={config.variantSelectorConfig?.getCustomSingleVariantText?.(product)}
                      customSingleVariantSubtext={config.variantSelectorConfig?.getCustomSingleVariantSubtext?.(product)}
                    />
                  ) : (config.getVariantSelectorComponent?.(product) || config.VariantSelectorComponent) === 'FramedCanvasVariantSelector' ? (
                    <FramedCanvasVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantSelect={(variantId) => handleAdjustment('size', variantId)}
                    />
                  ) : (config.getVariantSelectorComponent?.(product) || config.VariantSelectorComponent) === 'ToteBagVariantSelector' ? (
                    <ToteBagVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantSelect={(variantId) => handleAdjustment('size', variantId)}
                    />
                  ) : (config.getVariantSelectorComponent?.(product) || config.VariantSelectorComponent) === 'NotebookVariantSelector' ? (
                    <NotebookVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantSelect={(variantId) => handleAdjustment('size', variantId)}
                    />
                  ) : (config.getVariantSelectorComponent?.(product) || config.VariantSelectorComponent) === 'PelucheVariantSelector' ? (
                    <PelucheVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantSelect={(variantId) => handleAdjustment('size', variantId)}
                    />
                  ) : (
                    <ProductVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantChange={(variantId) => handleAdjustment('size', variantId)}
                      label={config.variantSelectorConfig?.label || "Variante"}
                      emoji={config.variantSelectorConfig?.emoji || "🎯"}
                      customSingleVariantText={config.variantSelectorConfig?.getCustomSingleVariantText?.(product)}
                      customSingleVariantSubtext={config.variantSelectorConfig?.getCustomSingleVariantSubtext?.(product)}
                    />
                  )}
                </div>
              </div>
              

            </motion.div>

            {/* Quantidade e Preços Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="px-4 mb-4"
            >
              <ProductQuantityPricing
                basePrice={basePrice}
                quantity={quantity}
                onQuantityChange={setQuantity}
                discountTiers={[]}
                canPurchase={!!canPurchase}
                onAddToCart={handleAddToCart}
                loading={loading}
                userInfo={userInfo}
                selectedImageUrl={selectedImageUrl}
              />
            </motion.div>

            {/* Botão Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="px-4 mb-6"
            >
              <ProductAddToCartButton
                canPurchase={!!canPurchase}
                isProcessingMockup={!!isProcessingMockup}
                loading={loading}
                userInfo={userInfo}
                selectedImageUrl={selectedImageUrl || ''}
                selectedPrintifyVariantId={selectedPrintifyVariantId}
                onAddToCart={handleAddToCart}
                onOpenGallery={handleOpenGallery} // ✅ NOVA PROP
                size="mobile"
              />
            </motion.div>

            {/* Informações Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="px-4 space-y-4"
            >
              <ProductGuarantees guarantees={config.guaranteeItems()} />
            </motion.div>
          </div>

          {/* Layout Desktop - Grid: Mockup Esquerda + Sidebar Direita */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-8">
            {/* ✅ MOCKUP DESKTOP - Área Esquerda (2 colunas) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 order-1"
            >
              {/* ✅ PRODUCT CANVAS REAL QUE GERA MOCKUPS */}
              <div className={`relative w-full h-[700px] ${printifyPreviewUrls.length > 0 ? 'bg-transparent' : 'bg-white'} rounded-2xl shadow-xl overflow-hidden border border-ghibli-sand/20 mb-6`}>
                <ProductCanvas
                  key={mockupGenerationKey} // ✅ Chave única para evitar duplicações
                  selectedProduct={product}
                  userImageUrl={selectedImageUrl}
                  userId={userInfo?.id}
                  printifyGeneratedPreviewUrls={printifyPreviewUrls}
                  onPreviewReady={handlePreviewReady}
                  onSelectImage={handleOpenGallery}
                  imageAdjustments={imageAdjustments}
                  onImageAdjust={setImageAdjustments}
                  selectedPrintifyVariantId={selectedPrintifyVariantId}
                  hasGenerated={hasGenerated}
                  onMockupGenerated={handleMockupGenerated}
                  mockupGenerationKey={mockupGenerationKey}
                  isGeneratingMockup={isGeneratingMockup}
                />
              </div>
              {/* ✅ CONTROLOS DESKTOP */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex flex-row justify-center items-center gap-4"
                >
                {/* Botão Trocar Arte */}
                <Button
                  onClick={userInfo ? handleOpenGallery : () => router.push('/transformacoes')}
                  className="px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white"
                >
                                      {userInfo 
                      ? (selectedImageUrl ? 'Trocar Arte' : 'Escolher Arte')
                      : '✨ Transforma a tua foto grátis primeiro!'
                    }
                </Button>

                {/* Controlos de Posição lado a lado com Trocar Arte - APENAS SE EXISTIR coordinateConfig E SE PERMITIDO */}
                {userInfo && selectedImageUrl && coordinateConfig && config.positionControls?.showPositionControls !== false && (
                  <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-ghibli-sand/30">
                    {(coordinateConfig.positionType === 'vertical' ? [
                      { key: 'top' as const, title: 'Cima', icon: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z' },
                      { key: 'center' as const, title: 'Centro', icon: 'circle' },
                      { key: 'bottom' as const, title: 'Baixo', icon: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z' }
                    ] : [
                      { key: 'left' as const, title: 'Esquerda', icon: 'M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z' },
                      { key: 'center' as const, title: 'Centro', icon: 'circle' },
                      { key: 'right' as const, title: 'Direita', icon: 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z' }
                    ]).map(({ key, title, icon }) => (
                      <Button 
                        key={key}
                        onClick={() => handleAdjustment('position', key)} 
                        variant="ghost"
                        size="sm"
                        className={`h-12 w-12 rounded-full transition-all duration-200 ${imagePosition === key 
                          ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                          : 'text-ghibli-earth hover:bg-ghibli-moss/10 hover:scale-105'
                        }`}
                        disabled={isGeneratingMockup}
                        title={title}
                      >
                        {icon === 'circle' ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d={icon}/>
                          </svg>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>


            </motion.div>

            {/* Painel de Controlo Desktop */}
            <motion.div
              {...PRODUCT_ANIMATIONS.sidebar}
              className="lg:col-span-1 order-2"
            >
              <Card className={PRODUCT_STYLES.card}>
                <ProductCardDecorations />
                
                <CardContent className="relative z-10 p-6 space-y-4">
                  {/* Título + Preço + Quantidade */}
                  <div className="pb-4 border-b border-ghibli-sand/30 space-y-4">
                    <div className="text-center">
                      <h1 className="text-2xl font-extrabold bg-gradient-to-r from-ghibli-earth to-ghibli-wood bg-clip-text text-transparent leading-tight mb-2">
                        {product.name}
                      </h1>
                    </div>

                    {/* Preço e Quantidade */}
                    <div className="space-y-3">
                      <div className="text-center">
                                        {/* ✅ NOVO: Sistema de descontos fake DINÂMICO */}
                {(() => {
                  const fakeDiscountInfo = getFakeDiscountInfo(product.id, basePrice);

                  if (fakeDiscountInfo && fakeDiscountInfo.hasDiscount) {
                            return (
                          <div className="flex flex-col items-center">
                                {/* Badge de desconto + preço fake riscado */}
                            <div className="flex items-center gap-3 mb-3">
                                  <motion.div 
                                    className="bg-gradient-to-r from-red-500 to-red-600 text-white text-lg font-black px-3 py-1 rounded-full shadow-lg"
                                    animate={{ 
                                      scale: [1, 1.05, 1],
                                      boxShadow: [
                                        "0 4px 6px rgba(239, 68, 68, 0.2)",
                                        "0 8px 25px rgba(239, 68, 68, 0.4)",
                                        "0 4px 6px rgba(239, 68, 68, 0.2)"
                                      ]
                                    }}
                                    transition={{ 
                                      duration: 2, 
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                  >
                                    {fakeDiscountInfo.discountPercent}% OFF
                                  </motion.div>
                                  <div className="text-lg text-gray-500 line-through font-medium">
                                    €{(fakeDiscountInfo.fakePrice * quantity).toFixed(2)}
                              </div>
                              </div>
                                
                                {/* Preço real (com desconto fake) */}
                                <div className="text-4xl font-black text-green-600 mb-1">
                                  €{totalPrice.toFixed(2)}
                            </div>
                            
                                {/* ✅ REMOVIDO: Texto "Poupa €X.XX!" */}
                            </div>
                            );
                          } else {
                            // Produto sem desconto fake
                            return (
                          <div className="flex items-baseline justify-center gap-2 mb-1">
                                <span className="text-4xl font-black text-ghibli-moss">€{totalPrice.toFixed(2)}</span>
                              </div>
                            );
                          }
                        })()}
                        
                        {/* ✅ REMOVIDO: Texto "Poupa €X.XX!" */}
                      </div>

                      {/* Seletor de Quantidade */}
                      <div className="bg-ghibli-cream/30 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-ghibli-earth">Quantidade:</span>
                          <div className="flex items-center gap-1 bg-white/80 rounded-md px-2 py-1">
                            <Button
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-md hover:bg-ghibli-moss/10 disabled:opacity-50"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            
                            <span className="min-w-[2.5rem] text-center font-bold text-ghibli-earth">
                              {quantity}
                            </span>
                            
                            <Button
                              onClick={() => setQuantity(quantity + 1)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-md hover:bg-ghibli-moss/10"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* ✅ REMOVIDO: Destaques de desconto de quantidade */}

                        {/* Total */}
                        {quantity > 1 && (
                          <div className="border-t border-ghibli-sand/30 pt-2 mt-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-ghibli-earth">Total:</span>
                              <div className="text-right">
                                <div className="text-xl font-black text-ghibli-moss">€{totalPrice.toFixed(2)}</div>
                                <div className="text-xs text-ghibli-earth/70">
                                  {quantity} × €{basePrice.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seletor de Variantes - MOVIDO PARA CIMA */}
                  {(config.getVariantSelectorComponent?.(product) || config.VariantSelectorComponent) === 'PhoneCaseVariantSelector' ? (
                    <PhoneCaseVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantChange={(variantId) => handleAdjustment('size', variantId)}
                      label={config.variantSelectorConfig?.label || "Modelo do Telemóvel"}
                      emoji={config.variantSelectorConfig?.emoji || "📱"}
                      customSingleVariantText={config.variantSelectorConfig?.getCustomSingleVariantText?.(product)}
                      customSingleVariantSubtext={config.variantSelectorConfig?.getCustomSingleVariantSubtext?.(product)}
                    />
                  ) : (config.getVariantSelectorComponent?.(product) || config.VariantSelectorComponent) === 'FramedCanvasVariantSelector' ? (
                    <FramedCanvasVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantSelect={(variantId) => handleAdjustment('size', variantId)}
                    />
                  ) : (config.getVariantSelectorComponent?.(product) || config.VariantSelectorComponent) === 'ToteBagVariantSelector' ? (
                    <ToteBagVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantSelect={(variantId) => handleAdjustment('size', variantId)}
                    />
                  ) : (config.getVariantSelectorComponent?.(product) || config.VariantSelectorComponent) === 'NotebookVariantSelector' ? (
                    <NotebookVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantSelect={(variantId) => handleAdjustment('size', variantId)}
                    />
                  ) : (config.getVariantSelectorComponent?.(product) || config.VariantSelectorComponent) === 'PelucheVariantSelector' ? (
                    <PelucheVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantSelect={(variantId) => handleAdjustment('size', variantId)}
                    />
                  ) : (
                    <ProductVariantSelector
                      product={product}
                      selectedVariantId={selectedPrintifyVariantId}
                      onVariantChange={(variantId) => handleAdjustment('size', variantId)}
                      label={config.variantSelectorConfig?.label || "Tamanho"}
                      emoji={config.variantSelectorConfig?.emoji || "📏"}
                      customSingleVariantText={config.variantSelectorConfig?.getCustomSingleVariantText?.(product)}
                      customSingleVariantSubtext={config.variantSelectorConfig?.getCustomSingleVariantSubtext?.(product)}
                    />
                  )}

                  {/* Botão Principal */}
                  <div className="pt-3">
                    <ProductAddToCartButton
                      canPurchase={!!canPurchase}
                      isProcessingMockup={!!isProcessingMockup}
                      loading={loading}
                      userInfo={userInfo}
                      selectedImageUrl={selectedImageUrl || ''}
                      selectedPrintifyVariantId={selectedPrintifyVariantId}
                      onAddToCart={handleAddToCart}
                      onOpenGallery={handleOpenGallery} // ✅ NOVA PROP
                      size="desktop"
                    />
                  </div>

                  {/* Status Arte */}
                  <ProductArtStatus 
                    selectedImageUrl={selectedImageUrl}
                    onOpenGallery={handleOpenGallery}
                  />

                  {/* Garantias */}
                  <ProductGuarantees 
                    guarantees={config.guaranteeItems()}
                    className="pt-4" 
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>

      <TransformationGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelectImage={handleSelectImageFromGallery}
      />
    </>
  );
};

export default GenericProductPage; 