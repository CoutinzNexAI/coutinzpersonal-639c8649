import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Truck, Award, ChevronDown, RotateCw, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
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
import { GlobalRateLimiter } from '@/lib/utils/rateLimiter';

interface PosterDetailPageProps {
  product: PrintifyProductMapping;
}

const PosterDetailPage: React.FC<PosterDetailPageProps> = ({ product: initialProduct }) => {
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
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState<number | null>(null);

  // ✅ NOVO: Estado para dimensões da imagem do utilizador
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // ✅ POSIÇÕES DEFINIDAS: Estado para a posição da imagem (3 opções)
  // Para poster vertical: left/center/right
  // Para poster horizontal: top/center/bottom
  const [imagePosition, setImagePosition] = useState<'left' | 'center' | 'right' | 'top' | 'bottom'>('center');

  // ✅ GALERIA DE MOCKUPS: Guarda o array de URLs das mockups atuais
  const [currentMockupUrls, setCurrentMockupUrls] = useState<string[]>([]);

  // ✅ ÍNDICE ATIVO: Para saber qual mockup mostrar na galeria
  const [activeMockupIndex, setActiveMockupIndex] = useState<number>(0);

  // ✅ LOADING INDICATOR: Para mostrar enquanto a nova mockup é gerada
  const [isGeneratingMockup, setIsGeneratingMockup] = useState<boolean>(false);

  // ✅ QUANTIDADE: Estado para a quantidade de posters
  const [quantity, setQuantity] = useState(1);

  // Calculate discount and prices
  const calculateDiscount = (qty: number) => {
    if (qty >= 3) return 15;
    if (qty >= 2) return 10;
    return 0;
  };

  // ✅ PREÇOS PARA POSTERS: baseado na variante selecionada
  const getBasePrice = () => {
    const selectedVariant = product?.variants?.find(v => v.id === selectedPrintifyVariantId);
    return selectedVariant?.priceAdjustment || 20; // Preço por poster baseado na variante
  };

  const basePrice = getBasePrice();
  const discount = calculateDiscount(quantity);
  const discountedPrice = basePrice * (1 - discount / 100);
  const totalPrice = discountedPrice * quantity;
  const savings = (basePrice * quantity) - totalPrice;

  // Função utilitária: Validação consolidada
  const validatePurchase = () => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar o seu poster!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione o tamanho do poster.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  };

  // Condições auxiliares para botão
  const isProcessingMockup = (!printifyProductId || !printifyImageId) && selectedImageUrl;
  const canPurchase = selectedImageUrl && printifyProductId && printifyImageId && selectedPrintifyVariantId && userInfo;



  // ✅ HANDLER: Para mudança de variante de tamanho
  const handleVariantChange = (variantId: string) => {
    const numericVariantId = parseInt(variantId);
    setSelectedPrintifyVariantId(numericVariantId);
  };

  // Fallback para carregamento dinâmico (caso não haja product das props)
  useEffect(() => {
    if (!initialProduct && typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      if (foundProduct && foundProduct.category === 'poster') {
        setProduct(foundProduct);
        if (foundProduct.variants && foundProduct.variants.length > 0) {
          // ✅ DEBUG: Log para verificar os IDs das variantes
          console.log('🔍 [POSTER DEBUG] Variantes disponíveis:', foundProduct.variants.map(v => ({ id: v.id, title: v.title })));
          
          const firstVariant = foundProduct.variants[0];
          console.log('🔍 [POSTER DEBUG] Primeira variante selecionada:', { id: firstVariant.id, title: firstVariant.title });
          
          setSelectedPrintifyVariantId(firstVariant.id);
        }
      } else {
        router.push('/shop');
        toast.error('Produto não encontrado');
      }
    } else if (initialProduct) {
      // Set default variant for initial product
      if (initialProduct.variants && initialProduct.variants.length > 0) {
        // ✅ DEBUG: Log para verificar os IDs das variantes
        console.log('🔍 [POSTER DEBUG] Variantes disponíveis (initial):', initialProduct.variants.map(v => ({ id: v.id, title: v.title })));
        
        const firstVariant = initialProduct.variants[0];
        console.log('🔍 [POSTER DEBUG] Primeira variante selecionada (initial):', { id: firstVariant.id, title: firstVariant.title });
        
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

  // Calcular defaultScale dinâmico e atualizar imageAdjustments - CORREÇÃO DEFINITIVA
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
      
      console.log('🎯 [FRONTEND] Cálculo de escala definitivo:', {
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
      toast.error('Escolha uma arte primeiro para personalizar o seu poster!');
      return;
    }

    if (!product) {
      toast.error('Produto não encontrado.');
      return;
    }

    if (!userInfo) {
      toast.error('Faça login para adicionar ao carrinho');
      return;
    }

    // Validação específica para poster - variante selecionada
    if (selectedPrintifyVariantId === null) {
      toast.error('Por favor, selecione um tamanho.');
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
      console.log('🛒 Adicionando poster ao carrinho com valores:', {
        productId: productId as string,
        printifyProductId,
        printifyImageId,
        printifyVariantId: variantIdToSend,
        selectedImageUrl,
        selectedImageId,
        // ✅ NOVO DEBUG: Mostrar os valores de escala calculados
        calculatedImageAdjustments: imageAdjustments,
        defaultScale: getPrintifyProduct(productId as string)?.defaultDesign.scale,
        scaleToUse: imageAdjustments?.scale || getPrintifyProduct(productId as string)?.defaultDesign.scale || 1.05
      });

      // Obter variante selecionada
      const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);

      CartService.addToCart({
        productId: productId as string,
        productName: product.name,
        productCategory: product.category || 'poster',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId!,
        price: discountedPrice,
        quantity: quantity,
        customizations: {
          variantId: selectedPrintifyVariantId!,
          size: selectedVariant?.title || 'Tamanho não encontrado',
          scale: imageAdjustments?.scale || getPrintifyProduct(productId as string)?.defaultDesign.scale || 1.05,
          x: imageAdjustments?.x || getPrintifyProduct(productId as string)?.defaultDesign.x || 0.5,
          y: imageAdjustments?.y || getPrintifyProduct(productId as string)?.defaultDesign.y || 0.5,
          angle: imageAdjustments?.rotation || getPrintifyProduct(productId as string)?.defaultDesign.angle || 0,
          print_on_side: getPrintifyProduct(productId as string)?.defaultDesign.print_on_side,
        },
        imageAdjustments,
      });
      
      toast.success(`${quantity === 1 ? 'Poster adicionado' : `${quantity} posters adicionados`} ao carrinho!`, {
        description: `Total: €${totalPrice.toFixed(2)}${discount > 0 ? ` (${discount}% desconto aplicado!)` : ''}`,
        action: {
          label: 'Ver Carrinho',
          onClick: () => router.push('/checkout'),
        },
      });

    } catch (error) {
      console.error('❌ Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
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
    setIsGalleryModalOpen(false);
    
    if (!imageUrl) {
      toast.error('URL da imagem transformada não encontrado.');
      return;
    }

    // ✅ PASSO 1 - Obtém as dimensões da imagem antes de fazer upload
    const img = new Image();
    img.onload = function(this: HTMLImageElement) {
      setUserImageDimensions({ width: this.width, height: this.height });
      console.log(`📐 Dimensões da Imagem Carregadas: ${this.width}x${this.height}`);
    };
    img.src = imageUrl;

    // --- PASSO 2: Carregar a imagem transformada para a Printify Media Library ---
    toast.loading('A carregar arte para Printify...');
    setLoading(true);

    try {
      const printifyUploadResponse = await fetch('/api/printify/uploads/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl, // URL da imagem transformada (ex: do Supabase)
          fileName: `transformed-image-${imageId || Date.now()}.png`
        }),
      });

      const uploadData = await printifyUploadResponse.json();

      if (printifyUploadResponse.ok && uploadData.success && uploadData.imageId) {
        // --- PASSO 3: Atualizar estados com o ID e URL da Printify ---
        setSelectedImageId(uploadData.imageId); // ESTE É O ID VÁLIDO DA PRINTIFY!
        setSelectedImageUrl(uploadData.previewUrl || imageUrl); // Usa o URL Printify retornado
        
        // Reset mockups para gerar novos
        setPrintifyPreviewUrls([]);
        setPrintifyImageId('');
        setPrintifyProductId('');
        
        // ✅ Reset posição para centro quando nova imagem é selecionada
        setImagePosition('center');
        
        toast.dismiss();
        toast.success('Arte carregada para Printify com sucesso!');
      } else {
        toast.dismiss();
        toast.error(uploadData.error || 'Erro ao carregar arte para Printify. Tente novamente.');
        setSelectedImageId(null);
        setSelectedImageUrl('');
        // Reset dimensões se erro
        setUserImageDimensions(null);
      }
    } catch (error) {
      console.error('❌ Erro no upload da arte para Printify:', error);
      toast.dismiss();
      toast.error('Erro na comunicação ao carregar arte para Printify.');
      setSelectedImageId(null);
      setSelectedImageUrl('');
      // Reset dimensões se erro
      setUserImageDimensions(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSelection = () => {
    setSelectedImageUrl('');
    setSelectedImageId(null);
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    // Reset dimensões e posição
    setUserImageDimensions(null);
    setImagePosition('center');
  };

  // ✅ FUNÇÃO: Converter polegadas para centímetros
  const convertInchesToCm = (sizeText: string): string => {
    // Exemplo: "22" x 34" (Vertical)" -> "56 x 86 cm (Vertical)"
    const inchMatch = sizeText.match(/(\d+(?:\.\d+)?)["″]?\s*x\s*(\d+(?:\.\d+)?)["″]?\s*\(([^)]+)\)/);
    if (inchMatch) {
      const width = Math.round(parseFloat(inchMatch[1]) * 2.54);
      const height = Math.round(parseFloat(inchMatch[2]) * 2.54);
      const orientation = inchMatch[3];
      return `${width} x ${height} cm (${orientation})`;
    }
    return sizeText; // Fallback se não conseguir fazer parse
  };

  // ✅ FUNÇÃO PRINCIPAL: Calcular coordenadas finais baseado na posição definida
  // Para poster vertical: left/center/right (ajusta X)
  // Para poster horizontal: top/center/bottom (ajusta Y)
  const calculatePrintifyCoords = (position: 'left' | 'center' | 'right' | 'top' | 'bottom', variantId: number, imageDimensions: { width: number; height: number }): ImageAdjustments => {
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

    // ✅ NOVO: Determinar se é poster horizontal ou vertical
    const isHorizontalPoster = product.id === 'poster_horizontal_semi_glossy';
    
    let printifyX = 0.5; // Centro padrão
    let printifyY = 0.5; // Centro padrão

    if (isHorizontalPoster) {
      // ✅ POSTER HORIZONTAL: Ajustar coordenada Y baseada na posição (top/center/bottom)
      const scaledImageHeight = userImageHeight * scaleToCover;
      const maxMovementY = Math.max(0, (scaledImageHeight - placeholderHeight) / 2);

      if (maxMovementY > 0) {
        if (position === 'top') {
          const movementY = -maxMovementY * 0.7; // 70% para cima
          printifyY = 0.5 + (movementY / placeholderHeight);
        } else if (position === 'bottom') {
          const movementY = maxMovementY * 0.7; // 70% para baixo
          printifyY = 0.5 + (movementY / placeholderHeight);
        }
        // 'center' fica com printifyY = 0.5
      }
    } else {
      // ✅ POSTER VERTICAL: Ajustar coordenada X baseada na posição (left/center/right)
      const scaledImageWidth = userImageWidth * scaleToCover;
      const maxMovementX = Math.max(0, (scaledImageWidth - placeholderWidth) / 2);

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
    }

    const finalAdjustments = {
      x: printifyX,
      y: printifyY,
      scale: printifyScale,
      rotation: 0
    };

    console.log('🎯 Coordenadas calculadas:', {
      position,
      variantId,
      isHorizontalPoster,
      scaleToCover,
      printifyScale,
      printifyX,
      printifyY,
      finalAdjustments
    });

    return finalAdjustments;
  };

  const handleImageAdjustmentChange = (adjustments: Partial<ImageAdjustments>) => {
    setImageAdjustments(prev => ({
      x: prev?.x || 0.5,
      y: prev?.y || 0.5,
      scale: prev?.scale || 1,
      rotation: prev?.rotation || 0,
      ...adjustments
    }));
  };

  // ✅ LÓGICA CENTRAL: Controla todos os ajustes que precisam de nova mockup
  const handleAdjustment = async (type: 'position' | 'size', value: string | number) => {
    // 1. FALA COM O GUARDA-COSTAS PRIMEIRO
    const { allowed, message } = GlobalRateLimiter.checkRequestLimit();
    if (!allowed) {
      toast.error(message); // Mostra o erro ao utilizador
      return; // Para a execução aqui
    }

    if (!userImageDimensions) {
      toast.error('Aguarde o carregamento da imagem');
      return;
    }

    // 2. Se for permitido, atualiza o estado correspondente
    let newPosition = imagePosition;
    let newVariantId = selectedPrintifyVariantId;

    if (type === 'position') {
      newPosition = value as 'left' | 'center' | 'right' | 'top' | 'bottom';
      setImagePosition(newPosition);
      console.log(`📍 Posição alterada para: ${newPosition}`);
    } else if (type === 'size') {
      newVariantId = value as number;
      setSelectedPrintifyVariantId(newVariantId);
      console.log(`📏 Tamanho alterado para variante: ${newVariantId}`);
    }

    // 3. Regista que um pedido foi feito
    GlobalRateLimiter.recordRequest();

    // 4. E só depois chama a função para gerar a mockup
    await generateNewMockup(newPosition, newVariantId);
  };

  // ✅ FUNÇÃO QUE CHAMA O BACKEND: Gera nova mockup com a posição e variante
  const generateNewMockup = async (currentPosition: 'left' | 'center' | 'right' | 'top' | 'bottom', currentVariantId: number) => {
    if (!userImageDimensions || !selectedImageUrl || !selectedImageId) {
      console.log('❌ Dados insuficientes para gerar mockup');
      return;
    }

    console.log('🔄 Iniciando geração de nova mockup...', { currentPosition, currentVariantId });
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

    try {
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success && data.previewUrls && data.previewUrls.length > 0) {
        console.log('✅ Nova galeria de mockups gerada com sucesso!', data.previewUrls.length, 'imagens');
        setCurrentMockupUrls(data.previewUrls);
        setActiveMockupIndex(0); // Sempre mostra a primeira imagem do novo set
        setPrintifyPreviewUrls(data.previewUrls);
      } else {
        console.error('❌ Erro ao gerar nova mockup:', data.error || 'Resposta inválida');
        toast.error('Erro ao gerar nova preview. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Falha grave na chamada à API:', error);
      toast.error('Erro de conexão. Tente novamente.');
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

  const currentPrice = basePrice;

  return (
    <>
      <Head>
        <title>{product.name} - Loja PicTuz</title>
        <meta name="description" content={`Personalize o seu ${product.name} com as suas criações AI. Posters de alta qualidade.`} />
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
                {product.id === 'poster_vertical_semi_glossy' ? '📋 Poster Vertical' : '📄 Poster Horizontal'}
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

              {/* Controlos Mobile - Adaptados para Poster */}
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

                      {/* Controlos de Posição - Adaptados por tipo de poster */}
                      <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-ghibli-sand/30">
                        {product.id === 'poster_vertical_semi_glossy' ? (
                          // Poster Vertical: left/center/right
                          <>
                            <Button 
                              onClick={() => handleAdjustment('position', 'left')} 
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 rounded-full transition-all duration-200 ${imagePosition === 'left' 
                                ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                                : 'text-ghibli-earth hover:bg-ghibli-moss/10'
                              }`}
                              disabled={isGeneratingMockup}
                              title="Esquerda"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
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
                              onClick={() => handleAdjustment('position', 'right')} 
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 rounded-full transition-all duration-200 ${imagePosition === 'right' 
                                ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                                : 'text-ghibli-earth hover:bg-ghibli-moss/10'
                              }`}
                              disabled={isGeneratingMockup}
                              title="Direita"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8.59 16.59L13.17 12l-4.58-4.59L10 6l6 6-6 6-1.41-1.41z"/>
                              </svg>
                            </Button>
                          </>
                        ) : (
                          // Poster Horizontal: top/center/bottom
                          <>
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
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Compacto Mobile */}
                    <div className="mt-2 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-ghibli-moss bg-ghibli-moss/5 px-2 py-1 rounded-full font-medium border border-ghibli-moss/20">
                        <div className="w-1 h-1 bg-ghibli-moss rounded-full animate-pulse"></div>
                        {product.id === 'poster_vertical_semi_glossy' 
                          ? (imagePosition === 'left' ? 'Esquerda' : imagePosition === 'right' ? 'Direita' : 'Centro')
                          : (imagePosition === 'top' ? 'Cima' : imagePosition === 'bottom' ? 'Baixo' : 'Centro')
                        }
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
                        🎨 Entre para personalizar o seu poster
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

                {/* Seletor de Quantidade */}
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

                  {/* Destaques de desconto */}
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      quantity >= 2 
                        ? 'bg-green-100 border border-green-300 text-green-800' 
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      <span>🎯 2+ posters</span>
                      <span className="font-bold">10% OFF</span>
                    </div>
                    <div className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      quantity >= 3 
                        ? 'bg-green-100 border border-green-300 text-green-800' 
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      <span>🔥 3+ posters</span>
                      <span className="font-bold">15% OFF</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-ghibli-sand/30 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ghibli-earth">Total:</span>
                      <div className="text-right">
                        <div className="text-xl font-black text-ghibli-moss">€{totalPrice.toFixed(2)}</div>
                        {quantity > 1 && (
                          <div className="text-xs text-ghibli-earth/70">
                            {quantity} × €{discountedPrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                    <span className="text-ghibli-moss font-medium text-sm">Criando o seu poster mágico...</span>
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

            {/* Size Selector Mobile */}
            {product.variants && product.variants.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.75 }}
                className="px-4 mb-4"
              >
                <Card className="bg-white/90 backdrop-blur-sm border-ghibli-sand/40">
                  <CardContent className="p-4">
                    <label className="block text-sm font-bold text-ghibli-moss mb-3">
                      📐 Tamanho do Poster
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

            {/* Informações Extras Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="px-4 space-y-4 mb-6"
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

              {/* Preço e Desconto Mobile */}
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sand/30">
                <ul className="text-sm space-y-2 text-ghibli-earth/80">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                    <span>Poster de <span className="font-bold text-ghibli-moss">máxima qualidade</span> em papel premium</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                    <span>Impressão de <span className="font-bold">altíssima resolução</span> resistente</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-wood rounded-full shrink-0"></div>
                    <span className="font-bold text-ghibli-wood">Perfeito para decorar qualquer espaço</span>
                  </li>
                </ul>
              </div>

              {/* Tamanho Mobile */}
              <div className="bg-ghibli-cream/30 rounded-xl border border-ghibli-sand/40 p-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-ghibli-moss"></div>
                  <span className="text-ghibli-earth font-semibold">
                    📐 {product.variants?.length || 0} tamanhos disponíveis
                  </span>
                </div>
                <p className="text-center text-xs text-ghibli-earth/70 mt-1">
                  Desde 5"x7" até 24"x36"
                </p>
              </div>

              {/* Garantias Mobile */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-ghibli-cream/40 rounded-xl p-3 text-center border border-ghibli-sand/30">
                  <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-ghibli-moss/10 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-ghibli-moss" />
                  </div>
                  <span className="text-xs font-bold text-ghibli-earth">Máxima Qualidade</span>
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

                        {/* Controlos de Posição - Adaptados por tipo de poster */}
                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-ghibli-sand/30">
                          {product.id === 'poster_vertical_semi_glossy' ? (
                            // Poster Vertical: left/center/right
                            <>
                              <Button 
                                onClick={() => handleAdjustment('position', 'left')} 
                                variant="ghost"
                                size="sm"
                                className={`h-12 w-12 rounded-full transition-all duration-200 ${imagePosition === 'left' 
                                  ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                                  : 'text-ghibli-earth hover:bg-ghibli-moss/10 hover:scale-105'
                                }`}
                                disabled={isGeneratingMockup}
                                title="Esquerda"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/>
                                </svg>
                              </Button>
                              
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
                              
                              <Button 
                                onClick={() => handleAdjustment('position', 'right')} 
                                variant="ghost"
                                size="sm"
                                className={`h-12 w-12 rounded-full transition-all duration-200 ${imagePosition === 'right' 
                                  ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                                  : 'text-ghibli-earth hover:bg-ghibli-moss/10 hover:scale-105'
                                }`}
                                disabled={isGeneratingMockup}
                                title="Direita"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8.59 16.59L13.17 12l-4.58-4.59L10 6l6 6-6 6-1.41-1.41z"/>
                                </svg>
                              </Button>
                            </>
                          ) : (
                            // Poster Horizontal: top/center/bottom
                            <>
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
                            </>
                          )}
                        </div>
                      </div>

                      {/* Indicador de Status - Compacto */}
                      <div className="mt-3 text-center">
                        <span className="inline-flex items-center gap-2 text-xs text-ghibli-moss bg-ghibli-moss/5 px-3 py-1 rounded-full font-medium border border-ghibli-moss/20">
                          <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full animate-pulse"></div>
                          Posição: {product.id === 'poster_vertical_semi_glossy' 
                            ? (imagePosition === 'left' ? 'Esquerda' : imagePosition === 'right' ? 'Direita' : 'Centro')
                            : (imagePosition === 'top' ? 'Cima' : imagePosition === 'bottom' ? 'Baixo' : 'Centro')
                          }
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
                          🎨 Entre para personalizar o seu poster
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

              {/* Painel Lateral - Sticky Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-1 order-2 lg:order-2"
              >
                <div className="sticky top-6 space-y-6">
                  {/* Título e Preço */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-ghibli-sand/20">
                    <h1 className="text-2xl lg:text-3xl font-black text-ghibli-earth mb-2 leading-tight">
                      {product.id === 'poster_vertical_semi_glossy' ? '📋 Poster Vertical' : '📄 Poster Horizontal'}
                    </h1>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl lg:text-4xl font-black text-ghibli-moss">
                        €{discountedPrice.toFixed(2)}
                      </div>
                      {discount > 0 && (
                        <div className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                          -{discount}%
                        </div>
                      )}
                    </div>

                    {discount > 0 && (
                      <div className="text-sm text-gray-600 mb-4">
                        <span className="line-through">€{basePrice.toFixed(2)}</span>
                        <span className="text-green-600 font-semibold ml-2">
                          Poupa €{savings.toFixed(2)}!
                        </span>
                      </div>
                    )}

                    <p className="text-sm text-ghibli-earth/80 leading-relaxed">
                      Poster de <span className="font-bold text-ghibli-moss">máxima qualidade</span> com impressão premium. 
                      Perfeito para decorar qualquer espaço com as suas criações AI.
                    </p>
                  </div>

                  {/* Seletor de Tamanho */}
                  {product.variants && product.variants.length > 1 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-ghibli-sand/20">
                      <label className="block text-lg font-bold text-ghibli-moss mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-ghibli-moss rounded-full"></div>
                        Tamanho do Poster
                      </label>
                      <select
                        value={selectedPrintifyVariantId?.toString() || ''}
                        onChange={(e) => setSelectedPrintifyVariantId(parseInt(e.target.value))}
                        className="w-full h-14 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium px-4 focus:border-ghibli-moss transition-all duration-200 focus:outline-none"
                      >
                        {product.variants?.map((variant) => (
                          <option key={variant.id} value={variant.id.toString()}>
                            {variant.title} ({convertInchesToCm(variant.title)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quantidade e Descontos */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-ghibli-sand/20">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-lg font-bold text-ghibli-moss flex items-center gap-2">
                        <div className="w-2 h-2 bg-ghibli-moss rounded-full"></div>
                        Quantidade
                      </label>
                      <div className="flex items-center gap-2 bg-ghibli-cream/50 rounded-xl p-2">
                        <Button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          size="sm"
                          variant="ghost"
                          className="h-10 w-10 p-0 rounded-lg hover:bg-ghibli-moss/10 disabled:opacity-50"
                        >
                          <Minus className="w-5 h-5" />
                        </Button>
                        
                        <span className="min-w-[3rem] text-center font-bold text-xl text-ghibli-earth">
                          {quantity}
                        </span>
                        
                        <Button
                          onClick={() => setQuantity(quantity + 1)}
                          size="sm"
                          variant="ghost"
                          className="h-10 w-10 p-0 rounded-lg hover:bg-ghibli-moss/10"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Progressão de Descontos */}
                    <div className="space-y-2 mb-4">
                      <div className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        quantity >= 2 
                          ? 'bg-green-100 border border-green-300 text-green-800' 
                          : 'bg-gray-50 text-gray-600'
                      }`}>
                        <span className="font-medium">2+ posters</span>
                        <span className="font-bold">10% OFF</span>
                      </div>
                      <div className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        quantity >= 3 
                          ? 'bg-green-100 border border-green-300 text-green-800' 
                          : 'bg-gray-50 text-gray-600'
                      }`}>
                        <span className="font-medium">3+ posters</span>
                        <span className="font-bold">15% OFF</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t border-ghibli-sand/30 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-ghibli-earth">Total:</span>
                        <div className="text-right">
                          <div className="text-2xl font-black text-ghibli-moss">€{totalPrice.toFixed(2)}</div>
                          {quantity > 1 && (
                            <div className="text-sm text-ghibli-earth/70">
                              {quantity} × €{discountedPrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botão Adicionar ao Carrinho */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-ghibli-sand/20">
                    {isProcessingMockup ? (
                      <div className="w-full py-4 bg-gradient-to-r from-ghibli-moss/50 to-ghibli-moss-light/50 rounded-xl text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-ghibli-moss font-medium text-sm">Criando o seu poster mágico...</span>
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
                  </div>

                  {/* Garantias e Informações */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-ghibli-sand/20">
                    <h3 className="text-lg font-bold text-ghibli-moss mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-ghibli-moss rounded-full"></div>
                      Garantias de Qualidade
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ghibli-moss/10 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4 text-ghibli-moss" />
                        </div>
                        <div>
                          <p className="font-semibold text-ghibli-earth text-sm">Material Premium</p>
                          <p className="text-xs text-ghibli-earth/70">Papel de alta qualidade resistente</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ghibli-moss/10 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-ghibli-moss" />
                        </div>
                        <div>
                          <p className="font-semibold text-ghibli-earth text-sm">Impressão HD</p>
                          <p className="text-xs text-ghibli-earth/70">Resolução máxima, cores vibrantes</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ghibli-moss/10 flex items-center justify-center shrink-0">
                          <div className="w-4 h-4 rounded-full bg-ghibli-moss"></div>
                        </div>
                        <div>
                          <p className="font-semibold text-ghibli-earth text-sm">Entrega Rápida</p>
                          <p className="text-xs text-ghibli-earth/70">Produção e envio em poucos dias</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* TransformationGalleryModal */}
          <TransformationGalleryModal
            isOpen={isGalleryModalOpen}
            onClose={() => setIsGalleryModalOpen(false)}
            onSelectImage={handleSelectImageFromGallery}
          />
        </main>
      </div>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posterProducts = getPrintifyProductsByCategory('poster');
  const productIds = Object.keys(posterProducts);
  
  const paths = productIds.map((productId) => ({
    params: { productId }
  }));

  return {
    paths,
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productId = params?.productId as string;
  const product = getPrintifyProduct(productId);
  
  if (!product || product.category !== 'poster') {
    return {
      notFound: true
    };
  }

  return {
    props: {
      product
    }
  };
};

export default PosterDetailPage; 