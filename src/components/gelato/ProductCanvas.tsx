import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { Area, Point } from 'react-easy-crop/types';
import { GelatoProduct } from '@/lib/gelato/gelatoProducts';
import { validateImageForPrint } from '@/lib/gelato/printFileGenerator';
import { Button } from '@/components/ui/button';
import { RotateCcw, ZoomIn, ZoomOut, Move, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageAdjustments {
  x: number;          // Posição X da imagem dentro da área de impressão (0-1, percentagem)
  y: number;          // Posição Y da imagem dentro da área de impressão (0-1, percentagem)
  scale: number;      // Zoom (escala, 1 = tamanho original)
  rotation?: number;  // Rotação em graus (se suportada pelo produto)
  cropArea?: {        // Área de crop da imagem original
    x: number;        // X do crop em percentagem da imagem original
    y: number;        // Y do crop em percentagem da imagem original
    width: number;    // Largura do crop em percentagem da imagem original
    height: number;   // Altura do crop em percentagem da imagem original
  };
}

interface ProductCanvasProps {
  selectedProduct: GelatoProduct;
  userImageUrl: string;
  gelatoGeneratedPreviewUrls?: string[]; // Array de mockups gerados pela Gelato
  onPreviewReady?: (previewUrl: string, adjustments?: ImageAdjustments) => void;
  className?: string;
}

const ProductCanvas: React.FC<ProductCanvasProps> = ({
  selectedProduct,
  userImageUrl,
  gelatoGeneratedPreviewUrls,
  onPreviewReady,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Estados do editor de ajuste manual
  const [isAdjustmentMode, setIsAdjustmentMode] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments>({
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0
  });

  // Estados para carrossel de mockups Gelato
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // Verificar se o produto suporta ajuste manual
  const supportsManualAdjustment = selectedProduct.supportsManualAdjustment;
  const adjustmentLimits = selectedProduct.adjustmentLimits;

  // Determinar se devemos usar mockups da Gelato
  const hasGelatoMockups = gelatoGeneratedPreviewUrls && gelatoGeneratedPreviewUrls.length > 0;
  const shouldUseGelatoMockups = !supportsManualAdjustment && hasGelatoMockups;

  // Carregar dimensões da imagem do utilizador
  useEffect(() => {
    if (!userImageUrl) return;

    const img = new window.Image();
    img.onload = () => {
      setUserImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);

      // Validar qualidade da imagem para produtos com ajuste manual
      if (supportsManualAdjustment) {
        const validation = validateImageForPrint(img.width, img.height, selectedProduct);
        setQualityWarnings(validation.warnings);

        // Inicializar zoom para preencher a área se suportar ajuste manual
        const initialZoom = Math.max(1, adjustmentLimits?.minZoom || 0.5);
        setZoom(initialZoom);
      }
    };
    img.src = userImageUrl;
  }, [userImageUrl, selectedProduct, supportsManualAdjustment, adjustmentLimits]);

  // Callback quando a área de crop muda
  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
      
      // Atualizar ajustes da imagem
      const newAdjustments: ImageAdjustments = {
        x: crop.x,
        y: crop.y,
        scale: zoom,
        rotation: adjustmentLimits?.allowRotation ? rotation : 0,
        cropArea: {
          x: croppedArea.x / 100,
          y: croppedArea.y / 100,
          width: croppedArea.width / 100,
          height: croppedArea.height / 100
        }
      };
      
      setImageAdjustments(newAdjustments);
    },
    [crop, zoom, rotation, adjustmentLimits]
  );

  // Navegar mockups Gelato
  const goToPreviousPreview = () => {
    if (!hasGelatoMockups) return;
    setCurrentPreviewIndex(prev => 
      prev === 0 ? gelatoGeneratedPreviewUrls!.length - 1 : prev - 1
    );
  };

  const goToNextPreview = () => {
    if (!hasGelatoMockups) return;
    setCurrentPreviewIndex(prev => 
      prev === gelatoGeneratedPreviewUrls!.length - 1 ? 0 : prev + 1
    );
  };

  // Resetar ajustes
  const resetAdjustments = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(adjustmentLimits?.minZoom || 1);
    setRotation(0);
    setImageAdjustments({
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0
    });
  };

  // Confirmar ajustes
  const confirmAdjustments = () => {
    setIsAdjustmentMode(false);
    if (onPreviewReady) {
      onPreviewReady(userImageUrl, imageAdjustments);
    }
  };

  // Cancelar ajustes
  const cancelAdjustments = () => {
    setIsAdjustmentMode(false);
    resetAdjustments();
  };

  // Gerar preview para callback (se necessário)
  useEffect(() => {
    if (imageLoaded && userImageDimensions && onPreviewReady && !isAdjustmentMode) {
      if (supportsManualAdjustment) {
        onPreviewReady(userImageUrl, imageAdjustments);
      } else if (shouldUseGelatoMockups) {
        // Para produtos com mockups Gelato, passar o URL atual do carrossel
        const currentMockupUrl = gelatoGeneratedPreviewUrls![currentPreviewIndex];
        onPreviewReady(currentMockupUrl);
      } else {
        onPreviewReady(userImageUrl);
      }
    }
  }, [imageLoaded, userImageDimensions, onPreviewReady, userImageUrl, isAdjustmentMode, supportsManualAdjustment, shouldUseGelatoMockups, gelatoGeneratedPreviewUrls, currentPreviewIndex, imageAdjustments]);

  return (
    <div className={`relative w-full max-w-lg mx-auto ${className}`}>
      {/* Container do Produto */}
      <div 
        ref={canvasRef}
        className="relative w-full aspect-square bg-white rounded-2xl shadow-xl overflow-hidden border border-ghibli-sand/30 group"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #fefefe 100%)",
          boxShadow: "0 20px 40px -12px rgba(139, 116, 88, 0.15), 0 8px 25px -8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)"
        }}
      >
        {/* Renderização do Mockup */}
        <div className="relative w-full h-full">
          {/* CENÁRIO 1: Produtos automáticos com mockups Gelato */}
          {shouldUseGelatoMockups ? (
            <>
              <Image
                src={gelatoGeneratedPreviewUrls![currentPreviewIndex]}
                alt={`Preview profissional ${selectedProduct.name}`}
                fill
                className="object-contain"
                priority
                onError={() => {
                  console.warn(`Failed to load Gelato preview: ${gelatoGeneratedPreviewUrls![currentPreviewIndex]}`);
                }}
              />
              
              {/* Controlos do carrossel se houver múltiplos mockups */}
              {gelatoGeneratedPreviewUrls!.length > 1 && (
                <>
                  <button
                    onClick={goToPreviousPreview}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNextPreview}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Indicadores */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {gelatoGeneratedPreviewUrls!.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPreviewIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentPreviewIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* CENÁRIO 2: Mockup inicial do produto */}
              <Image
                src={selectedProduct.mockupInitialPath}
                alt={`Mockup ${selectedProduct.name}`}
                fill
                className="object-contain"
                priority
                onError={() => {
                  console.warn(`Failed to load mockup: ${selectedProduct.mockupInitialPath}`);
                }}
              />
              
              {/* CENÁRIO 2A: Modo de ajuste manual para Canecas/Capas */}
              {supportsManualAdjustment && isAdjustmentMode && userImageUrl && imageLoaded && (
                <>
                  {/* Área de Crop Interativa - usando coordenadas calculadas dinamicamente */}
                  <div className="absolute inset-4 border-2 dashed border-blue-400 rounded-lg">
                    <Cropper
                      image={userImageUrl}
                      crop={crop}
                      zoom={zoom}
                      rotation={adjustmentLimits?.allowRotation ? rotation : 0}
                      aspect={selectedProduct.gelatoPrintDimensionsMm.width / selectedProduct.gelatoPrintDimensionsMm.height}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onRotationChange={adjustmentLimits?.allowRotation ? setRotation : undefined}
                      onCropComplete={onCropComplete}
                      cropShape="rect"
                      showGrid={false}
                      style={{
                        containerStyle: {
                          width: '100%',
                          height: '100%',
                          position: 'relative'
                        },
                        mediaStyle: {
                          borderRadius: selectedProduct.category === 'phone-case' ? '12px' : '0'
                        }
                      }}
                      maxZoom={adjustmentLimits?.maxZoom || 3}
                      minZoom={adjustmentLimits?.minZoom || 0.5}
                    />
                  </div>

                  {/* Overlay de instruções */}
                  <div className="absolute top-4 left-4 right-4 bg-black/80 text-white p-3 rounded-lg z-20 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Move className="w-4 h-4" />
                      <span className="font-medium">Ajustar Imagem</span>
                    </div>
                    <p className="text-xs opacity-90">
                      Arraste para mover • {adjustmentLimits?.allowRotation ? 'Rode para rodar • ' : ''}Use os controlos para zoom
                    </p>
                  </div>
                </>
              )}

              {/* CENÁRIO 2B: Sobreposição da imagem do utilizador (apenas se não temos Gelato mockups) */}
              {!isAdjustmentMode && userImageUrl && imageLoaded && !shouldUseGelatoMockups && (
                <motion.div
                  className="absolute inset-4 rounded-lg overflow-hidden"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Image
                    src={userImageUrl}
                    alt="Arte do utilizador"
                    fill
                    className="object-cover rounded-sm"
                    style={{ 
                      filter: selectedProduct.category === 'mug' ? 'none' : 'none',
                      transform: selectedProduct.category === 'phone-case' ? 'scale(0.95)' : 'none'
                    }}
                  />
                </motion.div>
              )}
            </>
          )}

          {/* Overlay de Loading */}
          {!imageLoaded && userImageUrl && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center p-6">
                <div className="w-10 h-10 border-4 border-ghibli-moss border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-ghibli-earth font-medium">A carregar a sua arte...</p>
                <p className="text-xs text-ghibli-earth/70 mt-1">Aguarde uns segundos</p>
              </div>
            </div>
          )}

          {/* Placeholder quando não há imagem */}
          {!userImageUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-ghibli-cream/30 to-ghibli-sand/20 flex items-center justify-center border-2 border-dashed border-ghibli-sand/40 rounded-xl m-4">
              <div className="text-center text-ghibli-earth/60 p-6">
                <motion.div 
                  className="text-5xl mb-3"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎨
                </motion.div>
                <p className="text-sm font-medium text-ghibli-wood">A sua arte AI aparecerá aqui</p>
                <p className="text-xs text-ghibli-earth/60 mt-1">
                  {supportsManualAdjustment ? 'Com ajuste manual disponível' : 'Preview profissional automático'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Indicator se estamos a usar Gelato mockups */}
      {shouldUseGelatoMockups && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
            <span>✨</span>
            <span>Preview profissional gerado</span>
          </div>
        </div>
      )}

      {/* Controlos do Editor (apenas para produtos com ajuste manual) */}
      {supportsManualAdjustment && userImageUrl && imageLoaded && (
        <div className="mt-4">
          {!isAdjustmentMode ? (
            <Button
              onClick={() => setIsAdjustmentMode(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Move className="w-4 h-4 mr-2" />
              Ajustar Posição da Imagem
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Controlos de Zoom */}
              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-ghibli-sand/30 rounded-lg p-3">
                <ZoomOut className="w-4 h-4 text-ghibli-earth" />
                <input
                  type="range"
                  min={adjustmentLimits?.minZoom || 0.5}
                  max={adjustmentLimits?.maxZoom || 3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1"
                />
                <ZoomIn className="w-4 h-4 text-ghibli-earth" />
                <span className="text-sm text-ghibli-earth min-w-[3rem]">{zoom.toFixed(1)}x</span>
              </div>

              {/* Controlos de Rotação (se suportada) */}
              {adjustmentLimits?.allowRotation && (
                <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-ghibli-sand/30 rounded-lg p-3">
                  <RotateCcw className="w-4 h-4 text-ghibli-earth" />
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-ghibli-earth min-w-[3rem]">{rotation}°</span>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-2">
                <Button
                  onClick={cancelAdjustments}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={resetAdjustments}
                  variant="outline"
                  className="px-3"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  onClick={confirmAdjustments}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Informações do Produto */}
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold text-ghibli-wood mb-2">
          {selectedProduct.name}
        </h3>
        <div className="flex items-center justify-center gap-4 text-sm text-ghibli-earth">
          <div className="flex items-center gap-1">
            <span>📏</span>
            <span>{selectedProduct.gelatoPrintDimensionsMm.width}×{selectedProduct.gelatoPrintDimensionsMm.height}mm</span>
          </div>
          <div className="flex items-center gap-1">
            <span>✨</span>
            <span>{selectedProduct.printFileResolution} DPI</span>
          </div>
          {supportsManualAdjustment && (
            <div className="flex items-center gap-1">
              <span>🎯</span>
              <span>Ajuste Manual</span>
            </div>
          )}
        </div>
      </div>

      {/* Avisos de Qualidade (apenas para produtos com ajuste manual) */}
      {supportsManualAdjustment && qualityWarnings.length > 0 && (
        <motion.div 
          className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start gap-2">
            <div className="text-amber-600 mt-0.5">⚠️</div>
            <div>
              <h4 className="text-sm font-medium text-amber-800 mb-1">
                Avisos de Qualidade
              </h4>
              <ul className="text-xs text-amber-700 space-y-1">
                {qualityWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProductCanvas; 