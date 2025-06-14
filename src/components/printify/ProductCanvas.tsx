import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Sparkles, RotateCw } from 'lucide-react';
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
  userImageUrl: string;
  userId: string;
  printifyGeneratedPreviewUrls?: string[];
  onPreviewReady: (data: {
    previewUrls: string[];
    printifyImageId: string;
    printifyProductId: string;
  }) => void;
  imageAdjustments?: ImageAdjustments;
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
  imageAdjustments
}: ProductCanvasProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Auto-generate mockup when component mounts (if not already generated)
  useEffect(() => {
    if (!hasGenerated && userImageUrl && userId && selectedProduct) {
      handleGenerateMockup();
    }
  }, [userImageUrl, userId, selectedProduct, hasGenerated]);

  const handleGenerateMockup = async () => {
    if (!userImageUrl || !userId || isGenerating) return;

    setIsGenerating(true);
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
      setIsGenerating(false);
    }
  };

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

  const renderInitialPreview = () => (
    <div className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
      {/* Background mockup */}
      <img
        src={selectedProduct.mockupInitialPath}
        alt={`${selectedProduct.name} mockup`}
        className="absolute inset-0 w-full h-full object-contain"
      />
      
      {/* User image overlay - positioned based on product type */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-48 h-48 rounded-lg overflow-hidden shadow-lg">
          <img
            src={userImageUrl}
            alt="Your transformed image"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-10" />
        </div>
      </div>

      {/* Generate button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
        <Button
          onClick={handleGenerateMockup}
          disabled={isGenerating}
          className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              A gerar pré-visualização...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Pré-visualização 3D
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <Sparkles className="absolute inset-0 w-6 h-6 m-auto text-blue-600 animate-pulse" />
      </div>
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          A gerar pré-visualização 3D...
        </h3>
        <p className="text-sm text-gray-600 max-w-md">
          Estamos a criar mockups profissionais do seu produto. 
          Isto pode demorar até 30 segundos.
        </p>
      </div>
      <div className="mt-4 flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
      </div>
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
      </div>

      {/* Thumbnail navigation */}
      {printifyGeneratedPreviewUrls.length > 1 && (
        <div className="flex space-x-2 justify-center">
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

      {/* Regenerate button */}
      <div className="mt-4 text-center">
        <Button
          variant="outline"
          onClick={() => {
            setHasGenerated(false);
            handleGenerateMockup();
          }}
          disabled={isGenerating}
          className="text-sm"
        >
          <RotateCw className="w-4 h-4 mr-2" />
          Gerar Novamente
        </Button>
      </div>
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
      <Button
        onClick={() => {
          setError(null);
          setHasGenerated(false);
          handleGenerateMockup();
        }}
        disabled={isGenerating}
      >
        <RotateCw className="w-4 h-4 mr-2" />
        Tentar Novamente
      </Button>
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

        {error ? (
          renderErrorState()
        ) : isGenerating ? (
          renderLoadingState()
        ) : printifyGeneratedPreviewUrls.length > 0 ? (
          renderGeneratedPreviews()
        ) : (
          renderInitialPreview()
        )}

        {/* Manual adjustment notice */}
        {selectedProduct.supportsManualAdjustment && (
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