import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { SmartProductLink } from '@/components/shared/SmartProductLink';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imagePersonalized: string; // Imagem com personalização
  imageBlank: string; // Imagem em branco
  href: string;
  badge?: string;
}

const bestSellers: Product[] = [
  {
    id: 'poster_vertical',
    name: 'Poster Vertical',
    category: 'Posters',
    price: 17.95, // ✅ ATUALIZADO
    imagePersonalized: '/Bestseller/poster1824foto.png',
    imageBlank: '/Bestseller/poster1824.png',
    href: '/shop/poster',
    badge: 'Novo'
  },
  {
    id: 'custom_canvas',
    name: 'Canvas Premium',
    category: 'Canvas',
    price: 24.95, // ✅ ATUALIZADO (6x6 base)
    imagePersonalized: '/Bestseller/canva16foto.png',
    imageBlank: '/Bestseller/canva16.png',
    href: '/shop/canvas/custom_canvas',
    badge: 'Mais Popular'
  },
  {
    id: 'heart_mug',
    name: 'Caneca Coração',
    category: 'Canecas',
    price: 26.95, // ✅ ATUALIZADO
    imagePersonalized: '/Bestseller/canecacoracaofoto.png',
    imageBlank: '/Bestseller/canecacoracao.png',
    href: '/shop/mug/heart_mug',
    badge: '❤️'
  },
  {
    id: 'custom_phone_case',
    name: 'Capa Telemóvel',
    category: 'Tecnologia',
    price: 19.95, // ✅ ATUALIZADO
    imagePersonalized: '/Bestseller/capatelemovelfoto.png',
    imageBlank: '/Bestseller/capatelemovel.png',
    href: '/shop/tecnologia/custom_phone_case',
    badge: 'TOP'
  },
];

// Componente individual do produto com hover effect
const ProductCard: React.FC<{ product: Product; index: number }> = ({ product, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <SmartProductLink productUrl={product.href}>
        <div 
          className="group bg-gradient-to-b from-white/90 via-ghibli-cream/70 to-white/90 rounded-2xl shadow-xl border border-ghibli-sand/30 overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer h-full hover:border-ghibli-moss/40 touch-manipulation active:scale-95"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Product Image com Efeito Hover */}
          <div className="relative aspect-square bg-gradient-to-br from-ghibli-cream/30 to-ghibli-sand/20 p-4 overflow-hidden">
            {/* Imagem Personalizada (padrão) */}
            <motion.div
              className="absolute inset-4"
              animate={{ 
                opacity: isHovered ? 0 : 1,
                scale: isHovered ? 1.05 : 1
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Image
                src={product.imagePersonalized}
                alt={`${product.name} personalizado`}
                fill
                className="object-contain drop-shadow-lg"
                quality={95}
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </motion.div>

            {/* Imagem em Branco (hover) */}
            <motion.div
              className="absolute inset-4"
              animate={{ 
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.95
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <Image
                src={product.imageBlank}
                alt={`${product.name} em branco`}
                fill
                className="object-contain drop-shadow-lg"
                quality={95}
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </motion.div>

            {/* Badge */}
            {product.badge && (
              <div className="absolute top-3 right-3 z-10">
                <span className={`
                  px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg
                  ${product.id === 'custom_canvas' ? 'bg-gradient-to-r from-ghibli-moss to-green-600' : ''}
                  ${product.id === 'heart_mug' ? 'bg-pink-500' : ''}
                  ${product.id === 'custom_phone_case' ? 'bg-ghibli-poppy' : ''}
                  ${product.id === 'poster_horizontal' ? 'bg-purple-600' : ''}
                `}>
                  {product.badge}
                </span>
              </div>
            )}

            {/* Overlay de Hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Product Info - Centralized like new /shop */}
          <div className="p-4 lg:p-6 text-center">
            <h3 className="text-lg lg:text-xl font-bold text-ghibli-wood mb-3 group-hover:text-ghibli-moss transition-colors line-clamp-2">
              {product.name}
            </h3>
            
            {/* Price - Centralized and prominent */}
            <div className="flex items-center justify-center">
              <div className="text-xl lg:text-2xl font-bold text-ghibli-moss">
                €{product.price.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </SmartProductLink>
    </motion.div>
  );
};

const BestSellersSection: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-white via-ghibli-cream/30 to-ghibli-paper/50 relative">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <motion.div 
          className="text-center mb-8 lg:mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ghibli-wood mb-4">
            <span className="bg-gradient-to-r from-ghibli-moss via-green-600 to-ghibli-moss-light bg-clip-text text-transparent">
              Best Sellers
            </span>
          </h2>
        </motion.div>

        {/* Products Grid - 2x2 no Mobile, 4 colunas no Desktop */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {bestSellers.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </motion.div>

        {/* CTA Section - Botão Menor e Centrado */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/shop">
            <Button 
              size="default"
              className="bg-gradient-to-r from-ghibli-moss via-green-600 to-ghibli-moss-light hover:from-green-700 hover:via-ghibli-moss hover:to-green-600 text-white font-bold px-8 py-6 text-base lg:text-lg rounded-xl shadow-lg hover:shadow-green-500/30 transition-all duration-300 border border-white/20 touch-manipulation active:scale-95"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Ver Todos os Produtos
              <span className="ml-2 text-sm">🚀</span>
            </Button>
          </Link>
        </motion.div>

      </div>

      {/* Background decoration */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-ghibli-sky/10 to-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-ghibli-moss/10 to-green-500/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-ghibli-poppy/5 to-pink-500/5 rounded-full blur-3xl animate-pulse opacity-50"></div>
      
      {/* Floating icons */}
      <motion.div 
        className="absolute top-20 right-20 text-3xl opacity-10"
        animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        🛍️
      </motion.div>
      <motion.div 
        className="absolute bottom-20 left-20 text-4xl opacity-10"
        animate={{ y: [0, 15, 0], rotate: [0, -10, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
      >
        ⭐
      </motion.div>
    </section>
  );
};

export default BestSellersSection; 