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
        <title>Quadros Canvas Personalizados - Loja PicTuz</title>
        <meta name="description" content="Transforme as suas criações AI em quadros canvas únicos. Impressão de alta qualidade em tela profissional." />
        <meta name="keywords" content="quadros canvas, impressão canvas, quadros personalizados, arte AI impressa" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-4 py-12 md:py-16">
          {/* Breadcrumb simplificado */}
          <div className="mb-8">
            <nav className="text-sm text-ghibli-earth">
              <Link href="/shop" className="hover:text-ghibli-moss transition-colors">
                ← Voltar à Loja
              </Link>
            </nav>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-3xl md:text-5xl font-ghibli font-bold text-ghibli-wood mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              🖼️ Quadros Canvas Personalizados
            </motion.h1>
            <motion.p 
              className="text-lg text-ghibli-earth max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Transforme as suas criações AI em quadros canvas de qualidade profissional
            </motion.p>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                    <div className="group bg-white rounded-2xl shadow-lg border border-ghibli-sand/30 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-amber-50 to-amber-100 p-8 flex items-center justify-center relative">
                        <div className="w-32 h-32 bg-white rounded border-4 border-amber-800/30 flex items-center justify-center relative shadow-md">
                          <div className="text-3xl text-ghibli-wood/50">🖼️</div>
                          {/* Print area preview */}
                          <div className="absolute inset-2 bg-ghibli-moss/20 rounded flex items-center justify-center">
                            <div className="text-xs text-ghibli-wood/60">Arte</div>
                          </div>
                        </div>
                        {/* Preview Badge */}
                        <div className="absolute top-4 right-4 bg-amber-600 text-white text-xs px-2 py-1 rounded-full">
                          Preview
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-ghibli-wood mb-2 group-hover:text-ghibli-moss transition-colors">
                          {product.name}
                        </h3>
                        
                        {/* Specifications */}
                        <div className="text-sm text-ghibli-earth space-y-1 mb-4">
                          <div>📏 {product.gelatoPrintDimensionsMm.width}×{product.gelatoPrintDimensionsMm.height}mm</div>
                          <div>🖼️ Canvas premium sem moldura</div>
                          <div>✨ Impressão de alta definição</div>
                          <div>🌿 Materiais sustentáveis</div>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-ghibli-wood">
                            €{product.price || 30.00}
                          </div>
                          <div className="text-xs text-ghibli-earth/70">
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
            className="mt-16 bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto border border-ghibli-sand/30"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-2xl font-semibold text-ghibli-wood mb-6 text-center">
              ✨ Porquê Escolher Quadros Canvas PicTuz?
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-ghibli-earth">
              <div className="text-center">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="font-semibold mb-2">Qualidade Museum</h3>
                <p>Canvas premium com impressão de qualidade profissional</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🌿</div>
                <h3 className="font-semibold mb-2">Sustentável</h3>
                <p>Materiais ecológicos e processo de produção responsável</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold mb-2">Pronto a Pendurar</h3>
                <p>Chega pronto para decorar a sua casa ou escritório</p>
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