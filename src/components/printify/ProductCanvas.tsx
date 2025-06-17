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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  // Reset hasGenerated when variant changes (for phone cases)
  useEffect(() => {
    setHasGenerated(false);
  }, [selectedPrintifyVariantId]);

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

  // Funções de arrasto para ajuste da posição X
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedProduct.supportsManualAdjustment && imageAdjustments) {
      setIsDragging(true);
      setDragStartX(e.clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && imageAdjustments && onImageAdjust) {
      const deltaX = e.clientX - dragStartX;
      const containerWidth = 400; // Aproximadamente a largura do container
      const deltaPercentage = deltaX / containerWidth;
      
      // Calcular nova posição X limitada entre 0 e 1
      const newX = Math.max(0, Math.min(1, imageAdjustments.x + deltaPercentage));
      
      onImageAdjust({ ...imageAdjustments, x: newX });
      setDragStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handlers para touch (dispositivos móveis)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (selectedProduct.supportsManualAdjustment && imageAdjustments) {
      setIsDragging(true);
      setDragStartX(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && imageAdjustments && onImageAdjust) {
      const deltaX = e.touches[0].clientX - dragStartX;
      const containerWidth = 400;
      const deltaPercentage = deltaX / containerWidth;
      
      const newX = Math.max(0, Math.min(1, imageAdjustments.x + deltaPercentage));
      
      onImageAdjust({ ...imageAdjustments, x: newX });
      setDragStartX(e.touches[0].clientX);
    }
  };

  // Estado inicial - sem imagem selecionada
  const renderEmptyState = () => {
    // Para capas de telemóvel, mostrar o mockup inicial (capa.png)
    if (selectedProduct.id === 'custom_phone_case') {
      return (
        <div className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
          {/* Mockup inicial da capa */}
          <img
            src={selectedProduct.mockupInitialPath}
            alt={`${selectedProduct.name} mockup inicial`}
            className="absolute inset-0 w-full h-full object-contain"
          />
          
          {/* Overlay com call to action */}
          <div className="absolute inset-0 bg-black bg-opacity-20 flex flex-col items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 text-center max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Personalize a sua {selectedProduct.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Escolha uma arte AI e um modelo de telemóvel para começar
              </p>
              
              <Button
                onClick={onSelectImage}
                className="bg-ghibli-moss hover:bg-ghibli-moss/90 text-white shadow-lg"
                size="lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Escolher Arte
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Para outros produtos, mostrar estado vazio tradicional
    return (
      <div className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden flex flex-col items-center justify-center">
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
          
          <Button
            onClick={onSelectImage}
            className="bg-ghibli-moss hover:bg-ghibli-moss/90 text-white shadow-lg px-8 py-3"
            size="lg"
          >
            <Upload className="w-5 h-5 mr-2" />
            Escolher Foto
          </Button>
        </div>
      </div>
    );
  };

  // Estado de carregamento com overlay melhorado
  const renderLoadingOverlay = () => (
    <div className="absolute inset-0 bg-black bg-opacity-70 rounded-lg flex flex-col items-center justify-center z-20">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4 text-center">
        <div className="relative mb-4 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-ghibli-moss animate-spin" />
          <Sparkles className="absolute w-6 h-6 text-ghibli-moss animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-ghibli-earth mb-2">
          A gerar pré-visualização 3D...
        </h3>
        <p className="text-sm text-ghibli-earth/70">
          Estamos a criar mockups profissionais do seu produto. 
          Isto pode demorar até 30 segundos.
        </p>
        <div className="mt-4 flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  );

  // Preview inicial com imagem do utilizador
  const renderInitialPreview = () => (
    <div 
      className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Background mockup */}
      <img
        src={selectedProduct.mockupInitialPath}
        alt={`${selectedProduct.name} mockup`}
        className="absolute inset-0 w-full h-full object-contain"
      />
      
      {/* User image overlay - positioned based on product type */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`relative w-48 h-48 rounded-lg overflow-hidden shadow-lg ${
            selectedProduct.supportsManualAdjustment ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <img
            src={userImageUrl}
            alt="Your transformed image"
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-black bg-opacity-10" />
          {selectedProduct.supportsManualAdjustment && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              Arraste para ajustar
            </div>
          )}
        </div>
      </div>

      {/* Generate button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
        <Button
          onClick={handleGenerateMockup}
          disabled={isLoadingMockups}
          className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
          size="lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Gerar Pré-visualização 3D
        </Button>
      </div>

      {/* Loading overlay */}
      {isLoadingMockups && renderLoadingOverlay()}
    </div>
  );

  const renderGeneratedPreviews = () => (
    <div className="w-full">
      {/* Main preview image */}
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
        <img
          src={printifyGeneratedPreviewUrls[currentPreviewIndex]}
          alt={`${selectedProduct.name} preview ${currentPreviewIndex + 1}`}
          className="w-full h-full object-contain"
        />
        
        {/* Navigation arrows */}
        {printifyGeneratedPreviewUrls.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
              onClick={handlePreviousPreview}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
              onClick={handleNextPreview}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Preview counter */}
        {printifyGeneratedPreviewUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <Badge variant="secondary" className="bg-white/90">
              {currentPreviewIndex + 1} de {printifyGeneratedPreviewUrls.length}
            </Badge>
          </div>
        )}

        {/* Loading overlay for regeneration */}
        {isLoadingMockups && renderLoadingOverlay()}
      </div>

      {/* Thumbnail navigation */}
      {printifyGeneratedPreviewUrls.length > 1 && (
        <div className="flex space-x-2 justify-center mb-4">
          {printifyGeneratedPreviewUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => setCurrentPreviewIndex(index)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentPreviewIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}


    </div>
  );

  const renderErrorState = () => (
    <div className="w-full h-96 bg-red-50 rounded-lg flex flex-col items-center justify-center p-6">
      <div className="text-red-600 mb-4">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Erro ao gerar pré-visualização
      </h3>
      <p className="text-sm text-gray-600 text-center mb-4 max-w-md">
        {error || 'Ocorreu um erro inesperado. Tente novamente.'}
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => {
            setError(null);
            setHasGenerated(false);
            handleGenerateMockup();
          }}
          disabled={isLoadingMockups}
        >
          <RotateCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
        

      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {selectedProduct.name}
          </h3>
          <p className="text-sm text-gray-600">
            Pré-visualização do seu produto personalizado
          </p>
        </div>

        {/* Renderização condicional baseada no estado */}
        {!userImageUrl ? (
          renderEmptyState()
        ) : error ? (
          renderErrorState()
        ) : printifyGeneratedPreviewUrls.length > 0 ? (
          renderGeneratedPreviews()
        ) : (
          renderInitialPreview()
        )}

        {/* Manual adjustment notice */}
        {selectedProduct.supportsManualAdjustment && userImageUrl && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Este produto suporta ajustes manuais. Pode ajustar a posição, 
              zoom e rotação da sua imagem antes de finalizar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 