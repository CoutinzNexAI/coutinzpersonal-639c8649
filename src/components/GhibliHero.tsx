// src/components/GhibliHero.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Images } from 'lucide-react'; // Apenas Images é necessário aqui para o botão "Veja Exemplos"
import { useImageProcessing, UseImageProcessingResult } from '@/hooks/useImageProcessing'; // Hook principal e tipo
import { motion, Variants } from 'framer-motion';

// --- IMPORTA OS COMPONENTES REATORIZADOS ---
import { StyleExamplesModal } from './gallery/StyleExamplsModal';
import { TransformationStudio } from './TransformationStudio'; // Novo componente para o estúdio
import StyleSelectorModal from './StyleSelectorModal'; // Modal de seleção de estilo principal

// --- Variantes de Animação para o Título ---
const titleContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // Atraso entre a animação de cada palavra
      delayChildren: 0.3,   // Atraso antes de começar a animar as palavras
    },
  },
};

const titleWordVariants: Variants = {
  hidden: { opacity: 0, y: -20, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 100,
      duration: 0.5,
    },
  },
};

// --- Componente GhibliHero Principal (Agora mais um orquestrador) ---
const GhibliHero = () => {
  // --- Hook Principal ---
  const imageProcessingProps = useImageProcessing();
  const {
    isStyleModalOpen,
    selectedStyle,
    processingState, 
    currentJobId,    
    setIsStyleModalOpen,
    handleNewImage,  
    availableStyles,
    stylesLoading,
    stylesError,
  } = imageProcessingProps;

  const [showStepZeroInStudio, setShowStepZeroInStudio] = useState(true);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const interactiveCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentJobId && !['idle', 'uploading_image', 'creating_job'].includes(processingState)) {
      if (['processing', 'polling_status', 'completed', 'error'].includes(processingState) && !selectedStyle) {
        // console.log('[GhibliHero Effect] Job ID found, but waiting for selectedStyle to load.');
      } else {
        // console.log('[GhibliHero Effect] Job ID found, continuing process.');
      }
    }
  }, [currentJobId, processingState, selectedStyle]);

  const handleTriggerStudio = () => {
    setShowStepZeroInStudio(false);
    if (imageProcessingProps.activeStep !== 1 && processingState === 'idle') {
        handleNewImage(); 
    } else if (imageProcessingProps.activeStep !==1 ) {
        imageProcessingProps.setActiveStep(1);
    }
  };

  const handleOpenExamples = () => {
    setIsExamplesOpen(true);
  };

  const resetStudioToStepZero = () => {
    handleNewImage(); 
    setShowStepZeroInStudio(true); 
  };

  const titleParts = "Transforme as suas Fotos em Obras de Arte!".split(/(Fotos em Obras)/g);


  return (
    <section className="relative pt-4 md:pt-6pb-16 md:pb-24 overflow-hidden">
      {/* Elementos Decorativos Flutuantes */}
      <div className="leaf-decoration top-20 left-10 text-3xl">🍃</div>
      <div className="leaf-decoration bottom-28 right-16 text-2xl">🍂</div>
      <div className="star-decoration top-40 right-28 text-xl">✨</div>
      <div className="star-decoration bottom-16 left-20 text-2xl">✨</div>

      <div className="container relative mx-auto px-4">
        <motion.h1
          variants={titleContainerVariants}
          initial="hidden"
          animate="visible"
          // Aumentada a margem inferior para empurrar o conteúdo abaixo
          className="text-4xl md:text-5xl lg:text-6xl font-ghibli font-bold text-ghibli-wood leading-tight mb-12 md:mb-20 text-center" 
          style={{ textShadow: "0 0 5px transparent" }} 
          whileInView={{ 
            textShadow: [
                "0 0 5px rgba(255, 223, 186, 0)", 
                "0 0 15px rgba(236, 153, 75, 0.7)", 
                "0 0 25px rgba(236, 153, 75, 0.5)",
                "0 0 15px rgba(236, 153, 75, 0.7)",
                "0 0 5px rgba(255, 223, 186, 0)"
            ],
            transition: { 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: titleParts.length * 0.2 + 0.5 
            }
          }}
          viewport={{ once: true, amount: 0.8 }} 
        >
          {titleParts.map((part, index) => (
            <motion.span key={index} variants={titleWordVariants} className="inline-block">
              {part.split("").map((char, charIndex) => (
                <motion.span 
                  key={charIndex} 
                  className="inline-block"
                  initial={{ opacity: 0, y: -10, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ 
                    duration: 0.3, 
                    ease: "easeOut",
                    delay: index * 0.15 + charIndex * 0.03 + Math.random() * 0.1 
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.span>
          ))}
        </motion.h1>

        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start lg:justify-center gap-8 xl:gap-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: titleParts.length * 0.1 + 0.5 }} 
            className="w-full lg:w-5/12 xl:w-4/12 mb-10 lg:mb-0 flex flex-col items-center lg:items-start"
          >
            {/* Subtítulo estilizado com cards animados */}
            <div className="mb-10 w-full">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: titleParts.length * 0.1 + 0.7 }}
                className="mb-4 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 p-4 rounded-xl shadow-sm border border-amber-100 transform hover:scale-102 transition-all duration-300"
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">🪄</span>
                  <p className="text-lg text-ghibli-earth leading-relaxed">
                    Transforme fotografias comuns em <span className="font-semibold text-ghibli-wood">arte verdadeiramente mágica</span>.
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: titleParts.length * 0.1 + 0.9 }}
                className="mb-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 p-4 rounded-xl shadow-sm border border-green-100 transform hover:scale-102 transition-all duration-300"
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">👍</span>
                  <p className="text-lg text-ghibli-earth leading-relaxed">
                    O processo é <span className="font-semibold text-ghibli-wood">simples</span>: envie a foto, escolha o estilo e está feito!
                  </p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: titleParts.length * 0.1 + 1.1 }}
                className="bg-gradient-to-r from-blue-50/80 to-sky-50/80 p-4 rounded-xl shadow-sm border border-blue-100 transform hover:scale-102 transition-all duration-300"
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">🖼️</span>
                  <p className="text-lg text-ghibli-earth leading-relaxed">
                    Crie imagens <span className="font-semibold text-ghibli-wood">fantásticas</span>, prontas para partilhar onde quiser!
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Botões com design aprimorado */}
            <div className="flex flex-col space-y-4 justify-center lg:justify-start w-full">
              <motion.div 
                className="w-full relative group"
                whileHover={{ 
                  scale: 1.03, 
                  transition: { duration: 0.2 }
                }} 
                whileTap={{ scale: 0.98 }}
                animate={{ 
                  y: [0, -4, 0],
                  transition: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: titleParts.length * 0.1 + 1.3}
                }}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-200 to-yellow-300 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <Button
                  variant="ghost" 
                  className="relative w-full text-lg px-8 py-3.5 bg-gradient-to-br from-amber-50 to-yellow-50 text-ghibli-wood font-medium inline-flex items-center justify-center
                           rounded-lg border-2 border-amber-100 hover:border-amber-200 transition-all duration-300
                           shadow-md hover:shadow-lg"
                  onClick={handleTriggerStudio}
                >
                  <motion.span 
                    animate={{ rotate: [0, -1, 1, -1, 0] }} 
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    className="mr-2"
                  >
                    ✨
                  </motion.span>
                  Transforme já a sua foto!
                </Button>
              </motion.div>
              
              <motion.div 
                className="w-full"
                whileHover={{ 
                  scale: 1.03,
                  transition: { duration: 0.2 }
                }} 
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className="w-full text-lg px-6 py-3.5 text-ghibli-earth bg-white/80 backdrop-blur-sm border-ghibli-moss/60 hover:bg-ghibli-moss/10 hover:text-ghibli-moss 
                           hover:border-ghibli-moss inline-flex items-center justify-center transition-all duration-300
                           rounded-lg shadow-sm hover:shadow-md"
                  onClick={handleOpenExamples}
                >
                  <motion.span 
                    whileHover={{ rotate: [0, -10, 10, 0], transition: {duration: 0.4}}}
                    className="bg-ghibli-moss/10 p-1.5 rounded-full mr-2"
                  >
                    <Images className="h-5 w-5 text-ghibli-moss" />
                  </motion.span>
                  Veja exemplos!
                </Button>
              </motion.div>
            </div>

            {/* Selo de confiança */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: titleParts.length * 0.1 + 1.5, duration: 0.7 }}
              className="mt-6 pt-2 flex items-center justify-center lg:justify-start w-full"
            >
              <div className="px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-amber-100 inline-flex items-center">
                <span className="text-amber-600 mr-2">⭐</span>
                <p className="text-sm text-ghibli-earth font-medium">Já transformámos +5000 fotos</p>
          </div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: titleParts.length * 0.1 + 0.7 }} 
            ref={interactiveCardRef} 
            className="w-full md:w-10/12 lg:w-7/12 xl:w-7/12"
          >
            <div className="ghibli-card p-0 h-auto min-h-[22rem] md:min-h-[28rem] flex flex-col items-center justify-center overflow-hidden">
              <TransformationStudio
                {...(imageProcessingProps as Omit<UseImageProcessingResult, 'handleNewImage' | 'currentJobId' | 'setIsStyleModalOpen' | 'isStyleModalOpen'>)}
                showStepZeroContent={showStepZeroInStudio}
                onStartClickForCarousel={handleTriggerStudio}
                onResetToStepZero={resetStudioToStepZero}
              />
            </div>
          </motion.div>
        </div>
      </div>

      <StyleSelectorModal
        isOpen={isStyleModalOpen}
        onOpenChange={setIsStyleModalOpen}
        onStyleSelect={imageProcessingProps.handleStyleSelect}
        selectedStyleId={selectedStyle?.id || null}
        styles={availableStyles}
        isLoading={stylesLoading}
        error={stylesError}
      />

      <StyleExamplesModal
        isOpen={isExamplesOpen}
        onOpenChange={setIsExamplesOpen}
        onStartTransformationClick={() => {
          setIsExamplesOpen(false);
          handleTriggerStudio();
        }}
      />
    </section>
  );
};

export default GhibliHero;