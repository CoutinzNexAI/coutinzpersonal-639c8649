import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPrintifyProductsByCategory } from '@/lib/printify/printifyProducts';

const BagsShopPage: React.FC = () => {
  const bagsProducts = getPrintifyProductsByCategory('bags');
  const productIds = Object.keys(bagsProducts);

  return (
    <>
      <Head>
        <title>Sacos Personalizados - Loja PicTuz</title>
        <meta name="description" content="Transforme as suas criações AI em sacos únicos. Tote bags de qualidade premium e impressão durável." />
        <meta name="keywords" content="sacos personalizados, tote bag, saco algodão, impressão personalizada" />
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
              🛍️ Sacos Personalizados
            </motion.h1>
            <motion.p 
              className="text-lg text-ghibli-earth max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Leve a sua arte para todo o lado com sacos sustentáveis e únicos
            </motion.p>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {productIds.map((productId, index) => {
              const product = bagsProducts[productId];
              
              return (
                <motion.div
                  key={productId}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link href={`/shop/bags/${productId}`}>
                    <div className="group bg-white rounded-2xl shadow-lg border border-ghibli-sand/30 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 flex items-center justify-center relative">
                        <div className="w-32 h-40 bg-white rounded-lg border-2 border-ghibli-wood/20 flex items-center justify-center relative shadow-md">
                          <div className="text-4xl text-ghibli-wood/50">🛍️</div>
                          {/* Print area preview */}
                          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-20 h-24 bg-ghibli-moss/20 rounded flex items-center justify-center">
                            <div className="text-xs text-ghibli-wood/60">Arte</div>
                          </div>
                        </div>
                        {/* Preview Badge */}
                        <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
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
                          <div>👜 {product.variants?.map(v => v.title).join(', ') || 'Tamanho único'}</div>
                          <div>🌱 100% Algodão orgânico</div>
                          <div>✨ Impressão resistente</div>
                          <div>♻️ Reutilizável e ecológico</div>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-ghibli-wood">
                            {product.basePrice ? `€${product.basePrice}` : `€${product.price || 25.00}`}
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
              ✨ Porquê Escolher Sacos PicTuz?
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-ghibli-earth">
              <div className="text-center">
                <div className="text-3xl mb-3">🌱</div>
                <h3 className="font-semibold mb-2">100% Sustentável</h3>
                <p>Algodão orgânico certificado, produção ecológica</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">💪</div>
                <h3 className="font-semibold mb-2">Resistente</h3>
                <p>Material durável para uso diário, lavável em máquina</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="font-semibold mb-2">Arte Vibrante</h3>
                <p>Impressão de alta qualidade que preserva as cores</p>
              </div>
            </div>
          </motion.div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default BagsShopPage; 