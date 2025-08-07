import React from 'react';
import { Button } from '@/components/ui/button';
import { Style } from '../StyleSelectorModal';
import Image from 'next/image';
import { Loader2, RefreshCw, ShoppingBag, Grid3x3, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { getFakeDiscountInfo } from '@/lib/fakeDiscounts';
import { canvasConfig } from '@/config/products/canvas.config';
import { useCart } from '@/hooks/useCart';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CompletedStateProps {
  transformedImageUrl: string;
  selectedStyle: Style;
  onDownload: () => void;
  transformationId?: string; // Novo prop para o ID da transformação
  initialRating?: number; // Novo prop para o rating inicial
  onNewImage?: () => void; // Handler para nova imagem
}

const CompletedState: React.FC<CompletedStateProps> = ({
  transformedImageUrl,
  selectedStyle,
  onDownload,
  transformationId,
  initialRating,
  onNewImage,
}) => {
  const router = useRouter();
  const { userInfo } = useAuth();
  const { addToCart } = useCart();
  
  const [imageError, setImageError] = React.useState(false);
  const [isOtherProductsModalOpen, setIsOtherProductsModalOpen] = React.useState(false);
  const [canvasMockupUrls, setCanvasMockupUrls] = React.useState<string[]>([]);
  const [posterMockupUrls, setPosterMockupUrls] = React.useState<string[]>([]);
  const [mugMockupUrls, setMugMockupUrls] = React.useState<string[]>([]);
  const [isGeneratingCanvasMockup, setIsGeneratingCanvasMockup] = React.useState(false);
  const [isGeneratingPosterMockup, setIsGeneratingPosterMockup] = React.useState(false);
  const [isGeneratingMugMockup, setIsGeneratingMugMockup] = React.useState(false);
  const [canvasMockupError, setCanvasMockupError] = React.useState(false);
  const [posterMockupError, setPosterMockupError] = React.useState(false);
  const [mugMockupError, setMugMockupError] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0); // 0 = canvas, 1 = poster, 2 = caneca, 3 = original
  const [showProductCarousel, setShowProductCarousel] = React.useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('[CompletedState Image] Erro ao carregar a imagem:', e.currentTarget.src);
    console.error('[CompletedState Image] URL que falhou:', transformedImageUrl);
    setImageError(true);
    toast.error("Erro ao carregar a imagem final.");
  };

  // Função para gerar mockup do canvas
  const generateCanvasMockup = React.useCallback(async () => {
    if (!transformedImageUrl || !userInfo?.id || isGeneratingCanvasMockup) return;

    setIsGeneratingCanvasMockup(true);
    setCanvasMockupError(false);

    try {
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'custom_canvas',
          userImageUrl: transformedImageUrl,
          userId: userInfo.id,
          selectedPrintifyVariantId: 91659, // Canvas 16″ x 16″ (41cm x 41cm)
          // Não passar imageAdjustments - deixar a API calcular automaticamente para fill perfeito
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.previewUrls && data.previewUrls.length > 0) {
        setCanvasMockupUrls(data.previewUrls);
        // Mostrar carousel quando primeiro mockup estiver pronto
        setShowProductCarousel(true);
      } else {
        throw new Error(data.error || 'Falha ao gerar mockup do canvas');
      }
    } catch (error) {
      console.error('❌ [CompletedState] Erro ao gerar mockup do canvas:', error);
      setCanvasMockupError(true);
    } finally {
      setIsGeneratingCanvasMockup(false);
    }
  }, [transformedImageUrl, userInfo?.id, isGeneratingCanvasMockup]);

  // Função para gerar mockup do poster
  const generatePosterMockup = React.useCallback(async () => {
    if (!transformedImageUrl || !userInfo?.id || isGeneratingPosterMockup) return;

    setIsGeneratingPosterMockup(true);
    setPosterMockupError(false);

    try {
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'poster_vertical_semi_glossy',
          userImageUrl: transformedImageUrl,
          userId: userInfo.id,
          selectedPrintifyVariantId: 92407, // Poster 24" x 36" (61,0 x 91,4 cm) = ~60,96x91,44cm
          // Não passar imageAdjustments - deixar a API calcular automaticamente para fill perfeito
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.previewUrls && data.previewUrls.length > 0) {
        setPosterMockupUrls(data.previewUrls);
        // Mostrar carousel quando primeiro mockup estiver pronto (se ainda não estiver visível)
        if (!showProductCarousel) {
        setShowProductCarousel(true);
        }
      } else {
        throw new Error(data.error || 'Falha ao gerar mockup do poster');
      }
    } catch (error) {
      console.error('❌ [CompletedState] Erro ao gerar mockup do poster:', error);
      setPosterMockupError(true);
    } finally {
      setIsGeneratingPosterMockup(false);
    }
  }, [transformedImageUrl, userInfo?.id, isGeneratingPosterMockup, showProductCarousel]);

  // Função para gerar mockup da caneca
  const generateMugMockup = React.useCallback(async () => {
    if (!transformedImageUrl || !userInfo?.id || isGeneratingMugMockup) return;

    setIsGeneratingMugMockup(true);
    setMugMockupError(false);

    try {
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'heart_mug',
          userImageUrl: transformedImageUrl,
          userId: userInfo.id,
          selectedPrintifyVariantId: 77224, // Caneca Heart / White
          // Não passar imageAdjustments - deixar a API calcular automaticamente para fill perfeito
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.previewUrls && data.previewUrls.length > 0) {
        setMugMockupUrls(data.previewUrls);
        // Mostrar carousel quando primeiro mockup estiver pronto (se ainda não estiver visível)
        if (!showProductCarousel) {
          setShowProductCarousel(true);
        }
      } else {
        throw new Error(data.error || 'Falha ao gerar mockup da caneca');
      }
    } catch (error) {
      console.error('❌ [CompletedState] Erro ao gerar mockup da caneca:', error);
      setMugMockupError(true);
    } finally {
      setIsGeneratingMugMockup(false);
    }
  }, [transformedImageUrl, userInfo?.id, isGeneratingMugMockup, showProductCarousel]);

  // Gerar mockups automaticamente em background (VERDADEIRAMENTE EM PARALELO)
  React.useEffect(() => {
    if (transformedImageUrl && userInfo?.id) {
      // 🚀 GERAÇÃO PARALELA REAL - todos os produtos geram simultaneamente
      // ✅ JÁ OTIMIZADO: Não há sequencialidade aqui - todas as funções são chamadas
      // imediatamente se as suas condições estiverem corretas
      
      // Gerar canvas imediatamente
      if (canvasMockupUrls.length === 0 && !canvasMockupError && !isGeneratingCanvasMockup) {
        generateCanvasMockup();
      }
      
      // Gerar poster imediatamente
      if (posterMockupUrls.length === 0 && !posterMockupError && !isGeneratingPosterMockup) {
        generatePosterMockup();
      }
      
      // Gerar caneca IMEDIATAMENTE (sem delay artificial)
      if (mugMockupUrls.length === 0 && !mugMockupError && !isGeneratingMugMockup) {
        generateMugMockup();
      }
    }
  }, [transformedImageUrl, userInfo?.id, canvasMockupUrls.length, posterMockupUrls.length, mugMockupUrls.length, canvasMockupError, posterMockupError, mugMockupError, isGeneratingCanvasMockup, isGeneratingPosterMockup, isGeneratingMugMockup, generateCanvasMockup, generatePosterMockup, generateMugMockup]);

  // Função para comprar Canvas diretamente
  const handleBuyCanvasDirect = async () => {
    if (!userInfo?.id) {
      toast.error('Faça login para adicionar ao carrinho!');
      return;
    }

    try {
      // Configuração do Canvas 16x16 (variante padrão)
      const canvasVariantId = 91659; // Canvas 16x16 sem moldura
      const canvasProduct = {
        id: 'custom_canvas',
        name: 'Canvas Personalizado 16x16',
        category: 'canvas'
      };

      // Calcular preço com desconto fake - usar preço real para Canvas 12x12
      const realPrice = 36.95; // Preço real Canvas 12x12 após desconto fake de 40%

      await addToCart({
        productId: 'custom_canvas',
        productName: 'Canvas Personalizado 12x12',
        productCategory: 'canvas',
        userImageUrl: transformedImageUrl,
        userImageId: transformationId || 'auto',
        price: realPrice,
        quantity: 1,
        customizations: {
          variantId: canvasVariantId, // 91657 = Canvas 12x12
          scale: 1.05, // Scale padrão do Canvas (com efeito fill)
          x: 0.5,
          y: 0.5,
          angle: 0,
          position: 'center',
          print_on_side: 'mirror' // Borda espelhada padrão do Canvas
        }
      });

      toast.success('Canvas adicionado ao carrinho! 🎨');
    } catch (error) {
      toast.error('Erro ao adicionar ao carrinho');
      console.error('Erro ao comprar Canvas:', error);
    }
  };

  const handleGoToProduct = () => {
    let productUrl = '';
    
    if (currentImageIndex === 0) {
      // Canvas 16x16
      productUrl = `/shop/canvas/custom_canvas?imageUrl=${encodeURIComponent(transformedImageUrl)}&imageId=${transformationId || 'auto'}&fromTransformation=true`;
    } else if (currentImageIndex === 1) {
      // Poster
      productUrl = `/shop/poster/poster_vertical_semi_glossy?imageUrl=${encodeURIComponent(transformedImageUrl)}&imageId=${transformationId || 'auto'}&fromTransformation=true`;
    } else if (currentImageIndex === 2) {
      // Caneca Coração
      productUrl = `/shop/mug/heart_mug?imageUrl=${encodeURIComponent(transformedImageUrl)}&imageId=${transformationId || 'auto'}&fromTransformation=true`;
    } else {
      // Imagem original - vai para poster por padrão
      productUrl = `/shop/poster/poster_vertical_semi_glossy?imageUrl=${encodeURIComponent(transformedImageUrl)}&imageId=${transformationId || 'auto'}&fromTransformation=true`;
    }
    
    router.push(productUrl);
  };

  const handleRetryCanvasMockup = () => {
    setCanvasMockupError(false);
    setCanvasMockupUrls([]);
    generateCanvasMockup();
  };

  const handleRetryPosterMockup = () => {
    setPosterMockupError(false);
    setPosterMockupUrls([]);
    generatePosterMockup();
  };

  const handleRetryMugMockup = () => {
    setMugMockupError(false);
    setMugMockupUrls([]);
    generateMugMockup();
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % 4); // 0 → 1 → 2 → 3 → 0
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + 4) % 4); // 0 → 3 → 2 → 1 → 0
  };

  // Determinar qual imagem mostrar
  const getCurrentImage = () => {
    if (currentImageIndex === 0) {
      // Mostrar mockup do canvas (usar a 3ª imagem - previewUrls[2])
      if (canvasMockupUrls.length > 2) {
        return { url: canvasMockupUrls[2], type: 'canvas' }; // Posição 2 = 3ª imagem como pedido
      } else if (canvasMockupUrls.length > 0) {
        return { url: canvasMockupUrls[0], type: 'canvas' }; // Fallback para primeira se não houver 3
      }
      // Se não tem mockup, mostrar imagem original temporariamente
      return { url: transformedImageUrl, type: 'original' };
    } else if (currentImageIndex === 1) {
      // Mostrar mockup do poster (usar a 4ª imagem - previewUrls[3])
      if (posterMockupUrls.length > 3) {
        return { url: posterMockupUrls[3], type: 'poster' }; // Posição 3 = 4ª imagem das 5 que o Printify disponibiliza
      } else if (posterMockupUrls.length > 0) {
        return { url: posterMockupUrls[0], type: 'poster' }; // Fallback para primeira se não houver 4
      }
      // Se não tem mockup, mostrar imagem original temporariamente
      return { url: transformedImageUrl, type: 'original' };
    } else if (currentImageIndex === 2) {
      // Mostrar mockup da caneca (usar a 3ª imagem - previewUrls[2])
      if (mugMockupUrls.length > 2) {
        return { url: mugMockupUrls[2], type: 'mug' };
      } else if (mugMockupUrls.length > 0) {
        return { url: mugMockupUrls[0], type: 'mug' }; // Fallback para primeira se não houver 3
      }
      // Se não tem mockup, mostrar imagem original temporariamente
      return { url: transformedImageUrl, type: 'original' };
    } else {
      // Mostrar imagem original
      return { url: transformedImageUrl, type: 'original' };
    }
  };

  const currentImage = getCurrentImage();

  // Determinar texto do produto
  const getProductText = () => {
    if (currentImageIndex === 0) {
      if (isGeneratingCanvasMockup) {
        return 'Canvas (a gerar...)';
      }
      return 'Canvas';
    } else if (currentImageIndex === 1) {
      if (isGeneratingPosterMockup) {
        return 'Poster Vertical (a gerar...)';
      }
      return 'Poster Vertical';
    } else if (currentImageIndex === 2) {
      if (isGeneratingMugMockup) {
        return 'Caneca Coração (a gerar...)';
      }
      return 'Caneca Coração';
    } else {
      return 'Poster Vertical'; // Default para imagem original
    }
  };

  // Determinar se deve mostrar loading (sempre false para não interromper fluxo)
  const isCurrentlyLoading = () => {
    // Nunca mostrar loading - mockups geram em background
    return false;
  };

  // Determinar se há erro
  const hasCurrentError = () => {
    if (currentImageIndex === 0) {
      return canvasMockupError;
    } else if (currentImageIndex === 1) {
      return posterMockupError;
    } else if (currentImageIndex === 2) {
      return mugMockupError;
    } else if (currentImageIndex === 3) {
      return imageError;
    }
    return false;
  };

  // Função de retry apropriada
  const handleRetryCurrentMockup = () => {
    if (currentImageIndex === 0) {
      handleRetryCanvasMockup();
    } else if (currentImageIndex === 1) {
      handleRetryPosterMockup();
    } else if (currentImageIndex === 2) {
      handleRetryMugMockup();
    }
  };

  // Calcular preços do Canvas para showcase
  const canvasVariantId = 91657; // Canvas 12x12 (30cm x 30cm) sem moldura
  const realPrice = 36.95; // Preço real Canvas 12x12 após desconto fake de 40%
  const fakeDiscountInfo = getFakeDiscountInfo('custom_canvas', realPrice);

  // Lista de outros produtos para o modal
  const otherProducts = [
    {
      id: 'poster_vertical',
      name: 'Poster Vertical',
      image: '/mockupproduto/postervertical.png',
      url: `/shop/poster/poster_vertical_semi_glossy?imageUrl=${encodeURIComponent(transformedImageUrl)}&imageId=${transformationId || 'auto'}&fromTransformation=true`
    },
    {
      id: 'poster_horizontal', 
      name: 'Poster Horizontal',
      image: '/mockupproduto/posterhorizontal.png',
      url: `/shop/poster/poster_horizontal_semi_glossy?imageUrl=${encodeURIComponent(transformedImageUrl)}&imageId=${transformationId || 'auto'}&fromTransformation=true`
    },
    {
      id: 'heart_mug',
      name: 'Caneca Coração',
      image: '/mockupproduto/canecacoracao.png',
      url: `/shop/mug/heart_mug?imageUrl=${encodeURIComponent(transformedImageUrl)}&imageId=${transformationId || 'auto'}&fromTransformation=true`
    },
    {
      id: 'notebook',
      name: 'Caderno',
      image: '/mockupproduto/caderno.png',
      url: `/shop/escritorio/notebook?imageUrl=${encodeURIComponent(transformedImageUrl)}&imageId=${transformationId || 'auto'}&fromTransformation=true`
    }
  ];

  return (
    <div className="relative w-full h-full flex flex-col min-h-0">
      
      {/* NOVO: Canvas Showcase - 3 Mockups + Preço + Comprar */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 min-h-0">
        <div className="w-full max-w-lg">
          {!showProductCarousel ? (
            <div className="bg-gray-100 rounded-xl p-6 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-ghibli-moss" />
              <p className="font-medium mb-1 text-ghibli-moss">A finalizar...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
              
              {/* Header com título */}
              <div className="bg-gradient-to-r from-ghibli-moss/10 to-ghibli-sky/10 p-4 border-b border-gray-100">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-ghibli-wood mb-1">
                    🎨 Canvas Personalizado
                  </h3>
                  <p className="text-sm text-ghibli-earth/70">
                    Transformação: {selectedStyle.name}
                  </p>
                  {/* Oferta limitada - discreto */}
                  <div className="mt-2">
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      ⏰ Oferta limitada
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Mockups do Canvas em grid */}
              <div className="p-4">
                {canvasMockupUrls.length >= 3 ? (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {canvasMockupUrls.slice(0, 3).map((url, index) => (
                      <div key={index} className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={url}
                          alt={`Canvas mockup ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 30vw, 20vw"
                        />
                      </div>
                    ))}
                  </div>
                ) : isGeneratingCanvasMockup ? (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-ghibli-moss" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 mb-4 text-center">
                    <p className="text-sm text-gray-600">A gerar mockups do Canvas...</p>
                  </div>
                )}

                {/* Preços com desconto fake */}
                {fakeDiscountInfo && (
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-lg text-green-600 line-through">
                        €{fakeDiscountInfo.fakePrice.toFixed(2)}
                      </span>
                      <span className="text-xl font-bold text-red-600">
                        €{fakeDiscountInfo.realPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="inline-block bg-red-100 text-red-800 text-sm font-semibold px-2 py-1 rounded-full">
                      {fakeDiscountInfo.badge}
                    </div>
                  </div>
                )}

                {/* Botão Comprar Canvas + Ver Produto */}
                <div className="space-y-2">
                  <Button
                    onClick={handleBuyCanvasDirect}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 font-bold text-base rounded-lg shadow-lg"
                    disabled={!userInfo || imageError}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Comprar Canvas 12x12
                  </Button>
                  
                  <Button
                    onClick={() => router.push(`/shop/canvas/custom_canvas?imageUrl=${encodeURIComponent(transformedImageUrl)}&imageId=${transformationId || 'auto'}&fromTransformation=true`)}
                    variant="outline"
                    className="w-full py-2 text-sm"
                  >
                    Ver Página do Produto
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* NOVO: Botões de Ação - Outros Produtos + Nova Imagem */}
      {showProductCarousel && (
        <div className="px-4 pb-4 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              onClick={() => setIsOtherProductsModalOpen(true)}
              className="py-3 text-sm font-medium"
            >
              <Grid3x3 className="w-4 h-4 mr-2" /> 
              Outros Produtos
            </Button>
            <Button 
              variant="outline"
              onClick={onNewImage || (() => window.location.reload())}
              className="py-3 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> 
              Nova Imagem
            </Button>
          </div>
        </div>
      )}

      {/* NOVO: Modal Outros Produtos */}
      <Dialog open={isOtherProductsModalOpen} onOpenChange={setIsOtherProductsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Outros Produtos Disponíveis</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 p-2">
            {otherProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  router.push(product.url);
                  setIsOtherProductsModalOpen(false);
                }}
                className="group relative bg-white border border-gray-200 rounded-lg p-3 hover:border-ghibli-moss hover:shadow-md transition-all duration-200"
              >
                <div className="aspect-square relative rounded-md overflow-hidden mb-2">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 768px) 40vw, 20vw"
                  />
                </div>
                <p className="text-sm font-medium text-center text-ghibli-earth group-hover:text-ghibli-moss">
                  {product.name}
                </p>
              </button>
            ))}
          </div>
          
          <div className="text-center pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOtherProductsModalOpen(false)}
              size="sm"
            >
              <X className="w-4 h-4 mr-1" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompletedState;