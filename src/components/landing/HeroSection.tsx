import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Star, Heart, Zap, Users } from 'lucide-react';
import Link from 'next/link';

const HeroSection: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div 
          className="grid lg:grid-cols-2 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* Left Column - Text Content */}
          <motion.div variants={itemVariants}>
            {/* Badge/Social Proof */}
            <motion.div 
              className="inline-flex items-center bg-white/80 backdrop-blur-sm border border-ghibli-moss/20 rounded-full px-4 py-2 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center mr-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-sm font-semibold text-ghibli-wood">
                +1,200 Clientes Satisfeitos
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-ghibli text-ghibli-wood mb-6 leading-tight"
              variants={itemVariants}
            >
              Produtos Únicos,<br/>
              <span className="bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light bg-clip-text text-transparent">
                Personalizados
              </span>{" "}
              com IA
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              className="text-xl md:text-2xl text-ghibli-earth mb-8 leading-relaxed"
              variants={itemVariants}
            >
              Transforma as tuas fotos em <strong>arte incrível</strong> e recebe produtos personalizados únicos em casa. 
              <span className="text-ghibli-moss font-semibold"> Entrega grátis!</span>
            </motion.p>

            {/* Benefits */}
            <motion.div 
              className="grid grid-cols-2 gap-4 mb-8"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-ghibli-moss" />
                <span className="text-ghibli-earth font-medium">Entrega Rápida</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-ghibli-poppy" />
                <span className="text-ghibli-earth font-medium">Arte Única</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-ghibli-moss" />
                <span className="text-ghibli-earth font-medium">+1K Clientes</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-ghibli-earth font-medium">5⭐ Reviews</span>
              </div>
            </motion.div>

            {/* Call to Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mb-8"
              variants={itemVariants}
            >
              <Link href="/transformacao">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light hover:from-ghibli-moss-light hover:to-ghibli-moss text-white font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="mr-2">🎨</span>
                  Transformar Foto Agora
                </Button>
              </Link>
              
              <Link href="/shop">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-ghibli-moss text-ghibli-moss hover:bg-ghibli-moss hover:text-white font-semibold px-8 py-4 text-lg rounded-xl transition-all duration-300"
                >
                  <span className="mr-2">🛍️</span>
                  Ver Produtos
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              className="flex items-center space-x-6 text-sm text-ghibli-earth"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Entrega Grátis</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Garantia 30 dias</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Feito em Portugal</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Product Images Grid */}
          <motion.div 
            className="grid grid-cols-2 gap-4"
            variants={itemVariants}
          >
            {/* Placeholder para fotos de pessoas com produtos */}
            <motion.div 
              className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-ghibli-sand to-ghibli-paper"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <div className="text-sm text-ghibli-earth font-medium">Capas Personalizadas</div>
                </div>
              </div>
              {/* Placeholder para imagem real */}
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                <span className="text-xs text-ghibli-earth opacity-50">[Foto: Pessoa com capa]</span>
              </div>
            </motion.div>

            <motion.div 
              className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-ghibli-moss/20 to-ghibli-moss/10"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">☕</div>
                  <div className="text-sm text-ghibli-earth font-medium">Canecas Únicas</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                <span className="text-xs text-ghibli-earth opacity-50">[Foto: Pessoa com caneca]</span>
              </div>
            </motion.div>

            <motion.div 
              className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-ghibli-sky/30 to-ghibli-sky/10"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <div className="text-sm text-ghibli-earth font-medium">Canvas Art</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                <span className="text-xs text-ghibli-earth opacity-50">[Foto: Canvas na parede]</span>
              </div>
            </motion.div>

            <motion.div 
              className="relative aspect-square rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-ghibli-poppy/20 to-ghibli-poppy/10"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">👕</div>
                  <div className="text-sm text-ghibli-earth font-medium">Roupa Custom</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                <span className="text-xs text-ghibli-earth opacity-50">[Foto: Pessoa com hoodie]</span>
              </div>
            </motion.div>
          </motion.div>

        </motion.div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-ghibli-moss/5 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-ghibli-sky/5 rounded-full blur-xl"></div>
    </section>
  );
};

export default HeroSection; 