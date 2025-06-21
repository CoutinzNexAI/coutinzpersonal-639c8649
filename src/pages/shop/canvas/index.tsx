import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PIC_TUZ_PRINTIFY_PRODUCT_MAP } from '@/lib/printify/printifyProducts';

const CanvasCategoryPage = () => {
  const canvasProducts = [
    PIC_TUZ_PRINTIFY_PRODUCT_MAP['custom_canvas'],
    PIC_TUZ_PRINTIFY_PRODUCT_MAP['framed_canvas']
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/shop" 
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar para a Loja
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Nossos Canvas</h1>
          <p className="text-gray-600 text-lg">
            Transforme as suas fotos em arte decorativa de alta qualidade
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {canvasProducts.map((product) => (
            <Link key={product.id} href={`/shop/canvas/${product.id}`}>
              <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={product.mockupInitialPath}
                      alt={product.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        // Fallback para uma imagem placeholder se o mockup não existir
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-800">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        A partir de €{product.basePrice?.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.variants?.length} tamanhos disponíveis
                      </p>
                    </div>
                    <div className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
                      {product.id === 'custom_canvas' ? 'Sem Moldura' : 'Com Moldura'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Por que escolher os nossos Canvas?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Alta Qualidade</h3>
              <p className="text-gray-600 text-sm">
                Impressão profissional em canvas de alta qualidade com cores vibrantes
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📏</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Vários Tamanhos</h3>
              <p className="text-gray-600 text-sm">
                Desde 10"x10" até 18"x18", encontre o tamanho perfeito para o seu espaço
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Entrega Rápida</h3>
              <p className="text-gray-600 text-sm">
                Produção e entrega rápida para que possa decorar o seu espaço em breve
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasCategoryPage; 