import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPrintifyProductsByCategory } from '@/lib/printify/printifyProducts';

const TecnologiaShopPage: React.FC = () => {
  const tecnologiaProducts = getPrintifyProductsByCategory('tecnologia');
  const productIds = Object.keys(tecnologiaProducts);

  return (
    <>
      <Head>
        <title>Tecnologia Personalizada - Loja PicTuz</title>
        <meta name="description" content="Transforme as suas criações AI em acessórios tecnológicos únicos. Capas de telemóvel personalizadas e mais." />
        <meta name="keywords" content="capas personalizadas, capa telemóvel, acessórios tecnologia, impressão personalizada" />
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
              📱 Tecnologia Personalizada
            </motion.h1>
            <motion.p 
              className="text-lg text-[#4A6B5B] max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Proteja os seus dispositivos com estilo único feito com as suas criações AI
            </motion.p>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {productIds.map((productId, index) => {
              const product = tecnologiaProducts[productId];
              
              return (
                <motion.div
                  key={productId}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link href={`/shop/tecnologia/${productId}`}>
                    <div className="group bg-white rounded-2xl shadow-lg border border-[#E8E0D0] overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-[#F5F1E8] to-[#E8E0D0] p-8 flex items-center justify-center relative">
                        <div className="w-20 h-36 bg-[#2D5A27] rounded-2xl border border-[#4A6B5B] flex items-center justify-center relative shadow-lg">
                          <div className="text-2xl text-white">📱</div>
                          {/* Print area preview */}
                          <div className="absolute inset-2 bg-white/20 rounded-xl flex items-center justify-center">
                            <div className="text-xs text-white/80">Arte</div>
                          </div>
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
                          <div>🛡️ Proteção premium anti-impacto</div>
                          <div>📱 {product.variants?.map(v => v.title).join(', ') || 'Múltiplos modelos'}</div>
                          <div>✨ Impressão de alta definição</div>
                          <div>🎯 Acesso a todas as funções</div>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-bold text-[#2D5A27]">
                            {product.basePrice ? `€${product.basePrice}` : `€${product.price || 15.00}`}
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
              ✨ Porquê Escolher Acessórios PicTuz?
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-[#4A6B5B]">
              <div className="text-center">
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="font-semibold mb-2">Proteção Superior</h3>
                <p>Material resistente que protege contra quedas e riscos</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="font-semibold mb-2">Impressão Duradoura</h3>
                <p>Cores vibrantes que não desbotam com o uso diário</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold mb-2">Acesso Total</h3>
                <p>Design que permite acesso completo a botões e portas</p>
              </div>
            </div>
          </motion.div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default TecnologiaShopPage; 