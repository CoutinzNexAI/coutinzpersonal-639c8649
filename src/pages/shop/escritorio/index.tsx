import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPrintifyProductsByCategory } from '@/lib/printify/printifyProducts';

const EscritorioShopPage: React.FC = () => {
  // ✅ USAR A NOVA CATEGORIA UNIFICADA 'escritorio'
  const escritorioProducts = getPrintifyProductsByCategory('escritorio');
  
  // ✅ FALLBACK: Se não encontrar produtos na nova categoria, tentar as antigas (backwards compatibility)
  const legacyNotebookProducts = getPrintifyProductsByCategory('stationery');
  const legacyMousepadProducts = getPrintifyProductsByCategory('office');
  
  // Combinar todos os produtos (nova categoria + fallback)
  const allProductsData = { 
    ...escritorioProducts, 
    ...legacyNotebookProducts, 
    ...legacyMousepadProducts 
  };
  
  const allProducts = Object.keys(allProductsData);

  console.log('🏢 [ESCRITORIO PAGE] Produtos encontrados:', {
    escritorioProducts: Object.keys(escritorioProducts),
    legacyNotebook: Object.keys(legacyNotebookProducts),
    legacyMousepad: Object.keys(legacyMousepadProducts),
    total: allProducts.length
  });

  return (
    <>
      <Head>
        <title>Produtos de Escritório - Loja PicTuz</title>
        <meta name="description" content="Transforme o seu espaço de trabalho com produtos personalizados únicos. Cadernos e mousepads com as suas criações AI." />
        <meta name="keywords" content="cadernos personalizados, mousepads personalizados, escritório personalizado, impressão personalizada" />
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
              📝 Produtos de Escritório
            </motion.h1>
            <motion.p 
              className="text-lg text-[#4A6B5B] max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Transforme o seu espaço de trabalho com produtos personalizados únicos
            </motion.p>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {allProducts.map((productId, index) => {
              const product = allProductsData[productId];
              // ✅ DETECTAR TIPO DE PRODUTO: Por ID do produto em vez de categoria
              const isNotebook = productId.includes('journal') || productId.includes('caderno') || product.category === 'stationery';
              const isMousepad = productId.includes('mouse_pad') || productId.includes('mousepad') || product.category === 'office';
              
              return (
              <motion.div
                  key={productId}
                  initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                  <Link href={`/shop/escritorio/${productId}`}>
                    <div className="group bg-white rounded-2xl shadow-lg border border-[#E8E0D0] overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-[#F5F1E8] to-[#E8E0D0] p-8 flex items-center justify-center relative">
                        {isNotebook ? (
                          <div className="w-24 h-32 bg-white rounded-lg border-2 border-[#2D5A27] flex items-center justify-center relative shadow-lg">
                            <div className="text-3xl">📝</div>
                            {/* Print area preview */}
                            <div className="absolute inset-2 bg-gray-100 rounded flex items-center justify-center">
                              <div className="text-xs text-gray-500">Arte</div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-36 h-24 bg-[#2D5A27] rounded-xl flex items-center justify-center relative shadow-lg">
                            <div className="text-3xl text-white">🖱️</div>
                            {/* Print area preview */}
                            <div className="absolute inset-2 bg-white/20 rounded-lg flex items-center justify-center">
                              <div className="text-xs text-white/80">Arte</div>
                            </div>
                          </div>
                      )}
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
                          <div>📏 {product.variants?.length || 0} opções disponíveis</div>
                          <div>✨ Duradouro e resistente</div>
                          {isNotebook ? (
                            <div>📝 Páginas lisas para criar</div>
                          ) : (
                            <div>🖱️ Base antiderrapante</div>
                          )}
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
              ✨ Porquê Escolher Produtos de Escritório PicTuz?
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-[#4A6B5B]">
              <div className="text-center">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="font-semibold mb-2">Qualidade Premium</h3>
                <p>Materiais de alta qualidade com impressão durável e cores vibrantes</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="font-semibold mb-2">Funcionalidade</h3>
                <p>Produtos práticos que combinam estilo único com utilidade diária</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold mb-2">Inspiração Diária</h3>
                <p>Transforme o seu espaço de trabalho num lugar único e inspirador</p>
              </div>
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default EscritorioShopPage;