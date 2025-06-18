import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Sparkles, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface ImageAdjustments {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  cropArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ProductCanvasProps {
  selectedProduct: PrintifyProductMapping;
  userImageUrl?: string;
  userId?: string;
  printifyGeneratedPreviewUrls?: string[];
  onPreviewReady: (data: {
    previewUrls: string[];
    printifyImageId: string;
    printifyProductId: string;
  }) => void;
  onSelectImage?: () => void;
  imageAdjustments?: ImageAdjustments;
  onImageAdjust?: (adjustments: ImageAdjustments) => void;
  selectedPrintifyVariantId?: number | null;
}

interface GenerateMockupResponse {
  success: boolean;
  previewUrls?: string[];
  printifyImageId?: string;
  printifyProductId?: string;
  error?: string;
  details?: string;
}

export default function ProductCanvas({
  selectedProduct,
  userImageUrl,
  userId,
  printifyGeneratedPreviewUrls = [],
  onPreviewReady,
  onSelectImage,
  imageAdjustments,
  onImageAdjust,
  selectedPrintifyVariantId
}: ProductCanvasProps) {
  const [isLoadingMockups, setIsLoadingMockups] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  // Reset hasGenerated when userImageUrl OR selectedPrintifyVariantId changes
  useEffect(() => {
    setHasGenerated(false);
    setCurrentPreviewIndex(0); // Reset index quando mudamos
    // Clear existing preview URLs when image/variant changes
    if (onPreviewReady) {
      onPreviewReady({ previewUrls: [], printifyImageId: '', printifyProductId: '' });
    }
  }, [userImageUrl, selectedPrintifyVariantId, onPreviewReady]);

  // Preload images for instant navigation
  useEffect(() => {
    if (printifyGeneratedPreviewUrls.length > 0) {
      printifyGeneratedPreviewUrls.forEach(url => {
        if (!preloadedImages.has(url)) {
          const img = new Image();
          img.onload = () => {
            setPreloadedImages(prev => new Set([...prev, url]));
          };
          img.src = url;
        }
      });
    }
  }, [printifyGeneratedPreviewUrls, preloadedImages]);

  const handleGenerateMockup = useCallback(async () => {
    if (!userImageUrl || !userId || isLoadingMockups) return;

    setIsLoadingMockups(true);
    setError(null);

    try {
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          userImageUrl: userImageUrl,
          userId: userId,
          imageAdjustments: selectedProduct.supportsManualAdjustment ? imageAdjustments : undefined,
          selectedPrintifyVariantId: selectedPrintifyVariantId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenerateMockupResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate mockup');
      }

      if (data.previewUrls && data.printifyImageId && data.printifyProductId) {
        onPreviewReady({
          previewUrls: data.previewUrls,
          printifyImageId: data.printifyImageId,
          printifyProductId: data.printifyProductId,
        });
        setHasGenerated(true);
      }
    } catch (err) {
      console.error('Error generating mockup:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoadingMockups(false);
    }
  }, [userImageUrl, userId, isLoadingMockups, selectedProduct, imageAdjustments, selectedPrintifyVariantId, onPreviewReady]);

  // Auto-generate mockup when component mounts (if not already generated)
  useEffect(() => {
    // Para capas de telemóvel, só gera se uma variante foi selecionada
    const shouldGenerate = selectedProduct.id === 'custom_phone_case' 
      ? (userImageUrl && userId && selectedProduct && selectedPrintifyVariantId)
      : (userImageUrl && userId && selectedProduct);

    if (!hasGenerated && shouldGenerate) {
      handleGenerateMockup();
    }
  }, [userImageUrl, userId, selectedProduct, selectedPrintifyVariantId, hasGenerated, handleGenerateMockup]);

  // NAVEGAÇÃO INSTANTÂNEA SEM DELAYS
  const handlePreviousPreview = useCallback(() => {
    setCurrentPreviewIndex((prev) => 
      prev === 0 ? printifyGeneratedPreviewUrls.length - 1 : prev - 1
    );
  }, [printifyGeneratedPreviewUrls.length]);

  const handleNextPreview = useCallback(() => {
    setCurrentPreviewIndex((prev) => 
      prev === printifyGeneratedPreviewUrls.length - 1 ? 0 : prev + 1
    );
  }, [printifyGeneratedPreviewUrls.length]);

  const handleDirectNavigation = useCallback((index: number) => {
    setCurrentPreviewIndex(index);
  }, []);

  // Estado inicial - sem imagem selecionada - MAXIMIZADO SEM MODAL
  const renderEmptyState = () => {
    // Para capas de telemóvel, mostrar o mockup inicial maximizado
    if (selectedProduct.id === 'custom_phone_case') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Mockup inicial da capa - MAXIMIZADO */}
          <div className="relative w-full h-full flex items-center justify-center p-12">
            <img
              src={selectedProduct.mockupInitialPath}
              alt={`${selectedProduct.name} mockup inicial`}
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
              style={{ maxHeight: '85%' }} // Otimização visual
            />
            
            {/* Texto sutil no canto */}
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
              <p className="text-sm text-ghibli-earth/80 font-medium">
                {selectedProduct.name}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Para outros produtos, mostrar estado vazio tradicional
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
        {/* Placeholder image */}
        <div className="mb-6">
          <img
            src="/fotocanva.png"
            alt="Escolha uma foto para personalizar"
            className="w-48 h-48 object-contain opacity-60"
          />
        </div>
        
        {/* Call to action */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Personalize o seu {selectedProduct.name}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md">
            Escolha uma das suas transformações AI para ver como ficará no produto
          </p>
        </div>
      </div>
    );
  };

  // Overlay de carregamento COMPLETAMENTE OPACO
  const renderLoadingOverlay = () => (
    <div className="absolute inset-0 bg-white/98 backdrop-blur-md flex flex-col items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-sm mx-4 border border-ghibli-sand/20">
        <div className="relative mb-6">
          <Loader2 className="w-14 h-14 text-ghibli-moss animate-spin" />
          <Sparkles className="w-6 h-6 text-ghibli-moss absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-ghibli-earth mb-3">A gerar mockups...</h3>
        <p className="text-sm text-ghibli-earth/70 text-center leading-relaxed">
          Estamos a criar uma pré-visualização personalizada do seu produto. 
          Isto pode demorar alguns segundos.
        </p>
      </div>
    </div>
  );

  const renderInitialPreview = () => (
    <div className="relative w-full h-full">
      {userImageUrl ? (
        // Mostrar a arte do utilizador na área de preview enquanto gera
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
          <img
            src={userImageUrl}
            alt="Arte selecionada"
            className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
            style={{ maxHeight: '85%' }}
          />
          
          {/* Badge informativo */}
          <div className="absolute top-6 right-6">
            <Badge className="bg-ghibli-moss text-white shadow-lg">
              Arte Selecionada
            </Badge>
          </div>
        </div>
      ) : (
        renderEmptyState()
      )}
      
      {/* Overlay de loading se estiver a gerar */}
      {isLoadingMockups && renderLoadingOverlay()}
    </div>
  );

  const renderGeneratedPreviews = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Imagem principal do mockup - OTIMIZADA */}
      <div className="w-full h-full flex items-center justify-center p-6">
        <img
          src={printifyGeneratedPreviewUrls[currentPreviewIndex]}
          alt={`${selectedProduct.name} personalizada - Vista ${currentPreviewIndex + 1}`}
          className="max-w-full max-h-full object-contain drop-shadow-2xl transition-opacity duration-200"
          style={{ maxHeight: '90%' }}
          loading="eager" // Carregamento prioritário
        />
      </div>

      {/* Navegação entre previews - OTIMIZADA */}
      {printifyGeneratedPreviewUrls.length > 1 && (
        <>
          {/* Botão Previous - RESPONSIVO */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousPreview}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 w-10 h-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Botão Next - RESPONSIVO */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPreview}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 w-10 h-10"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Indicadores de página - INTERATIVOS */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {printifyGeneratedPreviewUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDirectNavigation(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-110 ${
                  currentPreviewIndex === index 
                    ? 'bg-ghibli-moss shadow-lg' 
                    : 'bg-white/70 hover:bg-white/90 shadow-sm'
                }`}
                aria-label={`Ver mockup ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Badge com contador - MELHORADO */}
      {printifyGeneratedPreviewUrls.length > 1 && (
        <div className="absolute top-6 right-6">
          <Badge className="bg-ghibli-moss text-white shadow-lg px-3 py-1">
            {currentPreviewIndex + 1} de {printifyGeneratedPreviewUrls.length}
          </Badge>
        </div>
      )}

      {/* Badge de qualidade */}
      <div className="absolute top-6 left-6">
        <Badge className="bg-white/90 text-ghibli-earth shadow-lg">
          Pré-visualização HD
        </Badge>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Erro ao Gerar Mockup
        </h3>
        <p className="text-sm text-red-600 mb-4 max-w-md">
          {error || 'Ocorreu um erro inesperado. Tente novamente.'}
        </p>
        <Button
          onClick={handleGenerateMockup}
          variant="outline"
          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
        >
          <RotateCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    </div>
  );

  // Renderização principal
  if (error) {
    return renderErrorState();
  }

  if (printifyGeneratedPreviewUrls.length > 0) {
    return renderGeneratedPreviews();
  }

  return renderInitialPreview();
} 