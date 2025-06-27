import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Truck, Award, ChevronDown, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { ImageAdjustments, PRODUCT_ANIMATIONS, PRODUCT_STYLES } from '@/types/product';
import ProductCardDecorations from '@/components/shared/ProductCardDecorations';
import { validatePurchase } from '@/utils/productValidation';
import { GlobalRateLimiter } from '@/lib/utils/rateLimiter';

interface MugDetailPageProps {
  product: PrintifyProductMapping;
}

const MugDetailPage: React.FC<MugDetailPageProps> = ({ product: initialProduct }) => {
  const router = useRouter();
  const { productId } = router.query;
  const { userInfo, session } = useAuth();
  
  const [product, setProduct] = useState<PrintifyProductMapping | null>(initialProduct || null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [mockupImageUrl, setMockupImageUrl] = useState<string | null>(null);
  
  // Estados para Printify
  const [printifyPreviewUrls, setPrintifyPreviewUrls] = useState<string[]>([]);
  const [printifyImageId, setPrintifyImageId] = useState<string>('');
  const [printifyProductId, setPrintifyProductId] = useState<string>('');
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState<number | null>(null);

  // ✅ NOVO: Estado para dimensões da imagem do utilizador
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // ✅ POSIÇÕES DEFINIDAS: Estado para a posição da imagem (3 opções)
  // Para canecas: top/center/bottom (movimento vertical com escala corrigida)
  const [imagePosition, setImagePosition] = useState<'top' | 'center' | 'bottom'>('center');

  // ✅ GALERIA DE MOCKUPS: Guarda o array de URLs das mockups atuais
  const [currentMockupUrls, setCurrentMockupUrls] = useState<string[]>([]);

  // ✅ ÍNDICE ATIVO: Para saber qual mockup mostrar na galeria
  const [activeMockupIndex, setActiveMockupIndex] = useState<number>(0);

  // ✅ LOADING INDICATOR: Para mostrar enquanto a nova mockup é gerada
  const [isGeneratingMockup, setIsGeneratingMockup] = useState<boolean>(false);

  // Função utilitária: Validação consolidada
  const validatePurchase = () => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar a sua caneca!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione o tamanho da caneca.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  };

  // Setup inicial do produto
  useEffect(() => {
    if (!initialProduct && typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      if (foundProduct && foundProduct.category === 'mug') {
        setProduct(foundProduct);
        if (foundProduct.variants && foundProduct.variants.length > 0) {
          console.log('🔍 [MUG DEBUG] Variantes disponíveis:', foundProduct.variants.map(v => ({ id: v.id, title: v.title })));
          
          const firstVariant = foundProduct.variants[0];
          console.log('🔍 [MUG DEBUG] Primeira variante selecionada:', { id: firstVariant.id, title: firstVariant.title });
          
          setSelectedPrintifyVariantId(firstVariant.id);
        }
      } else {
        router.push('/shop');
        toast.error('Produto não encontrado');
      }
    } else if (initialProduct) {
      // Set default variant for initial product
      if (initialProduct.variants && initialProduct.variants.length > 0) {
        console.log('🔍 [MUG DEBUG] Variantes disponíveis (initial):', initialProduct.variants.map(v => ({ id: v.id, title: v.title })));
        
        const firstVariant = initialProduct.variants[0];
        console.log('🔍 [MUG DEBUG] Primeira variante selecionada (initial):', { id: firstVariant.id, title: firstVariant.title });
        
        setSelectedPrintifyVariantId(firstVariant.id);
      }
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

  // Calcular defaultScale dinâmico e atualizar imageAdjustments - Adaptado para canecas
  useEffect(() => {
    if (selectedImageUrl && product && selectedPrintifyVariantId) {
      const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
      if (!selectedVariant) return;

      const { placeholderWidth, placeholderHeight } = selectedVariant;
      const userImageWidth = 1016; // Assumindo que a imagem AI é sempre quadrada
      const userImageHeight = 1016;

      // PASSO A: Calcula o fator de zoom necessário para cobrir toda a área (lógica Math.max)
      const scaleToCover = Math.max(
        placeholderWidth / userImageWidth,
        placeholderHeight / userImageHeight
      );

      // PASSO B: Calcula qual será a LARGURA da imagem depois de aplicar este zoom
      const finalImageWidth = userImageWidth * scaleToCover;

      // PASSO C (A TRADUÇÃO): Converte a nossa largura final para o valor de 'scale' que a Printify entende
      const printifyScale = finalImageWidth / placeholderWidth;
      
      console.log('🎯 [MUG FRONTEND] Cálculo de escala definitivo:', {
        placeholderWidth,
        placeholderHeight,
        userImageWidth,
        userImageHeight,
        scaleToCover,
        finalImageWidth,
        printifyScale
      });
      
        setImageAdjustments({
        x: 0.5, // Mantém centrado
        y: 0.5, // Mantém centrado
        scale: printifyScale, // USA O VALOR TRADUZIDO!
        rotation: 0
        });
    }
  }, [selectedImageUrl, product, selectedPrintifyVariantId]);

  // ✅ DETECTAR DIMENSÕES DA IMAGEM: Quando uma imagem é selecionada
  useEffect(() => {
    if (selectedImageUrl) {
      const img = new Image();
      img.onload = () => {
        setUserImageDimensions({ width: img.width, height: img.height });
        console.log('📐 [MUG] Dimensões da imagem detectadas:', { width: img.width, height: img.height });
      };
      img.onerror = () => {
        console.error('❌ [MUG] Erro ao carregar imagem para detectar dimensões');
        // Default para imagens AI quadradas
        setUserImageDimensions({ width: 1016, height: 1016 });
      };
      img.src = selectedImageUrl;
    } else {
      setUserImageDimensions(null);
    }
  }, [selectedImageUrl]);

  // Função para lidar com os mockups gerados pelo ProductCanvas
  const handlePreviewReady = useCallback((data: {
    previewUrls: string[];
    printifyImageId: string;
    printifyProductId: string;
  }) => {
    setPrintifyPreviewUrls(data.previewUrls);
    setPrintifyImageId(data.printifyImageId);
    setPrintifyProductId(data.printifyProductId);
    
    // ✅ Inicializar galeria de mockups com todas as mockups geradas
    if (data.previewUrls.length > 0 && currentMockupUrls.length === 0) {
      setCurrentMockupUrls(data.previewUrls);
      setActiveMockupIndex(0);
    }
    
    console.log('✅ Printify mockups received:', data);
  }, [currentMockupUrls]);

  // ✅ FUNÇÃO PRINCIPAL: Calcular coordenadas finais baseado na posição definida (VERSÃO FINAL CORRIGIDA)
  const calculatePrintifyCoords = (position: 'top' | 'center' | 'bottom', variantId: number, imageDimensions: { width: number; height: number }): ImageAdjustments => {
    
    if (!product || !imageDimensions) {
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }
    const selectedVariant = product.variants?.find(v => v.id === variantId);
    if (!selectedVariant) {
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }

    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const { width: userImageWidth, height: userImageHeight } = imageDimensions;

    // --- PASSO 1: CALCULAR A ESCALA "COVER" ---
    const scaleToCover = Math.max(
      placeholderWidth / userImageWidth,
      placeholderHeight / userImageHeight
    );

    // --- PASSO 2: CALCULAR A ESCALA PARA A API DA PRINTIFY ---
    const finalImageWidth = userImageWidth * scaleToCover;
    const printifyScale = finalImageWidth / placeholderWidth;
    
    // --- PASSO 3: CALCULAR O MOVIMENTO MÁXIMO PERMITIDO ---
    const scaledImageWidth = userImageWidth * scaleToCover;
    const scaledImageHeight = userImageHeight * scaleToCover;
    
    const overflowX = Math.max(0, scaledImageWidth - placeholderWidth);
    const overflowY = Math.max(0, scaledImageHeight - placeholderHeight);
    
    // O MÁXIMO QUE O CENTRO (0.5) PODE ANDAR
    const maxOffsetX = (overflowX / 2) / placeholderWidth;
    const maxOffsetY = (overflowY / 2) / placeholderHeight; // ✅ CORREÇÃO: usar placeholderHeight para Y

    // --- PASSO 4: DEFINIR A POSIÇÃO FINAL COM BASE NO BOTÃO ---
    const finalX = 0.5; // Para canecas, X fica sempre centrado
    let finalY = 0.5;
    const shiftAmount = 0.35; // Reduzido para metade: usar 35% do movimento máximo para um ajuste mais suave

    if (position === 'top') {
      finalY = 0.5 - (maxOffsetY * shiftAmount);
    } else if (position === 'bottom') {
      finalY = 0.5 + (maxOffsetY * shiftAmount);
    }
    // Para canecas, X fica sempre centrado (finalX = 0.5)
    
    // --- PASSO 5: RETORNAR O OBJETO COMPLETO E CORRETO ---
    const finalAdjustments = {
      x: finalX,
      y: finalY,
      scale: printifyScale,
      rotation: 0
    };

    console.log('🎯 [CANECA] Coordenadas calculadas (VERSÃO DEFINITIVA):', {
      position,
      variantId,
      placeholderDimensions: { placeholderWidth, placeholderHeight },
      userImageDimensions: { userImageWidth, userImageHeight },
      scaleToCover,
      scaledImageWidth,
      scaledImageHeight,
      overflowX,
      overflowY,
      maxOffsetX,
      maxOffsetY,
      shiftAmount,
      finalX,
      finalY,
      printifyScale,
      finalAdjustments
    });

    return finalAdjustments;
  };

  // Handlers simplificados
  const handleAddToCart = async () => {
    const validationError = validatePurchase();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      // ✅ CARREGAR CONFIGURAÇÃO CENTRAL DO PRODUTO
      const productConfig = getPrintifyProduct(productId as string);
      if (!productConfig) {
        throw new Error('Configuração do produto não encontrada');
      }

      const variant = product!.variants?.find(v => v.id === selectedPrintifyVariantId);

      // ✅ USAR COORDENADAS DE POSICIONAMENTO PERSONALIZADO se disponível
      let finalCoordinates;
      if (userImageDimensions && selectedPrintifyVariantId) {
        finalCoordinates = calculatePrintifyCoords(imagePosition, selectedPrintifyVariantId, userImageDimensions);
        console.log('🎯 [MUG CARRINHO] Usando coordenadas customizadas:', finalCoordinates);
      } else {
        // Fallback para coordenadas padrão
        finalCoordinates = {
          scale: productConfig.defaultDesign.scale,
          x: productConfig.defaultDesign.x,
          y: productConfig.defaultDesign.y,
          angle: productConfig.defaultDesign.angle
        };
        console.log('🎯 [MUG CARRINHO] Usando coordenadas padrão:', finalCoordinates);
      }

      CartService.addToCart({
        productId: productId as string,
        productName: product!.name,
        productCategory: product!.category || 'mug',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId!,
        price: product!.basePrice || product!.price || 0,
        quantity: 1,
        customizations: {
          variantId: selectedPrintifyVariantId!, // Obrigatório agora
          size: variant?.title || 'Tamanho não encontrado',
          // ✅ OS CAMPOS CRÍTICOS: Usar coordenadas calculadas ou padrão
          scale: finalCoordinates.scale,
          x: finalCoordinates.x,
          y: finalCoordinates.y,
          angle: finalCoordinates.angle || 0,
          print_on_side: productConfig.defaultDesign.print_on_side, // Undefined para caneca (não usa)
        },
        imageAdjustments,
      });

      console.log('🛒 Caneca adicionada ao carrinho com configurações:', {
        position: imagePosition,
        coordinates: finalCoordinates,
        defaultDesign: productConfig.defaultDesign
      });
      
      toast.success('Caneca adicionada ao carrinho!', {
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
    
    // Reset estados Printify para nova geração
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    setImageAdjustments(undefined);
    
    toast.success('Arte aplicada com sucesso!');
  };

  const handleImageAdjustmentChange = (adjustments: Partial<ImageAdjustments>) => {
    if (imageAdjustments) {
      setImageAdjustments({ 
        ...imageAdjustments, 
        ...adjustments, 
        x: 0.5 // Força X sempre centrado
      });
    }
  };

  // ✅ LÓGICA CENTRAL: Controla todos os ajustes que precisam de nova mockup
  const handleAdjustment = async (type: 'position' | 'size', value: string | number) => {
    console.log('🎮 [CANECA] handleAdjustment chamado:', { type, value, currentPosition: imagePosition });
    
    // 1. FALA COM O GUARDA-COSTAS PRIMEIRO
    const { allowed, message } = GlobalRateLimiter.checkRequestLimit();
    if (!allowed) {
      console.log('🚫 [CANECA] Rate limit bloqueou o pedido:', message);
      toast.error(message); // Mostra o erro ao utilizador
      return; // Para a execução aqui
    }

    if (!userImageDimensions) {
      console.log('❌ [CANECA] userImageDimensions não está definido:', userImageDimensions);
      toast.error('Aguarde o carregamento da imagem');
      return;
    }

    console.log('✅ [CANECA] Verificações passaram, a processar ajuste...');

    // 2. Se for permitido, atualiza o estado correspondente
    let newPosition = imagePosition;
    let newVariantId = selectedPrintifyVariantId;

    if (type === 'position') {
      newPosition = value as 'top' | 'center' | 'bottom';
      setImagePosition(newPosition);
      console.log(`📍 [CANECA] Posição alterada de "${imagePosition}" para "${newPosition}"`);
    } else if (type === 'size') {
      newVariantId = value as number;
      setSelectedPrintifyVariantId(newVariantId);
      console.log(`📏 [CANECA] Tamanho alterado para variante: ${newVariantId}`);
    }

    // 3. Regista que um pedido foi feito
    GlobalRateLimiter.recordRequest();
    console.log('📝 [CANECA] Pedido registado no rate limiter');

    // 4. E só depois chama a função para gerar a mockup
    console.log('🚀 [CANECA] A chamar generateNewMockup...');
    await generateNewMockup(newPosition, newVariantId);
  };

  // ✅ FUNÇÃO QUE CHAMA O BACKEND: Gera nova mockup com a posição e variante
  const generateNewMockup = async (currentPosition: 'top' | 'center' | 'bottom', currentVariantId: number) => {
    if (!userImageDimensions || !selectedImageUrl || !selectedImageId) {
      console.log('❌ Dados insuficientes para gerar mockup:', { 
        userImageDimensions, 
        selectedImageUrl: !!selectedImageUrl, 
        selectedImageId: !!selectedImageId 
      });
      return;
    }

    console.log('🔄 [CANECA] Iniciando geração de nova mockup...', { 
      currentPosition, 
      currentVariantId,
      productId: product?.id
    });
    setIsGeneratingMockup(true);

    // Calcula as coordenadas baseadas na posição e variante
    const adjustments = calculatePrintifyCoords(currentPosition, currentVariantId, userImageDimensions);

    const requestBody = {
      productId: product?.id,
      userImageUrl: selectedImageUrl,
      userId: userInfo?.id,
      imageAdjustments: adjustments,
      selectedPrintifyVariantId: currentVariantId,
      printifyImageId: selectedImageId
    };

    console.log('📤 [CANECA] Enviando para API:', requestBody);

    try {
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('📥 [CANECA] Resposta da API:', data);

      if (response.ok && data.success && data.previewUrls && data.previewUrls.length > 0) {
        console.log('✅ [CANECA] Nova galeria de mockups gerada com sucesso!', data.previewUrls.length, 'imagens');
        
        // ✅ ATUALIZAR TODOS OS ESTADOS necessários
        setCurrentMockupUrls(data.previewUrls);
        setActiveMockupIndex(0);
        setPrintifyPreviewUrls(data.previewUrls);
        
        // ✅ ATUALIZAR imageAdjustments para refletir as novas coordenadas
        setImageAdjustments(adjustments);
        
        toast.success(`Posição alterada para: ${currentPosition === 'top' ? 'Cima' : currentPosition === 'bottom' ? 'Baixo' : 'Centro'}!`);
      } else {
        console.error('❌ [CANECA] Erro ao gerar nova mockup:', data.error || 'Resposta inválida');
        toast.error('Erro ao gerar nova preview. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ [CANECA] Falha grave na chamada à API:', error);
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  // Condições auxiliares para botão
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

  const currentPrice = product.basePrice || product.price || 0;

  return (
    <>
      <Head>
        <title>{product.name} - Loja PicTuz</title>
        <meta name="description" content={`Personalize a sua ${product.name} com as suas criações AI. Canecas de cerâmica de alta qualidade.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-2 sm:px-4 pt-20 pb-6 sm:pt-12 sm:pb-8 lg:py-8">
          {/* 📱 MOBILE LAYOUT: Título em Destaque no Topo */}
          <div className="block lg:hidden">
            {/* Título Mobile - Em Destaque */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6 px-4"
            >
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-ghibli-earth via-ghibli-wood to-ghibli-moss bg-clip-text text-transparent leading-tight mb-3 drop-shadow-sm">
                Caneca Coração
              </h1>
              <div className="text-4xl font-black text-ghibli-moss drop-shadow-sm">
                €25.00
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

                      {/* Controlos de Posição - Mobile Pequenos */}
                      <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-ghibli-sand/30">
                        <Button 
                          onClick={() => handleAdjustment('position', 'top')} 
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 rounded-full transition-all duration-200 ${imagePosition === 'top' 
                            ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                            : 'text-ghibli-earth hover:bg-ghibli-moss/10'
                          }`}
                          disabled={isGeneratingMockup}
                          title="Cima"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                          </svg>
                        </Button>
                        
                        <Button 
                          onClick={() => handleAdjustment('position', 'center')} 
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 rounded-full transition-all duration-200 ${imagePosition === 'center' 
                            ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                            : 'text-ghibli-earth hover:bg-ghibli-moss/10'
                          }`}
                          disabled={isGeneratingMockup}
                          title="Centro"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </Button>
                        
                        <Button 
                          onClick={() => handleAdjustment('position', 'bottom')} 
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 rounded-full transition-all duration-200 ${imagePosition === 'bottom' 
                            ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                            : 'text-ghibli-earth hover:bg-ghibli-moss/10'
                          }`}
                          disabled={isGeneratingMockup}
                          title="Baixo"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                          </svg>
                        </Button>
                      </div>
                    </div>

                    {/* Status Compacto Mobile */}
                    <div className="mt-2 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-ghibli-moss bg-ghibli-moss/5 px-2 py-1 rounded-full font-medium border border-ghibli-moss/20">
                        <div className="w-1 h-1 bg-ghibli-moss rounded-full animate-pulse"></div>
                        {imagePosition === 'top' ? 'Cima' : imagePosition === 'bottom' ? 'Baixo' : 'Centro'}
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

            {/* Botão Adicionar ao Carrinho Mobile - Destaque */}
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
                    ) : !selectedPrintifyVariantId ? (
                      <span>Selecione o Tamanho</span>
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
              {/* Status Arte Mobile */}
              {selectedImageUrl && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <img src={selectedImageUrl} className="w-10 h-10 rounded-lg object-cover border border-green-300" alt="Arte selecionada" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-800 text-sm">✅ Arte Aplicada</p>
                    <p className="text-xs text-green-600 truncate">Transformação AI pronta</p>
                  </div>
                </div>
              )}

              {/* Descrição Mobile */}
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

              {/* Tamanho Mobile */}
              <div className="bg-ghibli-cream/30 rounded-xl border border-ghibli-sand/40 p-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-ghibli-moss"></div>
                  <span className="text-ghibli-earth font-semibold">💝 Tamanho: 330 ml</span>
                </div>
                <p className="text-center text-xs text-ghibli-earth/70 mt-1">Formato especial de coração</p>
              </div>

              {/* Garantias Mobile */}
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
            {/* Área de Visualização */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 order-1"
            >
              <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[700px] bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl overflow-hidden mb-4 lg:mb-6 border border-ghibli-sand/20">
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

              {/* ✅ CONTROLOS LADO A LADO - Trocar Arte + Ajustar Posição */}
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

                      {/* Controlos de Posição - Maiores */}
                      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-ghibli-sand/30">
                        {/* Botão Cima */}
                        <Button 
                          onClick={() => handleAdjustment('position', 'top')} 
                          variant="ghost"
                          size="sm"
                          className={`h-12 w-12 rounded-full transition-all duration-200 ${imagePosition === 'top' 
                            ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                            : 'text-ghibli-earth hover:bg-ghibli-moss/10 hover:scale-105'
                          }`}
                          disabled={isGeneratingMockup}
                          title="Cima"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                          </svg>
                        </Button>
                        
                        {/* Botão Centro */}
                        <Button 
                          onClick={() => handleAdjustment('position', 'center')} 
                          variant="ghost"
                          size="sm"
                          className={`h-12 w-12 rounded-full transition-all duration-200 ${imagePosition === 'center' 
                            ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                            : 'text-ghibli-earth hover:bg-ghibli-moss/10 hover:scale-105'
                          }`}
                          disabled={isGeneratingMockup}
                          title="Centro"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </Button>
                        
                        {/* Botão Baixo */}
                        <Button 
                          onClick={() => handleAdjustment('position', 'bottom')} 
                          variant="ghost"
                          size="sm"
                          className={`h-12 w-12 rounded-full transition-all duration-200 ${imagePosition === 'bottom' 
                            ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                            : 'text-ghibli-earth hover:bg-ghibli-moss/10 hover:scale-105'
                          }`}
                          disabled={isGeneratingMockup}
                          title="Baixo"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                          </svg>
                        </Button>
                      </div>
                    </div>

                    {/* Indicador de Status - Compacto */}
                    <div className="mt-3 text-center">
                      <span className="inline-flex items-center gap-2 text-xs text-ghibli-moss bg-ghibli-moss/5 px-3 py-1 rounded-full font-medium border border-ghibli-moss/20">
                        <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full animate-pulse"></div>
                        Posição: {imagePosition === 'top' ? 'Cima' : imagePosition === 'bottom' ? 'Baixo' : 'Centro'}
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
                </motion.div>
              )}
            </motion.div>

            {/* Painel de Controlo */}
            <motion.div
              {...PRODUCT_ANIMATIONS.sidebar}
              className="lg:col-span-1 order-2"
            >
              <Card className={PRODUCT_STYLES.card}>
                
                <ProductCardDecorations />
                
                <CardContent className="relative z-10 p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {/* Título + Preço */}
                  <div className="text-center pb-3 sm:pb-4 border-b border-ghibli-sand/30">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-ghibli-earth to-ghibli-wood bg-clip-text text-transparent leading-tight mb-2">
                      Caneca Coração
                    </h1>
                    <div className="inline-block">
                      <div className="text-3xl sm:text-4xl font-black text-ghibli-moss drop-shadow-sm">
                        €25.00
                      </div>
                    </div>
                  </div>

                  {/* Descrição em Tópicos - Movida para cima */}
                  <div className="space-y-2">
                    <ul className="text-sm space-y-1 text-ghibli-earth/80">
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

                  {/* Status Arte */}
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

                  {/* Seletor/Display de Tamanho */}
                  {product.variants && product.variants.length > 1 ? (
                    // Se há múltiplas variantes, mostrar dropdown
                    <div className="relative">
                  <Select
                    onValueChange={(value) => setSelectedPrintifyVariantId(parseInt(value))}
                    value={selectedPrintifyVariantId?.toString() || ''}
                  >
                        <SelectTrigger className="w-full h-12 sm:h-14 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium hover:border-ghibli-moss/60 focus:border-ghibli-moss transition-all duration-200 shadow-sm hover:shadow-md pl-3 sm:pl-4 pr-8 sm:pr-10">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-2 h-2 rounded-full bg-ghibli-moss shrink-0"></div>
                            <SelectValue placeholder="Escolha o tamanho">
                              <span className="truncate">
                                {product.variants?.find(v => v.id === selectedPrintifyVariantId)?.title || 'Escolha o tamanho'}
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
                      
                      <label className="absolute -top-2 left-2 sm:left-3 px-2 bg-white text-xs font-bold text-ghibli-moss">
                        ☕ Tamanho da Caneca
                      </label>
                  </div>
                  ) : (
                    // Se há apenas 1 variante, apenas mostrar o tamanho (sem dropdown)
                    <div className="relative p-4 bg-ghibli-cream/30 rounded-xl border border-ghibli-sand/40">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-ghibli-moss"></div>
                        <span className="text-ghibli-earth font-semibold">
                          💝 Tamanho: 330 ml
                        </span>
                      </div>
                      <p className="text-center text-xs text-ghibli-earth/70 mt-1">
                        Formato especial de coração
                      </p>
                    </div>
                  )}

                  {/* Botão Principal */}
                  <div className="pt-3">
                    {isProcessingMockup ? (
                      <div className="w-full py-5 sm:py-6 bg-gradient-to-r from-ghibli-moss/50 to-ghibli-moss-light/50 rounded-xl lg:rounded-2xl text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-ghibli-moss font-medium text-sm sm:text-base">Criando a sua caneca mágica...</span>
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
                            <span className="text-center">Selecione o Tamanho</span>
                      ) : (
                        <>
                              <span className="text-lg sm:text-xl">🛒</span>
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

                  {/* Grid de Garantias */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <div className="group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />
                      </div>
                      <span className="text-xs font-bold text-ghibli-earth">Cerâmica Premium</span>
                    </div>
                    
                    <div className="group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />
                      </div>
                      <span className="text-xs font-bold text-ghibli-earth">Impressão HD</span>
                    </div>
                    
                    <div className="group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />
                      </div>
                      <span className="text-xs font-bold text-ghibli-earth">~1 semana</span>
              </div>

                    <div className="group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Award className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />
                      </div>
                      <span className="text-xs font-bold text-ghibli-earth">Garantia Total</span>
                    </div>
              </div>
                </CardContent>
              </Card>
            </motion.div>
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

// Geração estática dos paths para produtos de caneca
export const getStaticPaths: GetStaticPaths = async () => {
  const mugProducts = getPrintifyProductsByCategory('mug');
  const paths = Object.keys(mugProducts).map((productId) => ({
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

  if (!product || product.category !== 'mug') {
    return {
      notFound: true
    };
  }

  return {
    props: { product }
  };
};

export default MugDetailPage; 