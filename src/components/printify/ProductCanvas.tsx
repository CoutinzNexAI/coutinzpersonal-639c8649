import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Sparkles, RotateCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  // Reset hasGenerated when userImageUrl OR selectedPrintifyVariantId changes
  useEffect(() => {
    setHasGenerated(false);
    // Clear existing preview URLs when image/variant changes
    if (onPreviewReady) {
      onPreviewReady({ previewUrls: [], printifyImageId: '', printifyProductId: '' });
    }
  }, [userImageUrl, selectedPrintifyVariantId, onPreviewReady]);

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

  const handlePreviousPreview = () => {
    setCurrentPreviewIndex((prev) => 
      prev === 0 ? printifyGeneratedPreviewUrls.length - 1 : prev - 1
    );
  };

  const handleNextPreview = () => {
    setCurrentPreviewIndex((prev) => 
      prev === printifyGeneratedPreviewUrls.length - 1 ? 0 : prev + 1
    );
  };

  // Estado inicial - sem imagem selecionada - MAXIMIZADO SEM MODAL
  const renderEmptyState = () => {
    // Para capas de telemóvel, mostrar o mockup inicial maximizado
    if (selectedProduct.id === 'custom_phone_case') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Mockup inicial da capa - MAXIMIZADO */}
          <div className="relative w-full h-full flex items-center justify-center p-8">
            <img
              src={selectedProduct.mockupInitialPath}
              alt={`${selectedProduct.name} mockup inicial`}
              className="max-w-full max-h-full object-contain drop-shadow-lg"
            />
            
            {/* Texto sutil no canto */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
              <p className="text-sm text-ghibli-earth/80">
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
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-sm mx-4">
        <div className="relative mb-6">
          <Loader2 className="w-12 h-12 text-ghibli-moss animate-spin" />
          <Sparkles className="w-6 h-6 text-ghibli-moss absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-ghibli-earth mb-2">A gerar mockups...</h3>
        <p className="text-sm text-ghibli-earth/70 text-center">
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
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
          
          {/* Badge informativo */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-ghibli-moss text-white">
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
    <div className="relative w-full h-full">
      {/* Imagem principal do mockup */}
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <img
          src={printifyGeneratedPreviewUrls[currentPreviewIndex]}
          alt={`${selectedProduct.name} personalizada`}
          className="max-w-full max-h-full object-contain drop-shadow-xl"
        />
      </div>

      {/* Navegação entre previews (se houver múltiplas) */}
      {printifyGeneratedPreviewUrls.length > 1 && (
        <>
          {/* Botão Previous */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousPreview}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Botão Next */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPreview}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Indicadores de página */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {printifyGeneratedPreviewUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPreviewIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentPreviewIndex === index ? 'bg-ghibli-moss' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Badge com número de views */}
      {printifyGeneratedPreviewUrls.length > 1 && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-ghibli-moss text-white">
            {currentPreviewIndex + 1} de {printifyGeneratedPreviewUrls.length}
          </Badge>
        </div>
      )}
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