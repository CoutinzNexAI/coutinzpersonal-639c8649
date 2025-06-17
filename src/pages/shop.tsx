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
      id: 'quadros', 
      name: 'Quadros', 
      description: 'Transforme a sua arte em quadros deslumbrantes.',
      icon: '🖼️',
      color: 'from-amber-400 to-orange-500',
      href: '/shop/quadros'
    },
    { 
      id: 'roupa', 
      name: 'Roupa', 
      description: 'Vista a sua arte em t-shirts, hoodies e mais.',
      icon: '👕',
      color: 'from-blue-400 to-indigo-500',
      href: '/shop/roupa'
    },
    { 
      id: 'canecas', 
      name: 'Canecas', 
      description: 'Comece o dia com uma caneca personalizada.',
      icon: '☕',
      color: 'from-green-400 to-teal-500',
      href: '/shop/mug/ceramic_mug'
    },
    { 
      id: 'tecnologia', 
      name: 'Tecnologia', 
      description: 'Proteja os seus dispositivos com estilo único.',
      icon: '📱',
      color: 'from-purple-400 to-pink-500',
      href: '/shop/tecnologia/custom_phone_case'
    },
    { 
      id: 'sacos', 
      name: 'Sacos', 
      description: 'Leve a sua arte para todo o lado.',
      icon: '🛍️',
      color: 'from-emerald-400 to-green-500',
      href: '/shop/bags/tote_bag'
    },
    { 
      id: 'cadernos', 
      name: 'Cadernos', 
      description: 'Anote as suas ideias com estilo.',
      icon: '📓',
      color: 'from-indigo-400 to-purple-500',
      href: '/shop/stationery/spiral_journal'
    },
    { 
      id: 'escritorio', 
      name: 'Escritório', 
      description: 'Personalize o seu espaço de trabalho.',
      icon: '🖱️',
      color: 'from-slate-400 to-gray-500',
      href: '/shop/office/mouse_pad'
    },
    { 
      id: 'postcard', 
      name: 'Postcards', 
      description: 'Envie a sua arte para quem mais gosta.',
      icon: '💌',
      color: 'from-rose-400 to-red-500',
      href: '/shop/postcard'
    },
    { 
      id: 'acessorios', 
      name: 'Acessórios', 
      description: 'Personalize o seu dia a dia com estilo.',
      icon: '✨',
      color: 'from-cyan-400 to-blue-500',
      href: '/shop/acessorios'
    }
  ];

  return (
    <>
      <Head>
        <title>Explore a Nossa Loja - PicTuz</title>
        <meta name="description" content="Explore todas as categorias de produtos PicTuz. Transforme as suas criações de arte AI em produtos físicos únicos e de alta qualidade." />
        <meta name="keywords" content="loja pictuz, produtos personalizados, arte AI impressa, quadros, roupa, canecas, tecnologia, postcards, acessórios" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16">
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-ghibli font-bold text-ghibli-wood mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              🛍️ Explore a Nossa Loja
            </motion.h1>
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-ghibli-earth max-w-4xl mx-auto px-4 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Descubra todas as formas incríveis de dar vida às suas criações de arte AI. 
              Cada categoria oferece produtos únicos e de qualidade profissional.
            </motion.p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={category.href}>
                  <div className="group bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] cursor-pointer overflow-hidden border border-ghibli-stone/20">
                    {/* Category Header with Gradient */}
                    <div className={`h-32 bg-gradient-to-br ${category.color} relative overflow-hidden`}>
                      {/* Decorative elements */}
                      <div className="absolute inset-0 bg-white/10"></div>
                      <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/20 rounded-full"></div>
                      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full"></div>
                      
                      {/* Icon */}
                      <div className="flex items-center justify-center h-full">
                        <div className="text-6xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg">
                          {category.icon}
                        </div>
                      </div>
                      
                      {/* Badge */}
                      <div className="absolute top-4 right-4 bg-white/90 text-xs px-3 py-1 rounded-full font-medium shadow-lg text-gray-700">
                        ✓ Premium
                      </div>
                    </div>
                    
                    {/* Category Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-ghibli-wood mb-3 group-hover:text-ghibli-moss transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-ghibli-earth text-sm leading-relaxed mb-4">
                        {category.description}
                      </p>
                      
                      {/* Stats and CTA */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-ghibli-earth/70 font-medium">
                            {/* Placeholder count - will be updated when categories are mapped */}
                            {category.id === 'quadros' ? Object.keys(getPrintifyProductsByCategory('canvas' as PrintifyProductMapping['category'])).length :
                             category.id === 'roupa' ? Object.keys(getPrintifyProductsByCategory('apparel' as PrintifyProductMapping['category'])).length :
                             category.id === 'canecas' ? Object.keys(getPrintifyProductsByCategory('mug' as PrintifyProductMapping['category'])).length :
                             category.id === 'tecnologia' ? Object.keys(getPrintifyProductsByCategory('tecnologia' as PrintifyProductMapping['category'])).length :
                             category.id === 'sacos' ? Object.keys(getPrintifyProductsByCategory('bags' as PrintifyProductMapping['category'])).length :
                             category.id === 'cadernos' ? Object.keys(getPrintifyProductsByCategory('stationery' as PrintifyProductMapping['category'])).length :
                             category.id === 'escritorio' ? Object.keys(getPrintifyProductsByCategory('office' as PrintifyProductMapping['category'])).length :
                             '0'} produtos
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-ghibli-moss font-medium group-hover:text-ghibli-wood transition-colors">
                          <span className="text-sm">Explorar</span>
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Features Section */}
          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 max-w-6xl mx-auto shadow-xl border border-ghibli-stone/20 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-ghibli-wood mb-8 text-center">
              ✨ Por Que Escolher a PicTuz?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-ghibli-moss/10 to-ghibli-moss/5">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="font-bold text-ghibli-wood mb-2">Arte AI Única</h3>
                <p className="text-sm text-ghibli-earth">Transformações exclusivas criadas pela sua imaginação</p>
              </div>
              
              <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-amber-100/50 to-amber-50/30">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="font-bold text-ghibli-wood mb-2">Qualidade Premium</h3>
                <p className="text-sm text-ghibli-earth">Impressão profissional com materiais de alta qualidade</p>
              </div>
              
              <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-blue-100/50 to-blue-50/30">
                <div className="text-4xl mb-4">🚚</div>
                <h3 className="font-bold text-ghibli-wood mb-2">Entrega Rápida</h3>
                <p className="text-sm text-ghibli-earth">Produção e envio em 3-5 dias úteis</p>
              </div>
              
              <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-100/50 to-green-50/30">
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="font-bold text-ghibli-wood mb-2">Garantia Total</h3>
                <p className="text-sm text-ghibli-earth">30 dias de garantia de qualidade ou dinheiro de volta</p>
              </div>
            </div>
          </motion.div>

          {/* How It Works */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-ghibli-wood mb-12">
              🔥 Como Funciona
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="relative">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-ghibli-stone/20 h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-ghibli-moss to-ghibli-moss/80 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-ghibli-wood mb-4">Escolha a Categoria</h3>
                  <p className="text-ghibli-earth">Navegue pelas nossas categorias e encontre o produto perfeito para a sua arte AI</p>
                </div>
                {/* Arrow for desktop */}
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <svg className="w-8 h-8 text-ghibli-moss" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-ghibli-stone/20 h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-ghibli-wood mb-4">Personalize o Produto</h3>
                  <p className="text-ghibli-earth">Selecione a sua transformação AI e veja uma pré-visualização 3D em tempo real</p>
                </div>
                {/* Arrow for desktop */}
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <svg className="w-8 h-8 text-ghibli-moss" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div>
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-ghibli-stone/20 h-full">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-ghibli-wood mb-4">Receba em Casa</h3>
                  <p className="text-ghibli-earth">Produção profissional e entrega segura diretamente na sua porta</p>
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