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
import { GlobalRateLimiter } from '@/lib/utils/rateLimiter';

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
  // Para poster vertical: left/center/right
  // Para poster horizontal: top/center/bottom
  const [imagePosition, setImagePosition] = useState<'left' | 'center' | 'right' | 'top' | 'bottom'>('center');

  // ✅ GALERIA DE MOCKUPS: Guarda o array de URLs das mockups atuais
  const [currentMockupUrls, setCurrentMockupUrls] = useState<string[]>([]);

  // ✅ ÍNDICE ATIVO: Para saber qual mockup mostrar na galeria
  const [activeMockupIndex, setActiveMockupIndex] = useState<number>(0);

  // ✅ LOADING INDICATOR: Para mostrar enquanto a nova mockup é gerada
  const [isGeneratingMockup, setIsGeneratingMockup] = useState<boolean>(false);

  // ✅ SISTEMA DE QUANTIDADE E DESCONTOS (como nas canecas)
  const [quantity, setQuantity] = useState(1);
  const [cartFeedback, setCartFeedback] = useState<boolean>(false);

  // Calculate discount and prices (replicando das canecas)
  const calculateDiscount = (qty: number) => {
    if (qty >= 3) return 15;
    if (qty >= 2) return 10;
    return 0;
  };

  const selectedVariant = product?.variants?.find(v => v.id === selectedPrintifyVariantId);
  const basePrice = selectedVariant?.priceAdjustment || 20;
  const discount = calculateDiscount(quantity);
  const discountedPrice = basePrice * (1 - discount / 100);
  const totalPrice = discountedPrice * quantity;
  const savings = (basePrice * quantity) - totalPrice;

  // ✅ COMPUTED VALUES: Validação consolidada (replicando das canecas)
  const validatePurchase = () => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar o seu poster!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione o tamanho do poster.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  };

  const canPurchase = !validatePurchase();
  const canAddToCart = !!(selectedImageUrl && printifyProductId && printifyImageId && selectedPrintifyVariantId && userInfo);

  // ✅ HANDLER: Para mudança de variante de tamanho
  const handleVariantChange = (variantId: string) => {
    const numericVariantId = parseInt(variantId);
    setSelectedPrintifyVariantId(numericVariantId);
    
    // Encontrar a variante correspondente para atualizar o label
    const selectedVariant = product?.variants?.find(v => v.id === numericVariantId);
    if (selectedVariant) {
      const sizeMatch = selectedVariant.title.match(/(\d+\.?\d*["″]? x \d+\.?\d*["″]? \((Horizontal|Vertical)\))/);
      if (sizeMatch) {
        setSelectedSizeLabel(sizeMatch[1]);
      }
    }
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
        price: selectedVariant?.priceAdjustment || 20, // Usar preço fixo da variante
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
      
      // Mostrar feedback visual
      setCartFeedback(true);
      setTimeout(() => setCartFeedback(false), 3000);

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
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F0] via-[#F5F1E8] to-[#E8E0D0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2D5A27] mx-auto mb-4"></div>
          <p className="text-[#4A6B5B]">A carregar produto...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${product.name} - Poster Personalizado | PicTuz`}</title>
        <meta name="description" content={`Personalize o seu ${product.name} com as suas criações AI. Alta qualidade e entrega rápida.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <ol className="flex items-center space-x-2 text-sm text-ghibli-earth">
              <li><Link href="/shop" className="hover:text-ghibli-moss transition-colors">Loja</Link></li>
              <li className="text-ghibli-earth/50">/</li>
              <li><Link href="/shop/poster" className="hover:text-ghibli-moss transition-colors">Posters</Link></li>
              <li className="text-ghibli-earth/50">/</li>
              <li className="text-ghibli-moss font-medium">{product.name}</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[calc(100vh-140px)]">
            {/* Coluna da Esquerda - Área de Visualização Equilibrada (2 colunas) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 flex flex-col justify-center"
            >
              {/* Área Principal de Visualização OTIMIZADA */}
              <div className="relative w-full h-[65vh] bg-white rounded-2xl shadow-xl overflow-hidden mb-6 border border-[#E8E0D0]">
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

              {/* Secção de Controlos Centralizada */}
              <div className="flex flex-col items-center gap-4">
                {/* Botão "Escolher Arte" Destacado */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Button
                  onClick={handleOpenGallery}
                  size="lg"
                  disabled={!userInfo}
                    className={`px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl ${
                    userInfo 
                      ? 'bg-gradient-to-r from-[#2D5A27] to-[#2D5A27]/90 hover:from-[#2D5A27]/90 hover:to-[#2D5A27] text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-5 h-5 mr-3" />
                  {selectedImageUrl ? 'Trocar Arte' : 'Escolher Arte'}
                </Button>
              </motion.div>

                {/* ✅ CONTROLOS DE POSIÇÃO ELEGANTES com Símbolos Reais */}
                {selectedImageUrl && userImageDimensions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="flex flex-col items-center gap-3"
                  >
                    {/* Label Elegante */}
                    <div className="flex items-center gap-2 text-[#4A6B5B]">
                      <div className="w-1 h-1 bg-[#2D5A27] rounded-full"></div>
                      <span className="text-sm font-medium">Ajustar Posição</span>
                      <div className="w-1 h-1 bg-[#2D5A27] rounded-full"></div>
                    </div>
                    
                    {/* Controlos com Símbolos Bonitos */}
                    <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-[#E8E0D0]/60">
                      {/* Controlos para Poster Vertical */}
                      {product.id === 'poster_vertical_semi_glossy' && (
                        <>
                          <Button 
                            onClick={() => handleAdjustment('position', 'left')} 
                            variant="ghost"
                            size="sm"
                            className={`h-10 w-10 rounded-full transition-all duration-200 ${imagePosition === 'left' 
                              ? 'bg-[#2D5A27] text-white shadow-md scale-110' 
                              : 'text-[#4A6B5B] hover:bg-[#2D5A27]/10 hover:scale-105'
                            }`}
                            disabled={isGeneratingMockup}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                          </Button>
                          
                          <Button 
                            onClick={() => handleAdjustment('position', 'center')} 
                            variant="ghost"
                            size="sm"
                            className={`h-10 w-10 rounded-full transition-all duration-200 ${imagePosition === 'center' 
                              ? 'bg-[#2D5A27] text-white shadow-md scale-110' 
                              : 'text-[#4A6B5B] hover:bg-[#2D5A27]/10 hover:scale-105'
                            }`}
                            disabled={isGeneratingMockup}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </Button>
                          
                          <Button 
                            onClick={() => handleAdjustment('position', 'right')} 
                            variant="ghost"
                            size="sm"
                            className={`h-10 w-10 rounded-full transition-all duration-200 ${imagePosition === 'right' 
                              ? 'bg-[#2D5A27] text-white shadow-md scale-110' 
                              : 'text-[#4A6B5B] hover:bg-[#2D5A27]/10 hover:scale-105'
                            }`}
                            disabled={isGeneratingMockup}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                          </Button>
                        </>
                      )}

                      {/* Controlos para Poster Horizontal */}
                      {product.id === 'poster_horizontal_semi_glossy' && (
                        <>
                          <Button 
                            onClick={() => handleAdjustment('position', 'top')} 
                            variant="ghost"
                            size="sm"
                            className={`h-10 w-10 rounded-full transition-all duration-200 ${imagePosition === 'top' 
                              ? 'bg-[#2D5A27] text-white shadow-md scale-110' 
                              : 'text-[#4A6B5B] hover:bg-[#2D5A27]/10 hover:scale-105'
                            }`}
                            disabled={isGeneratingMockup}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                            </svg>
                          </Button>
                          
                          <Button 
                            onClick={() => handleAdjustment('position', 'center')} 
                            variant="ghost"
                            size="sm"
                            className={`h-10 w-10 rounded-full transition-all duration-200 ${imagePosition === 'center' 
                              ? 'bg-[#2D5A27] text-white shadow-md scale-110' 
                              : 'text-[#4A6B5B] hover:bg-[#2D5A27]/10 hover:scale-105'
                            }`}
                            disabled={isGeneratingMockup}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </Button>
                          
                          <Button 
                            onClick={() => handleAdjustment('position', 'bottom')} 
                            variant="ghost"
                            size="sm"
                            className={`h-10 w-10 rounded-full transition-all duration-200 ${imagePosition === 'bottom' 
                              ? 'bg-[#2D5A27] text-white shadow-md scale-110' 
                              : 'text-[#4A6B5B] hover:bg-[#2D5A27]/10 hover:scale-105'
                            }`}
                            disabled={isGeneratingMockup}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                            </svg>
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Indicador de Posição Atual */}
                    <div className="text-center">
                      <span className="inline-flex items-center gap-2 text-xs text-[#2D5A27] bg-[#2D5A27]/5 px-3 py-1 rounded-full font-medium border border-[#2D5A27]/20">
                        <div className="w-1.5 h-1.5 bg-[#2D5A27] rounded-full animate-pulse"></div>
                        {imagePosition === 'left' ? 'Esquerda' : 
                         imagePosition === 'right' ? 'Direita' : 
                         imagePosition === 'top' ? 'Cima' : 
                         imagePosition === 'bottom' ? 'Baixo' : 'Centro'}
                      </span>
                    </div>
                  </motion.div>
                )}

              {/* Prompt de Login (apenas se não autenticado) */}
              {!userInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                    className="mt-2"
                >
                  <Card className="bg-blue-50/80 border-blue-200 backdrop-blur-sm max-w-md">
                    <CardContent className="p-4 text-center">
                      <p className="text-blue-800 text-sm mb-3">
                          Faça login para personalizar este poster
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
              </div>
            </motion.div>

            {/* PAINEL DE CONTROLO COMPACTO - Coluna da Direita */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1 flex flex-col h-full"
            >
              {/* CARTÃO PRINCIPAL - Painel de Controlo Compacto */}
              <Card className="bg-gradient-to-br from-white to-[#F5F1E8]/30 backdrop-blur-sm border-[#E8E0D0]/30 shadow-xl hover:shadow-2xl transition-shadow duration-300 flex-1 flex flex-col">
                <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                  {/* 1. CABEÇALHO ELEGANTE */}
                  <div className="text-center pb-4 border-b border-[#E8E0D0]/30">
                    <motion.h1 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="text-2xl font-bold text-[#2D5A27] mb-2"
                    >
                      {product.name}
                    </motion.h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-[#4A6B5B]">
                      <div className="w-1 h-1 bg-[#2D5A27] rounded-full"></div>
                      <span>Premium • Semi-brilho • Alta qualidade</span>
                      <div className="w-1 h-1 bg-[#2D5A27] rounded-full"></div>
                    </div>
                  </div>

                  {/* 2. PREÇO DESTACADO */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-center py-4"
                  >
                    <div className="text-3xl font-bold text-[#2D5A27] mb-1">
                        €{finalPrice.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">IVA incluído</div>

                    {/* Envio Grátis Badge */}
                    <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 4a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 14.846 4.632 17 6.414 17H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.22-.916A1 1 0 005 4H3zm7 12a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z"/>
                      </svg>
                      Envio grátis › €50
                    </div>
                  </motion.div>

                  {/* 3. SELEÇÃO DE TAMANHO */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="space-y-3"
                  >
                    <label className="text-sm font-semibold text-[#2D5A27] flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v14H3V5h18z"/>
                      </svg>
                      Tamanho
                    </label>
                    <Select value={selectedPrintifyVariantId?.toString() || ''} onValueChange={handleVariantChange}>
                      <SelectTrigger className="w-full border-[#E8E0D0] focus:border-[#2D5A27] focus:ring-[#2D5A27]/20">
                        <SelectValue placeholder="Selecione o tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.variants?.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id.toString()}>
                            <div className="flex justify-between items-center w-full">
                              <span>{variant.title}</span>
                              <span className="ml-4 text-[#2D5A27] font-semibold">€{(variant.priceAdjustment || 20).toFixed(2)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* 4. GARANTIAS COMPACTAS */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="grid grid-cols-2 gap-3 py-4 border-t border-[#E8E0D0]/30"
                  >
                    <div className="flex items-center gap-2 text-sm text-[#4A6B5B]">
                      <div className="w-8 h-8 bg-[#2D5A27]/10 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#2D5A27]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                  </div>
                      <span className="font-medium">Qualidade garantida</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#4A6B5B]">
                      <div className="w-8 h-8 bg-[#2D5A27]/10 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#2D5A27]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                        </svg>
                      </div>
                      <span className="font-medium">Envio rápido</span>
                    </div>
                  </motion.div>

                  {/* 5. BOTÃO ADICIONAR AO CARRINHO - EFEITO ESPECIAL */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="mt-auto pt-4"
                  >
                    <Button
                      onClick={handleAddToCart}
                      disabled={!canAddToCart}
                      className={`w-full py-4 text-base font-bold rounded-xl shadow-lg transition-all duration-300 transform 
                        ${canAddToCart 
                          ? 'bg-gradient-to-r from-[#2D5A27] via-[#3d7a35] to-[#2D5A27] hover:shadow-2xl hover:scale-[1.02] text-white relative overflow-hidden group' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {/* Efeito Shimmer */}
                      {canAddToCart && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      )}
                      
                      <div className="relative flex items-center justify-center gap-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 4V2a1 1 0 0 0-1-1H2a1 1 0 0 0 0 2h3v16a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3H8a1 1 0 0 1 0-2h11.38a1 1 0 0 0 .97-.757L22 8H6.38L7 4zm-2 4h13.38l-1.5 6H6.62L5 8z"/>
                        </svg>
                        <span>
                          {canAddToCart 
                            ? `Adicionar • €${finalPrice.toFixed(2)}` 
                            : 'Selecione uma arte primeiro'
                          }
                        </span>
                        {canAddToCart && (
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                          </svg>
                    )}
                  </div>
                    </Button>
                    
                    {/* Feedback de sucesso */}
                    {cartFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-center"
                      >
                        <p className="text-green-800 text-sm font-medium">
                          ✅ Adicionado ao carrinho!
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
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