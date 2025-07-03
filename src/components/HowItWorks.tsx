// src/components/HowItWorks.tsx
import React from 'react';
import { Brush } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';

// Variantes para a animação do container da grelha (stagger)
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.25, // Ligeiro aumento para mais espaçamento na animação
    },
  },
};

// Variantes para a animação de cada cartão individual
const cardVariants = {
  hidden: { y: 40, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 12,
    },
  },
};

// Variantes para a animação das linhas conectoras (agora para 4 steps)
const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
      delay: 0.9, // Atraso ajustado para aparecer após os 4 cards (0.25 * 4 = 1.0)
    },
  },
};

const HowItWorks = () => {
  const router = useRouter();

  // Função para navegar para a página de transformação (home)
  const handleStep1Click = () => {
    router.push('/');
  };

  // Função para navegar para a loja
  const handleStep4Click = () => {
    router.push('/shop');
  };

  return (
    <section id="como-funciona" className="py-16 md:py-24 bg-ghibli-cream/20 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.1 }}
        >
            <h2 className="section-title text-center font-ghibli text-ghibli-wood">Como Funciona a Magia</h2>
            <p className="section-subtitle text-center text-ghibli-earth mb-6">
              Transforme as suas fotos em produtos únicos em apenas quatro passos simples e encantados.
            </p>
            <div className="flex justify-center mb-12 md:mb-16">
                <motion.div 
                className="h-1.5 w-24 bg-ghibli-moss/60 rounded-full"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.9, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
                />
            </div>
        </motion.div>

        <motion.div
          className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 md:gap-y-10 mt-12"
          variants={gridContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* --- Linhas Conectoras (Apenas em LG+) --- */}
          <motion.div
            className="absolute top-1/2 left-0 w-full h-0.5 hidden lg:block"
            style={{ transform: 'translateY(-50%)', zIndex: 0 }}
          >
            <motion.div
              className="absolute left-[calc(12.5%-1px)] w-[calc(25%+2px)] h-full bg-ghibli-sand/70 origin-left"
              variants={lineVariants}
            />
            <motion.div
              className="absolute left-[calc(37.5%-1px)] w-[calc(25%+2px)] h-full bg-ghibli-sand/70 origin-left"
              variants={lineVariants}
            />
            <motion.div
              className="absolute left-[calc(62.5%-1px)] w-[calc(25%+2px)] h-full bg-ghibli-sand/70 origin-left"
              variants={lineVariants}
            />
          </motion.div>
          {/* --- Fim Linhas Conectoras --- */}

          {/* Passo 1: Upload */}
          <motion.div
            className="relative z-10 group cursor-pointer"
            variants={cardVariants}
            whileHover={{ y: -10, transition: { type: 'spring', stiffness: 300, duration: 0.2 } }}
            onClick={handleStep1Click}
            title="Clique para transformar uma foto"
          >
            <Card className="ghibli-card h-full border-2 border-ghibli-sand/40 bg-white/70 backdrop-blur-sm overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-ghibli-sky/50">
              <CardContent className="p-6 md:p-8 flex flex-col items-center text-center">
                <motion.div 
                  className="w-28 h-28 rounded-full bg-ghibli-sky/20 flex items-center justify-center mb-6 border-2 border-ghibli-sky/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-ghibli-sky/30 group-hover:border-ghibli-sky/50"
                  whileHover={{boxShadow: "0 0 15px rgba(135, 206, 235, 0.7)"}}
                >
                  <Image 
                    src="/fotousar/upload.jpg" 
                    alt="Upload" 
                    width={80} 
                    height={80} 
                    className="rounded-md object-cover"
                  />
                </motion.div>
                <h3 className="text-xl lg:text-2xl font-ghibli text-ghibli-wood mb-3">1. Faça Upload</h3>
                <p className="text-ghibli-earth text-sm md:text-base leading-relaxed">
                  Selecione uma foto do seu dispositivo ou arraste-a para a área indicada.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Passo 2: Escolha o Estilo */}
          <motion.div
            className="relative z-10 group"
            variants={cardVariants}
            whileHover={{ y: -10, transition: { type: 'spring', stiffness: 300, duration: 0.2 } }}
          >
            <Card className="ghibli-card h-full border-2 border-ghibli-sand/40 bg-white/70 backdrop-blur-sm overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-ghibli-moss/50">
              <CardContent className="p-6 md:p-8 flex flex-col items-center text-center">
                <motion.div 
                  className="w-28 h-28 rounded-full bg-ghibli-sand/40 flex items-center justify-center mb-6 border-2 border-ghibli-sand/60 transition-all duration-300 group-hover:scale-110 group-hover:bg-ghibli-sand/60 group-hover:border-ghibli-sand"
                  whileHover={{boxShadow: "0 0 15px rgba(210, 180, 140, 0.7)"}}
                >
                  <Brush className="h-20 w-20 text-ghibli-earth-dark" />
                </motion.div>
                <h3 className="text-xl lg:text-2xl font-ghibli text-ghibli-wood mb-3">2. Escolha o Estilo</h3>
                <p className="text-ghibli-earth text-sm md:text-base leading-relaxed">
                  Navegue pela nossa galeria mágica e selecione o seu estilo artístico favorito.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Passo 3: Receba a Magia */}
          <motion.div
            className="relative z-10 group"
            variants={cardVariants}
            whileHover={{ y: -10, transition: { type: 'spring', stiffness: 300, duration: 0.2 } }}
          >
            <Card className="ghibli-card h-full border-2 border-ghibli-sand/40 bg-white/70 backdrop-blur-sm overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-ghibli-sunflower/70">
              <CardContent className="p-6 md:p-8 flex flex-col items-center text-center">
                <motion.div 
                  className="w-28 h-28 rounded-full bg-ghibli-sunflower/20 flex items-center justify-center mb-6 border-2 border-ghibli-sunflower/40 transition-all duration-300 group-hover:scale-110 group-hover:bg-ghibli-sunflower/40 group-hover:border-ghibli-sunflower/60"
                  whileHover={{boxShadow: "0 0 15px rgba(255, 223, 100, 0.8)"}}
                >
                  <Image 
                    src="/fotousar/magia.jpg" 
                    alt="Magia" 
                    width={80} 
                    height={80} 
                    className="rounded-md object-cover"
                  />
                </motion.div>
                <h3 className="text-xl lg:text-2xl font-ghibli text-ghibli-wood mb-3">3. Receba a Magia</h3>
                <p className="text-ghibli-earth text-sm md:text-base leading-relaxed">
                  Veja a sua foto ser transformada e descarregue a sua nova obra de arte!
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Passo 4: Escolha um Produto */}
          <motion.div
            className="relative z-10 group cursor-pointer"
            variants={cardVariants}
            whileHover={{ y: -10, transition: { type: 'spring', stiffness: 300, duration: 0.2 } }}
            onClick={handleStep4Click}
            title="Clique para ver produtos personalizáveis"
          >
            <Card className="ghibli-card h-full border-2 border-ghibli-sand/40 bg-white/70 backdrop-blur-sm overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-ghibli-moss/50">
              <CardContent className="p-6 md:p-8 flex flex-col items-center text-center">
                <motion.div 
                  className="w-28 h-28 rounded-full bg-ghibli-moss/20 flex items-center justify-center mb-6 border-2 border-ghibli-moss/40 transition-all duration-300 group-hover:scale-110 group-hover:bg-ghibli-moss/40 group-hover:border-ghibli-moss/60"
                  whileHover={{boxShadow: "0 0 15px rgba(79, 111, 82, 0.8)"}}
                >
                  <Image 
                    src="/fotousar/produto.png" 
                    alt="Produto" 
                    width={80} 
                    height={80} 
                    className="rounded-md object-cover"
                  />
                </motion.div>
                <h3 className="text-xl lg:text-2xl font-ghibli text-ghibli-wood mb-3">4. Escolha um Produto</h3>
                <p className="text-ghibli-earth text-sm md:text-base leading-relaxed">
                  Transforme a sua arte em produtos únicos: canvas, canecas, capas e muito mais!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
