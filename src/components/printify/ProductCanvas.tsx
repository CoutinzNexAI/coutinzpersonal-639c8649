import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

// Interface simplificada - componente "burro"
interface ProductCanvasProps {
  selectedProduct: PrintifyProductMapping;
  userImageUrl?: string;
  printifyGeneratedPreviewUrls: string[];
  isGenerating: boolean;
}

export default function ProductCanvas({
  selectedProduct,
  userImageUrl,
  printifyGeneratedPreviewUrls = [],
  isGenerating,
}: ProductCanvasProps) {

  // A única coisa que este componente faz agora é RENDERIZAR
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  useEffect(() => {
    setCurrentPreviewIndex(0); // Faz reset ao preview quando as URLs mudam
  }, [printifyGeneratedPreviewUrls]);

  // RENDERIZAÇÃO BASEADA NO ESTADO PASSADO PELO PAI
  
  // Estado de loading
  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-800">A gerar o seu mockup...</p>
            <p className="text-sm text-gray-600">Isto pode demorar alguns segundos</p>
          </div>
        </div>
      </div>
    );
  }

  // Se há mockups gerados, mostra-os
  if (printifyGeneratedPreviewUrls.length > 0) {
    const currentUrl = printifyGeneratedPreviewUrls[currentPreviewIndex];
    
    return (
      <div className="relative h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img
            src={currentUrl}
            alt={`${selectedProduct.name} - Preview ${currentPreviewIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            style={{ maxHeight: 'calc(100% - 2rem)' }}
          />
          
          {/* Navegação entre previews */}
          {printifyGeneratedPreviewUrls.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-md"
                onClick={() => setCurrentPreviewIndex((prev) => 
                  prev === 0 ? printifyGeneratedPreviewUrls.length - 1 : prev - 1
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-md"
                onClick={() => setCurrentPreviewIndex((prev) => 
                  prev === printifyGeneratedPreviewUrls.length - 1 ? 0 : prev + 1
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              {/* Indicador de página */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {currentPreviewIndex + 1} / {printifyGeneratedPreviewUrls.length}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Se há imagem mas ainda não há mockups (preview inicial)
  if (userImageUrl) {
    return (
      <div className="relative h-full w-full bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="relative inline-block">
            <img
              src={userImageUrl}
              alt="Sua arte"
              className="w-32 h-32 object-cover rounded-lg shadow-lg border-4 border-white"
            />
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-2">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Arte Selecionada!</h3>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              A gerar o mockup do seu {selectedProduct.name}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estado vazio - sem imagem selecionada
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
      <div className="text-center space-y-6 p-8 max-w-sm">
        <div className="w-24 h-24 mx-auto bg-ghibli-moss/10 rounded-full flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-ghibli-moss" />
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-ghibli-earth">
            Escolha a sua arte
          </h3>
          <p className="text-ghibli-earth/70 text-sm leading-relaxed">
            Selecione uma das suas criações AI para personalizar este {selectedProduct.name}
          </p>
        </div>
      </div>
    </div>
  );
}; 