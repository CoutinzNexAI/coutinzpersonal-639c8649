import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Star, Heart, Zap, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

  // Variante especial para o título agrupado
  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Variante simplificada para o subtítulo
  const subtitleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="relative py-8 md:py-12 overflow-hidden bg-gradient-to-b from-ghibli-paper to-ghibli-cream/50">
      <div className="container mx-auto px-4 z-10">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          <motion.div 
            className="flex flex-col space-y-6 pt-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile Images Grid */}
            <motion.div 
              className="grid grid-cols-4 gap-2 items-start mb-6" 
              variants={itemVariants}
            >
              {/* Canvas 9:16 - 2 colunas */}
              <Link href="/shop/canvas/custom_canvas" className="col-span-2">
                <motion.div 
                  className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer w-full aspect-[9/16]"
                  whileHover={{ scale: 1.02, rotate: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src="/landing/canvasgrande.png"
                    alt="Canvas personalizado"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    priority
                    quality={95}
                    sizes="50vw"
                  />
                  <div className="absolute top-1 left-1">
                    <span className="bg-gradient-to-r from-ghibli-moss to-green-600 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                      🖼️ TOP
                    </span>
                  </div>
                </motion.div>
              </Link>

              {/* Imagens menores lado a lado */}
              <div className="col-span-2 flex flex-col gap-2">
                <Link href="/shop/tecnologia/custom_phone_case" className="flex-1">
                  <motion.div 
                    className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer w-full aspect-square"
                    whileHover={{ scale: 1.02, rotate: -1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src="/landing/capatele.png"
                      alt="Capa de telemóvel personalizada"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      quality={95}
                      sizes="25vw"
                    />
                    <div className="absolute top-1 right-1">
                      <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                        📱
                      </span>
                    </div>
                  </motion.div>
                </Link>

                <Link href="/shop/mug/heart_mug" className="flex-1">
                  <motion.div 
                    className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer w-full aspect-square"
                    whileHover={{ scale: 1.02, rotate: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src="/landing/canecacoracao.png"
                      alt="Caneca de coração personalizada"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      quality={95}
                      sizes="25vw"
                    />
                    <div className="absolute top-1 right-1">
                      <span className="bg-pink-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                        ❤️
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </div>
            </motion.div>

            {/* Mobile Logo + Title Layout - Centrados em suas metades */}
            <motion.div 
              className="text-center mb-6"
              variants={itemVariants}
            >
              {/* Frase completa centrada numa linha - COM MAIS DESTAQUE */}
              <motion.h1 
                className="text-2xl font-black text-ghibli-wood leading-tight tracking-wide drop-shadow-sm"
                variants={titleVariants}
                style={{
                  textShadow: '0 2px 4px rgba(139, 69, 19, 0.1)'
                }}
              >
                More Than a Frame - It's a Feeling
              </motion.h1>
            </motion.div>

            {/* Mobile CTA Buttons - Side by Side - MOVIDOS PARA CIMA */}
            <motion.div 
              className="flex flex-wrap gap-2 mb-6"
              variants={itemVariants}
            >
              <Link href="/transformacoes" className="flex-1 min-w-[150px]">
                <motion.div whileTap={{ scale: 0.95 }} className="h-full">
                <Button 
                  className="w-full bg-gradient-to-r from-ghibli-moss via-green-600 to-ghibli-moss-light text-white font-bold py-4 text-base rounded-xl shadow-lg"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="mr-2">🎨</span>
                  Transformar Grátis
                </Button>
                </motion.div>
              </Link>
              
              <Link href="/shop" className="flex-1 min-w-[150px]"> 
                <motion.div whileTap={{ scale: 0.95 }} className="h-full">
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-ghibli-moss text-ghibli-moss hover:bg-ghibli-moss hover:text-white font-bold py-4 text-base rounded-xl"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="mr-2">🛍️</span>
                  Ver Produtos
                </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Mobile Benefits - MOVIDOS PARA BAIXO DOS BOTÕES */}
            <motion.div 
              className="grid grid-cols-2 gap-3 mb-6"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2 bg-white/80 p-3 rounded-lg">
                <Zap className="w-5 h-5 text-ghibli-moss" />
                <span className="text-ghibli-earth font-medium text-sm">Entrega 3-5 dias</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/80 p-3 rounded-lg">
                <Heart className="w-5 h-5 text-ghibli-poppy" />
                <span className="text-ghibli-earth font-medium text-sm">Criado só para si</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/80 p-3 rounded-lg">
                <Users className="w-5 h-5 text-ghibli-moss" />
                <span className="text-ghibli-earth font-medium text-sm">+300 utilizadores</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/80 p-3 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-ghibli-earth font-medium text-sm">5⭐ Reviews</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Desktop Layout */}
        <motion.div 
          className="hidden lg:grid lg:grid-cols-2 gap-8 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* Left Column - Text Content */}
          <motion.div variants={itemVariants}>
            {/* Logo */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Image
                src="/pictuzlogooficial.png"
                alt="PicTuz Logo"
                width={160}
                height={50}
                className="object-contain"
                priority
                quality={95}
              />
            </motion.div>

            {/* Main Headline - Agrupado */}
            <motion.h1 
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-ghibli-wood leading-[1.1] tracking-tight mb-4"
              variants={titleVariants}
            >
              More Than a Frame - <br/>
              It's a Feeling
            </motion.h1>

            {/* Welcome Message - Mini Animação */}
            <motion.div
              className="relative mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.6,
                type: "spring",
                bounce: 0.3 
              }}
            >
              <motion.div
                className="inline-block relative"
              >
                {/* Background Effect - só o fundo se move */}
                <motion.div
                  className="absolute -inset-4 bg-gradient-to-r from-ghibli-sky/30 via-ghibli-sunflower/20 to-ghibli-sky/30 rounded-full blur-sm"
                  animate={{
                    opacity: [0.4, 0.7, 0.4],
                    scale: [0.9, 1.1, 0.9],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Welcome Text - estático, maior, cor diferente */}
                <span className="relative text-lg font-semibold text-ghibli-sky-deep">
                  ✨ Bem-vindo ao Pictuz ✨
                </span>
              </motion.div>
            </motion.div>

            {/* Subtitle with Simplified Animation */}
            <motion.p 
              className="text-lg md:text-xl text-ghibli-earth mb-6 leading-relaxed max-w-3xl"
              variants={subtitleVariants}
            >
              Porque memórias não foram feitas para ficar no ecrã!
            </motion.p>

            {/* Benefits */}
            <motion.div 
              className="grid grid-cols-2 gap-3 mb-6"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-ghibli-moss" />
                <span className="text-ghibli-earth font-medium">Entrega Rápida (3-5 dias)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-ghibli-poppy" />
                <span className="text-ghibli-earth font-medium">Criado só para si</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-ghibli-moss" />
                <span className="text-ghibli-earth font-medium">+300 utilizadores</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-ghibli-earth font-medium">Clientes satisfeitos? Espreita tu mesmo</span>
              </div>
            </motion.div>

            {/* Call to Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mb-6"
              variants={itemVariants}
            >
              <Link href="/transformacoes">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="default" 
                    className="bg-gradient-to-r from-ghibli-moss via-green-600 to-ghibli-moss-light hover:from-green-700 hover:via-ghibli-moss hover:to-green-600 text-white font-bold px-8 py-3 lg:py-6 text-lg rounded-xl shadow-lg hover:shadow-green-500/30 transition-all duration-300 border border-white/20"
                  >
                    <span className="mr-2 text-lg">🎨</span>
                    Transforma a tua Foto Grátis 
                    <span className="ml-2 text-sm animate-bounce">✨</span>
                  </Button>
                </motion.div>
              </Link>
              
              <Link href="/shop">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    size="default"
                    className="border-2 border-ghibli-moss text-ghibli-moss hover:bg-ghibli-moss hover:text-white font-bold px-8 py-3 lg:py-6 text-lg rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg"
                  >
                    <span className="mr-2 text-lg">🛍️</span>
                    Ver Produtos
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column - Product Images Grid */}
          <motion.div 
            className="grid grid-cols-2 gap-3 items-start" 
            variants={itemVariants}
          >
            {/* Imagem principal 9:16 - Canvas */}
            <Link href="/shop/canvas/custom_canvas" className="col-span-1">
              <motion.div 
                className="relative rounded-3xl overflow-hidden shadow-2xl group cursor-pointer w-full aspect-[9/16]"
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Image
                  src="/landing/canvasgrande.png"
                  alt="Canvas personalizado com arte AI na parede"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                  quality={95}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              
                {/* Overlays e texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-gradient-to-r from-ghibli-moss to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    🖼️ Mais Popular
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <h3 className="text-lg font-bold mb-1">Canvas Personalizado</h3>
                  <p className="text-xs opacity-90">Arte única na tua parede</p>
                </div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-ghibli-moss/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10" />
              </motion.div>
            </Link>

            {/* Sub-grelha para os 2 quadrados */}
            <div className="col-span-1 grid grid-rows-2 gap-3 h-full">
              {/* Quadrado 1:1 - Tecnologia */}
              <Link href="/shop/tecnologia/custom_phone_case" className="row-span-1">
                <motion.div 
                  className="relative aspect-square rounded-xl overflow-hidden shadow-lg group cursor-pointer h-full w-full"
                  whileHover={{ scale: 1.02, rotate: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src="/landing/capatele.png"
                    alt="Capa de telemóvel personalizada"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    quality={95}
                    sizes="(max-width: 1024px) 25vw, 12.5vw"
                  />
                  {/* Overlays e texto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-1 right-1">
                    <span className="bg-ghibli-poppy text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                      TOP
                    </span>
                  </div>
                  <div className="absolute bottom-1 left-1 right-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h4 className="text-xs font-bold">Capa Telemóvel</h4>
                  </div>
                </motion.div>
              </Link>

              {/* Quadrado 1:1 - Caneca Coração */}
              <Link href="/shop/mug/heart_mug" className="row-span-1">
                <motion.div 
                  className="relative aspect-square rounded-xl overflow-hidden shadow-lg group cursor-pointer h-full w-full"
                  whileHover={{ scale: 1.02, rotate: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src="/landing/canecacoracao.png"
                    alt="Caneca coração personalizada"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    quality={95}
                    sizes="(max-width: 1024px) 25vw, 12.5vw"
                  />
                  {/* Overlays e texto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-1 right-1">
                    <span className="bg-pink-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                      ❤️
                    </span>
                  </div>
                  <div className="absolute bottom-1 left-1 right-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h4 className="text-xs font-bold">Caneca Coração</h4>
                  </div>
                </motion.div>
              </Link>
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-ghibli-moss/10 to-green-500/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-ghibli-sky/10 to-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-ghibli-poppy/10 to-pink-500/10 rounded-full blur-xl animate-bounce"></div>
      <div className="absolute bottom-40 left-20 w-28 h-28 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 rounded-full blur-xl animate-pulse"></div>
      
      {/* Floating elements */}
      <motion.div 
        className="absolute top-32 right-32 text-4xl opacity-20 z-0"
        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        🎨
      </motion.div>
      <motion.div 
        className="absolute bottom-32 left-32 text-3xl opacity-20 z-0"
        animate={{ y: [0, 10, 0], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      >
        ✨
      </motion.div>
    </section>
  );
};

export default HeroSection;