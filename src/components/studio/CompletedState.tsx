import React from 'react';
import { Button } from '@/components/ui/button';
import { Style } from '../StyleSelectorModal';
import Image from 'next/image';
import { Download, AlertTriangle, Loader2, RefreshCw, ShoppingBag, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';

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
  const [imageError, setImageError] = React.useState(false);
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
  
  const { userInfo } = useAuth();
  const router = useRouter();

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

  return (
    <div className="relative w-full h-full flex flex-col min-h-0">
      
      {/* Área da Imagem Principal - Carrossel de 4 imagens (só aparece quando showProductCarousel for true) */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 min-h-0">
        <div className="w-full max-w-sm min-h-[280px] max-h-[350px] aspect-square relative rounded-xl shadow-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
          {!showProductCarousel ? (
            // Mostrar loading até pelo menos 1 mockup estar pronto - NUNCA mostrar imagem transformada sozinha
            <div className="absolute inset-0 w-full h-full bg-gray-100 flex flex-col items-center justify-center text-center text-sm text-ghibli-moss p-4">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p className="font-medium mb-1">A finalizar...</p>
            </div>
          ) : isCurrentlyLoading() ? (
            <div className="absolute inset-0 w-full h-full bg-gray-100 flex flex-col items-center justify-center text-center text-sm text-ghibli-moss p-4">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p className="font-medium mb-1">A finalizar...</p>
            </div>
          ) : hasCurrentError() ? (
            <div className="absolute inset-0 w-full h-full bg-gray-200 flex flex-col items-center justify-center text-center text-sm text-gray-600 p-4">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <p className="font-medium mb-1">
                {currentImageIndex === 3 ? 'Erro ao carregar imagem' : 'Erro no mockup'}
              </p>
              {currentImageIndex !== 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryCurrentMockup}
                  className="text-xs mt-2"
                >
                  Tentar novamente
                </Button>
              )}
            </div>
          ) : currentImage ? (
            <div className="relative w-full h-full">
            <Image 
                key={`${currentImage.url}-${currentImageIndex}`}
                src={currentImage.url} 
                alt={
                  currentImage.type === 'poster' ? 'Preview do poster' :
                  currentImage.type === 'mug' ? 'Preview da caneca' :
                  currentImage.type === 'notebook' ? 'Preview do caderno' :
                  `Imagem transformada no estilo ${selectedStyle.name}`
                } 
              fill
              sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 30vw"
              style={{ 
                objectFit: "contain",
                width: "100%",
                height: "100%" 
              }}
              className="bg-gray-100"
              priority
              unoptimized={true}
                onError={currentImage.type === 'original' ? handleImageError : undefined}
              onLoad={() => {
                  if (currentImage.type === 'original') {
                setImageError(false);
                  }
              }}
            />
              
              {/* Setas de Navegação */}
              <>
                {/* Seta Esquerda */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 border border-gray-200"
                  title="Produto anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-ghibli-moss" />
                </button>
                
                {/* Seta Direita */}
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 border border-gray-200"
                  title="Próximo produto"
                >
                  <ChevronRight className="w-4 h-4 text-ghibli-moss" />
                </button>
              </>
              
              {/* Indicador do tipo de imagem - melhorado */}
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
                {currentImage.type === 'poster' ? 'Poster' : 
                 currentImage.type === 'mug' ? 'Caneca' : 
                 currentImage.type === 'notebook' ? 'Caderno' : 'Original'}
              </div>
              
              {/* Indicador de posição no carrossel - melhorado */}
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
                {currentImageIndex + 1}/4
              </div>
              
              {/* Indicador de loading discreto quando gerando mockup */}
              {((currentImageIndex === 0 && isGeneratingCanvasMockup) || 
                (currentImageIndex === 1 && isGeneratingPosterMockup) ||
                (currentImageIndex === 2 && isGeneratingMugMockup)) && (
                <div className="absolute top-2 right-2 bg-ghibli-moss/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  A gerar...
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-center text-ghibli-earth/60">
                <p className="text-sm">A preparar preview...</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Informações do Resultado - só aparece quando showProductCarousel for true */}
      {showProductCarousel && (
        <div className="px-4 pt-2 pb-3 flex-shrink-0 border-t border-gray-200">
          <div className="text-center">
            <p className="text-lg font-medium text-ghibli-wood">
              Transformação concluída!
            </p>
            <p className="text-sm text-muted-foreground">
              Estilo: {selectedStyle.name}
            </p>
          </div>
        </div>
      )}

      {/* Seção do Produto em Destaque - só aparece quando showProductCarousel for true */}
      {showProductCarousel && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="bg-gradient-to-r from-ghibli-moss/5 to-ghibli-sky/5 rounded-xl p-4 border border-ghibli-moss/20">
            <div className="text-center mb-3">
              <h3 className="font-semibold text-ghibli-wood flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Produto Recomendado
              </h3>
              <p className="text-sm text-ghibli-earth/70">{getProductText()}</p>
            </div>
            
            {/* Botão Principal Destacado */}
            <Button 
              onClick={handleGoToProduct}
              className="w-full bg-ghibli-moss hover:bg-ghibli-moss/90 text-white py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={imageError}
            >
              <span className="flex items-center justify-center gap-2">
                Ver Produto
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Botões Secundários - só aparece quando showProductCarousel for true */}
      {showProductCarousel && (
        <div className="px-4 pb-4 flex-shrink-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
          <Button 
              variant="outline"
            onClick={onDownload}
              className="py-2 text-sm"
            disabled={imageError}
          >
              <Download className="w-4 h-4 mr-2" /> 
              Original
            </Button>
            <Button 
              variant="outline"
              onClick={onNewImage || (() => window.location.reload())}
              className="py-2 text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> 
              Nova Imagem
          </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedState;