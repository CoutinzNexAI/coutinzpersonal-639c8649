// Template genérico para páginas de produto - Loja PicTuz
// Este componente será usado como base para todas as páginas de produto específicas 

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import { ImageAdjustments, PRODUCT_ANIMATIONS, PRODUCT_STYLES } from '@/types/product';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { GlobalRateLimiter } from '@/lib/utils/rateLimiter';

// Componentes compartilhados
import ProductQuantityPricing from '@/components/shared/ProductQuantityPricing';
import ProductArtStatus from '@/components/shared/ProductArtStatus';
import ProductGuarantees from '@/components/shared/ProductGuarantees';
import ProductDescription from '@/components/shared/ProductDescription';
import ProductVariantSelector from '@/components/shared/ProductVariantSelector';
import ProductAddToCartButton from '@/components/shared/ProductAddToCartButton';
import ProductMobileControls from '@/components/shared/ProductMobileControls';
import ProductCardDecorations from '@/components/shared/ProductCardDecorations';
import PhoneCaseVariantSelector from '@/components/shared/product-customization/PhoneCaseVariantSelector';
import FramedCanvasVariantSelector from '@/components/shared/product-customization/FramedCanvasVariantSelector';
import ToteBagVariantSelector from '@/components/shared/product-customization/ToteBagVariantSelector';
import NotebookVariantSelector from '@/components/shared/product-customization/NotebookVariantSelector';

interface GenericProductPageProps {
  product: PrintifyProductMapping;
  config: {
    productCategory: string;
    getBasePrice: (product: PrintifyProductMapping, selectedPrintifyVariantId: number | null) => number;
    discountTiers: Array<{ min: number; discount: number; label: string; emoji: string; }>;
    descriptionItems: (product: PrintifyProductMapping) => Array<{ text: string; color?: 'moss' | 'wood'; emoji?: string; }>;
    guaranteeItems: () => Array<{ icon: React.ComponentType<{ className?: string }>; title: string; }>;
    coordinateConfig?: { positionType: string; positions: readonly string[]; };
    getCoordinateConfig?: (product: PrintifyProductMapping) => { positionType: string; positions: readonly string[]; };
    calculatePrintifyCoords?: (position: string, variantId: number, imageDimensions: { width: number; height: number }, product: PrintifyProductMapping) => ImageAdjustments;
    validatePurchase: (selectedImageUrl: string, selectedImageId: string | null, userInfo: unknown, selectedPrintifyVariantId: number | null, printifyProductId: string, printifyImageId: string) => string | null;
    variantSelectorConfig: { label: string; emoji: string; getCustomSingleVariantText?: (product: PrintifyProductMapping) => string | undefined; getCustomSingleVariantSubtext?: (product: PrintifyProductMapping) => string | undefined; };
    getVariantSelectorComponent?: (product: PrintifyProductMapping) => string;
    VariantSelectorComponent: string;
  };
}

const GenericProductPage: React.FC<GenericProductPageProps> = ({ product, config }) => {
  const router = useRouter();
  const { userInfo } = useAuth();
  
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

  // Cálculos de preço usando a configuração
  const calculateDiscount = (qty: number) => {
    const applicableTiers = config.discountTiers?.filter((tier) => qty >= tier.min) || [];
    const bestTier = applicableTiers.reduce((best, current) => 
      current.discount > best.discount ? current : best, 
      { discount: 0 }
    );
    return bestTier.discount;
  };

  const basePrice = config.getBasePrice(product, selectedPrintifyVariantId);
  const discount = calculateDiscount(quantity);
  const discountedPrice = basePrice * (1 - discount / 100);
  const totalPrice = discountedPrice * quantity;
  const savings = (basePrice * quantity) - totalPrice;

  // Setup inicial do produto
  useEffect(() => {
    if (product?.variants?.length) {
      const firstVariant = product.variants[0];
      setSelectedPrintifyVariantId(firstVariant.id);
    }
  }, [product]);

  // Reset estados quando a variante muda
  useEffect(() => {
    if (selectedImageUrl && selectedPrintifyVariantId) {
      setPrintifyPreviewUrls([]);
      setPrintifyImageId('');
      setPrintifyProductId('');
    }
  }, [selectedPrintifyVariantId]);

  // Calcular imageAdjustments usando a configuração
  useEffect(() => {
    if (selectedImageUrl && product && selectedPrintifyVariantId) {
      const selectedVariant = product.variants?.find((v) => v.id === selectedPrintifyVariantId);
      if (!selectedVariant) return;

      const { placeholderWidth, placeholderHeight } = selectedVariant;
      const userImageWidth = 1016;
      const userImageHeight = 1016;

      const scaleToCover = Math.max(
        placeholderWidth / userImageWidth,
        placeholderHeight / userImageHeight
      );

      const finalImageWidth = userImageWidth * scaleToCover;
      const printifyScale = finalImageWidth / placeholderWidth;
      
      setImageAdjustments({
        x: 0.5,
        y: 0.5,
        scale: printifyScale,
        rotation: 0
      });
    }
  }, [selectedImageUrl, product, selectedPrintifyVariantId]);

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
    printifyImageId: string;
    printifyProductId: string;
  }) => {
    setPrintifyPreviewUrls(data.previewUrls);
    setPrintifyImageId(data.printifyImageId);
    setPrintifyProductId(data.printifyProductId);
    
    if (data.previewUrls.length > 0 && currentMockupUrls.length === 0) {
      setCurrentMockupUrls(data.previewUrls);
    }
  }, [currentMockupUrls]);

  const handleAddToCart = async () => {
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

      CartService.addToCart({
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
        },
        imageAdjustments,
      });

      toast.success(`${product.name} adicionado ao carrinho!`, {
        description: 'Continue as compras ou vá para o checkout',
        action: {
          label: 'Ver Carrinho',
          onClick: () => router.push('/checkout'),
        },
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGallery = () => setIsGalleryModalOpen(true);

  const handleSelectImageFromGallery = async (imageUrl: string, imageId: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    setIsGalleryModalOpen(false);
    
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    setImageAdjustments(undefined);
    
    toast.success('Arte aplicada com sucesso!');
  };

  // Função para gerar novos mockups quando a posição muda
  const generateNewMockup = async (position: 'top' | 'center' | 'bottom' | 'left' | 'right', variantId: number, isPositionChange: boolean = false) => {
    if (!selectedImageUrl || !userInfo?.id || !userImageDimensions) return;

    // Calcular novas coordenadas baseadas na posição
    let newAdjustments = imageAdjustments;
    if (config.calculatePrintifyCoords) {
      newAdjustments = config.calculatePrintifyCoords(
        position,
        variantId,
        userImageDimensions,
        product
      );
      setImageAdjustments(newAdjustments);
    }

    setIsGeneratingMockup(true);
    
    try {
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          userImageUrl: selectedImageUrl,
          userId: userInfo.id,
          imageAdjustments: newAdjustments,
          selectedPrintifyVariantId: variantId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate mockup');
      }

      if (data.previewUrls && data.printifyProductId) {
        setPrintifyPreviewUrls(data.previewUrls);
        setPrintifyImageId(data.printifyImageId || '');
        setPrintifyProductId(data.printifyProductId);
        setCurrentMockupUrls(data.previewUrls);
        
        // Só mostrar notificação se não for mudança de posição
        if (!isPositionChange) {
          toast.success('Mockup atualizado com sucesso!');
        }
      }
    } catch (error) {
      console.error('Error generating new mockup:', error);
      toast.error('Erro ao gerar novo mockup. Tente novamente.');
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  const handleAdjustment = async (type: 'position' | 'size', value: string | number) => {
    // 1. FALA COM O GUARDA-COSTAS PRIMEIRO
    const { allowed, message } = GlobalRateLimiter.checkRequestLimit();
    if (!allowed) {
      toast.error(message);
      return;
    }

    if (!userImageDimensions) {
      toast.error('Aguarde o carregamento da imagem');
      return;
    }

    let newPosition = imagePosition;
    let newVariantId = selectedPrintifyVariantId;

    if (type === 'position' && typeof value === 'string') {
      newPosition = value as 'top' | 'center' | 'bottom' | 'left' | 'right';
      setImagePosition(newPosition);
    } else if (type === 'size' && typeof value === 'number') {
      newVariantId = value;
      setSelectedPrintifyVariantId(newVariantId);
      // Resetar posição para centro quando muda variante
      setImagePosition('center');
      newPosition = 'center';
    }

    // 2. Se for permitido, regista o pedido
    GlobalRateLimiter.recordRequest();

    // 3. E SÓ DEPOIS CHAMA A FUNÇÃO PARA GERAR A MOCKUP (O ATAQUE)
    // Garante que newVariantId não é nulo antes de chamar
    if (newVariantId !== null) {
      const isPositionChange = type === 'position';
      await generateNewMockup(newPosition, newVariantId, isPositionChange);
    }
  };

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
        <Header />
        
        <main className="container mx-auto px-2 sm:px-4 pt-20 pb-6 sm:pt-12 sm:pb-8 lg:pt-24 lg:pb-8">
          
          {/* Layout Responsivo com CSS Grid */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            
            {/* Título Mobile */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6 px-4 lg:hidden"
            >
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-ghibli-earth via-ghibli-wood to-ghibli-moss bg-clip-text text-transparent leading-tight tracking-tight">
                {product.name}
              </h1>
            </motion.div>

            {/* ProductCanvas ÚNICO - Responsivo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6 lg:col-span-2 lg:order-1"
            >
              <div className="relative w-full h-[350px] lg:h-[700px] bg-white rounded-2xl shadow-xl overflow-hidden mb-4 lg:mb-6 border border-ghibli-sand/20">
                <ProductCanvas
                  selectedProduct={product}
                  userImageUrl={selectedImageUrl}
                  userId={userInfo?.id}
                  printifyGeneratedPreviewUrls={printifyPreviewUrls}
                  onPreviewReady={handlePreviewReady}
                  onSelectImage={handleOpenGallery}
                  imageAdjustments={imageAdjustments}
                  onImageAdjust={setImageAdjustments}
                  selectedPrintifyVariantId={selectedPrintifyVariantId}
                />
              </div>
            </motion.div>

            {/* Controlos Mobile - APENAS EM MOBILE */}
            <div className="lg:hidden">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-6"
              >

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
              showPositionControls={!!coordinateConfig}
                />
                
                {!userInfo && (
                  <div className="px-4">
                    <Card className="bg-ghibli-moss/10 border-ghibli-moss/30 backdrop-blur-sm">
                      <CardContent className="p-4 text-center">
                        <p className="text-ghibli-earth text-sm mb-3 font-medium">
                          🎨 Entre para personalizar o seu produto
                        </p>
                        <Button
                          onClick={() => router.push('/')}
                          className="w-full bg-ghibli-moss hover:bg-ghibli-moss/90 text-white border-0"
                        >
                          Fazer Login
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
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
                  discountTiers={config.discountTiers || []}
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
                <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sand/30">
                  <ProductDescription items={config.descriptionItems(product)} />
                </div>

                {/* Seletor de Variantes Mobile */}
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

                <ProductGuarantees guarantees={config.guaranteeItems()} />
              </motion.div>
            </div>

            {/* Painel de Controlo Desktop - Coluna Direita */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="hidden lg:block lg:col-span-1 lg:order-2"
            >
              {/* Conteúdo Desktop (será adicionado) */}
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold text-ghibli-earth mb-4">{product.name}</h2>
                <p className="text-ghibli-moss text-xl font-semibold">€{basePrice.toFixed(2)}</p>
              </div>
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