import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Truck, Award, Check, Upload, RotateCw, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { ChevronLeft } from 'lucide-react';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import { RateLimiter } from '@/lib/utils/rateLimiter';

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
  
  // Estados para Printify
  const [printifyPreviewUrls, setPrintifyPreviewUrls] = useState<string[]>([]);
  const [printifyImageId, setPrintifyImageId] = useState<string>('');
  const [printifyProductId, setPrintifyProductId] = useState<string>('');

  // Estado específico para seleção de variante da capa
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState<number | null>(null);

  // ✅ NOVOS ESTADOS para ajuste de posição
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imagePosition, setImagePosition] = useState<'left' | 'center' | 'right'>('center');
  const [currentMockupUrls, setCurrentMockupUrls] = useState<string[]>([]);
  const [activeMockupIndex, setActiveMockupIndex] = useState<number>(0);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState<boolean>(false);

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

  // Calcular defaultScale dinâmico e atualizar imageAdjustments (PRIMEIRA seleção de imagem)
  useEffect(() => {
    // 🎯 APENAS para primeira seleção - se não há imageAdjustments definido
    if (selectedImageUrl && product && selectedPrintifyVariantId && !imageAdjustments) {
      const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
      if (selectedVariant && product.printAreasConfig && product.printAreasConfig.length > 0) {
        const printAreaConfig = product.printAreasConfig[0]; // Assumindo apenas uma área de impressão para capas

        // Dimensões da imagem AI (padrão 1024x1024 para transformações PicTuz)
        const userImageWidth = 1024;
        const userImageHeight = 1024;

        // Dimensões do placeholder da variante selecionada
        const placeholderWidth = selectedVariant.placeholderWidth;
        const placeholderHeight = selectedVariant.placeholderHeight;

        // 🎯 MODO "Fill to placeholder" - scale 1.0 com X e Y centrados
        const fillScale = 1.0;

        console.log(`🎯 PRIMEIRA SELEÇÃO - Modo Fill to Placeholder: scale=${fillScale}, centrado (placeholder: ${placeholderWidth}x${placeholderHeight}, image: ${userImageWidth}x${userImageHeight})`);

        // Define os ajustes iniciais - modo "Fill to placeholder" centrado
        setImageAdjustments({
          x: 0.5, // SEMPRE centrado horizontalmente
          y: 0.5, // SEMPRE centrado verticalmente
          scale: fillScale, // Scale 1.0 = Fill to placeholder
          rotation: printAreaConfig.defaultAngle || 0
        });
      }
    }
  }, [selectedImageUrl, product, selectedPrintifyVariantId, imageAdjustments]); // Dependências corretas

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
          // ✅ OS CAMPOS CRÍTICOS: Usar defaultDesign do produto
          scale: getPrintifyProduct(productId as string)?.defaultDesign.scale || 1.0,
          x: getPrintifyProduct(productId as string)?.defaultDesign.x || 0.5,
          y: getPrintifyProduct(productId as string)?.defaultDesign.y || 0.5,
          angle: getPrintifyProduct(productId as string)?.defaultDesign.angle || 0,
          print_on_side: getPrintifyProduct(productId as string)?.defaultDesign.print_on_side,
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
    
    // ✅ PASSO 1 - Obtém as dimensões da imagem antes de fazer upload
    const img = new Image();
    img.onload = function(this: HTMLImageElement) {
      setUserImageDimensions({ width: this.width, height: this.height });
      console.log(`📐 Dimensões da Imagem Carregadas: ${this.width}x${this.height}`);
    };
    img.src = imageUrl;
    
    // Reset mockups para gerar novos
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    
    // ✅ Reset posição para centro quando nova imagem é selecionada
    setImagePosition('center');
    
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
    // Reset dimensões e posição
    setUserImageDimensions(null);
    setImagePosition('center');
    setCurrentMockupUrls([]);
    setActiveMockupIndex(0);
    setIsGeneratingMockup(false);
  };

  // ✅ FUNÇÃO: Calcular coordenadas finais baseado na posição definida (left/center/right)
  const calculatePrintifyCoords = (position: 'left' | 'center' | 'right', variantId: number, imageDimensions: { width: number; height: number }): ImageAdjustments => {
    if (!product) {
      console.log('❌ Produto não encontrado');
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }

    const selectedVariant = product.variants?.find(v => v.id === variantId);
    if (!selectedVariant) {
      console.log('❌ Variante não encontrada');
      return { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
    }

    const { placeholderWidth, placeholderHeight } = selectedVariant;
    const { width: userImageWidth, height: userImageHeight } = imageDimensions;

    // PASSO A: Calcular escala
    const scaleToCover = Math.max(
      placeholderWidth / userImageWidth,
      placeholderHeight / userImageHeight
    );
    const finalImageWidth = userImageWidth * scaleToCover;
    const printifyScale = finalImageWidth / placeholderWidth;

    // PASSO B: Calcular coordenada X baseada na posição (Y sempre centrado para ajuste horizontal)
    const scaledImageWidth = userImageWidth * scaleToCover;
    const maxMovementX = Math.max(0, (scaledImageWidth - placeholderWidth) / 2);

    let printifyX = 0.5; // Centro padrão

    if (maxMovementX > 0) {
      if (position === 'left') {
        const movementX = -maxMovementX * 0.7; // 70% para a esquerda
        printifyX = 0.5 + (movementX / placeholderWidth);
      } else if (position === 'right') {
        const movementX = maxMovementX * 0.7; // 70% para a direita
        printifyX = 0.5 + (movementX / placeholderWidth);
      }
      // 'center' fica com printifyX = 0.5
    }

    const finalAdjustments = {
      x: printifyX,
      y: 0.5, // Y sempre centrado para ajuste horizontal
      scale: printifyScale,
      rotation: 0
    };

    console.log('🎯 Coordenadas calculadas:', {
      position,
      variantId,
      scaleToCover,
      printifyScale,
      maxMovementX,
      printifyX,
      finalAdjustments
    });

    return finalAdjustments;
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

  // ✅ FUNÇÃO PRINCIPAL: Lidar com ajustes de posição
  const handleAdjustment = async (type: 'position', newPosition: 'left' | 'center' | 'right') => {
    if (!selectedImageUrl || !userImageDimensions || !selectedPrintifyVariantId) {
      toast.error('Selecione uma imagem primeiro');
      return;
    }

    // Rate limiting - máximo 3 chamadas por minuto
    const rateCheck = RateLimiter.checkRequestLimit();
    if (!rateCheck.allowed) {
      toast.error(rateCheck.message);
      return;
    }
    RateLimiter.recordRequest();
    
    console.log(`🎯 Ajustando posição: ${newPosition}`);
    setImagePosition(newPosition);

    // Calcular novas coordenadas
    const newCoordinates = calculatePrintifyCoords(newPosition, selectedPrintifyVariantId, userImageDimensions);
    setImageAdjustments(newCoordinates);

    // Gerar nova mockup
    await generateNewMockup(newCoordinates);
  };

  // ✅ FUNÇÃO: Gerar nova mockup com os ajustes aplicados
  const generateNewMockup = async (adjustments: ImageAdjustments) => {
    if (!selectedImageUrl || !selectedPrintifyVariantId || !product) {
      console.log('❌ Dados necessários em falta para gerar mockup');
      return;
    }

    setIsGeneratingMockup(true);

    try {
      console.log('🔄 Gerando nova mockup com ajustes:', adjustments);

      const requestBody = {
        productId: product.id,
        userImageUrl: selectedImageUrl,
        userId: userInfo?.id,
        selectedPrintifyVariantId,
        imageAdjustments: adjustments
      };

      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.mockupUrls) {
        console.log('✅ Nova mockup gerada:', data.data.mockupUrls);
        
        // Atualizar galeria de mockups
        setCurrentMockupUrls(data.data.mockupUrls);
        setActiveMockupIndex(0);
        
        // Atualizar dados Printify para carrinho
        setPrintifyImageId(data.data.printifyImageId);
        setPrintifyProductId(data.data.printifyProductId);
        
        toast.success('Posição ajustada com sucesso!');
      } else {
        console.error('❌ Resposta inválida:', data);
        toast.error('Erro ao gerar nova mockup');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar mockup:', error);
      toast.error('Erro ao aplicar ajuste. Tente novamente.');
    } finally {
      setIsGeneratingMockup(false);
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

                  {/* ✅ 6. CONTROLES DE POSIÇÃO HORIZONTAL - APENAS se tem imagem e dimensões */}
                  {selectedImageUrl && userImageDimensions && (
                    <div className="relative">
                      <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/50 rounded-xl p-4 sm:p-6 border border-blue-200/50">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <label className="text-sm font-bold text-blue-800">📐 Ajustar Posição Horizontal</label>
                          {isGeneratingMockup && (
                            <div className="flex items-center gap-1 ml-auto">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs text-blue-600">Gerando...</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            onClick={() => handleAdjustment('position', 'left')}
                            variant={imagePosition === 'left' ? 'default' : 'outline'}
                            disabled={isGeneratingMockup}
                            className={`relative h-12 text-sm font-medium transition-all duration-200 ${
                              imagePosition === 'left' 
                                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                                : 'bg-white/80 text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                            }`}
                          >
                            <span className="text-lg mr-1">⬅️</span>
                            Esquerda
                          </Button>
                          
                          <Button
                            onClick={() => handleAdjustment('position', 'center')}
                            variant={imagePosition === 'center' ? 'default' : 'outline'}
                            disabled={isGeneratingMockup}
                            className={`relative h-12 text-sm font-medium transition-all duration-200 ${
                              imagePosition === 'center' 
                                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                                : 'bg-white/80 text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                            }`}
                          >
                            <span className="text-lg mr-1">🎯</span>
                            Centro
                          </Button>
                          
                          <Button
                            onClick={() => handleAdjustment('position', 'right')}
                            variant={imagePosition === 'right' ? 'default' : 'outline'}
                            disabled={isGeneratingMockup}
                            className={`relative h-12 text-sm font-medium transition-all duration-200 ${
                              imagePosition === 'right' 
                                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                                : 'bg-white/80 text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                            }`}
                          >
                            <span className="text-lg mr-1">➡️</span>
                            Direita
                          </Button>
                        </div>
                        
                        <div className="mt-3 text-xs text-blue-600/80 text-center">
                          Ajuste fino da posição da sua arte na capa
                        </div>
                      </div>
                    </div>
                  )}

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