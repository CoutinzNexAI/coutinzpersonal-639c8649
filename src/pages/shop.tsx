import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import CircularGallery, { GalleryItem } from '@/components/ui/circular-gallery/CircularGallery';

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
    galleryImage: '/assets/gallery-images/person_with_canvas.png',
    gradient: 'from-emerald-400 to-teal-500',
    icon: '🖼️',
    items: ['Canvas Premium', 'Molduras Elegantes', 'Impressão HD']
  },
  {
    name: 'Roupa',
    href: '/shop/apparel',
    galleryImage: '/assets/gallery-images/person_wearing_tshirt.png',
    gradient: 'from-blue-400 to-indigo-500',
    icon: '👕',
    items: ['T-shirts', 'Hoodies', 'Tank Tops']
  },
  {
    name: 'Canecas',
    href: '/shop/mug',
    galleryImage: '/fotousar/raparigascafe.png',
    gradient: 'from-yellow-400 to-orange-500',
    icon: '☕',
    items: ['Cerâmica Premium', 'Impressão Durável', 'Várias Cores']
  },
  {
    name: 'Tecnologia',
    href: '/shop/tecnologia',
    galleryImage: '/assets/gallery-images/person_with_phone_case.png',
    gradient: 'from-purple-400 to-pink-500',
    icon: '📱',
    items: ['Capas Telemóvel', 'Mousepads', 'Acessórios']
  },
  {
    name: 'Sacos',
    href: '/shop/bags',
    galleryImage: '/fotousar/mae2filhos.png',
    gradient: 'from-green-400 to-emerald-500',
    icon: '🎒',
    items: ['Tote Bags', 'Backpacks', 'Gym Bags']
  },
  {
    name: 'Cadernos',
    href: '/shop/stationery',
    galleryImage: '/fotousar/rapazfaculdade.png',
    gradient: 'from-red-400 to-rose-500',
    icon: '📓',
    items: ['Cadernos A5', 'Journals', 'Planners']
  },
  {
    name: 'Escritório',
    href: '/shop/office',
    galleryImage: '/fotousar/passeioporto.png',
    gradient: 'from-gray-400 to-slate-500',
    icon: '🏢',
    items: ['Mousepad', 'Calendários', 'Organizadores']
  }
];

const ShopPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Prepare gallery items from categories with validation
  const galleryItems = categories.map(category => ({
    image: category.galleryImage,
    text: category.name
  }));

  // Debug log for gallery items - CRITICAL FOR DEBUGGING
  console.log('DADOS PARA A GALERIA:', galleryItems);
  console.log('Validação:', {
    hasItems: galleryItems.length > 0,
    allHaveImages: galleryItems.every(item => item.image),
    allHaveText: galleryItems.every(item => item.text),
    firstItem: galleryItems[0]
  });

  const handleGalleryItemClick = (item: GalleryItem, index: number) => {
    const category = categories[index];
    if (category) {
      router.push(category.href);
    }
  };

  // Safe gallery component with error boundary
  const SafeGallery = () => {
    try {
      return (
        <CircularGallery
          items={galleryItems}
          bend={3}
          textColor="#2D5A27"
          borderRadius={0.1}
          font="bold 28px Inter"
          onItemClick={handleGalleryItemClick}
        />
      );
    } catch (error) {
      console.error('Gallery Error:', error);
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-[#2D5A27] mb-2">Galeria Indisponível</h3>
            <p className="text-[#4A6B5B]">Use as categorias abaixo para navegar.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <Head>
        <title>PicTuz - Produtos Personalizados com Arte AI</title>
        <meta name="description" content="Descobre a nossa coleção completa de produtos personalizados. Desde quadros a roupa, transforma as tuas fotos em arte única." />
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
          <div className="text-center mb-16">
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

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="Procurar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 
                          text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#B8E6B8] 
                          focus:border-transparent transition-all duration-300"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-white/70 text-xl">🔍</span>
              </div>
            </div>
          </div>

          {/* Interactive 3D Gallery */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#2D5A27] mb-2">Galeria Interativa</h2>
              <p className="text-[#4A6B5B]">Arrastar para navegar • Clicar para explorar</p>
            </div>
            
            <div className="h-[600px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#F5F1E8] via-[#E8E0D0] to-[#D4C4A8] backdrop-blur-sm border border-white/20 shadow-2xl">
              <SafeGallery />
            </div>
          </div>

          {/* Traditional Category Grid */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white text-center mb-8">Todas as Categorias</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <div
                  key={category.name}
                  onClick={() => router.push(category.href)}
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