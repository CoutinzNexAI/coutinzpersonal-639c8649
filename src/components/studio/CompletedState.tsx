import React from 'react';
import { Button } from '@/components/ui/button';
import { Style } from '../StyleSelectorModal';
import Image from 'next/image';
import { Download, AlertTriangle, Loader2, RefreshCw, ShoppingBag, ArrowRight, ChevronRight } from 'lucide-react';
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
  const [mockupUrls, setMockupUrls] = React.useState<string[]>([]);
  const [isGeneratingMockup, setIsGeneratingMockup] = React.useState(false);
  const [mockupError, setMockupError] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0); // 0 = mockup, 1 = original
  
  const { userInfo } = useAuth();
  const router = useRouter();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('[CompletedState Image] Erro ao carregar a imagem:', e.currentTarget.src);
    console.error('[CompletedState Image] URL que falhou:', transformedImageUrl);
    setImageError(true);
    toast.error("Erro ao carregar a imagem final.");
  };

  // Função para gerar mockup automaticamente
  const generatePosterMockup = React.useCallback(async () => {
    if (!transformedImageUrl || !userInfo?.id || isGeneratingMockup) return;

    console.log('🎯 [CompletedState] Iniciando geração automática de mockup do poster');
    setIsGeneratingMockup(true);
    setMockupError(false);

    try {
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'poster_vertical_semi_glossy',
          userImageUrl: transformedImageUrl,
          userId: userInfo.id,
          selectedPrintifyVariantId: 101836, // Poster 16" x 24" (40,6 x 61,0 cm)
          // Usar as mesmas especificações do poster para fill sem espaços
          imageAdjustments: {
            x: 0.5,
            y: 0.5,
            scale: 1.05, // Fill para cobrir toda a área
            rotation: 0
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.previewUrls && data.previewUrls.length > 0) {
        setMockupUrls(data.previewUrls);
        console.log('✅ [CompletedState] Mockup gerado com sucesso:', data.previewUrls);
      } else {
        throw new Error(data.error || 'Falha ao gerar mockup');
      }
    } catch (error) {
      console.error('❌ [CompletedState] Erro ao gerar mockup:', error);
      setMockupError(true);
      // Não mostrar toast de erro para não incomodar o user
    } finally {
      setIsGeneratingMockup(false);
    }
  }, [transformedImageUrl, userInfo?.id, isGeneratingMockup]);

  // Gerar mockup automaticamente quando a imagem estiver pronta
  React.useEffect(() => {
    if (transformedImageUrl && userInfo?.id && mockupUrls.length === 0 && !mockupError) {
      // Pequeno delay para garantir que a imagem está totalmente carregada
      const timer = setTimeout(() => {
        generatePosterMockup();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [transformedImageUrl, userInfo?.id, mockupUrls.length, mockupError, generatePosterMockup]);

  const handleGoToProduct = () => {
    const productUrl = `/shop/poster/poster_vertical_semi_glossy?imageUrl=${encodeURIComponent(transformedImageUrl)}&imageId=${transformationId || 'auto'}&fromTransformation=true`;
    router.push(productUrl);
  };

  const handleRetryMockup = () => {
    setMockupError(false);
    setMockupUrls([]);
    generatePosterMockup();
  };

  const handleNextImage = () => {
    setCurrentImageIndex(currentImageIndex === 0 ? 1 : 0);
  };

  // Determinar qual imagem mostrar
  const getCurrentImage = () => {
    if (currentImageIndex === 0) {
      // Mostrar mockup (usar a 4ª imagem se disponível, senão a primeira)
      if (mockupUrls.length > 3) {
        return { url: mockupUrls[3], type: 'mockup' };
      } else if (mockupUrls.length > 0) {
        return { url: mockupUrls[0], type: 'mockup' };
      }
      return null;
    } else {
      // Mostrar imagem original
      return { url: transformedImageUrl, type: 'original' };
    }
  };

  const currentImage = getCurrentImage();

  return (
    <div className="relative w-full h-full flex flex-col min-h-0">
      
      {/* Área da Imagem Principal - Mockup ou Original */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 min-h-0">
        <div className="w-full max-w-sm min-h-[280px] max-h-[350px] aspect-square relative rounded-xl shadow-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
          {isGeneratingMockup && currentImageIndex === 0 ? (
            <div className="absolute inset-0 w-full h-full bg-gray-100 flex flex-col items-center justify-center text-center text-sm text-ghibli-moss p-4">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p className="font-medium mb-1">A gerar mockup...</p>
              <p className="text-xs text-ghibli-earth/70">~5 segundos</p>
            </div>
          ) : mockupError && currentImageIndex === 0 ? (
            <div className="absolute inset-0 w-full h-full bg-gray-200 flex flex-col items-center justify-center text-center text-sm text-gray-600 p-4">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <p className="font-medium mb-1">Erro no mockup</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryMockup}
                className="text-xs mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          ) : imageError && currentImageIndex === 1 ? (
            <div className="absolute inset-0 w-full h-full bg-gray-200 flex flex-col items-center justify-center text-center text-sm text-gray-600 p-4">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <p className="font-medium mb-1">Erro ao carregar imagem</p>
              <p className="text-xs text-gray-500 break-all">{transformedImageUrl}</p>
            </div>
          ) : currentImage ? (
            <div className="relative w-full h-full">
              <Image 
                key={`${currentImage.url}-${currentImageIndex}`}
                src={currentImage.url} 
                alt={currentImage.type === 'mockup' ? 'Preview do poster' : `Imagem transformada no estilo ${selectedStyle.name}`} 
                fill
                sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 30vw"
                style={{ 
                  objectFit: currentImage.type === 'mockup' ? "contain" : "contain",
                  width: "100%",
                  height: "100%" 
                }}
                className="bg-gray-100"
                priority
                unoptimized={true}
                onError={currentImage.type === 'original' ? handleImageError : undefined}
                onLoad={() => {
                  console.log('[CompletedState Image] Imagem carregada com sucesso:', currentImage.url);
                  if (currentImage.type === 'original') {
                    setImageError(false);
                  }
                }}
              />
              
              {/* Seta de Navegação - apenas mostrar se temos mockup */}
              {mockupUrls.length > 0 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 border border-gray-200"
                  title={currentImageIndex === 0 ? "Ver imagem original" : "Ver no produto"}
                >
                  <ChevronRight className="w-4 h-4 text-ghibli-moss" />
                </button>
              )}
              
              {/* Indicador do tipo de imagem */}
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {currentImage.type === 'mockup' ? 'No Produto' : 'Imagem Original'}
              </div>
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
      
      {/* Informações do Resultado */}
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

      {/* Seção do Produto em Destaque */}
      <div className="px-4 pb-2 flex-shrink-0">
        <div className="bg-gradient-to-r from-ghibli-moss/5 to-ghibli-sky/5 rounded-xl p-4 border border-ghibli-moss/20">
          <div className="text-center mb-3">
            <h3 className="font-semibold text-ghibli-wood flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Produto Recomendado
            </h3>
            <p className="text-sm text-ghibli-earth/70">Poster Vertical 16" x 24" - €35.00</p>
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

      {/* Botões Secundários */}
      <div className="px-4 pb-4 flex-shrink-0 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline"
            onClick={onDownload}
            className="py-2 text-sm"
            disabled={imageError}
          >
            <Download className="w-4 h-4 mr-2" /> 
            Baixar
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
    </div>
  );
};

export default CompletedState;