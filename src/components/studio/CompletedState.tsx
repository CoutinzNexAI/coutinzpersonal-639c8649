import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

interface CompletedStateProps {
  originalImageUrl: string;
  transformedImageUrl: string;
  transformationId: string;
  onDownload: () => void;
  onNewImage: () => void;
}

interface MockupData {
  mockupUrl: string;
  printifyProductId: string;
  printifyImageId: string;
}

const CompletedState: React.FC<CompletedStateProps> = ({
  originalImageUrl,
  transformedImageUrl,
  transformationId,
  onDownload,
  onNewImage,
}) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [posterMockup, setPosterMockup] = useState<MockupData | null>(null);
  const [mugMockup, setMugMockup] = useState<MockupData | null>(null);
  const [notebookMockup, setNotebookMockup] = useState<MockupData | null>(null);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [isGeneratingMug, setIsGeneratingMug] = useState(false);
  const [isGeneratingNotebook, setIsGeneratingNotebook] = useState(false);
  const [allMockupsReady, setAllMockupsReady] = useState(false);

  // Configuração dos produtos no carousel
  const products = [
    {
      id: 'poster',
      name: 'Poster Vertical',
      mockup: posterMockup,
      isGenerating: isGeneratingPoster,
      route: '/shop/poster/poster_vertical_semi_glossy',
      price: '€20.00'
    },
    {
      id: 'mug',
      name: 'Caneca Coração',
      mockup: mugMockup,
      isGenerating: isGeneratingMug,
      route: '/shop/mug/heart_mug',
      price: '€30.00'
    },
    {
      id: 'notebook',
      name: 'Caderno',
      mockup: notebookMockup,
      isGenerating: isGeneratingNotebook,
      route: '/shop/escritorio/spiral_journal',
      price: '€20.00'
    },
    {
      id: 'original',
      name: 'Imagem Original',
      mockup: null,
      isGenerating: false,
      route: null,
      price: null
    }
  ];

  const currentProduct = products[currentIndex];

  // Função para gerar mockup
  const generateMockup = async (
    productId: string,
    variantId: number,
    imageUrl: string,
    setMockup: (mockup: MockupData | null) => void,
    setIsGenerating: (loading: boolean) => void
  ) => {
    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          variant_id: variantId,
          image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na geração: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.mockupUrl && data.printifyProductId && data.printifyImageId) {
        setMockup({
          mockupUrl: data.mockupUrl,
          printifyProductId: data.printifyProductId,
          printifyImageId: data.printifyImageId,
        });
      }
    } catch (error) {
      console.error(`Erro ao gerar mockup ${productId}:`, error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Gerar todos os mockups em paralelo
  useEffect(() => {
    const generateAllMockups = async () => {
      const promises = [
        // Poster (imediato)
        generateMockup(
          'poster_vertical_semi_glossy',
          101836,
          transformedImageUrl,
          setPosterMockup,
          setIsGeneratingPoster
        ),
        
        // Caneca (delay 1s, usa 3ª imagem se disponível)
        new Promise(resolve => {
          setTimeout(async () => {
            // Tentar usar a 3ª imagem das preview URLs se disponível
            const imageToUse = transformedImageUrl; // Por agora usar a mesma, depois podemos implementar previewUrls[2]
            await generateMockup(
              'heart_mug',
              77224,
              imageToUse,
              setMugMockup,
              setIsGeneratingMug
            );
            resolve(void 0);
          }, 1000);
        }),
        
        // Caderno (delay 2s)
        new Promise(resolve => {
          setTimeout(async () => {
            await generateMockup(
              'spiral_journal',
              65482,
              transformedImageUrl,
              setNotebookMockup,
              setIsGeneratingNotebook
            );
            resolve(void 0);
          }, 2000);
        })
      ];

      await Promise.all(promises);
      setAllMockupsReady(true);
    };

    generateAllMockups();
  }, [transformedImageUrl]);

  const handleProductClick = () => {
    if (currentProduct.id === 'original') {
      onDownload();
      return;
    }

    const mockup = currentProduct.mockup;
    if (!mockup) {
      toast.error('Mockup ainda não está pronto');
      return;
    }

    const queryParams = new URLSearchParams({
      imageUrl: transformedImageUrl,
      imageId: transformationId,
      printifyProductId: mockup.printifyProductId,
      printifyImageId: mockup.printifyImageId,
      fromTransformation: 'true'
    }).toString();

    router.push(`${currentProduct.route}?${queryParams}`);
    toast.success('Arte aplicada automaticamente!');
  };

  const nextProduct = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevProduct = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  // Mostrar loading até todos os mockups estarem prontos
  if (!allMockupsReady) {
    return (
      <div className="flex flex-col items-center space-y-6 p-8">
        <div className="w-full max-w-md aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <img 
            src={transformedImageUrl} 
            alt="Transformação"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-lg font-semibold text-gray-700">A preparar produtos...</p>
          <p className="text-sm text-gray-500">A gerar mockups personalizados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-8">
      {/* Carousel de Produtos */}
      <div className="relative w-full max-w-md">
        {/* Navegação Esquerda */}
        <button
          onClick={prevProduct}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white/90 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Navegação Direita */}
        <button
          onClick={nextProduct}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white/90 transition-all"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>

        {/* Imagem do Produto */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
          {currentProduct.id === 'original' ? (
            <img 
              src={transformedImageUrl} 
              alt="Imagem Original"
              className="w-full h-full object-cover"
            />
          ) : currentProduct.mockup ? (
            <img 
              src={currentProduct.mockup.mockupUrl} 
              alt={currentProduct.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src={transformedImageUrl} 
                alt="A gerar..."
                className="w-full h-full object-cover opacity-50"
              />
              {currentProduct.isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                  <div className="text-white text-sm font-medium px-3 py-1 bg-black/50 rounded-full">
                    A gerar...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Indicadores */}
        <div className="flex justify-center mt-4 space-x-2">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-blue-500 w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Informações do Produto */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-500">Produto Recomendado</p>
        <h3 className="text-xl font-semibold text-gray-800">{currentProduct.name}</h3>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col w-full max-w-md space-y-3">
        {/* Botão Principal */}
        <Button
          onClick={handleProductClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
        >
          {currentProduct.id === 'original' ? 'Baixar Imagem' : `Ver Produto - ${currentProduct.price}`}
        </Button>

        {/* Botões Secundários */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onDownload}
            className="flex-1 flex items-center justify-center space-x-2 py-2"
          >
            <Download className="w-4 h-4" />
            <span>Original</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={onNewImage}
            className="flex-1 py-2"
          >
            Nova Imagem
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompletedState;