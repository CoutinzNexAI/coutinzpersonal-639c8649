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
import { Slider } from '@/components/ui/slider';
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
import { RateLimiter } from '@/lib/utils/rateLimiter';

interface PosterDetailPageProps {
  product: PrintifyProductMapping;
}

const PosterDetailPage: React.FC<PosterDetailPageProps> = ({ product: initialProduct }) => {
  const router = useRouter();
  const { productId } = router.query;
  const { userInfo, session } = useAuth();
  
  const [product, setProduct] = useState<PrintifyProductMapping | null>(initialProduct || null);
  // Inicializar os estados como vazios/nulos
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

  // Estado específico para seleção de variante do poster
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState<number | null>(null);

  // Estado específico para Poster - FIXO em "mirror"
  const [selectedEdgeType] = useState<string>('mirror');

  // Estado para seleção de tamanho (para posters)
  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string | null>(null);

  // ✅ NOVO: Estado para dimensões da imagem do utilizador
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // ✅ POSIÇÕES DEFINIDAS: Estado para a posição da imagem (3 opções)
  const [imagePosition, setImagePosition] = useState<'left' | 'center' | 'right'>('center');

  // ✅ GALERIA DE MOCKUPS: Guarda o array de URLs das mockups atuais
  const [currentMockupUrls, setCurrentMockupUrls] = useState<string[]>([]);

  // ✅ ÍNDICE ATIVO: Para saber qual mockup mostrar na galeria
  const [activeMockupIndex, setActiveMockupIndex] = useState<number>(0);

  // ✅ LOADING INDICATOR: Para mostrar enquanto a nova mockup é gerada
  const [isGeneratingMockup, setIsGeneratingMockup] = useState<boolean>(false);

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
          // Extrair tamanho do primeiro variant
          const firstVariantTitle = firstVariant.title;
          const sizeMatch = firstVariantTitle.match(/(\d+\.?\d*["″]? x \d+\.?\d*["″]? \((Horizontal|Vertical)\))/);
          if (sizeMatch) {
            setSelectedSizeLabel(sizeMatch[1]);
            console.log('🔍 [POSTER DEBUG] Tamanho extraído:', sizeMatch[1]);
          }
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
        // Extrair tamanho do primeiro variant
        const firstVariantTitle = firstVariant.title;
        const sizeMatch = firstVariantTitle.match(/(\d+\.?\d*["″]? x \d+\.?\d*["″]? \((Horizontal|Vertical)\))/);
        if (sizeMatch) {
          setSelectedSizeLabel(sizeMatch[1]);
          console.log('🔍 [POSTER DEBUG] Tamanho extraído (initial):', sizeMatch[1]);
        }
      }
    }
  }, [productId, initialProduct, router]);

  // useEffect para encontrar selectedPrintifyVariantId com base no tamanho selecionado
  useEffect(() => {
    if (product && selectedSizeLabel && product.variants) {
      const foundVariant = product.variants.find(variant => 
        variant.title.includes(selectedSizeLabel)
      );

      if (foundVariant && foundVariant.id !== selectedPrintifyVariantId) {
        setSelectedPrintifyVariantId(foundVariant.id);
      } else if (!foundVariant && selectedPrintifyVariantId !== null) {
        setSelectedPrintifyVariantId(null);
        toast.error('Combinação de tamanho não encontrada para o Poster.');
      }
    }
  }, [selectedSizeLabel, product, selectedPrintifyVariantId]);

  // Reset estados quando a variante muda
  useEffect(() => {
    if (selectedImageUrl && selectedPrintifyVariantId) {
      // Reset mockups Printify para forçar nova geração quando variante muda
      setPrintifyPreviewUrls([]);
      setPrintifyImageId('');
      setPrintifyProductId('');
    }
  }, [selectedPrintifyVariantId, selectedSizeLabel]);

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

      // Adicionar item ao carrinho usando o CartService - SIMPLIFICADO
      const cartItem = CartService.addToCart({
        productId: productId as string,
        productName: product.name,
        productCategory: product.category || 'poster',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId, // ID da imagem já processada
        price: product.basePrice || product.price || 0,
        quantity: 1,
        customizations: {
          variantId: selectedPrintifyVariantId!, // Obrigatório agora
          size: selectedVariant?.title || 'Tamanho não encontrado',
          // ✅ CORREÇÃO: Usar imageAdjustments calculados (Math.max) em vez de defaultDesign fixo
          scale: imageAdjustments?.scale || getPrintifyProduct(productId as string)?.defaultDesign.scale || 1.05,
          x: imageAdjustments?.x || getPrintifyProduct(productId as string)?.defaultDesign.x || 0.5,
          y: imageAdjustments?.y || getPrintifyProduct(productId as string)?.defaultDesign.y || 0.5,
          angle: imageAdjustments?.rotation || getPrintifyProduct(productId as string)?.defaultDesign.angle || 0,
          print_on_side: getPrintifyProduct(productId as string)?.defaultDesign.print_on_side,
        },
        imageAdjustments: imageAdjustments,
      });

      console.log('✅ Item adicionado ao carrinho:', cartItem);
      toast.success(`${product.name} adicionado ao carrinho!`);
      router.push('/checkout');

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

  // ✅ FUNÇÃO PRINCIPAL: Calcular coordenadas finais baseado na posição definida (left/center/right)
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

    // PASSO B: Calcular coordenada X baseada na posição
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
      y: 0.5, // Y sempre centrado para poster vertical
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
    const { allowed, message } = RateLimiter.checkRequestLimit();
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
      newPosition = value as 'left' | 'center' | 'right';
      setImagePosition(newPosition);
      console.log(`📍 Posição alterada para: ${newPosition}`);
    } else if (type === 'size') {
      newVariantId = value as number;
      setSelectedPrintifyVariantId(newVariantId);
      console.log(`📏 Tamanho alterado para variante: ${newVariantId}`);
    }

    // 3. Regista que um pedido foi feito
    RateLimiter.recordRequest();

    // 4. E só depois chama a função para gerar a mockup
    await generateNewMockup(newPosition, newVariantId);
  };

  // ✅ FUNÇÃO QUE CHAMA O BACKEND: Gera nova mockup com a posição e variante
  const generateNewMockup = async (currentPosition: 'left' | 'center' | 'right', currentVariantId: number) => {
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
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F0] via-[#F5F1E8] to-[#E8E0D0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2D5A27] mx-auto mb-4"></div>
          <p className="text-[#4A6B5B]">A carregar produto...</p>
        </div>
      </div>
    );
  }

  const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
  const finalPrice = (product.basePrice || 0) + (selectedVariant?.priceAdjustment || 0);

  return (
    <>
      <Head>
        <title>{`${product.name} - Poster Personalizado | PicTuz`}</title>
        <meta name="description" content={`Personalize o seu ${product.name} com as suas criações AI. Alta qualidade e entrega rápida.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F0] via-[#F5F1E8] to-[#E8E0D0]">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="text-sm text-[#4A6B5B] space-x-2">
              <Link href="/shop" className="hover:text-[#2D5A27] transition-colors">Loja</Link>
              <span>›</span>
              <Link href="/shop/poster" className="hover:text-[#2D5A27] transition-colors">Posters</Link>
              <span>›</span>
              <span className="text-[#2D5A27] font-medium">{product.name}</span>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna da Esquerda - Área Maximizada de Visualização (2 colunas) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              {/* Área Principal de Visualização OTIMIZADA - Mais Alta */}
              <div className="relative w-full h-[700px] bg-white rounded-2xl shadow-xl overflow-hidden mb-6 border border-[#E8E0D0]">
                {/* ✅ OVERLAY DE LOADING quando nova mockup está a ser gerada */}
                {isGeneratingMockup && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
                    <div className="bg-white rounded-xl p-6 text-center max-w-sm mx-4 shadow-2xl">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <h3 className="font-semibold text-gray-800 mb-2">A gerar nova posição...</h3>
                      <p className="text-sm text-gray-600">
                        Nova posição: {imagePosition} - Aguarde alguns segundos
                      </p>
                    </div>
                  </div>
                )}

                <ProductCanvas
                  selectedProduct={product}
                  userImageUrl={selectedImageUrl}
                  userId={userInfo?.id}
                  printifyGeneratedPreviewUrls={currentMockupUrls.length > 0 ? currentMockupUrls : printifyPreviewUrls}
                  onPreviewReady={handlePreviewReady}
                  onSelectImage={handleOpenGallery}
                  imageAdjustments={imageAdjustments}
                  onImageAdjust={setImageAdjustments}
                  selectedPrintifyVariantId={selectedPrintifyVariantId}
                  selectedImageId={selectedImageId}
                />

                {/* ✅ GALERIA DE MOCKUPS - Apenas setas para navegação */}
                {currentMockupUrls.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-black/70 backdrop-blur-sm rounded-xl p-2 flex items-center gap-2">
                      {/* Botão Anterior */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveMockupIndex(prev => prev > 0 ? prev - 1 : currentMockupUrls.length - 1)}
                        className="text-white hover:bg-white/20 h-8 w-8 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      {/* Botão Próximo */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveMockupIndex(prev => prev < currentMockupUrls.length - 1 ? prev + 1 : 0)}
                        className="text-white hover:bg-white/20 h-8 w-8 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botão "Escolher Arte" SEMPRE VISÍVEL - CTA Principal */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex justify-center"
              >
                <Button
                  onClick={handleOpenGallery}
                  size="lg"
                  disabled={!userInfo}
                  className={`px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                    userInfo 
                      ? 'bg-gradient-to-r from-[#2D5A27] to-[#2D5A27]/90 hover:from-[#2D5A27]/90 hover:to-[#2D5A27] text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-5 h-5 mr-3" />
                  {selectedImageUrl ? 'Trocar Arte' : 'Escolher Arte'}
                </Button>
              </motion.div>

              {/* ✅ CONTROLES DE POSIÇÃO - Movidos para debaixo do botão "Trocar Arte" */}
              {selectedImageUrl && userImageDimensions && product && product.id === 'poster_vertical_semi_glossy' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="mt-6"
                >
                  <Card className="bg-gradient-to-br from-[#2D5A27]/5 to-[#4A6B5B]/5 border-[#2D5A27]/20 shadow-lg">
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-[#2D5A27] mb-2">
                          Ajustar Posição
                        </h3>
                        <p className="text-sm text-[#4A6B5B]/80">
                          Escolha como posicionar a sua arte no poster
                        </p>
                      </div>
                      
                      <div className="flex gap-3 mb-4">
                        <Button 
                          onClick={() => handleAdjustment('position', 'left')} 
                          variant={imagePosition === 'left' ? 'default' : 'outline'}
                          className={`flex-1 ${imagePosition === 'left' 
                            ? 'bg-[#2D5A27] hover:bg-[#2D5A27]/90 text-white' 
                            : 'border-[#2D5A27]/30 text-[#2D5A27] hover:bg-[#2D5A27]/10'
                          }`}
                          disabled={isGeneratingMockup}
                        >
                          Esquerda
                        </Button>
                        <Button 
                          onClick={() => handleAdjustment('position', 'center')} 
                          variant={imagePosition === 'center' ? 'default' : 'outline'}
                          className={`flex-1 ${imagePosition === 'center' 
                            ? 'bg-[#2D5A27] hover:bg-[#2D5A27]/90 text-white' 
                            : 'border-[#2D5A27]/30 text-[#2D5A27] hover:bg-[#2D5A27]/10'
                          }`}
                          disabled={isGeneratingMockup}
                        >
                          Centro
                        </Button>
                        <Button 
                          onClick={() => handleAdjustment('position', 'right')} 
                          variant={imagePosition === 'right' ? 'default' : 'outline'}
                          className={`flex-1 ${imagePosition === 'right' 
                            ? 'bg-[#2D5A27] hover:bg-[#2D5A27]/90 text-white' 
                            : 'border-[#2D5A27]/30 text-[#2D5A27] hover:bg-[#2D5A27]/10'
                          }`}
                          disabled={isGeneratingMockup}
                        >
                          Direita
                        </Button>
                      </div>
                      
                      <div className="text-center">
                        <span className="inline-flex items-center gap-2 text-sm text-[#2D5A27] bg-[#2D5A27]/10 px-3 py-2 rounded-lg font-medium">
                          <span className="w-2 h-2 bg-[#2D5A27] rounded-full"></span>
                          Posição: {imagePosition === 'left' ? 'Esquerda' : imagePosition === 'right' ? 'Direita' : 'Centro'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Prompt de Login (apenas se não autenticado) */}
              {!userInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="mt-4 flex justify-center"
                >
                  <Card className="bg-blue-50/80 border-blue-200 backdrop-blur-sm max-w-md">
                    <CardContent className="p-4 text-center">
                      <p className="text-blue-800 text-sm mb-3">
                        Faça login para personalizar este poster com as suas criações AI
                      </p>
                      <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                      >
                        Fazer Login
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>

            {/* PAINEL DE CONTROLO UNIFICADO - Coluna da Direita */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1"
            >
              {/* CARTÃO PRINCIPAL - Painel de Controlo Único */}
              <Card className="bg-gradient-to-br from-white to-[#F5F1E8]/30 backdrop-blur-sm border-[#E8E0D0]/30 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8 space-y-6">
                  {/* 1. TÍTULO MELHORADO */}
                  <div className="text-center">
                    <h1 className="text-4xl font-black text-[#2D5A27] mb-4 leading-tight">
                      Poster Vertical
                    </h1>
                    <div className="w-16 h-1 bg-gradient-to-r from-[#2D5A27] to-[#4A6B5B] mx-auto rounded-full"></div>
                  </div>

                  {/* 2. PREÇO CENTRADO */}
                  <div className="bg-gradient-to-r from-[#2D5A27]/10 to-[#2D5A27]/5 rounded-xl p-6 text-center">
                    <div className="space-y-1">
                      <span className="block text-5xl font-black text-[#2D5A27] drop-shadow-sm">
                        €{finalPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-[#4A6B5B]/70 font-medium">
                        IVA incluído
                      </span>
                    </div>
                  </div>

                  {/* 3. INCENTIVO DE VENDA MELHORADO */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50 text-center">
                    <div className="flex items-center justify-center gap-3 text-green-700">
                      <Truck className="w-5 h-5" />
                      <span className="font-semibold">
                        Entrega gratuita em encomendas &gt; €50
                      </span>
                    </div>
                  </div>

                  {/* 4. DESCRIÇÃO MELHORADA */}
                  <div className="text-center">
                    <p className="text-[#4A6B5B]/90 leading-relaxed font-medium">
                      Transforme a sua arte AI num poster de alta qualidade! Impressão semi brilho premium com cores vibrantes e duradouras, perfeito para decorar qualquer espaço.
                    </p>
                  </div>

                  {/* 5. SELETOR DE TAMANHO (APENAS TAMANHO PARA POSTERS) */}
                  <div>
                    <label className="block text-sm font-bold text-[#2D5A27] mb-3 flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 text-[#2D5A27]" />
                      Escolha o Tamanho
                    </label>
                    <Select
                      onValueChange={(value) => {
                        // Encontrar o variant com base no título selecionado
                        const selectedVariant = product.variants?.find(v => v.title.includes(value));
                        if (selectedVariant) {
                          setSelectedSizeLabel(value);
                          // Usar a nova lógica com rate limiter
                          handleAdjustment('size', selectedVariant.id);
                        }
                      }}
                      value={selectedSizeLabel || ''}
                    >
                      <SelectTrigger className="w-full bg-white border-2 border-[#E8E0D0]/60 text-[#2D5A27] h-14 shadow-sm hover:border-[#2D5A27]/50 focus:border-[#2D5A27] transition-colors duration-200 font-medium">
                        <SelectValue placeholder="Selecione um tamanho">
                          {selectedSizeLabel ? convertInchesToCm(selectedSizeLabel) : 'Selecione um tamanho'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white text-[#2D5A27] border-[#E8E0D0] max-h-60 shadow-xl">
                        {/* Obter tamanhos únicos e ordenados */}
                        {Array.from(new Set(
                          product.variants?.map(v => {
                            const sizeMatch = v.title.match(/(\d+\.?\d*["″]? x \d+\.?\d*["″]? \((Horizontal|Vertical)\))/);
                            return sizeMatch ? sizeMatch[1] : null;
                          }).filter(Boolean)
                        )).sort((a, b) => {
                          // Ordenação por área (largura x altura)
                          const parseSize = (s: string) => {
                            const parts = s.replace(/["″()]/g, '').split(' x ').map(part => parseFloat(part));
                            return parts[0] * parts[1]; // área total
                          };
                          return parseSize(a || '') - parseSize(b || '');
                        }).map(size => (
                          <SelectItem key={size} value={size || ''} className="hover:bg-[#F5F1E8]/50">
                            {convertInchesToCm(size || '')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>



                  {/* 6. BLOCO DE AÇÕES - LÓGICA CONDICIONAL */}
                  <div className="pt-4">
                    {/* BOTÃO PRINCIPAL - Estado Condicional */}
                    <Button
                      onClick={handleAddToCart}
                      disabled={!selectedImageUrl || loading || !printifyProductId || !printifyImageId || !selectedPrintifyVariantId || !userInfo}
                      className={`w-full py-5 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform ${
                        selectedImageUrl && printifyProductId && printifyImageId && selectedPrintifyVariantId && userInfo
                          ? 'hover:scale-[1.02] bg-gradient-to-r from-[#2D5A27] via-[#2D5A27] to-[#2D5A27]/90 hover:from-[#2D5A27]/90 hover:via-[#2D5A27] hover:to-[#2D5A27] text-white border-0' 
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                      }`}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                          A adicionar...
                        </>
                      ) : !userInfo ? (
                        'Faça Login para Continuar'
                      ) : !selectedImageUrl ? (
                        'Escolha uma Arte Primeiro'
                      ) : !selectedPrintifyVariantId ? (
                        'Selecione o Tamanho'
                      ) : (!printifyProductId || !printifyImageId) ? (
                        <>
                          <RotateCw className="w-5 h-5 mr-3 animate-spin" />
                          A gerar preview...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🛒</span>
                          Adicionar ao Carrinho - €{finalPrice.toFixed(2)}
                        </>
                      )}
                    </Button>

                    {/* Informação Extra sobre Arte Selecionada */}
                    {selectedImageUrl && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <img
                            src={selectedImageUrl}
                            alt="Arte selecionada"
                            className="w-12 h-12 rounded-lg object-cover border border-green-300"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-800">
                              ✅ Arte selecionada
                            </p>
                            <p className="text-xs text-green-600">
                              Transformação AI aplicada
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={handleResetSelection}
                            variant="outline"
                            className="text-xs border-green-300 text-green-700 hover:bg-green-100"
                          >
                            Trocar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 7. BLOCO DE CONFIANÇA (Garantias) */}
                  <div className="pt-6 border-t border-[#E8E0D0]/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-[#F5F1E8]/60 to-[#F5F1E8]/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Shield className="w-6 h-6 text-[#2D5A27] mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-[#2D5A27]">Qualidade Premium</span>
                      </div>
                      <div className="bg-gradient-to-br from-[#F5F1E8]/60 to-[#F5F1E8]/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Sparkles className="w-6 h-6 text-[#2D5A27] mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-[#2D5A27]">Semi Brilho HD</span>
                      </div>
                      <div className="bg-gradient-to-br from-[#F5F1E8]/60 to-[#F5F1E8]/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Truck className="w-6 h-6 text-[#2D5A27] mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-[#2D5A27]">Entrega 3-5d</span>
                      </div>
                      <div className="bg-gradient-to-br from-[#F5F1E8]/60 to-[#F5F1E8]/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Award className="w-6 h-6 text-[#2D5A27] mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-[#2D5A27]">30d Garantia</span>
                      </div>
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