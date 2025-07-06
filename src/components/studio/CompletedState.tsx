import React from 'react';
import { Button } from '@/components/ui/button';
import { Style } from '../StyleSelectorModal';
import Image from 'next/image';
import { Download, AlertTriangle, Loader2, RefreshCw, ShoppingBag, ArrowRight } from 'lucide-react';
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
  const [mockupUrl, setMockupUrl] = React.useState<string>('');
  const [isGeneratingMockup, setIsGeneratingMockup] = React.useState(false);
  const [mockupError, setMockupError] = React.useState(false);
  
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
          selectedPrintifyVariantId: 92389, // Variante padrão 5" x 7"
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
        setMockupUrl(data.previewUrls[0]);
        console.log('✅ [CompletedState] Mockup gerado com sucesso:', data.previewUrls[0]);
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
    if (transformedImageUrl && userInfo?.id && !mockupUrl && !mockupError) {
      // Pequeno delay para garantir que a imagem está totalmente carregada
      const timer = setTimeout(() => {
        generatePosterMockup();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [transformedImageUrl, userInfo?.id, mockupUrl, mockupError, generatePosterMockup]);

  const handleGoToProduct = () => {
    const productUrl = `/shop/poster/poster_vertical_semi_glossy?imageUrl=${encodeURIComponent(transformedImageUrl)}&imageId=${transformationId || 'auto'}`;
    router.push(productUrl);
  };

  const handleRetryMockup = () => {
    setMockupError(false);
    setMockupUrl('');
    generatePosterMockup();
  };

  return (
    <div className="relative w-full h-full flex flex-col min-h-0">
      
      {/* Área da Imagem Transformada */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 min-h-0">
        <div className="w-full max-w-sm min-h-[280px] max-h-[350px] aspect-square relative rounded-xl shadow-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
          {imageError ? (
            <div className="absolute inset-0 w-full h-full bg-gray-200 flex flex-col items-center justify-center text-center text-sm text-gray-600 p-4">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <p className="font-medium mb-1">Erro ao carregar imagem</p>
              <p className="text-xs text-gray-500 break-all">{transformedImageUrl}</p>
            </div>
          ) : (
            <Image 
              key={transformedImageUrl}
              src={transformedImageUrl} 
              alt={`Imagem transformada no estilo ${selectedStyle.name}`} 
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
              onError={handleImageError}
              onLoad={() => {
                console.log('[CompletedState Image] Imagem carregada com sucesso:', transformedImageUrl);
                setImageError(false);
              }}
            />
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
              Ver no Produto
            </h3>
            <p className="text-sm text-ghibli-earth/70">Poster Vertical A4 Semi-Brilhante</p>
          </div>
          
          {/* Mockup do Produto */}
          <div className="aspect-[3/4] bg-white rounded-lg overflow-hidden border border-ghibli-sand/30 mb-3 max-w-[120px] mx-auto">
            {isGeneratingMockup ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-ghibli-moss">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-xs">A gerar...</p>
              </div>
            ) : mockupError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-ghibli-earth/60 p-2">
                <AlertTriangle className="w-5 h-5 mb-1" />
                <p className="text-xs text-center mb-2">Erro no mockup</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryMockup}
                  className="text-xs px-2 py-1 h-6"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : mockupUrl ? (
              <img 
                src={mockupUrl} 
                alt="Preview do poster" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <img
                  src="/mockupproduto/postervertical.png"
                  alt="Poster Vertical"
                  className="w-16 h-16 object-contain opacity-60"
                />
              </div>
            )}
          </div>
          
          {/* Botão Principal Destacado */}
          <Button 
            onClick={handleGoToProduct}
            className="w-full bg-ghibli-moss hover:bg-ghibli-moss/90 text-white py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={imageError}
          >
            <span className="flex items-center justify-center gap-2">
              Ver Produto - €20.00
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