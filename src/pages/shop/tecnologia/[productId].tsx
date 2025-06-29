import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Truck, Award, ChevronRight, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import { ImageAdjustments } from '@/types/product';
import ProductCardDecorations from '@/components/shared/ProductCardDecorations';
import { PositionControls } from '@/components/shared/PositionControls';
import { ProductPricing } from '@/components/shared/ProductPricing';
import { ProductGuarantees } from '@/components/shared/ProductGuarantees';
import { validatePurchase } from '@/utils/productValidation';
import { GlobalRateLimiter } from '@/lib/utils/rateLimiter';

interface PhoneCaseDetailPageProps {
  product: PrintifyProductMapping;
}

const PhoneCaseDetailPage: React.FC<PhoneCaseDetailPageProps> = ({ product: initialProduct }) => {
  const router = useRouter();
  const { productId } = router.query;
  const { userInfo } = useAuth();
  
  const [product, setProduct] = useState<PrintifyProductMapping | null>(initialProduct || null);
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

  // Estado para dimensões da imagem do utilizador
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Posição da imagem: left/center/right (movimento horizontal para capas)
  const [imagePosition, setImagePosition] = useState<'left' | 'center' | 'right'>('center');

  // Loading indicator para nova mockup
  const [isGeneratingMockup, setIsGeneratingMockup] = useState<boolean>(false);

  // Quantidade de capas
  const [quantity, setQuantity] = useState(1);



  // Calculate discount and prices
  const calculateDiscount = (qty: number) => {
    if (qty >= 3) return 15;
    if (qty >= 2) return 10;
    return 0;
  };

  // ✅ PREÇO BASE PARA CAPAS: €25.00
  const getBasePrice = () => {
    return 25.00; // Capa sempre €25.00
  };

  const basePrice = getBasePrice();
  const discount = calculateDiscount(quantity);
  const discountedPrice = basePrice * (1 - discount / 100);
  const totalPrice = discountedPrice * quantity;
  const savings = (basePrice * quantity) - totalPrice;

  // Função utilitária: Validação consolidada
  const validatePurchase = () => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar a sua capa!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione o modelo do telemóvel.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  };

  // Setup inicial do produto
  useEffect(() => {
    const currentProduct = initialProduct || (typeof productId === 'string' ? getPrintifyProduct(productId) : null);
    
    if (!currentProduct || currentProduct.category !== 'tecnologia') {
      router.push('/shop');
      toast.error('Produto não encontrado');
      return;
    }
    
    setProduct(currentProduct);
    
    // Selecionar primeira variante como padrão
    if (currentProduct.variants?.length > 0) {
      setSelectedPrintifyVariantId(currentProduct.variants[0].id);
    }
  }, [productId, initialProduct, router]);

  // Reset estados quando a variante muda
  useEffect(() => {
    if (selectedImageUrl && selectedPrintifyVariantId) {
      // Reset mockups Printify para forçar nova geração quando variante muda
      setPrintifyPreviewUrls([]);
      setPrintifyImageId('');
      setPrintifyProductId('');
    }
  }, [selectedPrintifyVariantId]);

  // Calcular escala inicial para imageAdjustments
  useEffect(() => {
    if (!selectedImageUrl || !product || !selectedPrintifyVariantId) return;
    
    const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
    if (!selectedVariant) return;

    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const userImageSize = 1016; // Imagens AI são quadradas
    
    const scaleToCover = Math.max(
      placeholderWidth / userImageSize,
      placeholderHeight / userImageSize
    );
    
    const finalImageWidth = userImageSize * scaleToCover;
    const printifyScale = finalImageWidth / placeholderWidth;
    
    setImageAdjustments({
      x: 0.5,
      y: 0.5,
      scale: printifyScale,
      rotation: 0
    });
  }, [selectedImageUrl, product, selectedPrintifyVariantId]);

  // Detectar dimensões da imagem selecionada
  useEffect(() => {
    if (!selectedImageUrl) {
      setUserImageDimensions(null);
      return;
    }

    const img = new Image();
    img.onload = () => setUserImageDimensions({ width: img.width, height: img.height });
    img.onerror = () => setUserImageDimensions({ width: 1016, height: 1016 }); // Fallback
    img.src = selectedImageUrl;
  }, [selectedImageUrl]);

  // Calcular coordenadas para posicionamento horizontal
  const calculatePrintifyCoords = (position: 'left' | 'center' | 'right', variantId: number, imageDimensions: { width: number; height: number }): ImageAdjustments => {
    const selectedVariant = product?.variants?.find(v => v.id === variantId);
    if (!selectedVariant) throw new Error(`Variante ${variantId} não encontrada`);

    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const { width: userImageWidth, height: userImageHeight } = imageDimensions;

    // Calcular escala para cobrir toda a área
    const scaleToCover = Math.max(
      placeholderWidth / userImageWidth,
      placeholderHeight / userImageHeight
    );
    
    const finalImageWidth = userImageWidth * scaleToCover;
    const printifyScale = finalImageWidth / placeholderWidth;

    // Calcular posição horizontal
    let printifyX = 0.5; // Centro padrão
    
    if (position !== 'center') {
      const scaledImageWidth = userImageWidth * scaleToCover;
      const overflowX = Math.max(0, scaledImageWidth - placeholderWidth);
      const maxOffsetX = (overflowX / 2) / placeholderWidth;
      
      if (overflowX > 0) {
        const movementX = maxOffsetX * 0.7; // 70% do movimento máximo
        printifyX = 0.5 + (position === 'left' ? -movementX : movementX);
      }
    }

    return {
      x: printifyX,
      y: 0.5,
      scale: printifyScale,
      rotation: 0
    };
  };

  // Controlador principal para geração de mockups
  useEffect(() => {
    if (!selectedImageUrl || !selectedPrintifyVariantId || !userImageDimensions || !userInfo?.id) {
      return;
    }

    const handler = setTimeout(() => {
      generateNewMockup(imagePosition, selectedPrintifyVariantId);
    }, 100);

    return () => clearTimeout(handler);
  }, [selectedImageUrl, selectedPrintifyVariantId, imagePosition, userImageDimensions, userInfo?.id]);

  const handlePreviewReady = useCallback((data: {
    previewUrls: string[];
    printifyImageId: string;
    printifyProductId: string;
  }) => {
    setPrintifyPreviewUrls(data.previewUrls);
    setPrintifyImageId(data.printifyImageId);
    setPrintifyProductId(data.printifyProductId);
  }, []);

  const handleAdjustment = async (type: 'position', value: string) => {
    const { allowed, message } = GlobalRateLimiter.checkRequestLimit();
    if (!allowed) {
      toast.error(message);
      return;
    }

    if (!userImageDimensions) {
      toast.error('Aguarde o carregamento da imagem');
      return;
    }

    if (!selectedPrintifyVariantId) {
      toast.error('Selecione um modelo de telemóvel primeiro');
      return;
    }

    if (type === 'position') {
      setImagePosition(value as 'left' | 'center' | 'right');
      GlobalRateLimiter.recordRequest();
    }
  };

  const generateNewMockup = async (currentPosition: 'left' | 'center' | 'right', currentVariantId: number) => {
    if (!userImageDimensions || !selectedImageUrl || !selectedImageId) return;

    setIsGeneratingMockup(true);
    
    const adjustments = calculatePrintifyCoords(currentPosition, currentVariantId, userImageDimensions);
    setImageAdjustments(adjustments);

    try {
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.id,
          userImageUrl: selectedImageUrl,
          userId: userInfo?.id,
          imageAdjustments: adjustments,
          selectedPrintifyVariantId: currentVariantId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.previewUrls?.length > 0) {
        setPrintifyPreviewUrls(data.previewUrls);
        setPrintifyImageId(data.printifyImageId);
        setPrintifyProductId(data.printifyProductId);
        
        const positionText = currentPosition === 'left' ? 'Esquerda' : currentPosition === 'right' ? 'Direita' : 'Centro';
        toast.success(`Posição alterada para: ${positionText}`);
      } else {
        toast.error('Erro ao gerar nova preview. Tente novamente.');
      }
    } catch (error) {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  const handleAddToCart = async () => {
    // Validar com a função consolidada
    const validationError = validatePurchase();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      const selectedVariant = product?.variants?.find(v => v.id === selectedPrintifyVariantId);

      CartService.addToCart({
        productId: productId as string,
        productName: product!.name,
        productCategory: product!.category || 'tecnologia',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId!,
        price: discountedPrice,
        quantity: quantity,
        customizations: {
          variantId: selectedPrintifyVariantId!,
          phoneModel: selectedVariant?.title || 'Modelo não encontrado',
          scale: imageAdjustments?.scale || 1.0,
          x: imageAdjustments?.x || 0.5,
          y: imageAdjustments?.y || 0.5,
          angle: imageAdjustments?.rotation || 0,
        },
        imageAdjustments,
      });

      toast.success(`${quantity === 1 ? 'Capa adicionada' : `${quantity} capas adicionadas`} ao carrinho!`, {
        description: `Total: €${totalPrice.toFixed(2)}${discount > 0 ? ` (${discount}% desconto aplicado!)` : ''}`,
        action: {
          label: 'Ver Carrinho',
          onClick: () => router.push('/checkout'),
        },
      });
    } catch (error) {
      toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGallery = () => setIsGalleryModalOpen(true);

  const handleSelectImageFromGallery = async (imageUrl: string, imageId: string) => {
    setLoading(true);
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    setIsGalleryModalOpen(false);
    
    // Reset estados para nova imagem
    setImagePosition('center');
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    setImageAdjustments(undefined);
    setUserImageDimensions(null);
    
    const img = new Image();
    img.onload = function(this: HTMLImageElement) {
      setUserImageDimensions({ width: this.naturalWidth, height: this.naturalHeight });
      setLoading(false);
      toast.success('Arte selecionada com sucesso!');
    };
    
    img.onerror = () => {
      setUserImageDimensions({ width: 1024, height: 1024 });
      setLoading(false);
      toast.success('Arte selecionada (dimensões estimadas)');
    };
    
    img.src = imageUrl;
  };

  const handleImageAdjustmentChange = (adjustments: Partial<ImageAdjustments>) => {
    if (imageAdjustments) {
      setImageAdjustments({ 
        ...imageAdjustments, 
        ...adjustments 
      });
    }
  };

  // Condições auxiliares para botão (igual às canecas)
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
        <title>📱 Capa Personalizada - Loja PicTuz</title>
        <meta name="description" content="Personalize a sua capa de telemóvel com as suas criações AI. Proteção premium com design único e qualidade superior." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        <ProductCardDecorations />
        
        <main className="container mx-auto px-2 sm:px-4 pt-20 pb-6 sm:pt-24 sm:pb-8 lg:py-8">
          {/* 📱 MOBILE LAYOUT: Título em Destaque no Topo */}
          <div className="block lg:hidden">
            {/* Título Mobile - Em Destaque */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6 px-4"
            >
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-ghibli-earth via-ghibli-wood to-ghibli-moss bg-clip-text text-transparent leading-tight mb-4 tracking-tight">
                📱 Capa Personalizada
              </h1>
              <div className="text-4xl sm:text-5xl font-black text-ghibli-moss drop-shadow-lg tracking-tight">
                €{basePrice.toFixed(2)}
              </div>
            </motion.div>

            {/* Mockup Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
            >
              <div className="relative w-full h-[350px] bg-white rounded-2xl shadow-xl overflow-hidden mb-4 border border-ghibli-sand/20">
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

              {/* Controlos Mobile - Mais Pequenos */}
              {userInfo ? (
                selectedImageUrl && userImageDimensions && product ? (
                  <div className="px-4">
                    <div className="flex gap-4 items-center justify-center">
                      {/* Botão Trocar Arte - Mobile */}
                      <Button
                        onClick={handleOpenGallery}
                        className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white rounded-lg shadow-lg transition-all duration-300"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Trocar
                      </Button>

                      <PositionControls
                        currentPosition={imagePosition}
                        onPositionChange={(position) => handleAdjustment('position', position)}
                        isGeneratingMockup={isGeneratingMockup}
                        variant="mobile"
                      />
                    </div>

                    {/* Status Compacto Mobile */}
                    <div className="mt-2 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-ghibli-moss bg-ghibli-moss/5 px-2 py-1 rounded-full font-medium border border-ghibli-moss/20">
                        <div className="w-1 h-1 bg-ghibli-moss rounded-full animate-pulse"></div>
                        {imagePosition === 'left' ? 'Esquerda' : imagePosition === 'right' ? 'Direita' : 'Centro'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 text-center">
                    <Button
                      onClick={handleOpenGallery}
                      className="px-6 py-3 text-base font-semibold shadow-lg transition-all duration-300 rounded-xl bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Escolher Arte
                    </Button>
                  </div>
                )
              ) : (
                <div className="px-4">
                  <Card className="bg-ghibli-moss/10 border-ghibli-moss/30 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <p className="text-ghibli-earth text-sm mb-3 font-medium">
                        📱 Entre para personalizar a sua capa
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

            {/* Seletor de Quantidade e Preços Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="px-4 mb-4"
            >
              {/* Quantidade e Preço */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sand/30 shadow-lg">
                {/* Header com preço */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-ghibli-moss">€{discountedPrice.toFixed(2)}</span>
                      {discount > 0 && (
                        <span className="text-sm text-gray-500 line-through">€{basePrice.toFixed(2)}</span>
                      )}
                    </div>
                    {discount > 0 && (
                      <span className="text-xs text-green-600 font-medium">
                        Poupa €{savings.toFixed(2)} com {discount}% desconto!
                      </span>
                    )}
                  </div>
                  
                  {/* Badge de desconto */}
                  {discount > 0 && (
                    <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{discount}%
                    </div>
                  )}
                </div>

                <ProductPricing
                  basePrice={basePrice}
                  quantity={quantity}
                  onQuantityChange={setQuantity}
                  discount={discount}
                  totalPrice={totalPrice}
                  savings={savings}
                  productName="capa"
                  variant="mobile"
                />
              </div>
            </motion.div>

            {/* Botão Adicionar ao Carrinho Mobile - Destaque (IGUAL ÀS CANECAS) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="px-4 mb-6"
            >
              {isProcessingMockup ? (
                <div className="w-full py-4 bg-gradient-to-r from-ghibli-moss/50 to-ghibli-moss-light/50 rounded-xl text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-ghibli-moss font-medium text-sm">Criando a sua capa mágica...</span>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  disabled={!canPurchase || loading}
                  className={`group relative w-full py-4 text-lg font-bold rounded-xl shadow-xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02] border-0 ${
                    canPurchase
                      ? 'bg-gradient-to-br from-ghibli-moss via-ghibli-moss-light to-ghibli-moss hover:from-ghibli-moss-light hover:via-ghibli-moss hover:to-ghibli-moss-light text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                  }`}
                >
                  {canPurchase && (
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000"></div>
                  )}
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>A adicionar...</span>
                      </>
                    ) : !userInfo ? (
                      <span>Faça Login para Continuar</span>
                    ) : !selectedImageUrl ? (
                      <span>Escolha uma Arte Primeiro</span>
                    ) : !selectedPrintifyVariantId ? (
                      <span>Selecione o Modelo</span>
                    ) : (
                      <>
                        <span className="text-xl">📱</span>
                        <span>Adicionar ao Carrinho</span>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </>
                    )}
                  </span>
                </Button>
              )}
            </motion.div>

            {/* Informações Extras Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="px-4 space-y-4"
            >
              {/* Status Arte Mobile - SÓ MOSTRA QUANDO HÁ IMAGEM SELECIONADA */}
              {selectedImageUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="mb-6"
                >
                  <Card className="bg-white/90 backdrop-blur-sm border-ghibli-sand/40">
                    <CardContent className="p-4">
                      <h2 className="text-lg font-bold text-ghibli-moss mb-3">📊 Status Arte</h2>
                      
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shrink-0"></div>
                        <span className="text-green-800 font-medium text-sm">✅ Arte selecionada e pronta!</span>
                        <Button
                          size="sm"
                          onClick={handleOpenGallery}
                          variant="outline"
                          className="text-xs px-3 py-1 border-green-300 text-green-700 hover:bg-green-100 shrink-0 ml-auto"
                        >
                          Trocar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Model Selector Mobile */}
              {product.variants && product.variants.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.75 }}
                  className="mb-4"
                >
                  <Card className="bg-white/90 backdrop-blur-sm border-ghibli-sand/40">
                    <CardContent className="p-4">
                      <label className="block text-sm font-bold text-ghibli-moss mb-3">
                        📱 Modelo do Telemóvel
                      </label>
                      <select
                        value={selectedPrintifyVariantId?.toString() || ''}
                        onChange={(e) => setSelectedPrintifyVariantId(parseInt(e.target.value))}
                        className="w-full h-12 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium px-4 focus:border-ghibli-moss transition-all duration-200"
                      >
                        {product.variants?.map((variant) => (
                          <option key={variant.id} value={variant.id.toString()}>
                            {variant.title}
                          </option>
                        ))}
                      </select>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Descrição e Garantias Mobile */}
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sand/30">
                <ul className="text-sm space-y-2 text-ghibli-earth/80">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                    <span>Capa de <span className="font-bold text-ghibli-moss">proteção premium</span> resistente</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                    <span>Impressão duradoura e <span className="font-bold">resistente ao desgaste</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-wood rounded-full shrink-0"></div>
                    <span className="font-bold text-ghibli-wood">Proteção total com estilo único</span>
                    <span className="text-blue-500">📱</span>
                  </li>
                </ul>
              </div>

              {/* Compatibilidade Mobile */}
              <div className="bg-ghibli-cream/30 rounded-xl border border-ghibli-sand/40 p-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-ghibli-moss"></div>
                  <span className="text-ghibli-earth font-semibold">
                    📱 Múltiplos modelos disponíveis
                  </span>
                </div>
                <p className="text-center text-xs text-ghibli-earth/70 mt-1">
                  iPhone e Samsung Galaxy
                </p>
              </div>

              <ProductGuarantees variant="mobile" />
            </motion.div>
          </div>

          {/* 🖥️ DESKTOP LAYOUT: Layout Original */}
          <div className="hidden lg:block">
            {/* Breadcrumb */}
            <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-ghibli-earth">
              <li><Link href="/shop" className="hover:text-ghibli-moss transition-colors">Loja</Link></li>
              <li className="text-ghibli-earth/50">/</li>
              <li><Link href={`/shop/${product.category}`} className="hover:text-ghibli-moss transition-colors capitalize">{product.category}</Link></li>
              <li className="text-ghibli-earth/50">/</li>
              <li className="text-ghibli-moss font-medium">{product.name}</li>
            </ol>
          </nav>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-8">
            {/* 📱 MOBILE: Mockup + Botão PRIMEIRO (ordem 1) */}
            {/* 🖥️ DESKTOP: Área de visualização à esquerda (ordem 1) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 order-1"
            >
              {/* Área Principal de Visualização OTIMIZADA para MOBILE */}
              <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[700px] bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl overflow-hidden mb-4 lg:mb-6 border border-ghibli-sand/20">
                {/* ✅ PRODUTO CANVAS COM ESTADO CONTROLADO */}
                <div className={`transition-opacity duration-300 ${isGeneratingMockup ? 'opacity-50' : 'opacity-100'}`}>
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

                {/* ✅ OVERLAY DE LOADING que aparece POR CIMA da imagem atual */}
                {isGeneratingMockup && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 text-center max-w-xs mx-4">
                      <div className="w-12 h-12 border-3 border-ghibli-moss border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <h3 className="font-bold text-ghibli-moss text-lg mb-2">
                        Gerando Nova Posição
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Aplicando: <span className="font-semibold text-ghibli-earth">
                          {imagePosition === 'left' ? 'Esquerda' : imagePosition === 'right' ? 'Direita' : 'Centro'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Aguarde alguns segundos...
                      </p>
                    </div>
                  </div>
                )}
              </div>



              {/* ✅ CONTROLOS LADO A LADO - Trocar Arte + Ajustar Posição (IGUAL ÀS CANECAS) */}
              {userInfo ? (
                selectedImageUrl && userImageDimensions && product ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="mt-6 px-4 lg:px-0"
              >
                    <div className="flex gap-8 items-center justify-center">
                      {/* Botão Trocar Arte - Maior */}
                <Button
                  onClick={handleOpenGallery}
                        className="px-8 py-4 text-base font-semibold bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Trocar Arte
                      </Button>

                                            <PositionControls
                        currentPosition={imagePosition}
                        onPositionChange={(position) => handleAdjustment('position', position)}
                        isGeneratingMockup={isGeneratingMockup}
                        variant="desktop"
                      />
                    </div>

                    {/* Indicador de Status - Compacto */}
                    <div className="mt-3 text-center">
                      <span className="inline-flex items-center gap-2 text-xs text-ghibli-moss bg-ghibli-moss/5 px-3 py-1 rounded-full font-medium border border-ghibli-moss/20">
                        <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full animate-pulse"></div>
                        Posição: {imagePosition === 'left' ? 'Esquerda' : imagePosition === 'right' ? 'Direita' : 'Centro'}
                      </span>
                      
                      {/* Loading indicator quando a gerar */}
                      {isGeneratingMockup && (
                        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-ghibli-earth/70">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span>Reposicionando arte...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-6 flex justify-center px-4 lg:px-0"
                  >
                    <Button
                      onClick={handleOpenGallery}
                      className="px-8 py-4 text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white"
                    >
                      <Sparkles className="w-5 h-5 mr-2 lg:mr-3" />
                      Escolher Arte
                    </Button>
                  </motion.div>
                )
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="mt-6 flex justify-center px-4 lg:px-0"
                >
                  <Card className="bg-ghibli-moss/10 border-ghibli-moss/30 backdrop-blur-sm w-full sm:max-w-md">
                    <CardContent className="p-4 text-center">
                      <p className="text-ghibli-earth text-sm mb-3 font-medium">
                        📱 Entre para personalizar a sua capa
                      </p>
                      <Button
                        onClick={() => router.push('/')}
                        className="w-full bg-ghibli-moss hover:bg-ghibli-moss/90 text-white border-0"
                      >
                        Fazer Login
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>

            {/* 🎨 PAINEL DE CONTROLO - SEGUNDO em mobile, direita em desktop */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1 order-2"
            >
              {/* 🚀 CARTÃO PRINCIPAL MOBILE-FIRST DESIGN */}
              <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-ghibli-cream/20 backdrop-blur-xl border border-ghibli-sand/20 shadow-lg lg:shadow-2xl hover:shadow-xl lg:hover:shadow-3xl transition-all duration-500 rounded-2xl lg:rounded-3xl mx-2 sm:mx-0">
                
                {/* ✨ Elementos decorativos subtis */}
                <div className="absolute inset-0 bg-paper-texture opacity-30"></div>
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-ghibli-moss/10 to-ghibli-moss-light/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-6 left-6 w-16 h-16 bg-gradient-to-br from-ghibli-sunflower/10 to-ghibli-poppy/10 rounded-full blur-xl"></div>
                
                <CardContent className="relative z-10 p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {/* 🎯 1. TÍTULO + PREÇO MOBILE-OPTIMIZED */}
                  <div className="text-center pb-3 sm:pb-4 border-b border-ghibli-sand/30">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-ghibli-earth to-ghibli-wood bg-clip-text text-transparent leading-tight mb-1">
                      📱 Capa Personalizada
                    </h1>
                    
                    <ProductPricing
                      basePrice={basePrice}
                      quantity={quantity}
                      onQuantityChange={setQuantity}
                      discount={discount}
                      totalPrice={totalPrice}
                      savings={savings}
                      productName="capa"
                      variant="desktop"
                    />

                    {/* Incentivo de desconto */}
                    {quantity === 1 && (
                      <div className="mt-2 text-xs text-ghibli-earth/60 bg-ghibli-cream/50 px-3 py-2 rounded-lg">
                        💡 <span className="font-medium">2+ capas:</span> 10% desconto • <span className="font-medium">3+ capas:</span> 15% desconto
                      </div>
                    )}
                  </div>

                  {/* 🎨 2. STATUS ARTE MOBILE-OPTIMIZED */}
                  {selectedImageUrl && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <img src={selectedImageUrl} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-green-300" alt="Arte selecionada" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-green-800 text-sm">✅ Arte Aplicada</p>
                        <p className="text-xs text-green-600 truncate">Transformação AI pronta</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleOpenGallery}
                        variant="outline"
                        className="text-xs px-3 py-1 border-green-300 text-green-700 hover:bg-green-100 shrink-0"
                      >
                        Trocar
                      </Button>
                    </div>
                  )}

                  {/* 🚀 3. INCENTIVO DE ENTREGA MOBILE-OPTIMIZED */}
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 rounded-xl border-l-4 border-emerald-400">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-emerald-800 text-sm">Envio GRÁTIS</p>
                      <p className="text-xs text-emerald-600">em encomendas superiores a €50</p>
                    </div>
                    <div className="text-xl sm:text-2xl shrink-0">🎁</div>
                  </div>

                  {/* 📝 4. DESCRIÇÃO MOBILE-OPTIMIZED */}
                  <div className="px-1">
                    <p className="text-sm leading-relaxed font-medium text-ghibli-earth/80">
                      Proteja o seu telemóvel com <span className="font-bold text-ghibli-moss">estilo único</span>! 
                      Proteção premium com as suas criações AI em <span className="font-bold">alta qualidade</span>.
                    </p>
                  </div>

                  {/* 🎯 5. SELETOR DE MODELO MOBILE-FIRST */}
                  <div className="relative">
                    <Select
                      onValueChange={(value) => setSelectedPrintifyVariantId(parseInt(value))}
                      value={selectedPrintifyVariantId?.toString() || ''}
                    >
                      <SelectTrigger className="w-full h-12 sm:h-14 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium hover:border-ghibli-moss/60 focus:border-ghibli-moss transition-all duration-200 shadow-sm hover:shadow-md pl-3 sm:pl-4 pr-8 sm:pr-10">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-2 h-2 rounded-full bg-ghibli-moss shrink-0"></div>
                          <SelectValue placeholder="Escolha o seu modelo">
                            <span className="truncate">
                              {product.variants?.find(v => v.id === selectedPrintifyVariantId)?.title || 'Escolha o seu modelo'}
                            </span>
                        </SelectValue>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white text-ghibli-earth border-ghibli-sand max-h-60 shadow-xl">
                        {product.variants?.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id.toString()} className="hover:bg-ghibli-cream/50">
                            {variant.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Label mobile-optimized */}
                    <label className="absolute -top-2 left-2 sm:left-3 px-2 bg-white text-xs font-bold text-ghibli-moss">
                      📱 Modelo do Telemóvel
                    </label>
                  </div>

                  {/* 🛒 7. BOTÃO PRINCIPAL MOBILE-FIRST (IGUAL ÀS CANECAS) */}
                  <div className="pt-3">
                    {isProcessingMockup ? (
                      <div className="w-full py-5 sm:py-6 bg-gradient-to-r from-ghibli-moss/50 to-ghibli-moss-light/50 rounded-xl lg:rounded-2xl text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-ghibli-moss font-medium text-sm sm:text-base">Criando a sua capa mágica...</span>
                        </div>
                        <div className="mt-2 text-xs text-ghibli-earth/70">✨ Aplicando transformação AI</div>
                      </div>
                    ) : (
                    <Button
                      onClick={handleAddToCart}
                      disabled={!canPurchase || loading}
                        className={`group relative w-full py-5 sm:py-6 text-base sm:text-lg font-bold rounded-xl lg:rounded-2xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02] border-0 ${
                        canPurchase
                            ? 'bg-gradient-to-br from-ghibli-moss via-ghibli-moss-light to-ghibli-moss hover:from-ghibli-moss-light hover:via-ghibli-moss hover:to-ghibli-moss-light text-white' 
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                      }`}
                      >
                        {/* Shimmer effect */}
                        {canPurchase && (
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000"></div>
                        )}
                        
                        <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                      {loading ? (
                        <>
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>A adicionar...</span>
                        </>
                      ) : !userInfo ? (
                            <span className="text-center">Faça Login para Continuar</span>
                      ) : !selectedImageUrl ? (
                            <span className="text-center">Escolha uma Arte Primeiro</span>
                      ) : !selectedPrintifyVariantId ? (
                            <span className="text-center">Selecione o Modelo</span>
                      ) : (
                        <>
                              <span className="text-lg sm:text-xl">📱</span>
                              <span className="hidden sm:inline">Adicionar ao Carrinho</span>
                              <span className="sm:hidden">Adicionar</span>
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center">
                                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                              </div>
                        </>
                      )}
                        </span>
                          </Button>
                    )}
                  </div>

                  <ProductGuarantees variant="desktop" />
                </CardContent>
              </Card>
            </motion.div>
          </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Modal de Galeria de Transformações */}
      <TransformationGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelectImage={handleSelectImageFromGallery}
      />
    </>
  );
};

// Geração estática dos paths para produtos de tecnologia
export const getStaticPaths: GetStaticPaths = async () => {
  const tecnologiaProducts = getPrintifyProductsByCategory('tecnologia');
  const paths = Object.keys(tecnologiaProducts).map((productId) => ({
    params: { productId }
  }));

  return {
    paths,
    fallback: false
  };
};

// Geração estática das props
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productId = params?.productId as string;
  const product = getPrintifyProduct(productId);

  if (!product || product.category !== 'tecnologia') {
    return {
      notFound: true
    };
  }

  return {
    props: { product }
  };
};

export default PhoneCaseDetailPage; 