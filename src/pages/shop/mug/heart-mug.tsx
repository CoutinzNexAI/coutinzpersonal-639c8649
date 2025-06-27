import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Truck, Award, ChevronRight, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import { ImageAdjustments } from '@/types/product';
import ProductCardDecorations from '@/components/shared/ProductCardDecorations';
import { GlobalRateLimiter } from '@/lib/utils/rateLimiter';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

const HeartMugPage: React.FC = () => {
  const router = useRouter();
  const { userInfo } = useAuth();
  
  // Estados básicos
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  
  // Estados para Printify
  const [printifyPreviewUrls, setPrintifyPreviewUrls] = useState<string[]>([]);
  const [printifyImageId, setPrintifyImageId] = useState<string>('');
  const [printifyProductId, setPrintifyProductId] = useState<string>('');
  
  // Estados para controlo
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imagePosition, setImagePosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [currentMockupUrls, setCurrentMockupUrls] = useState<string[]>([]);
  const [activeMockupIndex, setActiveMockupIndex] = useState<number>(0);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState<boolean>(false);
  const [quantity, setQuantity] = useState(1);

  // Configuração fixa da caneca coração compatível com PrintifyProductMapping
  const heartMugConfig: PrintifyProductMapping = {
    id: 'heart_mug',
    name: 'Caneca Coração',
    category: 'mug',
    mockupInitialPath: '/mockupproduto/canecacoracao.png',
    basePrice: 30,
    price: 30,
    supportsManualAdjustment: true,
    defaultDesign: {
      scale: 1,
      x: 0.5,
      y: 0.5,
      angle: 0
    },
    printifyBlueprintId: 651,
    printifyPrintProviderId: 5,
    variants: [{
      id: 8197,
      title: '330ml - Formato Coração',
      placeholderWidth: 400,
      placeholderHeight: 400,
      isGiftPackaging: false
    }],
    printAreasConfig: [{
      position: 'front',
      allowsUserImage: true,
      defaultX: 0.5,
      defaultY: 0.5,
      defaultScale: 1,
      defaultAngle: 0
    }]
  };

  // Cálculos de preço e desconto
  const calculateDiscount = (qty: number) => {
    if (qty >= 3) return 15;
    if (qty >= 2) return 10;
    return 0;
  };

  const basePrice = heartMugConfig.basePrice || 30;
  const discount = calculateDiscount(quantity);
  const discountedPrice = basePrice * (1 - discount / 100);
  const totalPrice = discountedPrice * quantity;
  const savings = (basePrice * quantity) - totalPrice;

  // Validação
  const validatePurchase = () => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar a sua caneca!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  };

  // Setup inicial das dimensões da imagem quando selecionada
  useEffect(() => {
    if (selectedImageUrl) {
      const img = new Image();
      img.onload = () => {
        setUserImageDimensions({ width: img.width, height: img.height });
        console.log('📐 [HEART MUG] Dimensões detectadas:', { width: img.width, height: img.height });
      };
      img.onerror = () => {
        console.error('❌ [HEART MUG] Erro ao detectar dimensões');
        setUserImageDimensions({ width: 1016, height: 1016 });
      };
      img.src = selectedImageUrl;
    } else {
      setUserImageDimensions(null);
    }
  }, [selectedImageUrl]);

  // Calcular coordenadas de posicionamento
  const calculatePrintifyCoords = (position: 'top' | 'center' | 'bottom'): ImageAdjustments => {
    if (!userImageDimensions || !heartMugConfig.variants) {
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }

    const variant = heartMugConfig.variants[0];
    const { placeholderWidth, placeholderHeight } = variant;
    const { width: userImageWidth, height: userImageHeight } = userImageDimensions;

    // Calcular escala para cobrir toda a área
    const scaleToCover = Math.max(
      placeholderWidth / userImageWidth,
      placeholderHeight / userImageHeight
    );

    // Converter para escala Printify
    const finalImageWidth = userImageWidth * scaleToCover;
    const printifyScale = finalImageWidth / placeholderWidth;
    
    // Calcular movimento permitido
    const scaledImageHeight = userImageHeight * scaleToCover;
    const overflowY = Math.max(0, scaledImageHeight - placeholderHeight);
    const maxOffsetY = (overflowY / 2) / placeholderHeight;

    const finalX = 0.5; // Sempre centrado horizontalmente
    let finalY = 0.5;
    const shiftAmount = 0.35;

    if (position === 'top') {
      finalY = 0.5 - (maxOffsetY * shiftAmount);
    } else if (position === 'bottom') {
      finalY = 0.5 + (maxOffsetY * shiftAmount);
    }

    return {
      x: finalX,
      y: finalY,
      scale: printifyScale,
      rotation: 0
    };
  };

  // Handlers
  const handlePreviewReady = useCallback((data: {
    previewUrls: string[];
    printifyImageId?: string;
    printifyProductId: string;
  }) => {
    setPrintifyPreviewUrls(data.previewUrls);
    setPrintifyImageId(data.printifyImageId || '');
    setPrintifyProductId(data.printifyProductId);
    
    if (data.previewUrls.length > 0 && currentMockupUrls.length === 0) {
      setCurrentMockupUrls(data.previewUrls);
      setActiveMockupIndex(0);
    }
    
    console.log('✅ [HEART MUG] Mockups prontos:', data);
  }, [currentMockupUrls]);

  const handleSelectImageFromGallery = async (imageUrl: string, imageId: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    setIsGalleryModalOpen(false);
    
    // Reset estados Printify
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    setImageAdjustments(undefined);
    
    toast.success('Arte aplicada com sucesso!');
  };

  const handleAdjustment = async (position: 'top' | 'center' | 'bottom') => {
    if (!userImageDimensions) {
      toast.error('Aguarde o carregamento da imagem');
      return;
    }

    const { allowed, message } = GlobalRateLimiter.checkRequestLimit();
    if (!allowed) {
      toast.error(message);
      return;
    }

    setImagePosition(position);
    GlobalRateLimiter.recordRequest();

    const newCoords = calculatePrintifyCoords(position);
    await generateNewMockup(position, newCoords);
  };

  const generateNewMockup = async (position: 'top' | 'center' | 'bottom', coords: ImageAdjustments) => {
    if (!selectedImageUrl || !selectedImageId) return;

    setIsGeneratingMockup(true);

    try {
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: heartMugConfig.id,
          userImageUrl: selectedImageUrl,
          userId: userInfo?.id,
          imageAdjustments: coords,
          selectedPrintifyVariantId: heartMugConfig.variants?.[0]?.id,
          printifyImageId: selectedImageId
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.previewUrls?.length > 0) {
        setCurrentMockupUrls(data.previewUrls);
        setActiveMockupIndex(0);
        setPrintifyPreviewUrls(data.previewUrls);
        setImageAdjustments(coords);
        
        toast.success(`Posição alterada para: ${position === 'top' ? 'Cima' : position === 'bottom' ? 'Baixo' : 'Centro'}!`);
      } else {
        toast.error('Erro ao gerar nova preview. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ [HEART MUG] Erro na API:', error);
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  const handleAddToCart = async () => {
    const validationError = validatePurchase();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      let finalCoordinates;
      if (userImageDimensions) {
        finalCoordinates = calculatePrintifyCoords(imagePosition);
      } else {
        finalCoordinates = { scale: 1, x: 0.5, y: 0.5, angle: 0 };
      }

      await CartService.addToCart({
        productId: heartMugConfig.id,
        productName: heartMugConfig.name,
        productCategory: heartMugConfig.category,
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId!,
        price: discountedPrice,
        quantity: quantity,
        customizations: {
          variantId: heartMugConfig.variants?.[0]?.id || 8197,
          size: heartMugConfig.variants?.[0]?.title || '330ml - Formato Coração',
          scale: finalCoordinates.scale,
          x: finalCoordinates.x,
          y: finalCoordinates.y,
          angle: finalCoordinates.angle || 0,
        },
        imageAdjustments,
      });

      const quantityText = quantity === 1 ? 'Caneca adicionada' : `${quantity} canecas adicionadas`;
      const discountText = discount > 0 ? ` (${discount}% desconto aplicado!)` : '';
      
      toast.success(`${quantityText} ao carrinho!`, {
        description: `Total: €${totalPrice.toFixed(2)}${discountText}`,
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

  // Condições auxiliares
  const isProcessingMockup = (!printifyProductId || !printifyImageId) && selectedImageUrl;
  const canPurchase = selectedImageUrl && printifyProductId && printifyImageId && userInfo;

  return (
    <>
      <Head>
        <title>Caneca Coração ❤️ - Loja PicTuz</title>
        <meta name="description" content="Personaliza a sua Caneca Coração com as suas criações AI. Caneca de cerâmica premium em formato especial de coração." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-2 sm:px-4 pt-20 pb-6 sm:pt-12 sm:pb-8 lg:py-8">
          {/* 📱 MOBILE LAYOUT */}
          <div className="block lg:hidden">
            {/* Título Mobile */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6 px-4"
            >
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-ghibli-earth via-ghibli-wood to-ghibli-moss bg-clip-text text-transparent leading-tight mb-4 tracking-tight">
                Caneca Coração ❤️
              </h1>
              <div className="text-4xl sm:text-5xl font-black text-ghibli-moss drop-shadow-lg tracking-tight">
                €{discountedPrice.toFixed(2)}
                {discount > 0 && (
                  <span className="text-lg text-gray-500 line-through ml-2">€{basePrice.toFixed(2)}</span>
                )}
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
                  selectedProduct={heartMugConfig}
                  userImageUrl={selectedImageUrl}
                  userId={userInfo?.id}
                  printifyGeneratedPreviewUrls={printifyPreviewUrls}
                  onPreviewReady={handlePreviewReady}
                  onSelectImage={() => setIsGalleryModalOpen(true)}
                  imageAdjustments={imageAdjustments}
                  onImageAdjust={setImageAdjustments}
                  selectedPrintifyVariantId={heartMugConfig.variants?.[0]?.id}
                />
              </div>

              {/* Controlos Mobile */}
              {userInfo ? (
                selectedImageUrl && userImageDimensions ? (
                  <div className="px-4">
                    <div className="flex gap-4 items-center justify-center">
                      <Button
                        onClick={() => setIsGalleryModalOpen(true)}
                        className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white rounded-lg shadow-lg transition-all duration-300"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Trocar
                      </Button>

                      <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-ghibli-sand/30">
                        {['top', 'center', 'bottom'].map((pos) => (
                          <Button 
                            key={pos}
                            onClick={() => handleAdjustment(pos as 'top' | 'center' | 'bottom')} 
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 rounded-full transition-all duration-200 ${imagePosition === pos 
                              ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                              : 'text-ghibli-earth hover:bg-ghibli-moss/10'
                            }`}
                            disabled={isGeneratingMockup}
                            title={pos === 'top' ? 'Cima' : pos === 'bottom' ? 'Baixo' : 'Centro'}
                          >
                            {pos === 'top' && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>}
                            {pos === 'center' && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/></svg>}
                            {pos === 'bottom' && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 text-center">
                    <Button
                      onClick={() => setIsGalleryModalOpen(true)}
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
                        🎨 Entre para personalizar a sua caneca
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
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sand/30 shadow-lg">
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
                  
                  {discount > 0 && (
                    <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{discount}%
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ghibli-earth">Quantidade:</span>
                    <div className="flex items-center gap-2 bg-ghibli-cream/50 rounded-lg p-1">
                      <Button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-md hover:bg-ghibli-moss/10 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      <span className="min-w-[2rem] text-center font-bold text-ghibli-earth">
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

                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      quantity >= 2 
                        ? 'bg-green-100 border border-green-300 text-green-800' 
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      <span>🎯 2+ canecas</span>
                      <span className="font-bold">10% OFF</span>
                    </div>
                    <div className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      quantity >= 3 
                        ? 'bg-green-100 border border-green-300 text-green-800' 
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      <span>🔥 3+ canecas</span>
                      <span className="font-bold">15% OFF</span>
                    </div>
                  </div>

                  {quantity > 1 && (
                    <div className="border-t border-ghibli-sand/30 pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ghibli-earth">Total:</span>
                        <div className="text-right">
                          <div className="text-xl font-black text-ghibli-moss">€{totalPrice.toFixed(2)}</div>
                          <div className="text-xs text-ghibli-earth/70">
                            {quantity} × €{discountedPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Botão Adicionar ao Carrinho Mobile */}
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
                    <span className="text-ghibli-moss font-medium text-sm">Criando a sua caneca mágica...</span>
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
                    ) : (
                      <>
                        <span className="text-xl">🛒</span>
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
              {selectedImageUrl && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <img src={selectedImageUrl} className="w-10 h-10 rounded-lg object-cover border border-green-300" alt="Arte selecionada" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-800 text-sm">✅ Arte Aplicada</p>
                    <p className="text-xs text-green-600 truncate">Transformação AI pronta</p>
                  </div>
                </div>
              )}

              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sand/30">
                <ul className="text-sm space-y-2 text-ghibli-earth/80">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                    <span>Caneca de <span className="font-bold text-ghibli-moss">cerâmica premium</span> em formato de coração</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                    <span>Impressão duradoura e <span className="font-bold">resistente à lavagem</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-wood rounded-full shrink-0"></div>
                    <span className="font-bold text-ghibli-wood">Perfeita para oferecer a quem mais gosta</span>
                    <span className="text-red-500">❤️</span>
                  </li>
                </ul>
              </div>

              <div className="bg-ghibli-cream/30 rounded-xl border border-ghibli-sand/40 p-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-ghibli-moss"></div>
                  <span className="text-ghibli-earth font-semibold">💝 Tamanho: 330 ml</span>
                </div>
                <p className="text-center text-xs text-ghibli-earth/70 mt-1">Formato especial de coração</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-ghibli-cream/40 rounded-xl p-3 text-center border border-ghibli-sand/30">
                  <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-ghibli-moss/10 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-ghibli-moss" />
                  </div>
                  <span className="text-xs font-bold text-ghibli-earth">Cerâmica Premium</span>
                </div>
                <div className="bg-ghibli-cream/40 rounded-xl p-3 text-center border border-ghibli-sand/30">
                  <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-ghibli-moss/10 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-ghibli-moss" />
                  </div>
                  <span className="text-xs font-bold text-ghibli-earth">Impressão HD</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 🖥️ DESKTOP LAYOUT será implementado quando necessário */}
          <div className="hidden lg:block">
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold text-ghibli-moss mb-4">
                Layout Desktop em Desenvolvimento
              </h1>
              <p className="text-ghibli-earth">
                O layout mobile está funcional. Desktop layout será implementado...
              </p>
            </div>
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

export default HeartMugPage; 