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

  const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
  const finalPrice = (product.basePrice || 0) + (selectedVariant?.priceAdjustment || 0);

  return (
    <>
      <Head>
        <title>{product.name} - Loja PicTuz Premium</title>
        <meta name="description" content={`Transforme a sua arte AI num ${product.name} de qualidade premium. Impressão semi-brilho museológica com cores vibrantes e duradouras.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .animation-delay-75 {
            animation-delay: 75ms;
          }
          .animation-delay-150 {
            animation-delay: 150ms;
          }
          .border-3 {
            border-width: 3px;
          }
          @media (max-width: 768px) {
            .min-h-75vh {
              min-height: 60vh;
            }
            .xl-col-span-3 {
              grid-column: span 1;
            }
            .xl-col-span-2 {
              grid-column: span 1;
            }
            .xl-grid-cols-5 {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-amber-50/30 relative overflow-hidden">
        {/* Premium Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,90,39,0.03)_0%,transparent_25%),radial-gradient(circle_at_70%_80%,rgba(74,107,91,0.04)_0%,transparent_25%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(245,241,232,0.4)_50%,transparent_100%)] pointer-events-none"></div>
        
        <Header />
        
        <main className="container mx-auto px-4 py-8 relative z-10">
          {/* Enhanced Breadcrumb */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <nav className="text-sm text-[#4A6B5B]/80 space-x-2 flex items-center">
              <Link href="/shop" className="hover:text-[#2D5A27] transition-colors font-medium hover:underline">Loja</Link>
              <span className="text-[#4A6B5B]/40">›</span>
              <Link href="/shop/poster" className="hover:text-[#2D5A27] transition-colors font-medium hover:underline">Posters</Link>
              <span className="text-[#4A6B5B]/40">›</span>
              <span className="text-[#2D5A27] font-bold">{product.name}</span>
            </nav>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 lg:gap-12">
            {/* Enhanced Preview Area - Now takes more space */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="xl:col-span-3 space-y-6"
            >
              {/* Hero Preview Container */}
              <div className="relative w-full min-h-[75vh] lg:min-h-[80vh] bg-gradient-to-br from-white via-white to-slate-50/50 rounded-3xl shadow-2xl shadow-black/5 overflow-hidden border border-white/60 backdrop-blur-sm">
                {/* Premium Shadow Layers */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/[0.02] via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute -inset-[1px] bg-gradient-to-br from-[#2D5A27]/10 via-transparent to-[#4A6B5B]/5 rounded-3xl -z-10"></div>
                
                {/* Enhanced Loading Overlay */}
                {isGeneratingMockup && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-30 rounded-3xl">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl border border-white/20">
                      <div className="relative mb-6">
                        <div className="w-12 h-12 border-3 border-[#2D5A27]/20 border-t-[#2D5A27] rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-b-[#4A6B5B]/30 rounded-full animate-spin mx-auto animation-delay-150"></div>
                      </div>
                      <h3 className="font-bold text-[#2D5A27] text-lg mb-2">Criando nova posição</h3>
                      <p className="text-sm text-[#4A6B5B]/80 font-medium">
                        Posição: <span className="font-bold text-[#2D5A27]">{imagePosition}</span>
                      </p>
                      <div className="mt-4 flex justify-center">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-[#2D5A27] rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-[#2D5A27] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-[#2D5A27] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
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

                {/* Enhanced Mockup Gallery Navigation */}
                {currentMockupUrls.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-black/70 backdrop-blur-lg rounded-2xl p-3 flex items-center gap-3 border border-white/10">
                      {/* Preview Counter */}
                      <span className="text-white/80 text-xs font-medium px-2">
                        {activeMockupIndex + 1} / {currentMockupUrls.length}
                      </span>
                      
                      {/* Navigation Buttons */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveMockupIndex(prev => prev > 0 ? prev - 1 : currentMockupUrls.length - 1)}
                        className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-110"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      {/* Dot Indicators */}
                      <div className="flex gap-1.5">
                        {currentMockupUrls.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveMockupIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                              index === activeMockupIndex 
                                ? 'bg-white scale-125' 
                                : 'bg-white/40 hover:bg-white/60'
                            }`}
                          />
                        ))}
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveMockupIndex(prev => prev < currentMockupUrls.length - 1 ? prev + 1 : 0)}
                        className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-110"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex justify-center"
              >
                <Button
                  onClick={handleOpenGallery}
                  size="lg"
                  disabled={!userInfo}
                  className={`group relative px-16 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] rounded-2xl overflow-hidden border-0 ${
                    userInfo 
                      ? 'bg-gradient-to-r from-[#2D5A27] via-[#2D5A27] to-[#1F4A1F] hover:from-[#1F4A1F] hover:via-[#2D5A27] hover:to-[#2D5A27] text-white' 
                      : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {/* Button Shimmer Effect */}
                  {userInfo && (
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000"></div>
                  )}
                  
                  <span className="relative z-10 flex items-center gap-4">
                    <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300 animate-float" />
                    {selectedImageUrl ? 'Trocar Arte' : 'Escolher Arte'}
                    <span className="w-2 h-2 bg-white/30 rounded-full group-hover:scale-150 transition-transform duration-300 animate-pulse"></span>
                  </span>
                </Button>
              </motion.div>
            </motion.div>

            {/* PREMIUM SIDEBAR - High-End Store Design */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
              className="xl:col-span-2"
            >
              {/* Sticky Container */}
              <div className="sticky top-8 space-y-6">
                {/* MAIN PRODUCT CARD - Premium Design */}
                <Card className="group relative bg-gradient-to-br from-white via-white to-[#F5F1E8]/20 backdrop-blur-xl border-[#E8E0D0]/30 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-3xl overflow-hidden">
                  {/* Premium Background Effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2D5A27]/[0.02] via-transparent to-[#4A6B5B]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute -inset-[1px] bg-gradient-to-br from-[#2D5A27]/10 via-transparent to-[#4A6B5B]/10 rounded-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <CardContent className="relative z-10 p-8 space-y-8">
                    {/* HEADER SECTION - Enhanced Typography */}
                    <div className="text-center space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-center">
                          <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2D5A27]/10 to-[#4A6B5B]/10 rounded-full px-4 py-2 text-xs font-bold text-[#2D5A27] border border-[#2D5A27]/20">
                            <div className="w-2 h-2 bg-[#2D5A27] rounded-full animate-pulse"></div>
                            PERSONALIZAÇÃO AI
                          </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-br from-[#2D5A27] via-[#2D5A27] to-[#1F4A1F] bg-clip-text text-transparent leading-tight">
                          {product.id === 'poster_horizontal_semi_glossy' ? 'Poster Horizontal' : 'Poster Vertical'}
                        </h1>
                        <div className="w-16 h-1 bg-gradient-to-r from-[#2D5A27] via-[#4A6B5B] to-[#2D5A27] mx-auto rounded-full shadow-sm"></div>
                      </div>
                    </div>

                    {/* PRICE SECTION - Premium Design */}
                    <div className="relative">
                      <div className="bg-gradient-to-br from-[#2D5A27]/5 via-[#2D5A27]/3 to-[#4A6B5B]/5 rounded-2xl p-6 text-center border border-[#2D5A27]/10 backdrop-blur-sm">
                        <div className="space-y-3">
                          <div className="relative">
                            <span className="block text-5xl lg:text-6xl font-black bg-gradient-to-br from-[#2D5A27] to-[#1F4A1F] bg-clip-text text-transparent drop-shadow-sm tracking-tight">
                              €{finalPrice.toFixed(2)}
                            </span>
                            {/* Price Glow Effect */}
                            <div className="absolute inset-0 text-5xl lg:text-6xl font-black text-[#2D5A27]/5 blur-sm -z-10">
                              €{finalPrice.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm text-[#4A6B5B]/70 font-medium">IVA incluído</span>
                            <div className="w-1 h-1 bg-[#4A6B5B]/40 rounded-full"></div>
                            <span className="text-sm text-[#4A6B5B]/70 font-medium">Entrega rápida</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SHIPPING INCENTIVE - Enhanced */}
                    <div className="relative">
                      <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 rounded-2xl p-4 border-l-4 border-emerald-400 border border-emerald-200/50 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shadow-sm">
                              <Truck className="w-6 h-6 text-emerald-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-emerald-800 text-base">Envio GRATUITO</div>
                            <div className="text-sm text-emerald-600 font-medium">em encomendas superiores a €50</div>
                          </div>
                          <div className="text-2xl">🎁</div>
                        </div>
                      </div>
                    </div>

                    {/* PRODUCT DESCRIPTION - Enhanced */}
                    <div className="space-y-4">
                      <div className="text-center space-y-3">
                        <h3 className="text-lg font-bold text-[#2D5A27]">✨ Arte AI Premium</h3>
                        <p className="text-[#4A6B5B]/90 leading-relaxed font-medium">
                          Transforme a sua criação AI num <span className="font-bold text-[#2D5A27]">poster de qualidade museológica</span>. 
                          Impressão semi-brilho premium com <span className="font-bold text-[#2D5A27]">cores vibrantes</span> e acabamento profissional.
                        </p>
                      </div>
                      
                      {/* Features Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { icon: '🎨', text: 'Qualidade Premium' },
                          { icon: '🌈', text: 'Cores Vibrantes' },
                          { icon: '✨', text: 'Semi-Brilho' },
                          { icon: '🏛️', text: 'Museológica' }
                        ].map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-[#F5F1E8]/30 rounded-xl border border-[#E8E0D0]/50">
                            <span className="text-lg">{feature.icon}</span>
                            <span className="text-sm font-semibold text-[#2D5A27]">{feature.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SIZE SELECTOR - Premium Design */}
                    <div className="space-y-4">
                      <label className="flex items-center justify-center gap-3 text-lg font-bold text-[#2D5A27]">
                        <ChevronDown className="w-5 h-5 text-[#2D5A27]" />
                        Escolha o Tamanho Premium
                      </label>
                      <Select
                        onValueChange={(value) => {
                          const selectedVariant = product.variants?.find(v => v.title.includes(value));
                          if (selectedVariant) {
                            setSelectedSizeLabel(value);
                            handleAdjustment('size', selectedVariant.id);
                          }
                        }}
                        value={selectedSizeLabel || ''}
                      >
                        <SelectTrigger className="w-full bg-gradient-to-r from-white to-[#F5F1E8]/30 border-2 border-[#E8E0D0]/60 text-[#2D5A27] h-16 shadow-lg hover:shadow-xl hover:border-[#2D5A27] transition-all duration-300 font-semibold rounded-2xl backdrop-blur-sm">
                          <SelectValue placeholder="Selecione um tamanho premium">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-[#2D5A27] rounded-full"></div>
                              {selectedSizeLabel ? convertInchesToCm(selectedSizeLabel) : 'Selecione um tamanho premium'}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-md text-[#2D5A27] border-[#E8E0D0] max-h-64 shadow-2xl rounded-2xl">
                          {Array.from(new Set(
                            product.variants?.map(v => {
                              const sizeMatch = v.title.match(/(\d+\.?\d*["″]? x \d+\.?\d*["″]? \((Horizontal|Vertical)\))/);
                              return sizeMatch ? sizeMatch[1] : null;
                            }).filter(Boolean)
                          )).sort((a, b) => {
                            const parseSize = (s: string) => {
                              const parts = s.replace(/["″()]/g, '').split(' x ').map(part => parseFloat(part));
                              return parts[0] * parts[1];
                            };
                            return parseSize(a || '') - parseSize(b || '');
                          }).map(size => (
                            <SelectItem key={size} value={size || ''} className="hover:bg-[#F5F1E8]/70 py-3 px-4 rounded-xl mx-2 my-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#2D5A27] rounded-full"></div>
                                {convertInchesToCm(size || '')}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* ADD TO CART SECTION - Premium CTA */}
                    <div className="space-y-4">
                      <Button
                        onClick={handleAddToCart}
                        disabled={!selectedImageUrl || loading || !printifyProductId || !printifyImageId || !selectedPrintifyVariantId || !userInfo}
                        className={`group relative w-full py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 transform rounded-2xl overflow-hidden border-0 ${
                          selectedImageUrl && printifyProductId && printifyImageId && selectedPrintifyVariantId && userInfo
                            ? 'hover:scale-[1.02] bg-gradient-to-r from-[#2D5A27] via-[#2D5A27] to-[#1F4A1F] hover:from-[#1F4A1F] hover:via-[#2D5A27] hover:to-[#2D5A27] text-white' 
                            : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                        }`}
                        size="lg"
                      >
                        {/* Button Background Effects */}
                        {selectedImageUrl && printifyProductId && printifyImageId && selectedPrintifyVariantId && userInfo && (
                          <>
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#2D5A27]/20 to-[#1F4A1F]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </>
                        )}
                        
                        <span className="relative z-10 flex items-center justify-center gap-4">
                          {loading ? (
                            <>
                              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                              A adicionar ao carrinho...
                            </>
                          ) : !userInfo ? (
                            <>
                              <span>🔐</span>
                              Faça Login para Continuar
                            </>
                          ) : !selectedImageUrl ? (
                            <>
                              <span>🎨</span>
                              Escolha uma Arte Primeiro
                            </>
                          ) : !selectedPrintifyVariantId ? (
                            <>
                              <span>📏</span>
                              Selecione o Tamanho
                            </>
                          ) : (!printifyProductId || !printifyImageId) ? (
                            <>
                              <RotateCw className="w-6 h-6 animate-spin" />
                              A gerar preview premium...
                            </>
                          ) : (
                            <>
                              <span className="text-2xl">🛒</span>
                              <span>Adicionar ao Carrinho</span>
                              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                                <span className="text-lg font-black">€{finalPrice.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                        </span>
                      </Button>

                      {/* Selected Art Display */}
                      {selectedImageUrl && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200/50 shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={selectedImageUrl}
                                alt="Arte selecionada"
                                className="w-16 h-16 rounded-xl object-cover border-2 border-green-300 shadow-md"
                              />
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">✓</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-green-800 text-base">✨ Arte AI Aplicada</div>
                              <div className="text-sm text-green-600 font-medium">Transformação pronta para impressão</div>
                            </div>
                            <Button
                              size="sm"
                              onClick={handleOpenGallery}
                              variant="outline"
                              className="text-xs px-4 py-2 border-green-300 text-green-700 hover:bg-green-100 rounded-xl font-semibold"
                            >
                              Trocar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TRUST BADGES - Premium Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: Shield, label: 'Qualidade\nGarantida', color: 'from-blue-500 to-blue-600' },
                        { icon: Sparkles, label: 'Impressão\nPremium', color: 'from-purple-500 to-purple-600' },
                        { icon: Truck, label: '~1 semana\nEntrega', color: 'from-green-500 to-green-600' },
                        { icon: Award, label: 'Satisfação\n100%', color: 'from-amber-500 to-amber-600' }
                      ].map((badge, index) => {
                        const IconComponent = badge.icon;
                        return (
                          <div key={index} className="group relative p-4 bg-gradient-to-br from-white to-[#F5F1E8]/30 rounded-xl border border-[#E8E0D0]/50 hover:border-[#2D5A27]/30 transition-all duration-300 text-center hover:shadow-lg">
                            <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${badge.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xs font-bold text-[#2D5A27] leading-tight whitespace-pre-line">
                              {badge.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* LOGIN PROMPT - Enhanced for Non-Users */}
                {!userInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <Card className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 border-blue-200/50 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
                      <CardContent className="p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <span className="text-2xl text-white">🔐</span>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-blue-800">Acesso Premium Requerido</h3>
                          <p className="text-blue-700 text-sm font-medium leading-relaxed">
                            Faça login para personalizar este poster com as suas criações AI exclusivas
                          </p>
                        </div>
                        <Button
                          onClick={() => router.push('/')}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <span className="mr-2">✨</span>
                          Fazer Login Agora
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
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