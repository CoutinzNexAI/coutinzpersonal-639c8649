import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Truck, Award, Upload, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import { RateLimiter } from '@/lib/utils/rateLimiter';
import { ImageAdjustments, PRODUCT_ANIMATIONS, PRODUCT_STYLES } from '@/types/product';
import ProductCardDecorations from '@/components/shared/ProductCardDecorations';

interface EscritorioDetailPageProps {
  product: PrintifyProductMapping;
}

const EscritorioDetailPage: React.FC<EscritorioDetailPageProps> = ({ product: initialProduct }) => {
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

  // ✅ ESTADOS DO SISTEMA DE POSICIONAMENTO HORIZONTAL (copiado das capas)
  const [imagePosition, setImagePosition] = useState<'left' | 'center' | 'right'>('center');
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);

  // ✅ FUNÇÃO DE CÁLCULO DE COORDENADAS (copiada das capas e adaptada para caderno)
  const calculatePrintifyCoords = useCallback((
    position: 'left' | 'center' | 'right',
    variantId: number,
    userImageDimensions: { width: number; height: number }
  ) => {
    const selectedVariant = product?.variants?.find(v => v.id === variantId);
    if (!selectedVariant) {
      throw new Error('Variante não encontrada');
    }

    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const { width: userImageWidth, height: userImageHeight } = userImageDimensions;

    console.log('🔍 [CADERNO] Calculando coordenadas:', { position, placeholderWidth, placeholderHeight, userImageWidth, userImageHeight });

    // PASSO A: Escala Math.max para cobrir toda a área
    const scaleToCover = Math.max(
      placeholderWidth / userImageWidth,
      placeholderHeight / userImageHeight
    );

    // PASSO B: Traduzir para escala Printify
    const finalImageWidth = userImageWidth * scaleToCover;
    const printifyScale = finalImageWidth / placeholderWidth;

    console.log('🔍 [CADERNO] Escala calculada:', { scaleToCover, finalImageWidth, printifyScale });

    // PASSO C: Calcular movimento horizontal
    const scaledImageWidth = userImageWidth * scaleToCover;
    const overflowX = Math.max(0, scaledImageWidth - placeholderWidth);
    const maxOffsetX = (overflowX / 2) / placeholderWidth;

    let printifyX = 0.5; // Centro padrão

    if (overflowX > 0) {
      if (position === 'left') {
        const movementX = -maxOffsetX * 0.35; // ✅ MOVIMENTO SUBTIL: 35% (mesma lógica das capas)
        printifyX = 0.5 + movementX;
      } else if (position === 'right') {
        const movementX = maxOffsetX * 0.35; // ✅ MOVIMENTO SUBTIL: 35% (mesma lógica das capas)
        printifyX = 0.5 + movementX;
      }
      // 'center' fica com printifyX = 0.5
    }

    const finalAdjustments = {
      x: printifyX,
      y: 0.5,
      scale: printifyScale,
      rotation: 0
    };

    console.log('✅ [CADERNO] Coordenadas finais:', finalAdjustments);

    return finalAdjustments;
  }, [product]);

  // Função utilitária: Validação consolidada
  const validatePurchase = () => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar o seu produto de escritório!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione o tipo de produto.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  };

  // Setup inicial do produto
  useEffect(() => {
    if (!initialProduct && typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      // Aceita tanto 'stationery' como 'office' (ambos são considerados escritório)
      if (foundProduct && (foundProduct.category === 'stationery' || foundProduct.category === 'office')) {
        setProduct(foundProduct);
        if (foundProduct.variants?.length) {
          setSelectedPrintifyVariantId(foundProduct.variants[0].id);
        }
      } else {
        router.push('/shop');
        toast.error('Produto não encontrado');
      }
    } else if (initialProduct?.variants?.length) {
      setSelectedPrintifyVariantId(initialProduct.variants[0].id);
    }
  }, [productId, initialProduct, router]);

  // ✅ CONTROLADOR DE TRÁFEGO MESTRE: Único useEffect responsável por gerar mockups
  // Só executa quando TODOS os dados necessários estão prontos (evita a "corrida")
  useEffect(() => {
    // ✅ CONDIÇÃO DE GUARDA: SÓ avança se tivermos TODOS os dados necessários
    if (!selectedImageUrl || !selectedPrintifyVariantId || !userImageDimensions || !userInfo?.id) {
      console.log("⏳ [CADERNO-CONTROLLER] A aguardar todos os dados para gerar mockup...", {
        selectedImageUrl: !!selectedImageUrl,
        selectedPrintifyVariantId: !!selectedPrintifyVariantId,
        userImageDimensions: !!userImageDimensions,
        userId: !!userInfo?.id
      });
      return; // Se alguma informação crucial falta, não faz nada
    }

    console.log('🚀 [CADERNO-CONTROLLER] TODOS os dados prontos! Iniciando geração...', {
      selectedImageUrl: !!selectedImageUrl,
      selectedPrintifyVariantId,
      imagePosition,
      userImageDimensions,
      userId: !!userInfo?.id
    });

    // ✅ DEBOUNCE MÍNIMO: Apenas para garantir que o estado React estabiliza
    const handler = setTimeout(() => {
      console.log('🎯 [CADERNO-CONTROLLER] Disparando geração com dimensões reais confirmadas...');
      
      // ✅ A posição vem do estado controlado pelos botões
      const currentPosition = imagePosition;
      
      // ✅ Chama a função que faz todo o trabalho COM as dimensões reais
      generateNewMockup(currentPosition, selectedPrintifyVariantId);

    }, 100); // Debounce mínimo apenas para estabilizar o React state

    return () => clearTimeout(handler);

  // ✅ DEPENDÊNCIAS CRUCIAIS: Qualquer mudança nestes valores dispara nova geração
  }, [selectedImageUrl, selectedPrintifyVariantId, imagePosition, userImageDimensions, userInfo?.id]);

  // ✅ FUNÇÃO PARA AJUSTAR POSIÇÃO (copiada das capas)
  const handleAdjustment = async (type: 'position', value: string) => {
    // ✅ RATE LIMITING: Verificar se pode fazer o pedido
    const { allowed, message } = RateLimiter.checkRequestLimit();
    if (!allowed) {
      toast.error(message);
      return;
    }

    if (!userImageDimensions) {
      toast.error('Aguarde o carregamento da imagem');
      return;
    }

    if (!selectedPrintifyVariantId) {
      toast.error('Selecione o tipo de produto primeiro');
      return;
    }

    console.log('🎮 [CADERNO] handleAdjustment chamado:', { type, value, currentPosition: imagePosition });

    if (type === 'position') {
      const newPosition = value as 'left' | 'center' | 'right';
      setImagePosition(newPosition); // ✅ Só muda o estado - o useEffect vai disparar automaticamente
      console.log(`📍 [CADERNO] Posição alterada de "${imagePosition}" para "${newPosition}"`);
      
      // ✅ REGISTAR PEDIDO: Após mudança bem-sucedida
      RateLimiter.recordRequest();
    }
  };

  // ✅ FUNÇÃO PARA GERAR NOVA MOCKUP (copiada das capas)
  const generateNewMockup = async (currentPosition: 'left' | 'center' | 'right', currentVariantId: number) => {
    if (!userImageDimensions || !selectedImageUrl || !selectedImageId) {
      console.log('❌ Dados insuficientes para gerar mockup');
      return;
    }

    console.log('🔄 [CADERNO] Iniciando geração de nova mockup...', { currentPosition, currentVariantId });
    setIsGeneratingMockup(true);

    // ✅ CALCULAR AJUSTES AUTOMATICAMENTE baseados na posição e variante
    const adjustments = calculatePrintifyCoords(currentPosition, currentVariantId, userImageDimensions);
    
    // ✅ APLICAR AJUSTES IMEDIATAMENTE para evitar bordas brancas
    setImageAdjustments(adjustments);

    const requestBody = {
      productId: product?.id,
      userImageUrl: selectedImageUrl,
      userId: userInfo?.id,
      imageAdjustments: adjustments,
      selectedPrintifyVariantId: currentVariantId,
    };

    try {
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success && data.previewUrls && data.previewUrls.length > 0) {
        console.log('✅ [CADERNO] Nova mockup gerada com sucesso!', data.previewUrls.length, 'imagens');
        setPrintifyPreviewUrls(data.previewUrls);
        setPrintifyImageId(data.printifyImageId);
        setPrintifyProductId(data.printifyProductId);
        
        toast.success(`Posição alterada para: ${currentPosition === 'left' ? 'Esquerda' : currentPosition === 'right' ? 'Direita' : 'Centro'}`);
      } else {
        console.error('❌ [CADERNO] Erro ao gerar nova mockup:', data.error || 'Resposta inválida');
        toast.error('Erro ao gerar nova preview. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ [CADERNO] Falha na chamada à API:', error);
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  // Handlers simplificados
  const handlePreviewReady = useCallback((data: {
    previewUrls: string[];
    printifyImageId: string;
    printifyProductId: string;
  }) => {
    setPrintifyPreviewUrls(data.previewUrls);
    setPrintifyImageId(data.printifyImageId);
    setPrintifyProductId(data.printifyProductId);
  }, []);

  const handleAddToCart = async () => {
    const validationError = validatePurchase();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const variant = product!.variants?.find(v => v.id === selectedPrintifyVariantId);

      CartService.addToCart({
        productId: productId as string,
        productName: product!.name,
        productCategory: 'escritorio', // Categoria unificada
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId!,
        price: product!.basePrice || product!.price || 0,
        quantity: 1,
        customizations: {
          variantId: selectedPrintifyVariantId!, // Obrigatório agora
          variant: variant?.title || 'Tipo não encontrado',
          scale: getPrintifyProduct(productId as string)?.defaultDesign.scale || 1.1,
          x: getPrintifyProduct(productId as string)?.defaultDesign.x || 0.5,
          y: getPrintifyProduct(productId as string)?.defaultDesign.y || 0.5,
          angle: getPrintifyProduct(productId as string)?.defaultDesign.angle || 0,
          print_on_side: getPrintifyProduct(productId as string)?.defaultDesign.print_on_side,
        },
        imageAdjustments,
      });

      const productType = product!.category === 'stationery' ? 'Caderno' : 'Mousepad';
      toast.success(`${productType} adicionado ao carrinho!`, {
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
    console.log('🎬 [CADERNO-SYNC] Iniciando seleção de imagem...', { imageUrl: !!imageUrl, imageId });
    
    setLoading(true); // ✅ Loading geral enquanto carrega dimensões
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    setIsGalleryModalOpen(false);
    
    // ✅ Reset estados - preparar para nova imagem
    setImagePosition('center');
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    setImageAdjustments(undefined); // Limpar ajustes antigos
    
    // ✅ CRÍTICO: Reset userImageDimensions para null
    // Isto impede o useEffect de disparar antes das dimensões estarem prontas
    setUserImageDimensions(null);
    
    console.log('🔄 [CADERNO-SYNC] Estados resetados. Carregando dimensões reais da imagem...');
    
    // ✅ AGUARDAR DIMENSÕES REAIS: Só define userImageDimensions quando tiver certeza
    const img = new Image();
    img.onload = function(this: HTMLImageElement) {
      const realWidth = this.naturalWidth;
      const realHeight = this.naturalHeight;
      
      console.log(`✅ [CADERNO-SYNC] Dimensões carregadas: ${realWidth}x${realHeight}`);
      
      // ✅ AGORA SIM: Define as dimensões reais
      // Isto vai disparar o useEffect que vai gerar a mockup
      setUserImageDimensions({ width: realWidth, height: realHeight });
      setLoading(false);
      
      toast.success('Arte selecionada com sucesso!');
    };
    
    img.onerror = () => {
      console.error('❌ [CADERNO-SYNC] Erro ao carregar imagem. Usando fallback 1024x1024');
      setUserImageDimensions({ width: 1024, height: 1024 }); // Fallback seguro
      setLoading(false);
      toast.success('Arte selecionada (dimensões estimadas)');
    };
    
    // ✅ INICIAR CARREGAMENTO: Isto dispara o img.onload
    img.src = imageUrl;
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
  const isNotebook = product.category === 'stationery';
  const productEmoji = isNotebook ? '📝' : '🖱️';
  const productType = isNotebook ? 'Caderno' : 'Mousepad';

  return (
    <>
      <Head>
        <title>{product.name} - Loja PicTuz</title>
        <meta name="description" content={`Personalize o seu ${product.name} com as suas criações AI. Produtos de escritório únicos para um ambiente criativo.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-2 sm:px-4 pt-16 pb-6 sm:pt-12 sm:pb-8 lg:py-8">
          {/* Breadcrumb - Hidden on mobile */}
          <nav className="mb-4 lg:mb-8 hidden sm:block">
            <ol className="flex items-center space-x-2 text-sm text-ghibli-earth">
              <li><Link href="/shop" className="hover:text-ghibli-moss transition-colors">Loja</Link></li>
              <li className="text-ghibli-earth/50">/</li>
              <li><Link href="/shop/escritorio" className="hover:text-ghibli-moss transition-colors">Escritório</Link></li>
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
                        Ajustando Posição
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

              {/* Botão "Escolher Arte" */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex justify-center px-4 lg:px-0"
              >
                <Button
                  onClick={handleOpenGallery}
                  disabled={!userInfo}
                  className={`w-full sm:w-auto px-8 sm:px-12 py-4 text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl lg:rounded-2xl ${
                    userInfo 
                      ? 'bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-5 h-5 mr-2 lg:mr-3" />
                  {selectedImageUrl ? 'Trocar Arte' : 'Escolher Arte'}
                </Button>
              </motion.div>

              {/* 🎮 CONTROLOS DE AJUSTE HORIZONTAL - ABAIXO DA MOCKUP (copiado das capas) */}
              {selectedImageUrl && product?.supportsManualAdjustment && userImageDimensions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="mt-6 px-4 lg:px-0"
                >
                  <Card className="bg-gradient-to-br from-[#2D5A27]/5 to-[#4A6B5B]/5 border-[#2D5A27]/20 shadow-lg">
                    <CardContent className="p-4">
                      <div className="text-center mb-3">
                        <h3 className="text-base font-bold text-[#2D5A27] mb-1">
                          Ajustar Posição Horizontal
                        </h3>
                        <p className="text-xs text-gray-600">
                          Escolha como centrar a sua arte
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={() => handleAdjustment('position', 'left')}
                          variant={imagePosition === 'left' ? 'default' : 'outline'}
                          disabled={isGeneratingMockup}
                          className="flex flex-col h-auto py-4 hover:shadow-md transition-all bg-white hover:bg-gray-50"
                        >
                          <ChevronLeft className="w-6 h-6" />
                          <span className="text-sm mt-1 font-medium">Esquerda</span>
                        </Button>
                        
                        <Button
                          onClick={() => handleAdjustment('position', 'center')}
                          variant={imagePosition === 'center' ? 'default' : 'outline'}
                          disabled={isGeneratingMockup}
                          className="flex flex-col h-auto py-4 hover:shadow-md transition-all bg-white hover:bg-gray-50"
                        >
                          <div className="w-6 h-6 flex items-center justify-center">
                            <div className="w-2 h-2 bg-current rounded-full"></div>
                          </div>
                          <span className="text-sm mt-1 font-medium">Centro</span>
                        </Button>
                        
                        <Button
                          onClick={() => handleAdjustment('position', 'right')}
                          variant={imagePosition === 'right' ? 'default' : 'outline'}
                          disabled={isGeneratingMockup}
                          className="flex flex-col h-auto py-4 hover:shadow-md transition-all bg-white hover:bg-gray-50"
                        >
                          <ChevronRight className="w-6 h-6" />
                          <span className="text-sm mt-1 font-medium">Direita</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Prompt de Login */}
              {!userInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="mt-4 flex justify-center px-4 lg:px-0"
                >
                  <Card className="bg-blue-50/80 border-blue-200 backdrop-blur-sm w-full sm:max-w-md">
                    <CardContent className="p-4 text-center">
                      <p className="text-blue-800 text-sm sm:text-base mb-3">
                        Faça login para personalizar este {productType.toLowerCase()} com as suas criações AI
                      </p>
                      <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                        className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
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
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-ghibli-earth to-ghibli-wood bg-clip-text text-transparent leading-tight mb-1">
                      {product.name}
                    </h1>
                    <div className="inline-block">
                      <div className="text-3xl sm:text-4xl font-black text-ghibli-moss drop-shadow-sm">
                        €{currentPrice.toFixed(2)}
                      </div>
                      <div className="text-center text-xs text-ghibli-earth/60 font-medium -mt-1">
                        IVA incluído
                      </div>
                    </div>
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

                  {/* Incentivo de Entrega */}
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

                  {/* Descrição */}
                  <div className="px-1">
                    <p className="text-sm leading-relaxed font-medium text-ghibli-earth/80">
                      {isNotebook ? (
                        <>Caderno de <span className="font-bold text-ghibli-moss">alta qualidade</span>! 
                        Páginas lisas e <span className="font-bold">capa durável</span> para as suas ideias criativas.</>
                      ) : (
                        <>Mousepad <span className="font-bold text-ghibli-moss">premium</span>! 
                        Base antiderrapante e <span className="font-bold">superfície lisa</span> para máxima precisão.</>
                      )}
                    </p>
                  </div>

                  {/* Seletor de Tipo */}
                  <div className="relative">
                    <Select
                      onValueChange={(value) => setSelectedPrintifyVariantId(parseInt(value))}
                      value={selectedPrintifyVariantId?.toString() || ''}
                    >
                      <SelectTrigger className="w-full h-12 sm:h-14 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium hover:border-ghibli-moss/60 focus:border-ghibli-moss transition-all duration-200 shadow-sm hover:shadow-md pl-3 sm:pl-4 pr-8 sm:pr-10">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-2 h-2 rounded-full bg-ghibli-moss shrink-0"></div>
                          <SelectValue placeholder={`Escolha o ${isNotebook ? 'tamanho' : 'tipo'}`}>
                            <span className="truncate">
                              {product.variants?.find(v => v.id === selectedPrintifyVariantId)?.title || `Escolha o ${isNotebook ? 'tamanho' : 'tipo'}`}
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
                      {productEmoji} {isNotebook ? 'Tamanho do Caderno' : 'Tipo de Mousepad'}
                    </label>
                  </div>

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
                          <span className="text-ghibli-moss font-medium text-sm sm:text-base">Criando o seu {productType.toLowerCase()} mágico...</span>
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
                            <span className="text-center">Selecione o {isNotebook ? 'Tamanho' : 'Tipo'}</span>
                      ) : (
                        <>
                              <span className="text-lg sm:text-xl">🛒</span>
                              <span className="hidden sm:inline">Adicionar ao Carrinho</span>
                              <span className="sm:hidden">Adicionar</span>
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center">
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
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
                      <span className="text-xs font-bold text-ghibli-earth">
                        {isNotebook ? 'Papel Premium' : 'Base Antiderrapante'}
                      </span>
                    </div>
                    
                    <div className="group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />
                      </div>
                      <span className="text-xs font-bold text-ghibli-earth">
                        {isNotebook ? 'Capa Durável' : 'Superfície Lisa'}
                      </span>
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

// Geração estática dos paths para produtos de escritório (stationery + office)
export const getStaticPaths: GetStaticPaths = async () => {
  const notebookProducts = getPrintifyProductsByCategory('stationery');
  const mousepadProducts = getPrintifyProductsByCategory('office');
  
  const allProducts = { ...notebookProducts, ...mousepadProducts };
  const paths = Object.keys(allProducts).map((productId) => ({
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

  if (!product || (product.category !== 'stationery' && product.category !== 'office')) {
    return {
      notFound: true
    };
  }

  return {
    props: { product }
  };
};

export default EscritorioDetailPage;