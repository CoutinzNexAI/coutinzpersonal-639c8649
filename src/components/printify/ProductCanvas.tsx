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
  isGeneratingMockup?: boolean;
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
  selectedImageId,
  isGeneratingMockup = false
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

  // ✅ NEUTRALIZADO: handleGenerateMockup removido - responsabilidade transferida para GenericProductPage

  // ✅ NEUTRALIZADO: Auto-geração removida - responsabilidade transferida para GenericProductPage

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
    // Para hoodie jovem, mostrar estado específico
    if (selectedProduct.id === 'custom_youth_hoodie') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
          {/* Placeholder específico para hoodie */}
          <div className="mb-6">
            <img
              src="/assets/mockups/hoodie/youth_hoodie_blank.svg"
              alt="Personaliza a tua hoodie"
              className="w-64 h-64 object-contain opacity-60"
            />
          </div>
            
          {/* Call to action específico para hoodie */}
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
              Personaliza a tua Hoodie Jovem
            </h3>
            <p className="text-ghibli-earth/70 mb-6 leading-relaxed hidden lg:block">
              Combina logo, arte AI e frase personalizada para criar uma hoodie única.
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
    }

    // Para caneca coração, mostrar estado específico
    if (selectedProduct.id === 'heart_mug') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
          {/* Placeholder image */}
          <div className="mb-6">
            <img
              src="/mockupproduto/canecacoracao.png"
              alt="Escolha uma foto para personalizar"
              className="w-64 h-64 object-contain opacity-60"
            />
          </div>
          
          {/* Call to action */}
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
              Personaliza a sua Caneca Coração
            </h3>
            <p className="text-ghibli-earth/70 mb-6 leading-relaxed hidden lg:block">
              Escolha uma das suas transformações AI para criar um produto único e personalizado.
            </p>
            
            {onSelectImage && (
              <Button
                onClick={onSelectImage}
                className="hidden bg-ghibli-moss hover:bg-ghibli-moss/90 text-white px-8 py-3"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Escolher Arte
              </Button>
            )}
          </div>
        </div>
      );
    }

    // Para caneca cerâmica, mostrar estado específico
    if (selectedProduct.id === 'ceramic_mug') {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
        {/* Placeholder image */}
        <div className="mb-6">
          <img
              src="/mockupproduto/canecapersonalizada.png"
            alt="Escolha uma foto para personalizar"
              className="w-64 h-64 object-contain opacity-60"
          />
        </div>
        
        {/* Call to action */}
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
              Personaliza a sua Caneca Cerâmica
            </h3>
            <p className="text-ghibli-earth/70 mb-6 leading-relaxed hidden lg:block">
              Escolha uma das suas transformações AI para criar um produto único e personalizado.
            </p>
            
            {onSelectImage && (
              <Button
                onClick={onSelectImage}
                className="hidden bg-ghibli-moss hover:bg-ghibli-moss/90 text-white px-8 py-3"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Escolher Arte
              </Button>
            )}
          </div>
        </div>
      );
    }

    // Para canvas, mostrar estado específico sem botão
    if (selectedProduct.id === 'custom_canvas' || selectedProduct.id === 'framed_canvas') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
          {/* Placeholder image do canvas */}
          <div className="mb-6">
            <img
              src={selectedProduct.mockupInitialPath}
              alt="Canvas personalizado"
              className="w-64 h-64 object-contain opacity-60"
            />
          </div>
          
          {/* Call to action específico para canvas - SEM BOTÃO */}
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
              {selectedProduct.id === 'custom_canvas' 
                ? 'Canvas Personalizável' 
                : 'Canvas com Moldura Personalizável'
              }
            </h3>
            <p className="text-ghibli-earth/70 mb-6 leading-relaxed hidden lg:block">
              Escolha uma arte e veja o seu canvas personalizado ganhar vida.
            </p>
          </div>
        </div>
      );
    }

    // Para posters, mostrar placeholder específico baseado na orientação
    if (selectedProduct.id === 'poster_horizontal_semi_glossy') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
          {/* Placeholder image horizontal */}
          <div className="mb-6">
            <img
              src="/mockupproduto/posterhorizontal.png"
              alt="Poster Horizontal Personalizado"
              className="w-64 h-64 object-contain opacity-60"
            />
          </div>
          
          {/* Call to action específico para poster horizontal */}
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
              Poster Horizontal Personalizado
            </h3>
            <p className="text-ghibli-earth/70 mb-6 leading-relaxed hidden lg:block">
              Escolha uma arte e veja o seu poster horizontal ganhar vida.
            </p>
          </div>
        </div>
      );
    }

    if (selectedProduct.id === 'poster_vertical_semi_glossy') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
          {/* Placeholder image vertical */}
          <div className="mb-6">
            <img
              src="/mockupproduto/postervertical.png"
              alt="Poster Vertical Personalizado"
              className="w-64 h-64 object-contain opacity-60"
            />
          </div>
          
          {/* Call to action específico para poster vertical */}
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
              Poster Vertical Personalizado
            </h3>
            <p className="text-ghibli-earth/70 mb-6 leading-relaxed hidden lg:block">
              Escolha uma arte e veja o seu poster vertical ganhar vida.
            </p>
          </div>
        </div>
      );
    }

    // Para capa de telemóvel, mostrar placeholder específico
    if (selectedProduct.id === 'custom_phone_case') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
          {/* Placeholder image da capa */}
          <div className="mb-6">
            <img
              src="/mockupproduto/telemovel.png"
              alt="Capa de Telemóvel Personalizada"
              className="w-64 h-64 object-contain opacity-60"
            />
          </div>
          
          {/* Call to action específico para capa */}
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
              Capa de Telemóvel Personalizada
            </h3>
            <p className="text-ghibli-earth/70 mb-6 leading-relaxed hidden lg:block">
              Escolha uma arte e veja a sua capa personalizada ganhar vida.
            </p>
          </div>
        </div>
      );
    }

    // Para saco, mostrar placeholder específico
    if (selectedProduct.id === 'tote_bag') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
          {/* Placeholder image do saco */}
          <div className="mb-6">
            <img
              src="/assets/mockups/bag/saco.png"
              alt="Saco Personalizado"
              className="w-64 h-64 object-contain opacity-60"
            />
          </div>
          
          {/* Call to action específico para saco */}
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
              Saco Personalizado
            </h3>
            <p className="text-ghibli-earth/70 mb-6 leading-relaxed hidden lg:block">
              Escolha uma arte e veja o seu saco sustentável ganhar vida.
            </p>
          </div>
        </div>
      );
    }

    // Para caderno (spiral_journal), mostrar placeholder específico
    if (selectedProduct.id === 'spiral_journal') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
          {/* Placeholder image */}
          <div className="mb-6">
            <img
              src="/mockupproduto/caderno.png"
              alt="Caderno Personalizado"
              className="w-64 h-64 object-contain opacity-60"
            />
          </div>
          
          {/* Call to action específico para caderno */}
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
              Caderno Personalizado
            </h3>
            <p className="text-ghibli-earth/70 mb-6 leading-relaxed hidden lg:block">
              Escolha uma arte e veja o seu caderno personalizado ganhar vida.
            </p>
          </div>
        </div>
      );
    }

    // Para mouse pad, mostrar placeholder específico
    if (selectedProduct.id === 'mouse_pad') {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
          {/* Placeholder image */}
          <div className="mb-6">
            <img
              src="/mockupproduto/mousepad.png"
              alt="Mouse Pad Personalizado"
              className="w-64 h-64 object-contain opacity-60"
            />
          </div>
          
          {/* Call to action específico para mouse pad */}
          <div className="text-center max-w-md">
            <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
              Mouse Pad Personalizado
            </h3>
            <p className="text-ghibli-earth/70 mb-6 leading-relaxed hidden lg:block">
              Escolha uma arte e veja o seu mouse pad personalizado ganhar vida.
            </p>
          </div>
        </div>
      );
    }

    // Para outros produtos, mostrar estado vazio genérico
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8">
        {/* Placeholder image genérico */}
        <div className="mb-6">
          <div className="w-64 h-64 bg-ghibli-cream/50 rounded-xl border-2 border-dashed border-ghibli-sand flex items-center justify-center">
            <span className="text-6xl opacity-40">📷</span>
          </div>
        </div>
        
        {/* Call to action genérico */}
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-ghibli-earth mb-3">
            Personaliza o seu produto
          </h3>
          <p className="text-ghibli-earth/70 mb-6 leading-relaxed hidden lg:block">
            Escolha uma das suas transformações AI para criar um produto único e personalizado.
          </p>
          
          {onSelectImage && (
            <Button
              onClick={onSelectImage}
              className="hidden bg-ghibli-moss hover:bg-ghibli-moss/90 text-white px-8 py-3"
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
        <h3 className="font-semibold text-ghibli-earth mb-2">✨ A personalizar o seu produto...</h3>
        <p className="text-sm text-ghibli-earth/70">
          {selectedProduct.id === 'custom_youth_hoodie' 
            ? 'A criar a sua hoodie única com logo, arte e frase...' 
            : selectedProduct.id === 'custom_phone_case'
            ? 'A criar a sua capa personalizada...'
            : 'A aplicar a sua transformação AI...'
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
      {/* Imagem principal com fundo branco para capas */}
      <div className={`relative w-full h-full flex items-center justify-center ${
        selectedProduct.id === 'custom_phone_case' ? 'bg-white' : ''
      }`}>
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
        {/* ✅ NEUTRALIZADO: Botão removido - regeneração controlada pelo GenericProductPage */}
      </div>
    </div>
  );

  // Renderização principal
  if (isGeneratingMockup) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ghibli-moss mx-auto mb-4" />
          <p className="text-ghibli-earth">A gerar a sua obra de arte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return renderErrorState();
  }

  if (!userImageUrl) {
    return renderEmptyState();
  }

  if (isLoadingMockups) {
    return (
      <div className="relative w-full h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ghibli-moss mx-auto mb-4" />
          <p className="text-ghibli-earth/70 text-sm">A gerar mockup...</p>
        </div>
      </div>
    );
  }

  if (printifyGeneratedPreviewUrls.length > 0) {
    return renderGeneratedPreviews();
  }

  return renderInitialPreview();
} 