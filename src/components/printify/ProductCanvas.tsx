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

interface AllImageAdjustments {
  logo: ImageAdjustments;
  customer: ImageAdjustments;
  phrase: ImageAdjustments;
}

interface ProductCanvasProps {
  selectedProduct: PrintifyProductMapping;
  userImageUrl?: string;
  userId?: string;
  printifyGeneratedPreviewUrls?: string[];
  onPreviewReady: (data: {
    previewUrls: string[];
    printifyImageId?: string;
    printifyProductId: string;
    customerPrintifyImageId?: string;
    dynamicPhrasePrintifyImageId?: string;
  }) => void;
  onSelectImage?: () => void;
  imageAdjustments?: ImageAdjustments;
  onImageAdjust?: (adjustments: ImageAdjustments) => void;
  selectedPrintifyVariantId?: number | null;
  allImageAdjustments?: AllImageAdjustments;
  selectedPhraseText?: string;
  mockupUrl?: string;
  selectedImageId?: string | null; // Para Canvas products
}

interface GenerateMockupResponse {
  success: boolean;
  previewUrls?: string[];
  printifyImageId?: string;
  printifyProductId?: string;
  customerPrintifyImageId?: string;
  dynamicPhrasePrintifyImageId?: string;
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
  selectedPrintifyVariantId,
  allImageAdjustments,
  selectedPhraseText,
  mockupUrl,
  selectedImageId
}: ProductCanvasProps) {
  const [isLoadingMockups, setIsLoadingMockups] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  // ✅ OTIMIZAÇÃO: Estado consolidado do Printify
  const [printifyData, setPrintifyData] = useState({
    previewUrls: [] as string[],
    imageId: '',
    productId: ''
  });

  // ✅ CALCULAÇÃO DE ESTILO NO CORPO PRINCIPAL - SEMPRE RECALCULADO
  // Converte as coordenadas da Printify (centro=0.5) para percentagens de desvio CSS (centro=0%)
  const xPercent = imageAdjustments ? (imageAdjustments.x - 0.5) * 100 : 0;
  const yPercent = imageAdjustments ? (imageAdjustments.y - 0.5) * 100 : 0;
  const scale = imageAdjustments?.scale || 1;
  const rotation = imageAdjustments?.rotation || 0;

  const imageStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    // ✅ FORMATO CORRETO: translate(-50%, -50%) para centrar + translate(x%, y%) para posicionar
    transform: `translate(-50%, -50%) translate(${xPercent}%, ${yPercent}%) scale(${scale}) rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    transition: 'transform 0.05s linear', // Transição mais rápida para feedback instantâneo
  };

  // ✅ DEBUG: Log para verificar se o estilo está a ser calculado
  if (imageAdjustments && selectedProduct.id.includes('poster_')) {
    console.log('🎨 [ProductCanvas] Estilo da imagem calculado:', {
      imageAdjustments,
      xPercent,
      yPercent,
      scale,
      rotation,
      transformCSS: imageStyle.transform
    });
  }

  // Reset hasGenerated when userImageUrl OR selectedPrintifyVariantId OR selectedPhraseText changes
  useEffect(() => {
    setHasGenerated(false);
    setCurrentPreviewIndex(0);
    // Clear existing preview URLs when image/variant/phrase changes
    if (onPreviewReady) {
      if (selectedProduct.id === 'custom_youth_hoodie') {
        onPreviewReady({ 
          previewUrls: [], 
          customerPrintifyImageId: '', 
          dynamicPhrasePrintifyImageId: '', 
          printifyProductId: '' 
        });
      } else {
        onPreviewReady({ 
          previewUrls: [], 
          printifyImageId: '', 
          printifyProductId: '' 
        });
      }
    }
  }, [userImageUrl, selectedPrintifyVariantId, selectedPhraseText, onPreviewReady, selectedProduct.id]);

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
      // Construir payload baseado no tipo de produto
      let requestBody: Record<string, unknown>;

      if (selectedProduct.id === 'custom_youth_hoodie') {
        // Para sweat de criança - múltiplas imagens
        const logoConfig = selectedProduct.printAreasConfig?.find(area => area.position === 'front');
        
        requestBody = {
          productId: selectedProduct.id,
          selectedPrintifyVariantId: selectedPrintifyVariantId,
          logoImageId: logoConfig?.staticImageId || '684d920a45ec86ab347594c5', // ID fixo do logo
          customerImageUrl: userImageUrl,
          customerImageAdjustments: allImageAdjustments?.customer,
          selectedPhraseText: selectedPhraseText || 'Sem frase',
          phraseImageAdjustments: allImageAdjustments?.phrase,
          userId: userId,
        };
      } else {
        // Para outros produtos (capa, caneca, etc.) - imagem única
        requestBody = {
          productId: selectedProduct.id,
          userImageUrl: userImageUrl,
          userId: userId,
          // ✅ CORREÇÃO: Enviar imageAdjustments para produtos que suportam ajustes manuais OU posters
          imageAdjustments: (selectedProduct.supportsManualAdjustment || selectedProduct.id.includes('poster_')) ? imageAdjustments : undefined,
          selectedPrintifyVariantId: selectedPrintifyVariantId,
        };

        // Para Canvas products - SEMPRE carregar a imagem primeiro
        if ((selectedProduct.id === 'custom_canvas' || selectedProduct.id === 'framed_canvas')) {
          // Para Canvas, não passar printifyImageId - deixar a API carregar a imagem
          // O backend irá primeiro fazer upload da imagem para Printify e depois usar o ID
          requestBody.forceImageUpload = true; // Flag para forçar re-upload

          // *** ADICIONAR PRINTDETAILS PARA CANVAS (CUSTOM E FRAMED) ***
            requestBody.printDetails = { print_on_side: 'mirror' }; // Força a borda espelhada
        }

        // Para Poster products, adicionar printifyImageId
        if (selectedProduct.id.includes('poster_')) {
          if (selectedImageId) {
            // Usar selectedImageId diretamente se disponível
            requestBody.printifyImageId = selectedImageId;
          } else if (userImageUrl) {
            // Fallback: extrair printifyImageId da URL da imagem
            const printifyImageIdMatch = userImageUrl.match(/\/([a-f0-9]{24})$/);
            if (printifyImageIdMatch) {
              requestBody.printifyImageId = printifyImageIdMatch[1];
            }
          }
        }
      }

      console.log('🔍 [ProductCanvas DEBUG] generateMockups chamado com:', { requestBody });

      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenerateMockupResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate mockup');
      }

      if (data.previewUrls && data.printifyProductId) {
        if (selectedProduct.id === 'custom_youth_hoodie') {
          // Para sweat de criança
          if (data.customerPrintifyImageId && data.dynamicPhrasePrintifyImageId) {
            onPreviewReady({
              previewUrls: data.previewUrls,
              customerPrintifyImageId: data.customerPrintifyImageId,
              dynamicPhrasePrintifyImageId: data.dynamicPhrasePrintifyImageId,
              printifyProductId: data.printifyProductId,
            });
          }
        } else {
          // Para outros produtos
          if (data.printifyImageId) {
            onPreviewReady({
              previewUrls: data.previewUrls,
              printifyImageId: data.printifyImageId,
              printifyProductId: data.printifyProductId,
            });
          }
        }
        setHasGenerated(true);
      }
    } catch (err) {
      console.error('Error generating mockup:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoadingMockups(false);
    }
  }, [
    userImageUrl, 
    userId, 
    isLoadingMockups, 
    selectedProduct, 
    imageAdjustments, 
    selectedPrintifyVariantId, 
    onPreviewReady,
    allImageAdjustments,
    selectedPhraseText,
    selectedImageId
  ]);

  // Auto-generate mockup when component mounts (if not already generated)
  useEffect(() => {
    let shouldGenerate = false;

    if (selectedProduct.id === 'custom_youth_hoodie') {
      // Para sweat de criança, precisamos de imagem, variante e frase
      shouldGenerate = !!(userImageUrl && userId && selectedProduct && selectedPrintifyVariantId && selectedPhraseText);
    } else if (selectedProduct.id === 'custom_phone_case') {
      // Para capas de telemóvel, só gera se uma variante foi selecionada
      shouldGenerate = !!(userImageUrl && userId && selectedProduct && selectedPrintifyVariantId);
    } else {
      // Para outros produtos
      shouldGenerate = !!(userImageUrl && userId && selectedProduct);
    }

    if (!hasGenerated && shouldGenerate) {
      handleGenerateMockup();
    }
  }, [userImageUrl, userId, selectedProduct, selectedPrintifyVariantId, selectedPhraseText, hasGenerated, handleGenerateMockup]);

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
    // Para capas de telemóvel ou sweat, mostrar o mockup inicial maximizado
    if (selectedProduct.id === 'custom_phone_case' || selectedProduct.id === 'custom_youth_hoodie') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Mockup inicial maximizado */}
          <div className="relative w-full h-full flex items-center justify-center p-12">
            <img
              src={mockupUrl || selectedProduct.mockupInitialPath}
              alt={`${selectedProduct.name} mockup inicial`}
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
              style={{ maxHeight: '85%' }}
            />
            
            {/* Texto sutil no canto */}
            <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
              <p className="text-sm text-ghibli-earth/80 font-medium">
                {selectedProduct.name}
              </p>
              {selectedProduct.id === 'custom_youth_hoodie' && selectedPhraseText && (
                <p className="text-xs text-ghibli-earth/60">
                  Frase: {selectedPhraseText}
                </p>
              )}
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
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
            Personalize o seu {selectedProduct.name}
          </h3>
          <p className="text-ghibli-earth/70 mb-6 leading-relaxed">
            Escolha uma das suas transformações AI para criar um produto único e personalizado.
          </p>
          
          {onSelectImage && (
            <Button
              onClick={onSelectImage}
              className="bg-ghibli-moss hover:bg-ghibli-moss/90 text-white px-8 py-3"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Escolher Arte
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Loading overlay
  const renderLoadingOverlay = () => (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
      <div className="bg-white rounded-xl p-6 text-center max-w-sm mx-4 shadow-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-ghibli-moss mx-auto mb-4" />
        <h3 className="font-semibold text-ghibli-earth mb-2">A gerar mockups...</h3>
        <p className="text-sm text-ghibli-earth/70">
          {selectedProduct.id === 'custom_youth_hoodie' 
            ? 'A processar logo, arte e frase...' 
            : 'A processar a sua arte personalizada...'
          }
        </p>
      </div>
    </div>
  );

  // Preview inicial simples
  const renderInitialPreview = () => (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative">
        <img
          src={mockupUrl || selectedProduct.mockupInitialPath}
          alt="Preview inicial"
          className="max-w-full max-h-full object-contain drop-shadow-xl"
          style={{ maxHeight: '80%' }}
        />
        
        {/* ✅ Overlay com imagem do utilizador (preview RESPONSIVO REAL-TIME) */}
        {userImageUrl && (
          <div style={imageStyle}>
            <img
              src={userImageUrl}
              alt="Sua arte"
              className="w-32 h-32 object-cover rounded-lg border-2 border-white shadow-lg opacity-80"
            />
          </div>
        )}
      </div>
      
      {/* Loading indicator no canto */}
      <div className="absolute top-4 right-4 bg-ghibli-moss text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
        <RotateCw className="w-4 h-4 animate-spin" />
        A gerar...
      </div>
    </div>
  );

  // Previews gerados pela Printify
  const renderGeneratedPreviews = () => (
    <div className="relative w-full h-full">
      {/* Imagem principal */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={printifyGeneratedPreviewUrls[currentPreviewIndex]}
          alt={`Preview ${currentPreviewIndex + 1}`}
          className="max-w-full max-h-full object-contain drop-shadow-2xl"
          style={{ maxHeight: '90%' }}
        />
      </div>

      {/* Controlos de navegação (se múltiplas previews) */}
      {printifyGeneratedPreviewUrls.length > 1 && (
        <>
          {/* Setas de navegação */}
          <Button
            onClick={handlePreviousPreview}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-ghibli-earth shadow-lg border border-ghibli-sand/30"
            size="sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={handleNextPreview}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-ghibli-earth shadow-lg border border-ghibli-sand/30"
            size="sm"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Indicadores de página */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {printifyGeneratedPreviewUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDirectNavigation(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentPreviewIndex 
                    ? 'bg-ghibli-moss scale-125' 
                    : 'bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>


        </>
      )}
    </div>
  );

  // Estado de erro
  const renderErrorState = () => (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Erro ao gerar mockup
        </h3>
        <p className="text-red-600 text-sm mb-4 leading-relaxed">
          {error}
        </p>
        <Button
          onClick={handleGenerateMockup}
          disabled={isLoadingMockups}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <RotateCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    </div>
  );

  // Renderização principal
  if (error) {
    return renderErrorState();
  }

  if (!userImageUrl) {
    return renderEmptyState();
  }

  if (isLoadingMockups) {
    return (
      <div className="relative w-full h-full">
        {renderInitialPreview()}
        {renderLoadingOverlay()}
      </div>
    );
  }

  if (printifyGeneratedPreviewUrls.length > 0) {
    return renderGeneratedPreviews();
  }

  return renderInitialPreview();
} 