import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPrintifyProductsByCategory } from '@/lib/printify/printifyProducts';

const StationeryShopPage: React.FC = () => {
  const stationeryProducts = getPrintifyProductsByCategory('stationery');
  const productIds = Object.keys(stationeryProducts);

  return (
    <>
      <Head>
        <title>Cadernos Personalizados - Loja PicTuz</title>
        <meta name="description" content="Transforme as suas criações AI em cadernos únicos. Papelaria de qualidade premium para as suas ideias." />
        <meta name="keywords" content="cadernos personalizados, caderno espiral, papelaria personalizada, impressão em caderno" />
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
              📓 Cadernos Personalizados
            </motion.h1>
            <motion.p 
              className="text-lg text-ghibli-earth max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Anote as suas ideias com estilo único em cadernos personalizados
            </motion.p>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {productIds.map((productId, index) => {
              const product = stationeryProducts[productId];
              
              return (
                <motion.div
                  key={productId}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link href={`/shop/stationery/${productId}`}>
                    <div className="group bg-white rounded-2xl shadow-lg border border-ghibli-sand/30 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 flex items-center justify-center relative">
                        <div className="w-24 h-32 bg-white rounded border-2 border-ghibli-wood/20 flex items-center justify-center relative shadow-md">
                          <div className="text-3xl text-ghibli-wood/50">📓</div>
                          {/* Print area preview */}
                          <div className="absolute inset-1 bg-ghibli-moss/20 rounded flex items-center justify-center">
                            <div className="text-xs text-ghibli-wood/60">Arte</div>
                          </div>
                        </div>
                        {/* Preview Badge */}
                        <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
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
                          <div>📏 Formato A5 (150×240mm)</div>
                          <div>📝 {product.variants?.map(v => v.title).join(', ') || 'Páginas em branco'}</div>
                          <div>🌀 Encadernação espiral</div>
                          <div>✨ Papel de qualidade premium</div>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-ghibli-wood">
                            {product.basePrice ? `€${product.basePrice}` : `€${product.price || 20.00}`}
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
              ✨ Porquê Escolher Cadernos PicTuz?
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-ghibli-earth">
              <div className="text-center">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="font-semibold mb-2">Papel Premium</h3>
                <p>Papel de alta qualidade, ideal para escrita e desenho</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🌀</div>
                <h3 className="font-semibold mb-2">Espiral Resistente</h3>
                <p>Encadernação durável que permite abrir 360°</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="font-semibold mb-2">Capa Personalizada</h3>
                <p>A sua arte AI na capa, tornando cada caderno único</p>
              </div>
            </div>
          </motion.div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default StationeryShopPage; 