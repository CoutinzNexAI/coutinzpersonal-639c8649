import React from 'react';
import { Upload, Brush, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion'; // Import framer-motion
import { cn } from '@/lib/utils'; // Import cn utility

const HowItWorks = () => {

  // Variantes para a animação do container da grelha (stagger)
  const gridContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Atraso entre a animação de cada filho (cartão)
      },
    },
  };

  // Variantes para a animação de cada cartão individual
  const cardVariants = {
    hidden: { y: 30, opacity: 0 }, // Começa 30px abaixo e invisível
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring', // Efeito elástico
        stiffness: 100,
        damping: 10,
      },
    },
  };

  // Variantes para a animação das linhas conectoras
  const lineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: {
      scaleX: 1,
      opacity: 0.5, // Meia opacidade para ser subtil
      transition: {
        duration: 0.5,
        ease: "easeInOut",
        // Atraso para as linhas aparecerem depois dos cartões
        delay: 0.6, // (0.2 stagger * 3 cards = 0.6) - Ajustar se necessário
      },
    },
  };


  return (
    <section id="como-funciona" className="py-16 md:py-24 overflow-hidden"> {/* Added overflow-hidden */}
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Como Funciona</h2>
        <p className="section-subtitle text-center text-ghibli-earth">
          Transforme suas fotos em apenas três passos simples
        </p>

        {/* Container da Grelha com animação */}
        <motion.div
          className="relative grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12 md:gap-y-8 mt-12" // Added gap-y-12 for mobile
          variants={gridContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }} // Anima quando 10% visível
        >
          {/* --- Linhas Conectoras (Apenas em MD+) --- */}
          {/* Linha entre Cartão 1 e 2 */}
          <motion.div
             className="absolute top-1/2 left-1/3 w-1/3 h-0.5 bg-ghibli-sand origin-left hidden md:block" // Escondido em mobile
             style={{ transform: 'translateY(-50%) translateX(-50%)' }} // Ajusta posicionamento
             variants={lineVariants}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true, amount: 0.1 }}
          />
           {/* Linha entre Cartão 2 e 3 */}
           <motion.div
             className="absolute top-1/2 left-2/3 w-1/3 h-0.5 bg-ghibli-sand origin-left hidden md:block" // Escondido em mobile
             style={{ transform: 'translateY(-50%) translateX(-50%)' }} // Ajusta posicionamento
             variants={lineVariants}
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true, amount: 0.1 }}
          />
          {/* --- Fim Linhas Conectoras --- */}


          {/* Passo 1: Upload */}
          <motion.div
            className="relative z-10 group" // Adiciona group e z-index para ficar sobre as linhas
            variants={cardVariants}
            whileHover={{ y: -8 }} // Efeito lift no hover
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card className="ghibli-card h-full border-ghibli-sand/30 overflow-hidden transition-shadow duration-300 group-hover:shadow-lg"> {/* Garante altura igual e sombra no hover */}
              <CardContent className="p-8 flex flex-col items-center">
                {/* Ícone com animação de escala no hover do cartão */}
                <div className="w-16 h-16 rounded-full bg-ghibli-sky flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
                  <Upload className="h-8 w-8 text-ghibli-sky-deep" />
                </div>
                <h3 className="text-xl font-ghibli text-ghibli-wood mb-2">1. Faça Upload</h3>
                <p className="text-ghibli-earth text-center">
                  Selecione uma foto do seu dispositivo ou arraste-a para a área indicada
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Passo 2: Escolha o Estilo */}
          <motion.div
            className="relative z-10 group"
            variants={cardVariants}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card className="ghibli-card h-full border-ghibli-sand/30 overflow-hidden transition-shadow duration-300 group-hover:shadow-lg">
              <CardContent className="p-8 flex flex-col items-center">
                 {/* Ícone com animação de escala no hover do cartão */}
                 <div className="w-16 h-16 rounded-full bg-ghibli-sand flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
                  <Brush className="h-8 w-8 text-ghibli-earth" />
                </div>
                <h3 className="text-xl font-ghibli text-ghibli-wood mb-2">2. Escolha o Estilo</h3>
                <p className="text-ghibli-earth text-center">
                  Selecione entre os vários estilos artísticos inspirados no universo Ghibli
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Passo 3: Transforme */}
          <motion.div
            className="relative z-10 group"
            variants={cardVariants}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Card className="ghibli-card h-full border-ghibli-sand/30 overflow-hidden transition-shadow duration-300 group-hover:shadow-lg">
              <CardContent className="p-8 flex flex-col items-center">
                 {/* Ícone com animação de escala no hover do cartão */}
                 <div className="w-16 h-16 rounded-full bg-ghibli-sunflower/30 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
                  <Sun className="h-8 w-8 text-ghibli-sunflower" />
                </div>
                <h3 className="text-xl font-ghibli text-ghibli-wood mb-2">3. Transforme</h3>
                <p className="text-ghibli-earth text-center">
                  Veja sua foto ser magicamente transformada e baixe o resultado
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
