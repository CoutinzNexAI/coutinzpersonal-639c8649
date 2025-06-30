import React from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart } from 'lucide-react';
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
    <section className="py-16 md:py-24 bg-white relative">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center bg-ghibli-moss/10 border border-ghibli-moss/20 rounded-full px-6 py-2 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Star className="w-4 h-4 text-ghibli-moss mr-2" />
            <span className="text-sm font-semibold text-ghibli-moss">PRODUTOS MAIS VENDIDOS</span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-ghibli text-ghibli-wood mb-6">
            Os Nossos <span className="text-ghibli-moss">Best Sellers</span>
          </h2>
          
          <p className="text-xl text-ghibli-earth max-w-3xl mx-auto mb-8">
            Descobre os produtos favoritos dos nossos clientes. Arte única, qualidade premium e entrega rápida garantida.
          </p>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {['Todos', 'Canecas', 'Canvas', 'Tecnologia', 'Posters'].map((category) => (
              <button
                key={category}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  category === 'Todos' 
                    ? 'bg-ghibli-moss text-white shadow-lg' 
                    : 'bg-white text-ghibli-earth border border-ghibli-sand hover:border-ghibli-moss hover:text-ghibli-moss'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
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
            <Button 
              size="lg"
              className="bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light hover:from-ghibli-moss-light hover:to-ghibli-moss text-white font-semibold px-12 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Ver Todos os Produtos
            </Button>
          </Link>
        </motion.div>

      </div>

      {/* Background decoration */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-ghibli-sky/5 rounded-full blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-ghibli-moss/5 rounded-full blur-2xl"></div>
    </section>
  );
};

export default BestSellersSection; 