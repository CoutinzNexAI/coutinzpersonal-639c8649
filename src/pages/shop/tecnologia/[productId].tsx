import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Minus, Plus, ChevronRight, Shield, Truck, Award } from 'lucide-react';
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
import { ImageAdjustments } from '@/types/product';
import ProductCardDecorations from '@/components/shared/ProductCardDecorations';
import { GlobalRateLimiter } from '@/lib/utils/rateLimiter';

// ✅ COMPONENTES E HOOKS GENÉRICOS
import ProductArtStatus from '@/components/shared/ProductArtStatus';
import ProductDescription from '@/components/shared/ProductDescription';
import ProductVariantSelector from '@/components/shared/ProductVariantSelector';
import ProductAddToCartButton from '@/components/shared/ProductAddToCartButton';
import ProductLoadingState from '@/components/shared/ProductLoadingState';
import ProductMobileControls from '@/components/shared/ProductMobileControls';
import ProductQuantityPricing from '@/components/shared/ProductQuantityPricing';
import ProductPositionControls from '@/components/shared/ProductPositionControls';
import ProductGuarantees from '@/components/shared/ProductGuarantees';
import ProductHeader from '@/components/shared/ProductHeader';
import { useProductPricing } from '@/hooks/useProductPricing';
import { useProductValidation } from '@/hooks/useProductValidation';
import { useProductCoordinates } from '@/hooks/useProductCoordinates';

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
  const [mockupImageUrl, setMockupImageUrl] = useState<string | null>(null);
  
  // Estados para Printify
  const [printifyPreviewUrls, setPrintifyPreviewUrls] = useState<string[]>([]);
  const [printifyImageId, setPrintifyImageId] = useState<string>('');
  const [printifyProductId, setPrintifyProductId] = useState<string>('');
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState<number | null>(null);

  // ✅ NOVO: Estado para dimensões da imagem do utilizador
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // ✅ POSIÇÕES DEFINIDAS: Estado para a posição da imagem (3 opções)
  // Para capas: left/center/right (movimento horizontal)
  const [imagePosition, setImagePosition] = useState<'left' | 'center' | 'right'>('center');

  // ✅ GALERIA DE MOCKUPS: Guarda o array de URLs das mockups atuais
  const [currentMockupUrls, setCurrentMockupUrls] = useState<string[]>([]);

  // ✅ ÍNDICE ATIVO: Para saber qual mockup mostrar na galeria
  const [activeMockupIndex, setActiveMockupIndex] = useState<number>(0);

  // ✅ LOADING INDICATOR: Para mostrar enquanto a nova mockup é gerada
  const [isGeneratingMockup, setIsGeneratingMockup] = useState<boolean>(false);

  // ✅ QUANTIDADE: Estado para a quantidade de capas
  const [quantity, setQuantity] = useState(1);

  // ✅ HOOKS GENÉRICOS: Substituem as funções duplicadas
  const { discountedPrice, totalPrice, discount, savings, calculateDiscount } = useProductPricing({
    basePrice: 25.00, // Preço base das capas
    quantity: quantity
  });

  const { validatePurchase, validateAndShowError } = useProductValidation();

  const { calculatePrintifyCoords } = useProductCoordinates();

  // Setup inicial do produto
  useEffect(() => {
    if (!initialProduct && typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      if (foundProduct && foundProduct.category === 'tecnologia') {
        setProduct(foundProduct);
        if (foundProduct.variants && foundProduct.variants.length > 0) {
          console.log('🔍 [CAPA DEBUG] Variantes disponíveis:', foundProduct.variants.map(v => ({ id: v.id, title: v.title })));
          
          const firstVariant = foundProduct.variants[0];
          console.log('🔍 [CAPA DEBUG] Primeira variante selecionada:', { id: firstVariant.id, title: firstVariant.title });
          
          setSelectedPrintifyVariantId(firstVariant.id);
        }
      } else {
        router.push('/shop');
        toast.error('Produto não encontrado');
      }
    } else if (initialProduct) {
      // Set default variant for initial product
      if (initialProduct.variants && initialProduct.variants.length > 0) {
        console.log('🔍 [CAPA DEBUG] Variantes disponíveis (initial):', initialProduct.variants.map(v => ({ id: v.id, title: v.title })));
        
        const firstVariant = initialProduct.variants[0];
        console.log('🔍 [CAPA DEBUG] Primeira variante selecionada (initial):', { id: firstVariant.id, title: firstVariant.title });
        
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

  // Calcular defaultScale dinâmico e atualizar imageAdjustments - Adaptado para capas
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
      
      console.log('🎯 [CAPA FRONTEND] Cálculo de escala definitivo:', {
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
        console.log('📐 [CAPA] Dimensões da imagem detectadas:', { width: img.width, height: img.height });
      };
      img.onerror = () => {
        console.error('❌ [CAPA] Erro ao carregar imagem para detectar dimensões');
        // Default para imagens AI quadradas
        setUserImageDimensions({ width: 1016, height: 1016 });
      };
      img.src = selectedImageUrl;
    } else {
      setUserImageDimensions(null);
    }
  }, [selectedImageUrl]);

  // ✅ COORDENADAS: Agora usamos o hook genérico

  // ✅ CONTROLADOR DE TRÁFEGO MESTRE: Único useEffect responsável por gerar mockups
  // Só executa quando TODOS os dados necessários estão prontos (evita a "corrida")
  useEffect(() => {
    // ✅ CONDIÇÃO DE GUARDA: SÓ avança se tivermos TODOS os dados necessários
    if (!selectedImageUrl || !selectedPrintifyVariantId || !userImageDimensions || !userInfo?.id) {
      console.log("⏳ [TRAFFIC-CONTROLLER] A aguardar todos os dados para gerar mockup...", {
        selectedImageUrl: !!selectedImageUrl,
        selectedPrintifyVariantId: !!selectedPrintifyVariantId,
        userImageDimensions: !!userImageDimensions,
        userId: !!userInfo?.id
      });
      return; // Se alguma informação crucial falta, não faz nada
    }

    console.log('🚀 [TRAFFIC-CONTROLLER] TODOS os dados prontos! Iniciando geração...', {
      selectedImageUrl: !!selectedImageUrl,
      selectedPrintifyVariantId,
      imagePosition,
      userImageDimensions,
      userId: !!userInfo?.id
    });

    // ✅ DEBOUNCE MÍNIMO: Apenas para garantir que o estado React estabiliza
    const handler = setTimeout(() => {
      console.log('🎯 [TRAFFIC-CONTROLLER] Disparando geração com dimensões reais confirmadas...');
      
      // ✅ A posição vem do estado controlado pelos botões
      const currentPosition = imagePosition;

      // ✅ Chama a função que faz todo o trabalho COM as dimensões reais
      generateNewMockup(currentPosition, selectedPrintifyVariantId);

    }, 100); // Debounce mínimo apenas para estabilizar o React state

    return () => clearTimeout(handler);

  // ✅ DEPENDÊNCIAS CRUCIAIS: Qualquer mudança nestes valores dispara nova geração
  }, [selectedImageUrl, selectedPrintifyVariantId, imagePosition, userImageDimensions, userInfo?.id]);

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
    // ✅ RATE LIMITING: Verificar se pode fazer o pedido (copiado do poster)
    const { allowed, message } = GlobalRateLimiter.checkRequestLimit();
    if (!allowed) {
      toast.error(message);
      return;
    }

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
      
      // ✅ REGISTAR PEDIDO: Após mudança bem-sucedida (copiado do poster)
      GlobalRateLimiter.recordRequest();
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
    const adjustments = calculatePrintifyCoords({
      position: currentPosition,
      variantId: currentVariantId,
      imageDimensions: userImageDimensions,
      product: product!,
      positionType: 'horizontal', // Capas usam movimento horizontal (esquerda/direita)
      shiftAmount: 0.35 // 35% como no poster
    });
    
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
    // Validar com a função consolidada
    const validationError = validatePurchase({
      selectedImageUrl,
      selectedImageId,
      userInfo,
      selectedPrintifyVariantId,
      printifyProductId,
      printifyImageId,
      productName: 'Capa',
      customValidationMessage: 'Escolha uma arte primeiro para personalizar a sua capa!'
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      // ✅ DEBUG: Log dos valores antes de adicionar ao carrinho
      console.log('🛒 Adicionando capa ao carrinho com valores:', {
        productId: productId as string,
        printifyProductId,
        printifyImageId,
        printifyVariantId: selectedPrintifyVariantId,
        selectedImageUrl,
        selectedImageId,
        quantity,
        totalPrice
      });

      // Obter variante selecionada
      const selectedVariant = product?.variants?.find(v => v.id === selectedPrintifyVariantId);

      // Adicionar item ao carrinho usando o CartService
      const cartItem = CartService.addToCart({
        productId: productId as string,
        productName: product!.name,
        productCategory: product!.category || 'tecnologia',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId!,
        price: discountedPrice,
        quantity: quantity,
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
      toast.success(`${quantity === 1 ? 'Capa adicionada' : `${quantity} capas adicionadas`} ao carrinho!`, {
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

  const handleOpenGallery = () => setIsGalleryModalOpen(true);

  const handleSelectImageFromGallery = async (imageUrl: string, imageId: string) => {
    console.log('🎬 [SYNC] Iniciando seleção de imagem...', { imageUrl: !!imageUrl, imageId });
    
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
    
    console.log('🔄 [SYNC] Estados resetados. Carregando dimensões reais da imagem...');
    
    // ✅ AGUARDAR DIMENSÕES REAIS: Só define userImageDimensions quando tiver certeza
    const img = new Image();
    img.onload = function(this: HTMLImageElement) {
      const realWidth = this.naturalWidth;
      const realHeight = this.naturalHeight;
      
      console.log(`✅ [SYNC] Dimensões carregadas: ${realWidth}x${realHeight}`);
      
      // ✅ AGORA SIM: Define as dimensões reais
      // Isto vai disparar o useEffect que vai gerar a mockup
      setUserImageDimensions({ width: realWidth, height: realHeight });
      setLoading(false);
    
    toast.success('Arte selecionada com sucesso!');
    };
    
    img.onerror = () => {
      console.error('❌ [SYNC] Erro ao carregar imagem. Usando fallback 1024x1024');
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
        ...adjustments 
      });
    }
  };

  // Condições auxiliares para botão (igual às canecas)
  const isProcessingMockup = Boolean((!printifyProductId || !printifyImageId) && selectedImageUrl);
  const canPurchase = Boolean(selectedImageUrl && printifyProductId && printifyImageId && selectedPrintifyVariantId && userInfo);

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
        <title>📱 Capa Personalizada - Loja PicTuz</title>
        <meta name="description" content="Personalize a sua capa de telemóvel com as suas criações AI. Proteção premium com design único e qualidade superior." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        <ProductCardDecorations />
        
        <main className="container mx-auto px-2 sm:px-4 pt-20 pb-6 sm:pt-24 sm:pb-8 lg:py-8">
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
                📱 Capa Personalizada
              </h1>
              <div className="text-4xl sm:text-5xl font-black text-ghibli-moss drop-shadow-lg tracking-tight">
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

              {/* Controlos Mobile - COMPONENTE GENÉRICO */}
              <ProductMobileControls
                selectedImageUrl={selectedImageUrl}
                userImageDimensions={userImageDimensions}
                product={product}
                imagePosition={imagePosition}
                isGeneratingMockup={isGeneratingMockup}
                userInfo={userInfo}
                onOpenGallery={handleOpenGallery}
                onAdjustPosition={(position) => handleAdjustment('position', position)}
                positionType="horizontal"
              />
              
              {!userInfo && (
                <div className="px-4">
                  <Card className="bg-ghibli-moss/10 border-ghibli-moss/30 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <p className="text-ghibli-earth text-sm mb-3 font-medium">
                        📱 Entre para personalizar a sua capa
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

            {/* Seletor de Quantidade e Preços Mobile - COMPONENTE GENÉRICO */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="px-4 mb-4"
            >
              <ProductQuantityPricing
                basePrice={25.00}
                quantity={quantity}
                onQuantityChange={setQuantity}
                discountTiers={[
                  { min: 2, discount: 10, label: 'capas', emoji: '🎯' },
                  { min: 3, discount: 15, label: 'capas', emoji: '🔥' }
                ]}
              />
            </motion.div>

            {/* Botão Adicionar ao Carrinho Mobile - Destaque (IGUAL ÀS CANECAS) */}
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
                    <span className="text-ghibli-moss font-medium text-sm">Criando a sua capa mágica...</span>
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
                      <span>Selecione o Modelo</span>
                    ) : (
                      <>
                        <span className="text-xl">📱</span>
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

              {/* Model Selector Mobile */}
              {product.variants && product.variants.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.75 }}
                  className="mb-4"
                >
                  <Card className="bg-white/90 backdrop-blur-sm border-ghibli-sand/40">
                    <CardContent className="p-4">
                      <label className="block text-sm font-bold text-ghibli-moss mb-3">
                        📱 Modelo do Telemóvel
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

              {/* Descrição e Garantias Mobile */}
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-ghibli-sand/30">
                <ul className="text-sm space-y-2 text-ghibli-earth/80">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                    <span>Capa de <span className="font-bold text-ghibli-moss">proteção premium</span> resistente</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                    <span>Impressão duradoura e <span className="font-bold">resistente ao desgaste</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-ghibli-wood rounded-full shrink-0"></div>
                    <span className="font-bold text-ghibli-wood">Proteção total com estilo único</span>
                    <span className="text-blue-500">📱</span>
                  </li>
                </ul>
              </div>

              {/* Compatibilidade Mobile */}
              <div className="bg-ghibli-cream/30 rounded-xl border border-ghibli-sand/40 p-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-ghibli-moss"></div>
                  <span className="text-ghibli-earth font-semibold">
                    📱 Múltiplos modelos disponíveis
                  </span>
                </div>
                <p className="text-center text-xs text-ghibli-earth/70 mt-1">
                  iPhone e Samsung Galaxy
                </p>
              </div>

              {/* Garantias Mobile */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-ghibli-cream/40 rounded-xl p-3 text-center border border-ghibli-sand/30">
                  <div className="w-6 h-6 mx-auto mb-1 rounded-full bg-ghibli-moss/10 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-ghibli-moss" />
                  </div>
                  <span className="text-xs font-bold text-ghibli-earth">Proteção Premium</span>
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
            {/* Breadcrumb - COMPONENTE GENÉRICO */}
            <ProductHeader product={product} />

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



              {/* ✅ CONTROLOS DESKTOP - COMPONENTE GENÉRICO */}
              <ProductPositionControls
                selectedImageUrl={selectedImageUrl}
                userImageDimensions={userImageDimensions}
                product={product}
                imagePosition={imagePosition}
                isGeneratingMockup={isGeneratingMockup}
                onOpenGallery={handleOpenGallery}
                onAdjustPosition={(position) => handleAdjustment('position', position)}
                positionType="horizontal"
                className="mt-6 px-4 lg:px-0"
              />
              
              {!userInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="mt-6 flex justify-center px-4 lg:px-0"
                >
                  <Card className="bg-ghibli-moss/10 border-ghibli-moss/30 backdrop-blur-sm w-full sm:max-w-md">
                    <CardContent className="p-4 text-center">
                      <p className="text-ghibli-earth text-sm mb-3 font-medium">
                        📱 Entre para personalizar a sua capa
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
                      📱 Capa Personalizada
                    </h1>
                    
                    {/* Preço principal */}
                    <div className="space-y-1">
                    <div className="inline-block">
                        <div className="text-2xl sm:text-3xl font-black text-ghibli-moss">
                          €{discountedPrice.toFixed(2)}
                      </div>
                        {discount > 0 && (
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <span className="line-through text-ghibli-earth/50">€25.00</span>
                            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                              -{discount}%
                            </span>
                      </div>
                        )}
                    </div>
                      
                      {/* Quantidade */}
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="w-8 h-8 p-0 border-ghibli-sand"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-16 text-center font-semibold text-ghibli-earth">
                          {quantity} {quantity === 1 ? 'capa' : 'capas'}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-8 h-8 p-0 border-ghibli-sand"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Total e poupança */}
                      {quantity > 1 && (
                        <div className="text-xs text-ghibli-earth/70 space-y-1">
                          <div>Total: <span className="font-bold text-ghibli-moss">€{totalPrice.toFixed(2)}</span></div>
                          {savings > 0 && (
                            <div className="text-green-600 font-medium">
                              Poupa €{savings.toFixed(2)}!
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Incentivo de desconto */}
                    {quantity === 1 && (
                      <div className="mt-2 text-xs text-ghibli-earth/60 bg-ghibli-cream/50 px-3 py-2 rounded-lg">
                        💡 <span className="font-medium">2+ capas:</span> 10% desconto • <span className="font-medium">3+ capas:</span> 15% desconto
                      </div>
                    )}
                  </div>

                  {/* 🎨 2. STATUS ARTE - COMPONENTE GENÉRICO */}
                  <ProductArtStatus
                    selectedImageUrl={selectedImageUrl}
                    onOpenGallery={handleOpenGallery}
                  />

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

                  {/* 📝 4. DESCRIÇÃO - COMPONENTE GENÉRICO */}
                  <ProductDescription
                    items={[
                      { text: "📱 <strong>Proteção premium</strong> para o seu telemóvel", color: 'moss' },
                      { text: "🎨 <strong>Impressão HD</strong> com qualidade superior", color: 'moss' },
                      { text: "💪 <strong>Material durável</strong> e resistente", color: 'moss' },
                      { text: "✨ <strong>Compatibilidade perfeita</strong> com o seu modelo", color: 'moss' }
                    ]}
                  />

                  {/* 🎯 5. SELETOR DE MODELO - COMPONENTE GENÉRICO */}
                  <ProductVariantSelector
                    product={product}
                    selectedVariantId={selectedPrintifyVariantId}
                    onVariantChange={setSelectedPrintifyVariantId}
                    label="Modelo do Telemóvel"
                    emoji="📱"
                  />

                  {/* 🛒 7. BOTÃO ADICIONAR AO CARRINHO - COMPONENTE GENÉRICO */}
                  <ProductAddToCartButton
                    onAddToCart={handleAddToCart}
                    loading={loading}
                    isProcessingMockup={isProcessingMockup}
                    canPurchase={canPurchase}
                    selectedImageUrl={selectedImageUrl}
                    selectedPrintifyVariantId={selectedPrintifyVariantId}
                    userInfo={userInfo}
                  />

                  {/* 🛡️ 8. GRID DE GARANTIAS - COMPONENTE GENÉRICO */}
                  <ProductGuarantees 
                    guarantees={[
                      {
                        icon: <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />,
                        title: 'Proteção Premium'
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
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
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