import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GelatoProduct } from '@/lib/gelato/gelatoProducts';
import { validateImageForPrint } from '@/lib/gelato/printFileGenerator';

interface ProductCanvasProps {
  selectedProduct: GelatoProduct;
  userImageUrl: string;
  onPreviewReady?: (previewUrl: string) => void;
  className?: string;
}

const ProductCanvas: React.FC<ProductCanvasProps> = ({
  selectedProduct,
  userImageUrl,
  onPreviewReady,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [userImageDimensions, setUserImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Carregar dimensões da imagem do utilizador
  useEffect(() => {
    if (!userImageUrl) return;

    const img = new window.Image();
    img.onload = () => {
      setUserImageDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);

      // Validar qualidade da imagem
      const validation = validateImageForPrint(img.width, img.height, selectedProduct);
      setQualityWarnings(validation.warnings);
    };
    img.src = userImageUrl;
  }, [userImageUrl, selectedProduct]);

  // Calcular posicionamento automático da imagem do utilizador
  const calculateImageStyle = () => {
    const { printAreaCoords, mockupDimensions } = selectedProduct;
    
    // Calcular posição relativa baseada nas coordenadas do mockup
    const left = (printAreaCoords.x / mockupDimensions.width) * 100;
    const top = (printAreaCoords.y / mockupDimensions.height) * 100;
    const width = (printAreaCoords.width / mockupDimensions.width) * 100;
    const height = (printAreaCoords.height / mockupDimensions.height) * 100;

    return {
      position: 'absolute' as const,
      left: `${left}%`,
      top: `${top}%`,
      width: `${width}%`,
      height: `${height}%`,
      objectFit: 'cover' as const,
      borderRadius: selectedProduct.category === 'phone-case' ? '12px' : '0',
      zIndex: 2
    };
  };

  // Gerar preview para callback (se necessário)
  useEffect(() => {
    if (imageLoaded && userImageDimensions && onPreviewReady && canvasRef.current) {
      // Aqui poderíamos gerar um canvas real para o preview
      // Por agora, retornamos o URL da imagem do utilizador
      onPreviewReady(userImageUrl);
    }
  }, [imageLoaded, userImageDimensions, onPreviewReady, userImageUrl]);

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
        {/* Mockup do Produto */}
        <div className="relative w-full h-full">
          <Image
            src={selectedProduct.mockupPath}
            alt={`Mockup ${selectedProduct.name}`}
            fill
            className="object-contain"
            priority
            onError={() => {
              console.warn(`Failed to load mockup: ${selectedProduct.mockupPath}`);
            }}
          />
          
          {/* Imagem do Utilizador Sobreposta */}
          {userImageUrl && imageLoaded && (
            <motion.div
              style={calculateImageStyle()}
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

          {/* Overlay de Loading */}
          {!imageLoaded && userImageUrl && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center p-6">
                <div className="w-10 h-10 border-4 border-ghibli-moss border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-ghibli-earth font-medium">A posicionar a sua arte...</p>
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
                <p className="text-xs text-ghibli-earth/60 mt-1">Posicionamento automático</p>
              </div>
            </div>
          )}
        </div>
      </div>

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
        </div>
      </div>

      {/* Avisos de Qualidade */}
      {qualityWarnings.length > 0 && (
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

      {/* Especificações Técnicas */}
      {userImageDimensions && (
        <div className="mt-4 p-3 bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-lg">
          <h4 className="text-sm font-medium text-ghibli-wood mb-2">
            📊 Especificações
          </h4>
          <div className="text-xs text-ghibli-earth space-y-1">
            <div>Imagem: {userImageDimensions.width}×{userImageDimensions.height}px</div>
            <div>Impressão: {selectedProduct.printFileResolution} DPI</div>
            <div>Bleed: {selectedProduct.printFileBleed}mm</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCanvas; 