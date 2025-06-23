import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import CircularGallery, { GalleryItem } from '@/components/ui/circular-gallery/CircularGallery';
import { ArrowLeft, Sparkles, ShoppingBag, Palette } from 'lucide-react';

const GalleryDemo: React.FC = () => {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<GalleryItem | null>(null);

  const handleProductSelect = (product: GalleryItem) => {
    console.log('🎯 Produto selecionado:', product);
    setSelectedProduct(product);
    
    // Redirecionar após um breve momento para mostrar o feedback
    setTimeout(() => {
      router.push(product.url);
    }, 800);
  };

  return (
    <>
      <Head>
        <title>Galeria Interativa • PicTuz</title>
        <meta name="description" content="Explore nossa galeria interativa de produtos personalizados. Arraste para a direita e descubra nossas criações únicas." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="relative min-h-screen">
        {/* Header Navigation */}
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-sm font-medium text-gray-700">Voltar</span>
          </button>
        </div>

        {/* Logo */}
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              PicTuz
            </span>
          </div>
        </div>

        {/* Main Gallery */}
        <CircularGallery 
          onProductSelect={handleProductSelect}
          autoRotationSpeed={0.3}
          className="w-full h-screen"
        />

        {/* Product Selection Feedback */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-4 text-center transform animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Excelente Escolha!
              </h3>
              <p className="text-gray-600 mb-4">
                Redirecionando para <span className="font-semibold text-purple-600">{selectedProduct.name}</span>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Features Highlights */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="flex justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg max-w-4xl w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Palette className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Design Personalizado
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-pink-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Qualidade Premium
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">
                    IA Avançada
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-in {
          animation: animate-in 0.3s ease-out;
        }
        
        .zoom-in-95 {
          transform: scale(0.95);
        }
        
        .duration-300 {
          transition-duration: 300ms;
        }

        /* Hide scrollbars but keep functionality */
        html {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        html::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default GalleryDemo; 