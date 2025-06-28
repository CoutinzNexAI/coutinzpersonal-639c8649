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

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
          {/* Header */}
          <div className="text-center mb-20 lg:mb-24">
            <motion.h1 
              className="text-3xl md:text-5xl font-ghibli font-bold text-ghibli-wood mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              🖼️ Canvas Personalizados
            </motion.h1>
            <motion.p 
              className="text-lg text-ghibli-earth max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Decore os seus espaços com arte única feita com as suas criações AI
            </motion.p>
          </div>

          {/* Desktop Layout: Products Left + Info Right */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
            {/* Left: Products (2 columns) */}
            <div className="lg:col-span-2">
              <div className="grid md:grid-cols-2 gap-8 justify-center">
            {productIds.map((productId, index) => {
              const product = canvasProducts[productId];
              
                  // Get correct mockup image
                  const mockupImage = product.id === 'framed_canvas' 
                    ? '/mockupproduto/canvamoldura.png'
                    : '/mockupproduto/canva.png';
                  
              return (
                <motion.div
                  key={productId}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      className="w-full max-w-sm mx-auto"
                >
                  <Link href={`/shop/canvas/${productId}`}>
                        <div className="group bg-white rounded-2xl shadow-lg border border-ghibli-sand/30 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer h-full">
                          {/* Product Image with Real Mockup */}
                          <div className="aspect-square bg-gradient-to-br from-ghibli-cream/50 to-ghibli-sand/30 p-8 flex items-center justify-center relative">
                            <img
                              src={mockupImage}
                              alt={product.name}
                              className="w-40 h-40 object-contain drop-shadow-lg"
                            />
                        {/* Preview Badge */}
                            <div className="absolute top-4 right-4 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Preview
                        </div>
                      </div>
                      
                      {/* Product Info */}
                          <div className="p-6 flex-1">
                            <h3 className="text-xl font-semibold text-ghibli-wood mb-3 group-hover:text-ghibli-moss transition-colors">
                          {product.name}
                        </h3>
                        
                        {/* Specifications */}
                            <div className="text-sm text-ghibli-earth space-y-2 mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full"></div>
                                <span>Canvas de qualidade premium</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full"></div>
                                <span>{product.variants?.length || 0} tamanhos disponíveis</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full"></div>
                                <span>Impressão resistente e durável</span>
                              </div>
                              {product.id === 'framed_canvas' && (
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                                  <span className="font-medium text-amber-700">Moldura elegante incluída 🖼️</span>
                                </div>
                              )}
                              {product.id === 'custom_canvas' && (
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  <span className="font-medium text-blue-600">Opções de borda espelhada ✨</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Price */}
                            <div className="flex items-center justify-center">
                              <div className="text-2xl font-bold text-ghibli-moss">
                                €{product.basePrice || product.price || 20.00}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right: Info Section */}
            <div className="lg:col-span-1">
              <motion.div 
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-ghibli-sand/30 sticky top-8"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h2 className="text-2xl font-semibold text-ghibli-wood mb-6 text-center">
                  ✨ Porquê Escolher Canvas PicTuz?
                </h2>
                <div className="space-y-6 text-sm text-ghibli-earth">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🎨</span>
                    </div>
                    <h3 className="font-semibold mb-2 text-ghibli-wood">Qualidade Premium</h3>
                    <p>Canvas de alta qualidade com impressão durável e cores vibrantes</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🖼️</span>
                    </div>
                    <h3 className="font-semibold mb-2 text-ghibli-wood">Opções Versáteis</h3>
                    <p>Escolha entre canvas sem moldura ou com moldura elegante já incluída</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">⚡</span>
                    </div>
                    <h3 className="font-semibold mb-2 text-ghibli-wood">Pronto a Pendurar</h3>
                    <p>Entregue pronto para decorar imediatamente o seu espaço favorito</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Mobile Layout: Stacked Products */}
          <div className="lg:hidden">
            <div className="grid gap-6 max-w-md mx-auto">
              {productIds.map((productId, index) => {
                const product = canvasProducts[productId];
                
                // Get correct mockup image
                const mockupImage = product.id === 'framed_canvas' 
                  ? '/mockupproduto/canvamoldura.png'
                  : '/mockupproduto/canva.png';
                
                return (
                  <motion.div
                    key={productId}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <Link href={`/shop/canvas/${productId}`}>
                      <div className="group bg-white rounded-2xl shadow-lg border border-ghibli-sand/30 overflow-hidden hover:shadow-xl transition-all duration-300 active:scale-95 cursor-pointer">
                        {/* Product Image */}
                        <div className="aspect-[4/3] bg-gradient-to-br from-ghibli-cream/50 to-ghibli-sand/30 p-6 flex items-center justify-center relative">
                          <img
                            src={mockupImage}
                            alt={product.name}
                            className="w-32 h-32 object-contain drop-shadow-lg"
                          />
                          {/* Preview Badge */}
                          <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Preview
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <div className="p-5">
                          <h3 className="text-lg font-semibold text-ghibli-wood mb-2 group-hover:text-ghibli-moss transition-colors">
                            {product.name}
                          </h3>
                          
                          {/* Key Features */}
                          <div className="text-sm text-ghibli-earth space-y-1 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full"></div>
                              <span>Canvas premium</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full"></div>
                              <span>{product.variants?.length || 0} tamanhos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full"></div>
                              <span>Impressão durável</span>
                            </div>
                            {product.id === 'framed_canvas' && (
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                                <span className="font-medium text-amber-700">🖼️ Com moldura</span>
                              </div>
                            )}
                            {product.id === 'custom_canvas' && (
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span className="font-medium text-blue-600">✨ Borda espelhada</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Price */}
                          <div className="flex items-center justify-center">
                            <div className="text-xl font-bold text-ghibli-moss">
                              €{product.basePrice || product.price || 20.00}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

            {/* Mobile Info Section */}
          <motion.div 
              className="mt-12 bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-ghibli-sand/30"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
              <h2 className="text-xl font-semibold text-ghibli-wood mb-4 text-center">
                ✨ Porquê Escolher PicTuz?
            </h2>
              <div className="grid grid-cols-2 gap-4 text-center text-sm">
                <div>
                  <div className="text-2xl mb-2">🎨</div>
                  <h3 className="font-semibold mb-1 text-ghibli-wood">Premium</h3>
                  <p className="text-xs text-ghibli-earth">Canvas de qualidade</p>
                </div>
                <div>
                  <div className="text-2xl mb-2">🖼️</div>
                  <h3 className="font-semibold mb-1 text-ghibli-wood">Versátil</h3>
                  <p className="text-xs text-ghibli-earth">Com/sem moldura</p>
                </div>
                <div>
                  <div className="text-2xl mb-2">✨</div>
                  <h3 className="font-semibold mb-1 text-ghibli-wood">Durável</h3>
                  <p className="text-xs text-ghibli-earth">Impressão resistente</p>
              </div>
                <div>
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="font-semibold mb-1 text-ghibli-wood">Pronto</h3>
                  <p className="text-xs text-ghibli-earth">Para pendurar</p>
              </div>
              </div>
            </motion.div>
            </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default CanvasShopPage; 