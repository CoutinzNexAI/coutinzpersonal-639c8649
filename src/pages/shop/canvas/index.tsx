import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPrintifyProductsByCategory } from '@/lib/printify/printifyProducts';

const CanvasShopPage: React.FC = () => {
  const canvasProducts = getPrintifyProductsByCategory('canvas');
  const productIds = Object.keys(canvasProducts);

  return (
    <>
      <Head>
        <title>Canvas Personalizados - Loja PicTuz</title>
        <meta name="description" content="Transforme as suas criações AI em canvas únicos. Canvas sem borda e com moldura personalizada." />
        <meta name="keywords" content="canvas personalizado, quadros personalizados, impressão canvas, decoração personalizada" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F0] via-[#F5F1E8] to-[#E8E0D0]">
        <Header />
        
        <main className="container mx-auto px-4 py-12 md:py-16">
          {/* Breadcrumb simplificado */}
          <div className="mb-8">
            <nav className="text-sm text-[#4A6B5B]">
              <Link href="/shop" className="hover:text-[#2D5A27] transition-colors">
                ← Voltar à Loja
              </Link>
            </nav>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-3xl md:text-5xl font-bold text-[#2D5A27] mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              🖼️ Canvas Personalizados
            </motion.h1>
            <motion.p 
              className="text-lg text-[#4A6B5B] max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Decore os seus espaços com arte única feita com as suas criações AI
            </motion.p>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {productIds.map((productId, index) => {
              const product = canvasProducts[productId];
              
              return (
                <motion.div
                  key={productId}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link href={`/shop/canvas/${productId}`}>
                    <div className="group bg-white rounded-2xl shadow-lg border border-[#E8E0D0] overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-[#F5F1E8] to-[#E8E0D0] p-8 flex items-center justify-center relative">
                        <div className="w-32 h-32 bg-white rounded-lg border-8 border-[#2D5A27] flex items-center justify-center relative shadow-lg">
                          <div className="text-4xl">🎨</div>
                          {/* Print area preview */}
                          <div className="absolute inset-2 bg-gray-100 rounded flex items-center justify-center">
                            <div className="text-xs text-gray-500">Arte</div>
                          </div>
                          {/* Frame for framed canvas */}
                          {productId === 'framed_canvas' && (
                            <div className="absolute inset-0 border-4 border-amber-800 rounded-lg"></div>
                          )}
                        </div>
                        {/* Preview Badge */}
                        <div className="absolute top-4 right-4 bg-[#2D5A27] text-white text-xs px-2 py-1 rounded-full">
                          Preview
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-[#2D5A27] mb-2 group-hover:text-[#4A6B5B] transition-colors">
                          {product.name}
                        </h3>
                        
                        {/* Specifications */}
                        <div className="text-sm text-[#4A6B5B] space-y-1 mb-4">
                          <div>🎨 Impressão de alta qualidade</div>
                          <div>📏 {product.variants?.length || 0} tamanhos disponíveis</div>
                          <div>✨ Cores vibrantes e duradouras</div>
                          {productId === 'custom_canvas' && <div>🖼️ Opções de borda espelhada</div>}
                          {productId === 'framed_canvas' && <div>🖼️ Moldura incluída</div>}
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-[#2D5A27]">
                            {product.basePrice ? `€${product.basePrice}` : `€${product.price || 20.00}`}
                          </div>
                          <div className="text-xs text-[#4A6B5B]/70">
                            + envio
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Info Section */}
          <motion.div 
            className="mt-16 bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto border border-[#E8E0D0]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-2xl font-semibold text-[#2D5A27] mb-6 text-center">
              ✨ Porquê Escolher Canvas PicTuz?
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-[#4A6B5B]">
              <div className="text-center">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="font-semibold mb-2">Qualidade Premium</h3>
                <p>Canvas de alta qualidade com impressão durável e cores vibrantes</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🖼️</div>
                <h3 className="font-semibold mb-2">Opções Versáteis</h3>
                <p>Escolha entre canvas sem borda ou com moldura elegante</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold mb-2">Pronto a Pendurar</h3>
                <p>Entregue pronto para decorar imediatamente o seu espaço</p>
              </div>
            </div>
          </motion.div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default CanvasShopPage; 