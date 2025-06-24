import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import HeroCarousel from '@/components/HeroCarousel';

interface Category {
  name: string;
  href: string;
  galleryImage: string;
  gradient: string;
  icon: string;
  items: string[];
}

const categories: Category[] = [
  {
    name: 'Quadros',
    href: '/shop/canvas',
    galleryImage: '/circular-gallery/canvas.png',
    gradient: 'from-emerald-400 to-teal-500',
      icon: '🖼️',
    items: ['Canvas Premium', 'Molduras Elegantes', 'Impressão HD']
  },
  {
    name: 'Posters',
    href: '/shop/poster',
    galleryImage: '/circular-gallery/poster.png',
    gradient: 'from-orange-400 to-red-500',
    icon: '📋',
    items: ['Horizontal', 'Vertical']
  },
  
  {
    name: 'Canecas',
    href: '/shop/mug',
    galleryImage: '/circular-gallery/mug.png',
    gradient: 'from-yellow-400 to-orange-500',
    icon: '☕',
    items: ['Cerâmica Premium', 'Impressão Durável', 'Várias Cores']
  },
  {
    name: 'Tecnologia',
    href: '/shop/tecnologia',
    galleryImage: '/circular-gallery/tecnologia.png',
    gradient: 'from-purple-400 to-pink-500',
    icon: '📱',
    items: ['Capas Telemóvel', 'Mousepads', 'Acessórios']
  },
  {
    name: 'Sacos',
    href: '/shop/bag',
    galleryImage: '/circular-gallery/bag.png',
    gradient: 'from-green-400 to-emerald-500',
    icon: '🎒',
    items: ['Tote Bags', 'Impressão Durável', 'Eco-Friendly']
  },
  {
    name: 'Escritório',
    href: '/shop/escritorio',
    galleryImage: '/circular-gallery/escritorio.png',
    gradient: 'from-gray-400 to-slate-500',
    icon: '🏢',
    items: ['Cadernos', 'Mousepads', 'Personalizado']
  }
];

const ShopPage: React.FC = () => {
  const router = useRouter();

  const handleCategoryClick = (href: string) => {
    router.push(href);
  };

  // Novo componente HeroCarousel (muito mais simples!)
  const HeroSection = () => {
    return <HeroCarousel />;
  };

  return (
    <>
      <Head>
        <title>PicTuz - Produtos Personalizados com Arte AI</title>
        <meta name="description" content="Descobre a nossa coleção completa de produtos personalizados. Desde quadros a acessórios, transforma as tuas fotos em arte única." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F0] via-[#F5F1E8] to-[#E8E0D0] relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/3 rounded-full blur-xl"></div>
        </div>

        <Header />
        
        <main className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-22">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-[#2D5A27] mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              🎨 Loja PicTuz
            </motion.h1>
            <motion.p 
              className="text-xl text-[#4A6B5B] max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Transforme as suas criações AI em produtos físicos únicos
            </motion.p>
          </div>

          {/* Interactive 3D Gallery */}
          <div className="mb-16">
                      
            <div className="h-[500px] md:h-[600px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#F5F1E8] via-[#E8E0D0] to-[#D4C4A8] backdrop-blur-sm border border-white/20 shadow-2xl">
              <HeroSection />
            </div>
          </div>
                      
          {/* Traditional Category Grid */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white text-center mb-8">Todas as Categorias</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category.name}
                  onClick={() => handleCategoryClick(category.href)}
                  className="group relative bg-gradient-to-br from-[#F5F1E8]/90 via-[#E8E0D0]/80 to-[#D4C4A8]/70 
                            backdrop-blur-md rounded-3xl p-6 border-2 border-[#B8A082]/30 
                            hover:border-[#8B7355]/50 cursor-pointer transition-all duration-500 
                            hover:scale-105 hover:bg-gradient-to-br hover:from-[#F5F1E8] 
                            hover:via-[#E8E0D0] hover:to-[#D4C4A8] shadow-lg hover:shadow-2xl"
                >
                  {/* Icon and Title */}
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 
                                    filter drop-shadow-lg">
                      {category.icon}
                    </div>
                    <h3 className="text-xl font-bold text-[#2D5A27] mb-2 drop-shadow-sm">
                        {category.name}
                      </h3>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    {category.items.map((item, index) => (
                      <div key={index} className="flex items-center text-[#4A6B5B] text-sm font-medium">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#6B8E5A] to-[#8B7355] 
                                        rounded-full mr-3 group-hover:scale-125 transition-transform duration-300">
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Ghibli-style decorative border */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#6B8E5A]/10 
                                  via-transparent to-[#8B7355]/10 opacity-0 group-hover:opacity-100 
                                  transition-opacity duration-500 pointer-events-none">
          </div>

                  {/* Arrow */}
                  <div className="absolute top-4 right-4 text-[#4A6B5B]/60 group-hover:text-[#2D5A27] 
                                  group-hover:translate-x-1 transition-all duration-300 text-lg font-bold">
                    →
            </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">
              Pronto para Criar?
            </h2>
            <p className="text-[#E8F5E8] mb-6 text-lg">
              Carrega a tua foto e vê a magia acontecer em segundos
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 bg-gradient-to-r from-[#B8E6B8] to-[#9FD7A0] text-[#2D5A27] 
                        font-bold rounded-2xl hover:scale-105 transition-all duration-300 
                        shadow-lg hover:shadow-xl"
            >
              Começar Agora
            </button>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default ShopPage; 