import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PromotionalBanner from '@/components/landing/PromotionalBanner';
import { getPrintifyProductsByCategory } from '@/lib/printify/printifyProducts';

const MugShopPage: React.FC = () => {
  const mugProducts = getPrintifyProductsByCategory('mug');
  const productIds = Object.keys(mugProducts);

  return (
    <>
      <Head>
        <title>Canecas Personalizadas - Loja PicTuz</title>
        <meta name="description" content="Transforme as suas criações AI em canecas únicas. Cerâmica de qualidade e impressão durável." />
        <meta name="keywords" content="canecas personalizadas, caneca cerâmica, caneca coração, impressão personalizada" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        {/* Banner Promocional */}
        <PromotionalBanner />

        {/* Header com margem ajustada */}
        <div className="relative z-40 mt-8">
          <Header />
        </div>
        
        <main className="container mx-auto px-4 py-16 md:py-20 lg:py-24">
          {/* Header */}
          <div className="text-center mb-20 lg:mb-24">
            <motion.h1 
              className="text-3xl md:text-5xl font-ghibli font-bold text-ghibli-wood mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              ☕ Canecas Personalizadas
            </motion.h1>
            <motion.p 
              className="text-lg text-ghibli-earth max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Comece o dia com uma caneca única feita com as suas criações AI
            </motion.p>
          </div>

          {/* Desktop Layout: Products Left + Info Right */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
            {/* Left: Products (2 columns) */}
            <div className="lg:col-span-2">
              <div className="grid md:grid-cols-2 gap-8 justify-center">
                {productIds.map((productId, index) => {
                  const product = mugProducts[productId];
                  
                  // Get correct mockup image
                  const mockupImage = product.id === 'heart_mug' 
                    ? '/mockupproduto/canecacoracao.png'
                    : '/mockupproduto/canecapersonalizada.png';
                  
                  return (
                    <motion.div
                      key={productId}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      className="w-full max-w-sm mx-auto"
                    >
                      <Link href={`/shop/mug/${productId}`}>
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
                                <span>Cerâmica de qualidade premium</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full"></div>
                                <span>{product.id === 'heart_mug' ? 'Formato especial de coração' : 'Padrão (330ml), Grande (450ml)'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full"></div>
                                <span>Impressão resistente à lavagem</span>
                              </div>
                              {product.id === 'heart_mug' && (
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                  <span className="font-medium text-red-600">Formato especial de coração ❤️</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Price */}
                            <div className="flex items-center justify-center">
                              <div className="text-2xl font-bold text-ghibli-moss">
                                €{product.basePrice || product.price || 25.00}
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
                  ✨ Porquê Escolher Canecas PicTuz?
                </h2>
                <div className="space-y-6 text-sm text-ghibli-earth">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🏺</span>
                    </div>
                    <h3 className="font-semibold mb-2 text-ghibli-wood">Cerâmica Premium</h3>
                    <p>Material de alta qualidade, resistente e durável para uso diário</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🎨</span>
                    </div>
                    <h3 className="font-semibold mb-2 text-ghibli-wood">Cores Vibrantes</h3>
                    <p>Impressão de alta definição que mantém as cores vívidas por muito tempo</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🔄</span>
                    </div>
                    <h3 className="font-semibold mb-2 text-ghibli-wood">Lavável</h3>
                    <p>Resistente à máquina de lavar loiça e micro-ondas</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Mobile Layout: Stacked Products */}
          <div className="lg:hidden">
            <div className="grid gap-6 max-w-md mx-auto">
              {productIds.map((productId, index) => {
                const product = mugProducts[productId];
                
                // Get correct mockup image
                const mockupImage = product.id === 'heart_mug' 
                  ? '/mockupproduto/canecacoracao.png'
                  : '/mockupproduto/canecapersonalizada.png';
                
                return (
                  <motion.div
                    key={productId}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    <Link href={`/shop/mug/${productId}`}>
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
                            <div>🏺 Cerâmica premium</div>
                            <div>☕ {product.variants?.length > 1 ? 'Múltiplos tamanhos' : '330 ml'}</div>
                            <div>✨ Impressão resistente</div>
                            {product.id === 'heart_mug' && <div>💝 Formato coração</div>}
                          </div>
                          
                          {/* Price */}
                          <div className="flex items-center justify-center">
                            <div className="text-xl font-bold text-ghibli-moss">
                              €{product.basePrice || product.price || 25.00}
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
                  <div className="text-2xl mb-2">🏺</div>
                  <h3 className="font-semibold mb-1 text-ghibli-wood">Premium</h3>
                  <p className="text-xs text-ghibli-earth">Cerâmica de qualidade</p>
                </div>
                <div>
                  <div className="text-2xl mb-2">🎨</div>
                  <h3 className="font-semibold mb-1 text-ghibli-wood">HD</h3>
                  <p className="text-xs text-ghibli-earth">Impressão vibrante</p>
                </div>
                <div>
                  <div className="text-2xl mb-2">🔄</div>
                  <h3 className="font-semibold mb-1 text-ghibli-wood">Lavável</h3>
                  <p className="text-xs text-ghibli-earth">Resistente</p>
                </div>
                <div>
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="font-semibold mb-1 text-ghibli-wood">Rápido</h3>
                  <p className="text-xs text-ghibli-earth">~1 semana</p>
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

export default MugShopPage; 