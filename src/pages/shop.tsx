import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';

const ShopPage: React.FC = () => {
  const categories = [
    {
      id: 'canvas',
      name: 'Quadros',
      description: 'Transforme as suas criações em quadros de arte',
      icon: '🖼️',
      image: '/assets/mockups/canvas/canvas_20x20_mockup_blank_front.png',
      href: '/shop/canvas'
    },
    {
      id: 'apparel',
      name: 'Roupa',
      description: 'Vista as suas criações AI',
      icon: '👕',
      image: '/assets/mockups/tshirt/tshirt_m_white_mockup_front.png',
      href: '/shop/apparel'
    },
    {
      id: 'mug',
      name: 'Canecas',
      description: 'Beba a sua arte todos os dias',
      icon: '☕',
      image: '/assets/mockups/mug/mug_white_mockup_blank.png',
      href: '/shop/mug'
    },
    {
      id: 'phone-case',
      name: 'Capas de Telemóvel',
      description: 'Proteja o seu telemóvel com estilo',
      icon: '📱',
      image: '/assets/mockups/phone-case/iphone_15_case_mockup_blank.png',
      href: '/shop/phone-case'
    }
  ];

  return (
    <>
      <Head>
        <title>Loja PicTuz - Transforme Arte AI em Produtos Físicos</title>
        <meta name="description" content="Transforme as suas criações de arte AI em produtos físicos únicos. Quadros, t-shirts, posters, canecas e capas de telemóvel personalizadas." />
        <meta name="keywords" content="loja pictuz, produtos personalizados, arte AI impressa, quadros canvas, t-shirts personalizadas" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16">
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-ghibli font-bold text-ghibli-wood mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              🛍️ Loja PicTuz
            </motion.h1>
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-ghibli-earth max-w-3xl mx-auto px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Transforme as suas criações de arte AI em produtos físicos únicos e de alta qualidade
            </motion.p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={category.href}>
                  <div className="group bg-white rounded-2xl shadow-lg border border-ghibli-sand/30 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105 cursor-pointer active:scale-95">
                    {/* Category Image */}
                    <div className="aspect-square bg-gradient-to-br from-ghibli-cream to-ghibli-sand/50 p-6 sm:p-8 flex items-center justify-center relative overflow-hidden">
                      {/* Decorative pattern */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="w-full h-full bg-gradient-to-br from-ghibli-moss/10 to-transparent"></div>
                      </div>
                      
                      <div className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg relative z-10">
                        {category.icon}
                      </div>
                      
                      {/* Premium badge */}
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg opacity-90">
                        ✓ Premium
                      </div>
                      
                      {/* Quality indicator */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-ghibli-wood/70 font-medium">Alta Qualidade</span>
                      </div>
                    </div>
                    
                    {/* Category Info */}
                    <div className="p-4 sm:p-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-ghibli-wood mb-2 group-hover:text-ghibli-moss transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-ghibli-earth text-sm leading-relaxed mb-3">
                        {category.description}
                      </p>
                      
                      {/* Products Count & CTA */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-ghibli-earth/70">
                          {Object.keys(getPrintifyProductsByCategory(category.id as PrintifyProductMapping['category'])).length} produtos
                        </div>
                        <div className="text-xs text-ghibli-moss font-medium group-hover:text-ghibli-wood transition-colors">
                          Ver produtos →
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Trust indicators */}
          <motion.div 
            className="mt-12 sm:mt-16 flex flex-wrap justify-center gap-4 sm:gap-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="flex items-center gap-2 text-sm text-ghibli-earth">
              <span className="text-green-500">✓</span>
              <span>Impressão profissional</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ghibli-earth">
              <span className="text-green-500">✓</span>
              <span>Entrega rápida</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ghibli-earth">
              <span className="text-green-500">✓</span>
              <span>Garantia de qualidade</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ghibli-earth">
              <span className="text-green-500">✓</span>
              <span>Suporte 24/7</span>
            </div>
          </motion.div>

          {/* Info Section */}
          <motion.div 
            className="mt-16 sm:mt-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto border border-ghibli-sand/30 shadow-xl">
              <h2 className="text-xl sm:text-2xl font-semibold text-ghibli-wood mb-6">
                ✨ Como Funciona
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-ghibli-earth">
                <div className="text-center p-4 rounded-xl bg-ghibli-cream/30">
                  <div className="text-3xl mb-3">🎨</div>
                  <h3 className="font-semibold mb-2 text-ghibli-wood">1. Escolha o Produto</h3>
                  <p>Selecione o produto físico que deseja personalizar</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-ghibli-moss/10">
                  <div className="text-3xl mb-3">🖼️</div>
                  <h3 className="font-semibold mb-2 text-ghibli-wood">2. Use a Sua Arte AI</h3>
                  <p>A sua transformação AI é automaticamente posicionada</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-ghibli-sand/20">
                  <div className="text-3xl mb-3">🚚</div>
                  <h3 className="font-semibold mb-2 text-ghibli-wood">3. Receba em Casa</h3>
                  <p>Impressão profissional e entrega direta na sua porta</p>
                </div>
              </div>
            </div>
          </motion.div>


        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default ShopPage; 