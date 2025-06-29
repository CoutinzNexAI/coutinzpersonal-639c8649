import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Minus, Plus, Shield, Truck, Award } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import { ImageAdjustments, PRODUCT_ANIMATIONS, PRODUCT_STYLES } from '@/types/product';
import { GlobalRateLimiter } from '@/lib/utils/rateLimiter';

// Novos componentes compartilhados
import ProductHeader from '@/components/shared/ProductHeader';
import ProductPositionControls from '@/components/shared/ProductPositionControls';
import ProductQuantityPricing from '@/components/shared/ProductQuantityPricing';
import ProductArtStatus from '@/components/shared/ProductArtStatus';
import ProductGuarantees from '@/components/shared/ProductGuarantees';
import ProductDescription from '@/components/shared/ProductDescription';
import ProductVariantSelector from '@/components/shared/ProductVariantSelector';
import ProductAddToCartButton from '@/components/shared/ProductAddToCartButton';
import ProductMobileControls from '@/components/shared/ProductMobileControls';
import ProductMobileInfo from '@/components/shared/ProductMobileInfo';
import ProductCardDecorations from '@/components/shared/ProductCardDecorations';

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

  // ✅ QUANTIDADE: Estado para a quantidade de canecas
  const [quantity, setQuantity] = useState(1);

  // Calculate discount and prices
  const calculateDiscount = (qty: number) => {
    if (qty >= 3) return 15;
    if (qty >= 2) return 10;
    return 0;
  };

  // ✅ CORREÇÃO: Preços corretos baseados na variante selecionada
  const getBasePrice = () => {
    if (product?.id === 'heart_mug') {
      return 30.00; // Heart mug sempre €30.00
    }
    
    if (product?.id === 'ceramic_mug' && selectedPrintifyVariantId) {
      // 330ml (id: 62327) = €22.50, 450ml (id: 62328) = €27.50
      return selectedPrintifyVariantId === 62327 ? 22.50 : 27.50;
    }
    
    return product?.basePrice || 30; // Fallback
  };

  const basePrice = getBasePrice();
  const discount = calculateDiscount(quantity);
  const discountedPrice = basePrice * (1 - discount / 100);
  const totalPrice = discountedPrice * quantity;
  const savings = (basePrice * quantity) - totalPrice;

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
        price: discountedPrice,
        quantity: quantity,
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
      
      toast.success(`${quantity === 1 ? 'Caneca adicionada' : `${quantity} canecas adicionadas`} ao carrinho!`, {
        description: `Total: €${totalPrice.toFixed(2)}${discount > 0 ? ` (${discount}% desconto aplicado!)` : ''}`,
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
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-ghibli-earth via-ghibli-wood to-ghibli-moss bg-clip-text text-transparent leading-tight mb-4 tracking-tight">
                {product.id === 'heart_mug' ? 'Caneca Coração ❤️' : 'Caneca Personalizada'}
              </h1>
              <div className="text-4xl sm:text-5xl font-black text-ghibli-moss drop-shadow-lg tracking-tight">
                €{currentPrice.toFixed(2)}
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
              <ProductMobileControls
                selectedImageUrl={selectedImageUrl}
                userImageDimensions={userImageDimensions}
                product={product}
                imagePosition={imagePosition}
                isGeneratingMockup={isGeneratingMockup}
                userInfo={userInfo}
                onOpenGallery={handleOpenGallery}
                onAdjustPosition={(position) => handleAdjustment('position', position)}
                positionType="vertical"
              />
              
              {!userInfo && (
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
              <ProductQuantityPricing
                basePrice={basePrice}
                quantity={quantity}
                onQuantityChange={setQuantity}
                discountTiers={[
                  { min: 2, discount: 10, label: 'canecas', emoji: '💡' },
                  { min: 3, discount: 15, label: 'canecas', emoji: '🔥' }
                ]}
              />
            </motion.div>

            {/* Botão Adicionar ao Carrinho Mobile - Destaque */}
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

            {/* Informações Extras Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="px-4 space-y-4"
            >
              {/* Informações do Produto Mobile */}
              <ProductMobileInfo
                selectedImageUrl={selectedImageUrl}
                product={product}
                selectedVariantId={selectedPrintifyVariantId}
                onOpenGallery={handleOpenGallery}
                onVariantChange={(variantId) => handleAdjustment('size', variantId)}
                variantLabel="Tamanho da Caneca"
                variantEmoji="☕"
              />

              {/* Preço e Desconto Mobile */}
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sand/30">
                <ul className="text-sm space-y-2 text-ghibli-earth/80">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                    <span>Caneca de <span className="font-bold text-ghibli-moss">cerâmica premium</span> {product.id === 'heart_mug' ? 'em formato de coração' : 'resistente'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                    <span>Impressão duradoura e <span className="font-bold">resistente à lavagem</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-wood rounded-full shrink-0"></div>
                    <span className="font-bold text-ghibli-wood">{product.id === 'heart_mug' ? 'Perfeita para oferecer a quem mais gosta' : 'Perfeita para todas as ocasiões'}</span>
                    {product.id === 'heart_mug' && <span className="text-red-500">❤️</span>}
                  </li>
                </ul>
              </div>

              {/* Tamanho Mobile */}
              <div className="bg-ghibli-cream/30 rounded-xl border border-ghibli-sand/40 p-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-ghibli-moss"></div>
                  <span className="text-ghibli-earth font-semibold">
                    {product.id === 'heart_mug' ? '💝 Tamanho: 330 ml' : '☕ Tamanhos disponíveis'}
                  </span>
                </div>
                <p className="text-center text-xs text-ghibli-earth/70 mt-1">
                  {product.id === 'heart_mug' ? 'Formato especial de coração' : '330ml e 450ml'}
                </p>
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
            <ProductHeader product={product} />

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
                <ProductPositionControls
                  selectedImageUrl={selectedImageUrl}
                  userImageDimensions={userImageDimensions}
                  product={product}
                  imagePosition={imagePosition}
                  isGeneratingMockup={isGeneratingMockup}
                  onOpenGallery={handleOpenGallery}
                  onAdjustPosition={(position) => handleAdjustment('position', position)}
                  positionType="vertical"
                  className="mt-6 px-4 lg:px-0"
                />
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
                  {/* Título + Preço + Quantidade */}
                  <div className="pb-3 sm:pb-4 border-b border-ghibli-sand/30 space-y-4">
                    <div className="text-center">
                      <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-ghibli-earth to-ghibli-wood bg-clip-text text-transparent leading-tight mb-2">
                        {product.id === 'heart_mug' ? 'Caneca Coração' : 'Caneca Personalizada'}
                </h1>
                      </div>

                    {/* Preço e Quantidade */}
                    <div className="space-y-3">
                      {/* Preço Principal */}
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-2 mb-1">
                          <span className="text-3xl sm:text-4xl font-black text-ghibli-moss">€{discountedPrice.toFixed(2)}</span>
                          {discount > 0 && (
                            <span className="text-lg text-gray-500 line-through">€{basePrice.toFixed(2)}</span>
                          )}
                          {discount > 0 && (
                            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              -{discount}%
                      </div>
                          )}
                        </div>
                        {discount > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            Poupa €{savings.toFixed(2)} com {discount}% desconto!
                          </p>
                        )}
                      </div>

                      {/* Seletor de Quantidade */}
                      <div className="bg-ghibli-cream/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-ghibli-earth">Quantidade:</span>
                          <div className="flex items-center gap-2 bg-white/80 rounded-lg p-1">
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

                        {/* Mini destaques de desconto */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`text-center p-2 rounded-md transition-all ${
                            quantity >= 2 
                              ? 'bg-green-100 border border-green-300 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <div className="font-bold">2+ canecas</div>
                            <div>10% OFF</div>
                          </div>
                          <div className={`text-center p-2 rounded-md transition-all ${
                            quantity >= 3 
                              ? 'bg-green-100 border border-green-300 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <div className="font-bold">3+ canecas</div>
                            <div>15% OFF</div>
                          </div>
                        </div>

                        {/* Total */}
                        {quantity > 1 && (
                          <div className="border-t border-ghibli-sand/30 pt-2 mt-3">
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
                  </div>

                  {/* Status Arte */}
                  <ProductArtStatus 
                    selectedImageUrl={selectedImageUrl}
                    onOpenGallery={handleOpenGallery}
                  />

                  {/* Descrição em Tópicos */}
                  <ProductDescription 
                    items={[
                      { 
                        text: `Caneca de <span class="font-bold text-ghibli-moss">cerâmica premium</span> ${product.id === 'heart_mug' ? 'em formato de coração' : 'resistente'}`,
                        color: 'moss'
                      },
                      { 
                        text: 'Impressão duradoura e <span class="font-bold">resistente à lavagem</span>',
                        color: 'moss'
                      },
                      { 
                        text: `<span class="font-bold text-ghibli-wood">${product.id === 'heart_mug' ? 'Perfeita para oferecer a quem mais gosta' : 'Perfeita para todas as ocasiões'}</span>`,
                        color: 'wood',
                        emoji: product.id === 'heart_mug' ? '❤️' : undefined
                      }
                    ]}
                  />

                  {/* Seletor/Display de Tamanho */}
                  <ProductVariantSelector
                    product={product}
                    selectedVariantId={selectedPrintifyVariantId}
                    onVariantChange={(variantId) => handleAdjustment('size', variantId)}
                    label="Tamanho da Caneca"
                    emoji="☕"
                  />

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
                      size="desktop"
                    />
                  </div>

                  {/* Grid de Garantias */}
                  <ProductGuarantees 
                    guarantees={[
                      {
                        icon: <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />,
                        title: 'Cerâmica Premium'
                      },
                      {
                        icon: <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />,
                        title: 'Impressão HD'
                      },
                      {
                        icon: <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />,
                        title: '~1 semana'
                      },
                      {
                        icon: <Award className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />,
                        title: 'Garantia Total'
                      }
                    ]}
                    className="pt-3 sm:pt-4" 
                  />
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