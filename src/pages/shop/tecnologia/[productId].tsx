import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Truck, Award, Check, Upload, RotateCw, ChevronDown, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';

interface ImageAdjustments {
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

interface PhoneCaseDetailPageProps {
  product: PrintifyProductMapping;
}

const PhoneCaseDetailPage: React.FC<PhoneCaseDetailPageProps> = ({ product: initialProduct }) => {
  const router = useRouter();
  const { productId } = router.query;
  const { userInfo, session } = useAuth();
  
  const [product, setProduct] = useState<PrintifyProductMapping | null>(initialProduct || null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  
  // Estados para posicionamento horizontal
  const [imagePosition, setImagePosition] = useState<'left' | 'center' | 'right'>('center');
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  
  // Estados para Printify
  const [printifyPreviewUrls, setPrintifyPreviewUrls] = useState<string[]>([]);
  const [printifyImageId, setPrintifyImageId] = useState<string>('');
  const [printifyProductId, setPrintifyProductId] = useState<string>('');

  // Estado específico para seleção de variante da capa
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState<number | null>(null);

  // Fallback para carregamento dinâmico (caso não haja product das props)
  useEffect(() => {
    if (!initialProduct && typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      if (foundProduct && foundProduct.category === 'tecnologia') {
        setProduct(foundProduct);
        if (foundProduct.id === 'custom_phone_case' && foundProduct.variants && foundProduct.variants.length > 0) {
          setSelectedPrintifyVariantId(foundProduct.variants[0].id);
        }
      } else {
        router.push('/shop');
        toast.error('Produto não encontrado');
      }
    } else if (initialProduct) {
      // Set default variant for initial product
      if (initialProduct.id === 'custom_phone_case' && initialProduct.variants && initialProduct.variants.length > 0) {
        setSelectedPrintifyVariantId(initialProduct.variants[0].id);
      }
    }
  }, [productId, initialProduct, router]);

  // Reset estados quando a variante muda (mesmo se já há imagem selecionada)
  useEffect(() => {
    if (selectedImageUrl && selectedPrintifyVariantId) {
      // Reset mockups Printify para forçar nova geração quando variante muda
      setPrintifyPreviewUrls([]);
      setPrintifyImageId('');
      setPrintifyProductId('');
    }
  }, [selectedPrintifyVariantId]); // Só depende da variante

  // Função para calcular coordenadas Printify baseadas na posição horizontal
  const calculatePrintifyCoords = useCallback((position: 'left' | 'center' | 'right', variantId: number, imageDimensions: { width: number; height: number }): ImageAdjustments => {
    console.log('🧮 [CAPA] Calculando coordenadas:', { position, variantId, imageDimensions });

    if (!product || !product.variants) {
      throw new Error('Produto ou variantes não encontrados');
    }

    // Encontrar a variante selecionada
    const selectedVariant = product.variants.find(v => v.id === variantId);
    if (!selectedVariant) {
      throw new Error(`Variante ${variantId} não encontrada`);
    }

    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const { width: userImageWidth, height: userImageHeight } = imageDimensions;

    console.log('📐 [CAPA] Dimensões:', { 
      placeholder: { placeholderWidth, placeholderHeight }, 
      userImage: { userImageWidth, userImageHeight } 
    });

    // PASSO A: Calcular escala "FILL" para cobertura completa (Math.max)
    const scaleToCover = Math.max(
      placeholderWidth / userImageWidth,
      placeholderHeight / userImageHeight
    );

    // PASSO B: Traduzir para escala Printify
    const finalImageWidth = userImageWidth * scaleToCover;
    const printifyScale = finalImageWidth / placeholderWidth;

    console.log('🔍 [CAPA] Escala calculada:', { scaleToCover, finalImageWidth, printifyScale });

    // PASSO C: Calcular movimento horizontal (50% do máximo para ser mais subtil)
    let printifyX = 0.5; // Centro padrão
    const printifyY = 0.5; // Centro padrão (não se move verticalmente)

    // Calcular overflow horizontal após aplicar a escala
    const scaledImageWidth = userImageWidth * scaleToCover;
    const overflowX = Math.max(0, scaledImageWidth - placeholderWidth);
    
    if (overflowX > 0) {
      // Calcular movimento máximo possível
      const maxOffsetX = (overflowX / 2) / placeholderWidth;
      
      // ✅ MOVIMENTO MAIS SUBTIL: Usar apenas 50% do movimento máximo
      const shiftAmount = 0.5;
      
      if (position === 'left') {
        printifyX = 0.5 - (maxOffsetX * shiftAmount); // 50% para a esquerda
      } else if (position === 'right') {
        printifyX = 0.5 + (maxOffsetX * shiftAmount); // 50% para a direita
      }
      // 'center' fica com printifyX = 0.5
      
      console.log('📍 [CAPA] Movimento calculado:', { 
        overflowX, 
        maxOffsetX, 
        shiftAmount, 
        finalX: printifyX 
      });
    }

    const finalAdjustments = {
      x: printifyX,
      y: printifyY,
      scale: printifyScale,
      rotation: 0
    };

    console.log('✅ [CAPA] Coordenadas finais:', finalAdjustments);

    return finalAdjustments;
  }, [product]);

  // ✅ GATILHO ÚNICO: Este useEffect é o único responsável por decidir quando gerar mockups
  useEffect(() => {
    // Só gera se tivermos todos os dados necessários
    if (selectedImageUrl && selectedPrintifyVariantId && userImageDimensions && userInfo?.id) {
      
      console.log('🔄 [UNIFIED] Detectada mudança de estado que requer nova mockup:', {
        selectedImageUrl: !!selectedImageUrl,
        selectedPrintifyVariantId,
        imagePosition,
        userImageDimensions: !!userImageDimensions
      });

      // Usa debounce para não fazer chamadas excessivas
      const handler = setTimeout(() => {
        console.log('🚀 [UNIFIED] Disparando geração de mockup após debounce...');
        generateNewMockup(imagePosition, selectedPrintifyVariantId);
      }, 300); // Pequeno atraso de 300ms

      return () => clearTimeout(handler);
    }
  }, [selectedImageUrl, selectedPrintifyVariantId, imagePosition, userImageDimensions, userInfo?.id]); // Depende de TUDO o que pode mudar o design

  // Função para lidar com os mockups gerados pelo ProductCanvas
  const handlePreviewReady = useCallback((data: {
    previewUrls: string[];
    printifyImageId: string;
    printifyProductId: string;
  }) => {
    setPrintifyPreviewUrls(data.previewUrls);
    setPrintifyImageId(data.printifyImageId);
    setPrintifyProductId(data.printifyProductId);
    console.log('✅ Printify mockups received:', data);
  }, []);

  // ✅ FUNÇÃO SIMPLIFICADA: Só muda o estado, o useEffect faz o resto
  const handleAdjustment = async (type: 'position', value: string) => {
    if (!userImageDimensions) {
      toast.error('Aguarde o carregamento da imagem');
      return;
    }

    if (!selectedPrintifyVariantId) {
      toast.error('Selecione um modelo de telemóvel primeiro');
      return;
    }

    console.log('🎮 [CAPA] handleAdjustment chamado:', { type, value, currentPosition: imagePosition });

    if (type === 'position') {
      const newPosition = value as 'left' | 'center' | 'right';
      setImagePosition(newPosition); // ✅ Só muda o estado - o useEffect vai disparar automaticamente
      console.log(`📍 [CAPA] Posição alterada de "${imagePosition}" para "${newPosition}"`);
    }
  };

  // Função para gerar nova mockup
  const generateNewMockup = async (currentPosition: 'left' | 'center' | 'right', currentVariantId: number) => {
    if (!userImageDimensions || !selectedImageUrl || !selectedImageId) {
      console.log('❌ Dados insuficientes para gerar mockup');
      return;
    }

    console.log('🔄 [CAPA] Iniciando geração de nova mockup...', { currentPosition, currentVariantId });
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
        console.log('✅ [CAPA] Nova mockup gerada com sucesso!', data.previewUrls.length, 'imagens');
        setPrintifyPreviewUrls(data.previewUrls);
        setPrintifyImageId(data.printifyImageId);
        setPrintifyProductId(data.printifyProductId);
        
        toast.success(`Posição alterada para: ${currentPosition === 'left' ? 'Esquerda' : currentPosition === 'right' ? 'Direita' : 'Centro'}`);
      } else {
        console.error('❌ [CAPA] Erro ao gerar nova mockup:', data.error || 'Resposta inválida');
        toast.error('Erro ao gerar nova preview. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ [CAPA] Falha na chamada à API:', error);
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  const handleAddToCart = async () => {
    // Mostrar toast se não há arte selecionada
    if (!selectedImageUrl) {
      toast.error('Escolha uma arte primeiro para personalizar a sua capa!');
      return;
    }

    if (!product || !selectedImageId) {
      toast.error('ID da transformação não encontrado. Selecione a imagem novamente.');
      return;
    }

    if (!userInfo) {
      toast.error('Faça login para adicionar ao carrinho');
      return;
    }

    // Validação específica para capas - variante selecionada
    if (selectedPrintifyVariantId === null) {
      toast.error('Por favor, selecione um modelo de telemóvel.');
      return;
    }

    // ✅ NOVO: Validação dos IDs Printify necessários
    if (!printifyProductId || !printifyImageId) {
      toast.error('Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.');
      return;
    }

    // Usar a variante selecionada pelo usuário
    const variantIdToSend = selectedPrintifyVariantId;
    if (!variantIdToSend) {
      toast.error('ID da variante do produto não encontrado. Contacte o suporte.');
      return;
    }

    setLoading(true);

    try {
      // ✅ DEBUG: Log dos valores antes de adicionar ao carrinho
      console.log('🛒 Adicionando capa ao carrinho com valores:', {
        productId: productId as string,
        printifyProductId,
        printifyImageId,
        printifyVariantId: variantIdToSend,
        selectedImageUrl,
        selectedImageId
      });

      // Obter variante selecionada
      const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);

      // Adicionar item ao carrinho usando o CartService - SIMPLIFICADO
      const cartItem = CartService.addToCart({
        productId: productId as string,
        productName: product!.name,
        productCategory: product!.category || 'tecnologia',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId!,
        price: product!.basePrice || product!.price || 0,
        quantity: 1,
        customizations: {
          variantId: selectedPrintifyVariantId!,
          phoneModel: selectedVariant?.title || 'Modelo não encontrado',
          // ✅ OS CAMPOS CRÍTICOS: Usar ajustes calculados ou valores padrão
          scale: imageAdjustments?.scale || 1.0,
          x: imageAdjustments?.x || 0.5,
          y: imageAdjustments?.y || 0.5,
          angle: imageAdjustments?.rotation || 0,
        },
        imageAdjustments,
      });

      console.log('✅ Item adicionado ao carrinho:', cartItem);
      toast.success(`${product.name} adicionada ao carrinho!`);
      router.push('/checkout');

    } catch (error) {
      console.error('❌ Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGallery = () => {
    if (!userInfo) {
      toast.error('Faça login para aceder à sua galeria de transformações');
      return;
    }
    setIsGalleryModalOpen(true);
  };

  const handleSelectImageFromGallery = async (imageUrl: string, imageId: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    setIsGalleryModalOpen(false);
    
    // Reset posição para centro
    setImagePosition('center');
    
    // Reset mockups para gerar novos
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    
    // Definir dimensões da imagem (padrão AI: 1024x1024)
    setUserImageDimensions({ width: 1024, height: 1024 });
    
    // *** CORREÇÃO CRÍTICA: Reset imageAdjustments para valores padrão do produto ***
    // Isso força um novo cálculo de scale baseado na nova imagem e variante selecionada
    if (product && selectedPrintifyVariantId) {
      const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
      if (selectedVariant && product.printAreasConfig?.[0]) {
        const printAreaConfig = product.printAreasConfig[0];
        
        // Dimensões da imagem AI (padrão 1024x1024 para transformações PicTuz)
        const userImageWidth = 1024;
        const userImageHeight = 1024;
        
        // Dimensões do placeholder da variante selecionada
        const placeholderWidth = selectedVariant.placeholderWidth;
        const placeholderHeight = selectedVariant.placeholderHeight;
        
        // 🎯 MODO "Fill to placeholder" - scale 1.0 com X e Y centrados
        // Printify vai fazer o cover/fill automaticamente no backend
        const fillScale = 1.0;
        
        console.log(`🔄 RESET COMPLETO - Nova arte selecionada. Modo Fill to Placeholder: scale=${fillScale}, centrado (placeholder: ${placeholderWidth}x${placeholderHeight}, image: ${userImageWidth}x${userImageHeight})`);
        
        // Resetar para modo "Fill to placeholder" centrado
        setImageAdjustments({
          x: 0.5, // SEMPRE centrado horizontalmente
          y: 0.5, // SEMPRE centrado verticalmente  
          scale: fillScale, // Scale 1.0 = Fill to placeholder
          rotation: printAreaConfig.defaultAngle || 0,
          cropArea: undefined // Limpar qualquer crop anterior
        });
      }
    }
    
    toast.success('Arte selecionada com sucesso!');
  };

  const handleResetSelection = () => {
    setSelectedImageUrl('');
    setSelectedImageId(null);
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    setImageAdjustments(undefined);
  };

  const handleImageAdjustmentChange = (adjustments: Partial<ImageAdjustments>) => {
    if (imageAdjustments) {
      // Manter X sempre centrado (0.5) - não permitir alteração
      setImageAdjustments({ 
        ...imageAdjustments, 
        ...adjustments, 
        x: 0.5 // Forçar X sempre centrado
      });
    }
  };

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
        <meta name="description" content={`Personalize a sua ${product.name} com as suas criações AI. Proteção premium para o seu telemóvel com design único.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-2 sm:px-4 pt-16 pb-6 sm:pt-12 sm:pb-8 lg:py-8">
          {/* Breadcrumb - Hidden on mobile for cleaner look */}
          <nav className="mb-4 lg:mb-8 hidden sm:block">
            <ol className="flex items-center space-x-2 text-sm text-ghibli-earth">
              <li><Link href="/shop" className="hover:text-ghibli-moss transition-colors">Loja</Link></li>
              <li className="text-ghibli-earth/50">/</li>
              <li><Link href={`/shop/${product.category}`} className="hover:text-ghibli-moss transition-colors capitalize">{product.category}</Link></li>
              <li className="text-ghibli-earth/50">/</li>
              <li className="text-ghibli-moss font-medium">{product.name}</li>
            </ol>
          </nav>

          {/* 📱 MOBILE-FIRST: Mockup primeiro, depois painel de compra */}
          {/* 🖥️ DESKTOP: Layout em grid como antes */}
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

              {/* Botão "Escolher Arte" OTIMIZADO para MOBILE */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex justify-center px-4 lg:px-0"
              >
                <Button
                  onClick={handleOpenGallery}
                  disabled={!userInfo}
                  className={`w-full sm:w-auto px-8 sm:px-12 py-4 lg:py-4 text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl lg:rounded-2xl ${
                    userInfo 
                      ? 'bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-5 h-5 mr-2 lg:mr-3" />
                  {selectedImageUrl ? 'Trocar Arte' : 'Escolher Arte'}
                </Button>
              </motion.div>

              {/* Prompt de Login OTIMIZADO para MOBILE */}
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
                        Faça login para personalizar esta capa com as suas criações AI
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

              {/* 🎮 CONTROLOS DE AJUSTE HORIZONTAL - ABAIXO DA MOCKUP */}
              {selectedImageUrl && product?.supportsManualAdjustment && userImageDimensions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="mt-6 px-4 lg:px-0"
                >
                  <Card className="bg-gradient-to-br from-[#2D5A27]/5 to-[#4A6B5B]/5 border-[#2D5A27]/20 shadow-lg">
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-[#2D5A27] flex items-center justify-center gap-2">
                          <RotateCw className="w-5 h-5" />
                          Ajustar Posição Horizontal
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">Desloque a sua arte para a posição ideal na capa.</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          onClick={() => handleAdjustment('position', 'left')}
                          variant={imagePosition === 'left' ? 'default' : 'outline'}
                          disabled={isGeneratingMockup}
                          className="flex flex-col h-auto py-4 hover:shadow-md transition-all"
                        >
                          <ChevronLeft className="w-6 h-6" />
                          <span className="text-sm mt-1 font-medium">Esquerda</span>
                        </Button>
                        <Button
                          onClick={() => handleAdjustment('position', 'center')}
                          variant={imagePosition === 'center' ? 'default' : 'outline'}
                          disabled={isGeneratingMockup}
                          className="flex flex-col h-auto py-4 hover:shadow-md transition-all"
                        >
                          <span className="font-bold text-lg">●</span>
                          <span className="text-sm mt-1 font-medium">Centro</span>
                        </Button>
                        <Button
                          onClick={() => handleAdjustment('position', 'right')}
                          variant={imagePosition === 'right' ? 'default' : 'outline'}
                          disabled={isGeneratingMockup}
                          className="flex flex-col h-auto py-4 hover:shadow-md transition-all"
                        >
                          <ChevronRight className="w-6 h-6" />
                          <span className="text-sm mt-1 font-medium">Direita</span>
                        </Button>
                      </div>
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
                      Capa de Telemóvel Personalizada
                    </h1>
                    <div className="inline-block">
                      <div className="text-3xl sm:text-4xl font-black text-ghibli-moss drop-shadow-sm">
                        €25.00
                      </div>
                      <div className="text-center text-xs text-ghibli-earth/60 font-medium -mt-1">
                        IVA incluído
                      </div>
                    </div>
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

                  {/* 🛒 7. BOTÃO PRINCIPAL MOBILE-FIRST */}
                  <div className="pt-3">
                    {(!printifyProductId || !printifyImageId) && selectedImageUrl ? (
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
                      disabled={!selectedImageUrl || loading || !printifyProductId || !printifyImageId || !selectedPrintifyVariantId || !userInfo}
                        className={`group relative w-full py-5 sm:py-6 text-base sm:text-lg font-bold rounded-xl lg:rounded-2xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02] border-0 ${
                        selectedImageUrl && printifyProductId && printifyImageId && selectedPrintifyVariantId && userInfo
                            ? 'bg-gradient-to-br from-ghibli-moss via-ghibli-moss-light to-ghibli-moss hover:from-ghibli-moss-light hover:via-ghibli-moss hover:to-ghibli-moss-light text-white' 
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                      }`}
                      >
                        {/* Shimmer effect */}
                        {selectedImageUrl && printifyProductId && printifyImageId && selectedPrintifyVariantId && userInfo && (
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

                  {/* 🛡️ 8. GRID DE GARANTIAS MOBILE-OPTIMIZED */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <div className="group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />
                      </div>
                      <span className="text-xs font-bold text-ghibli-earth">Proteção Premium</span>
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