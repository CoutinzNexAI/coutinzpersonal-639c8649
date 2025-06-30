import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Package, Coffee, Image, Briefcase, Smartphone, ShoppingBag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ElementType;
  image: string;
  productCount: number;
}

const productCategories: ProductCategory[] = [
  {
    id: 'canvas',
    name: 'Canvas Personalizado',
    description: 'Transforme as suas fotos em obras de arte para decorar a sua casa',
    href: '/shop/canvas',
    icon: Image,
    image: '/landing/canvasgrande.png',
    productCount: 3
  },
  {
    id: 'mug',
    name: 'Canecas',
    description: 'Canecas personalizadas para o seu café matinal especial',
    href: '/shop/mug',
    icon: Coffee,
    image: '/Bestseller/canecacoracao.png',
    productCount: 2
  },
  {
    id: 'poster',
    name: 'Posters',
    description: 'Posters de alta qualidade para decorar qualquer espaço',
    href: '/shop/poster',
    icon: Package,
    image: '/Bestseller/poster1824.png',
    productCount: 2
  },
  {
    id: 'tecnologia',
    name: 'Tecnologia',
    description: 'Capas de telemóvel e acessórios tech personalizados',
    href: '/shop/tecnologia',
    icon: Smartphone,
    image: '/Bestseller/capatelemovel.png',
    productCount: 1
  },
  {
    id: 'bag',
    name: 'Tote Bags',
    description: 'Sacos reutilizáveis com o seu design único',
    href: '/shop/bag',
    icon: ShoppingBag,
    image: '/landing/totebag.png',
    productCount: 1
  },
  {
    id: 'escritorio',
    name: 'Escritório',
    description: 'Mousepads e acessórios para o seu espaço de trabalho',
    href: '/shop/escritorio',
    icon: Briefcase,
    image: '/mockupproduto/mousepad.png',
    productCount: 1
  }
];

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

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 12
    }
  }
};

const ShopPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ghibli-paper to-ghibli-cream/50">
      <Head>
        <title>Loja - Produtos Personalizados | PicTuz</title>
        <meta name="description" content="Descubra a nossa coleção completa de produtos personalizados: canvas, canecas, posters, capas e muito mais. Transforme as suas fotos em produtos únicos!" />
        <meta name="keywords" content="loja produtos personalizados, canvas personalizado, canecas personalizadas, posters personalizados, capas telemóvel, tote bags" />
      </Head>

      <Header />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-6xl font-bold text-ghibli-wood mb-6">
              Loja de Produtos
              <span className="block text-ghibli-moss">Personalizados</span>
            </h1>
            <p className="text-xl text-ghibli-earth max-w-2xl mx-auto mb-8">
              Transforme as suas fotos em produtos únicos. Cada item é criado especialmente para si com a sua arte personalizada.
            </p>
            <div className="h-1 w-24 bg-ghibli-moss/60 rounded-full mx-auto"></div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {productCategories.map((category) => {
              const IconComponent = category.icon;
              
              return (
                <motion.div key={category.id} variants={cardVariants}>
                  <Link href={category.href}>
                    <Card className="h-full group cursor-pointer border-2 border-ghibli-sand/40 bg-white/70 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-ghibli-moss/50 hover:-translate-y-2">
                      <CardContent className="p-0">
                        <div className="relative h-48 bg-ghibli-cream/30 overflow-hidden">
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-4 right-4 bg-ghibli-moss text-white text-sm px-3 py-1 rounded-full">
                            {category.productCount} produto{category.productCount > 1 ? 's' : ''}
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="flex items-center mb-3">
                            <div className="w-10 h-10 rounded-full bg-ghibli-moss/20 flex items-center justify-center mr-3">
                              <IconComponent className="w-5 h-5 text-ghibli-moss-dark" />
                            </div>
                            <h3 className="text-xl font-bold text-ghibli-wood">{category.name}</h3>
                          </div>
                          
                          <p className="text-ghibli-earth mb-4 leading-relaxed">
                            {category.description}
                          </p>

                          <div className="flex items-center text-ghibli-moss font-medium group-hover:text-ghibli-moss-dark transition-colors">
                            Ver produtos
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-ghibli-sand/30">
              <h2 className="text-2xl font-bold text-ghibli-wood mb-4">
                Não encontra o produto ideal?
              </h2>
              <p className="text-ghibli-earth mb-6">
                Estamos sempre a adicionar novos produtos à nossa coleção. 
                Contacte-nos se tem alguma sugestão!
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-ghibli-moss text-white rounded-lg hover:bg-ghibli-moss-dark transition-colors"
              >
                Contactar-nos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ShopPage; 