import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  category: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  href: string;
  badge?: string;
}

const bestSellers: Product[] = [
  {
    id: '1',
    name: 'Caneca Personalizada Premium',
    category: 'Canecas',
    originalPrice: 24.99,
    salePrice: 19.99,
    discount: 20,
    rating: 4.8,
    reviewCount: 127,
    imageUrl: '/placeholder-mug.jpg',
    href: '/shop/mug',
    badge: 'Mais Vendido'
  },
  {
    id: '2',
    name: 'Canvas com Moldura 30x40cm',
    category: 'Canvas',
    originalPrice: 49.99,
    salePrice: 39.99,
    discount: 20,
    rating: 4.9,
    reviewCount: 89,
    imageUrl: '/placeholder-canvas.jpg',
    href: '/shop/canvas',
    badge: 'Novo'
  },
  {
    id: '3',
    name: 'Capa Telemóvel Personalizada',
    category: 'Tecnologia',
    originalPrice: 19.99,
    salePrice: 15.99,
    discount: 20,
    rating: 4.7,
    reviewCount: 203,
    imageUrl: '/placeholder-phone-case.jpg',
    href: '/shop/tecnologia'
  },
  {
    id: '4',
    name: 'Poster A3 Arte Premium',
    category: 'Posters',
    originalPrice: 29.99,
    salePrice: 24.99,
    discount: 17,
    rating: 4.6,
    reviewCount: 156,
    imageUrl: '/placeholder-poster.jpg',
    href: '/shop/poster',
    badge: 'Limitado'
  }
];

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-white via-ghibli-cream/30 to-ghibli-paper/50 relative">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-ghibli-wood mb-8">
            <span className="bg-gradient-to-r from-ghibli-moss via-green-600 to-ghibli-moss-light bg-clip-text text-transparent">
              Best Sellers
            </span>
          </h2>
        </motion.div>

        {/* Products Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {bestSellers.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/shop">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-ghibli-moss via-green-600 to-ghibli-moss-light hover:from-green-700 hover:via-ghibli-moss hover:to-green-600 text-white font-bold px-16 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-green-500/30 transition-all duration-500 border-2 border-white/20"
              >
                <ShoppingCart className="w-6 h-6 mr-3" />
                Ver Todos os Produtos
                <span className="ml-3 text-lg animate-pulse">🚀</span>
              </Button>
            </motion.div>
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