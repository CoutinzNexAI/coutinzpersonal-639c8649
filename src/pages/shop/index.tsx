import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Image, Coffee, Package, Smartphone, ShoppingBag, Briefcase, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PromotionalBanner from '@/components/landing/PromotionalBanner';

// Interface para categorias
interface Category {
  id: string;
  name: string;
  href: string;
  icon: React.ElementType;
  emoji: string;
  color: string;
}

// Interface para produtos individuais
interface IndividualProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  href: string;
  badge?: string;
  // ✅ NOVO: Sistema de descontos especiais
  hasSpecialDiscount?: boolean;
  discountPercent?: number;
  originalPrice?: number;
}

// 6 Categorias - só com emojis, maiores e mais coloridas
const categories: Category[] = [
  {
    id: 'canvas',
    name: 'Canvas',
    href: '/shop/canvas',
    icon: Image,
    emoji: '🖼️',
    color: 'from-emerald-400 to-teal-500'
  },
  {
    id: 'poster',
    name: 'Posters',
    href: '/shop/poster',
    icon: Package,
    emoji: '📋',
    color: 'from-orange-400 to-red-500'
  },
  {
    id: 'mug',
    name: 'Canecas',
    href: '/shop/mug',
    icon: Coffee,
    emoji: '☕',
    color: 'from-yellow-400 to-orange-500'
  },
  {
    id: 'tecnologia',
    name: 'Tecnologia',
    href: '/shop/tecnologia',
    icon: Smartphone,
    emoji: '📱',
    color: 'from-purple-400 to-pink-500'
  },
  {
    id: 'bag',
    name: 'Sacos',
    href: '/shop/bag',
    icon: ShoppingBag,
    emoji: '🎒',
    color: 'from-green-400 to-emerald-500'
  },
  {
    id: 'escritorio',
    name: 'Escritório',
    href: '/shop/escritorio',
    icon: Briefcase,
    emoji: '🏢',
    color: 'from-gray-400 to-slate-500'
  }
];

// ✅ NOVO: Função para obter preço com desconto especial
const getProductPricing = (product: IndividualProduct) => {
  if (product.hasSpecialDiscount && product.discountPercent && product.originalPrice) {
    return {
      originalPrice: product.originalPrice,
      discountedPrice: product.price,
      discountPercent: product.discountPercent,
      hasDiscount: true
    };
  }
  return {
    originalPrice: product.price,
    discountedPrice: product.price,
    discountPercent: 0,
    hasDiscount: false
  };
};

// 10 Produtos individuais - nova ordem especificada
const individualProducts: IndividualProduct[] = [
  // 1. Poster Vertical
  {
    id: 'poster_vertical',
    name: 'Poster Vertical',
    price: 17.95, // ✅ ATUALIZADO
    image: '/mockupproduto/postervertical.png',
    href: '/shop/poster/poster_vertical_semi_glossy'
  },
  // 2. Caneca Coração
  {
    id: 'heart_mug',
    name: 'Caneca Coração',
    price: 24.26, // ✅ NOVO: Preço com desconto de 10% (26.95 * 0.9)
    originalPrice: 26.95, // ✅ NOVO: Preço original
    hasSpecialDiscount: true, // ✅ NOVO: Indica desconto especial
    discountPercent: 10, // ✅ NOVO: 10% de desconto
    image: '/mockupproduto/canecacoracao.png',
    href: '/shop/mug/heart_mug',
    badge: '🔥 10% OFF'
  },
  // 3. Canvas (sem borda)
  {
    id: 'custom_canvas',
    name: 'Canvas',
    price: 24.95, // ✅ ATUALIZADO (6x6 base)
    image: '/mockupproduto/canva.png',
    href: '/shop/canvas/custom_canvas',
    badge: 'Popular'
  },
  // 4. Capa Telemóvel
  {
    id: 'custom_phone_case',
    name: 'Capa Telemóvel',
    price: 19.95, // ✅ ATUALIZADO
    image: '/mockupproduto/telemovel.png',
    href: '/shop/tecnologia/custom_phone_case',
    badge: 'TOP'
  },
  // 5. Poster Horizontal
  {
    id: 'poster_horizontal',
    name: 'Poster Horizontal',
    price: 17.95, // ✅ ATUALIZADO
    image: '/mockupproduto/posterhorizontal.png',
    href: '/shop/poster/poster_horizontal_semi_glossy'
  },
  // 6. Caneca (normal)
  {
    id: 'ceramic_mug',
    name: 'Caneca',
    price: 18.95, // ✅ ATUALIZADO (330ml base)
    image: '/mockupproduto/canecapersonalizada.png',
    href: '/shop/mug/ceramic_mug'
  },
  // 7. Caderno
  {
    id: 'spiral_journal',
    name: 'Caderno',
    price: 17.95, // ✅ ATUALIZADO
    image: '/mockupproduto/caderno.png',
    href: '/shop/escritorio/spiral_journal'
  },
  // 8. Saco
  {
    id: 'tote_bag',
    name: 'Saco Tote Bag',
    price: 19.95, // ✅ ATUALIZADO
    image: '/mockupproduto/saco.png',
    href: '/shop/bag/tote_bag'
  },
  // 9. Mousepad
  {
    id: 'mouse_pad',
    name: 'Mouse Pad',
    price: 24.95, // ✅ ATUALIZADO
    image: '/mockupproduto/mousepad.png',
    href: '/shop/escritorio/mouse_pad'
  },

];

const ShopPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ghibli-paper to-ghibli-cream/50 relative overflow-hidden">
      <Head>
        <title>Loja PicTuz - Produtos Personalizados com IA</title>
        <meta name="description" content="Transforme as suas criações AI em produtos físicos únicos. Canvas, canecas, posters, capas e muito mais!" />
        <meta name="keywords" content="loja produtos personalizados, canvas personalizado, canecas personalizadas, posters personalizados, capas telemóvel, tote bags" />
      </Head>

      {/* Elementos decorativos de fundo */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-ghibli-moss/10 to-green-500/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-ghibli-sky/10 to-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-gradient-to-r from-ghibli-sunflower/10 to-yellow-500/10 rounded-full blur-xl animate-pulse"></div>

      {/* Banner Promocional */}
      <PromotionalBanner />

      {/* Header com margem ajustada */}
      <div className="relative z-40">
        <Header />
      </div>

      <main className="pt-24 pb-16 relative z-10">
        <div className="container mx-auto px-4">
          
          {/* TÍTULO PRINCIPAL - Maior, verde e destacado */}
          <motion.div
            className="text-center mb-12 mt-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-ghibli-moss via-green-600 to-ghibli-moss-light bg-clip-text text-transparent drop-shadow-sm">
                Loja PicTuz
              </span>
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-ghibli-earth max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Transforme as suas criações AI em{' '}
              <span className="font-semibold text-ghibli-wood">produtos físicos únicos</span>
            </motion.p>
          </motion.div>

          {/* CATEGORIAS - Só emojis, maiores e mais coloridas */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Desktop - Grid normal */}
            <div className="hidden md:flex justify-center">
              <div className="grid grid-cols-6 gap-6 max-w-5xl">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.8 + (index * 0.1),
                      type: "spring",
                      bounce: 0.4
                    }}
                  >
                    <Link href={category.href}>
                      <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.color} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer`}>
                        {/* Efeito brilho */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        
                        <div className="relative text-center">
                          {/* Emoji grande */}
                          <div className="text-4xl md:text-5xl mb-2 transform group-hover:scale-110 transition-transform duration-300">
                            {category.emoji}
                          </div>
                          {/* Nome da categoria */}
                          <p className="text-white font-bold text-sm md:text-base drop-shadow-sm group-hover:text-yellow-100 transition-colors">
                            {category.name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mobile - Scroll horizontal */}
            <div className="md:hidden">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 pb-4 px-4 min-w-max">
                  {categories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: 0.8 + (index * 0.1),
                        type: "spring",
                        bounce: 0.4
                      }}
                      className="flex-shrink-0"
                    >
                      <Link href={category.href}>
                        <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.color} p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer w-20`}>
                          {/* Efeito brilho */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                          
                          <div className="relative text-center">
                            {/* Emoji grande */}
                            <div className="text-3xl mb-1 transform group-hover:scale-110 transition-transform duration-300">
                              {category.emoji}
                            </div>
                            {/* Nome da categoria */}
                            <p className="text-white font-bold text-xs drop-shadow-sm group-hover:text-yellow-100 transition-colors">
                              {category.name}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* TÍTULO DOS PRODUTOS */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-ghibli-wood mb-3">
              Todos os Produtos
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light rounded-full mx-auto"></div>
          </motion.div>

          {/* PRODUTOS INDIVIDUAIS - Cards melhorados */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.6 }}
          >
            {individualProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.8 + (index * 0.05) }}
              >
                <Link href={product.href}>
                  <div className="group bg-gradient-to-br from-white/95 to-ghibli-cream/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-ghibli-sand/40 hover:shadow-2xl hover:border-ghibli-moss/50 transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
                    
                    {/* Imagem do produto */}
                    <div className="aspect-square bg-gradient-to-br from-ghibli-cream/30 to-ghibli-sand/20 p-4 flex items-center justify-center relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                      />
                      
                      {/* Badge se existir */}
                      {product.badge && (
                        <div className="absolute top-3 right-3">
                          <motion.span 
                            className={`
                              text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg
                              ${product.id === 'heart_mug' ? 'bg-gradient-to-r from-red-500 via-pink-500 to-red-600' : 'bg-gradient-to-r from-ghibli-moss to-green-600'}
                            `}
                            animate={product.id === 'heart_mug' ? {
                              scale: [1, 1.1, 1],
                              boxShadow: [
                                "0 4px 6px rgba(239, 68, 68, 0.1)",
                                "0 8px 25px rgba(239, 68, 68, 0.3)",
                                "0 4px 6px rgba(239, 68, 68, 0.1)"
                              ]
                            } : {}}
                            transition={product.id === 'heart_mug' ? {
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            } : {}}
                          >
                            {product.badge}
                          </motion.span>
                        </div>
                      )}

                      {/* Efeito hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-ghibli-moss/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    
                    {/* Info do produto - centrada */}
                    <div className="p-4 text-center">
                      {/* Nome centrado */}
                      <h3 className="font-bold text-base text-ghibli-wood group-hover:text-ghibli-moss transition-colors mb-3 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      {/* Preço centrado e destacado com suporte a desconto */}
                      <div className="flex flex-col items-center justify-center">
                        {(() => {
                          const pricing = getProductPricing(product);
                          if (pricing.hasDiscount) {
                            return (
                              <>
                                {/* Preço original riscado */}
                                <div className="text-sm text-gray-500 line-through mb-1">
                                  €{pricing.originalPrice.toFixed(2)}
                                </div>
                                {/* Preço com desconto animado */}
                                <motion.div 
                                  className="text-2xl font-bold text-red-600 relative"
                                  animate={{ 
                                    scale: [1, 1.05, 1],
                                  }}
                                  transition={{ 
                                    duration: 2, 
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                >
                                  €{pricing.discountedPrice.toFixed(2)}
                                  {/* Sparkle effect */}
                                  <motion.span
                                    className="absolute -top-1 -right-2 text-yellow-400 text-sm"
                                    animate={{ 
                                      scale: [0, 1, 0],
                                      rotate: [0, 180, 360]
                                    }}
                                    transition={{
                                      duration: 1.5,
                                      repeat: Infinity,
                                      delay: 0.5
                                    }}
                                  >
                                    ✨
                                  </motion.span>
                                </motion.div>
                                {/* Valor poupado */}
                                <div className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full mt-1">
                                  Poupas €{(pricing.originalPrice - pricing.discountedPrice).toFixed(2)}!
                                </div>
                              </>
                            );
                          } else {
                            return (
                              <span className="text-2xl font-bold bg-gradient-to-r from-ghibli-moss via-green-600 to-ghibli-moss-light bg-clip-text text-transparent">
                                €{product.price.toFixed(2)}
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* CALL TO ACTION FINAL - Novo texto */}
          <motion.div
            className="text-center mt-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.2, duration: 0.8 }}
          >
            <div className="relative bg-gradient-to-br from-white/90 to-ghibli-cream/70 backdrop-blur-md rounded-3xl p-8 md:p-12 border-2 border-ghibli-sand/30 shadow-2xl overflow-hidden">
              {/* Efeito de brilho de fundo */}
              <div className="absolute inset-0 bg-gradient-to-r from-ghibli-moss/5 via-ghibli-sunflower/5 to-ghibli-sky/5 rounded-3xl"></div>
              
              <div className="relative z-10">
                <motion.div
                  className="mb-6"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-12 h-12 text-ghibli-moss mx-auto" />
                </motion.div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-ghibli-wood mb-4">
                  Pronto para Criar?
                </h2>
                <p className="text-ghibli-earth text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                  Carrega a tua foto e vê a magia acontecer em segundos
                </p>
                
                <Link href="/transformacoes">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block"
                  >
                    <div className="bg-gradient-to-r from-ghibli-moss via-green-600 to-ghibli-moss-light text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-ghibli-moss/30 transition-all duration-300 text-lg border border-white/20">
                      Começar Agora
                      <span className="ml-2 text-xl">✨</span>
                    </div>
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShopPage; 