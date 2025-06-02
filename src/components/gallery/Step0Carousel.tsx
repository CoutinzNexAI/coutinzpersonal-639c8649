// src/components/gallery/Step0Carousel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sparkles, Wand2, Lightbulb } from 'lucide-react';

interface CarouselExample {
  id: number;
  beforeSrc: string;
  afterSrc: string;
  altBefore: string; // Texto alternativo mais específico
  altAfter: string;  // Texto alternativo mais específico
  ariaLabel: string; // Para o slide como um todo
}

const EXAMPLES_DATA: CarouselExample[] = [
  {
    id: 1,
    beforeSrc: '/saojoaoportonormal.jpg',
    afterSrc: '/saojoaoportoghibli.png',
    altBefore: 'Fotografia original de uma celebração de São João no Porto',
    altAfter: 'Fotografia de São João no Porto transformada para o estilo Ghibli',
    ariaLabel: 'Exemplo de transformação: São João no Porto para estilo Ghibli',
  },
  {
    id: 2,
    beforeSrc: '/marcelonormal.jpg',
    afterSrc: '/reiportugal/marcelo.png',
    altBefore: 'Imagem original de uma paisagem urbana com grafitti',
    altAfter: 'Paisagem urbana com grafitti transformada para o estilo Azulejo',
    ariaLabel: 'Exemplo de transformação: Paisagem urbana para estilo Azulejo Português',
  },
  {
    id: 3,
    beforeSrc: '/camoesnormal.jpg',
    afterSrc: '/camoeslego.png',
    altBefore: 'Estátua original de Luís de Camões',
    altAfter: 'Estátua de Luís de Camões transformada em estilo Lego',
    ariaLabel: 'Exemplo de transformação: Estátua de Camões para estilo Lego',
  },
];

const TIPS: string[] = [
  "Utilize fotos com boa iluminação para melhores resultados",
  "Fundos com muitas pessoas podem piorar o resultado",
  "Experimente diferentes estilos para descobrir o seu favorito!"
];

const SLIDE_INTERVAL = 5500; // 5.5 segundos

// Helper function para obter o src da imagem
const getImageSrcModal = (path: string | undefined | null): string => {
  if (!path) return 'https://placehold.co/300x300/EEE/31343C?text=Indisponível'; 
  return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
};

interface Step0CarouselProps {
  onStartClick: () => void;
}

export const Step0Carousel: React.FC<Step0CarouselProps> = ({ onStartClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [liveRegionText, setLiveRegionText] = useState("");

  const goToNextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) => {
      const next = (prevIndex + 1) % EXAMPLES_DATA.length;
      setLiveRegionText(EXAMPLES_DATA[next]?.ariaLabel || `Exemplo ${next + 1}`);
      return next;
    });
  }, []);

  const goToPreviousSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => {
      const prev = (prevIndex - 1 + EXAMPLES_DATA.length) % EXAMPLES_DATA.length;
      setLiveRegionText(EXAMPLES_DATA[prev]?.ariaLabel || `Exemplo ${prev + 1}`);
      return prev;
    });
  }, []);
  
  const goToIndex = (index: number) => {
    setDirection(index > currentIndex ? 1 : (index < currentIndex ? -1 : 0));
    setCurrentIndex(index);
    setLiveRegionText(EXAMPLES_DATA[index]?.ariaLabel || `Exemplo ${index + 1}`);
  };

  useEffect(() => {
    if (EXAMPLES_DATA.length <= 1) return;
    const intervalId = setInterval(goToNextSlide, SLIDE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [goToNextSlide]);

  useEffect(() => {
    if (TIPS.length <= 1) return;
    const tipIntervalId = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % TIPS.length);
    }, SLIDE_INTERVAL + 1000); // Muda a dica um pouco depois do slide
    return () => clearInterval(tipIntervalId);
  }, []);
  
  // Efeito para navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPreviousSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextSlide, goToPreviousSlide]);


  const currentExample = EXAMPLES_DATA[currentIndex];
  const placeholderSrc = 'https://placehold.co/300x300/EEE/31343C?text=Indisponível';

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    event.currentTarget.src = placeholderSrc;
    event.currentTarget.srcset = ""; // Limpa o srcset também
    // Adicionar classes para estilização de erro se necessário
  };

  const slideVariants = {
    hidden: (customDirection: number) => ({
      x: customDirection > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
    visible: {
      x: '0%',
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 70, damping: 20 },
    },
    exit: (customDirection: number) => ({
      x: customDirection < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3, ease: "easeIn" },
    }),
  };

  if (!currentExample) {
    // Fallback se EXAMPLES_DATA estiver vazio ou currentIndex for inválido
    return (
        <div className="flex flex-col items-center justify-center gap-4 w-full max-w-md mx-auto p-4 h-96 bg-ghibli-cream/50 rounded-lg">
            <Wand2 className="w-12 h-12 text-ghibli-moss" />
            <p className="text-ghibli-wood text-center">A carregar exemplos mágicos...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm sm:max-w-md mx-auto p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex items-center gap-2 text-center"
      >
        <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 text-ghibli-sky" strokeWidth={1.5} />
        <h4 className="text-md sm:text-lg font-ghibli font-semibold text-ghibli-wood tracking-wide">
          Veja a Magia Acontecer!
        </h4>
        <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 opacity-90" strokeWidth={1.5} />
      </motion.div>

      <div className={cn(
        "relative w-full overflow-hidden rounded-xl", // Borda arredondada no container principal
        "bg-ghibli-cream/80 border-2 border-ghibli-sand/50",
        "shadow-xl shadow-ghibli-wood/25 aspect-[4/3] sm:aspect-[16/9] md:aspect-[4/3]", // Proporção do container do slide
        "max-h-[280px] sm:max-h-[320px] md:max-h-[300px]" // Altura máxima responsiva
      )}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center gap-1 sm:gap-2 p-1 sm:p-1.5"
            aria-roledescription="slide"
            aria-label={currentExample.ariaLabel}
          >
            {/* Imagem "Antes" - Quadrada */}
            <div className="relative w-1/2 h-full aspect-square group flex items-center justify-center overflow-hidden rounded-lg bg-black/5">
              <Image
                src={getImageSrcModal(currentExample.beforeSrc)}
                alt={currentExample.altBefore}
                fill
                style={{ objectFit: "contain" }} // 'contain' para ver a imagem toda dentro do quadrado
                className="transition-transform duration-300 group-hover:scale-105"
                priority={currentIndex === 0}
                onError={handleImageError}
                sizes="(max-width: 640px) 40vw, 200px" // Ajustar sizes
                unoptimized={currentExample.beforeSrc.startsWith('https://placehold.co')}
              />
              <span className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-[10px] sm:text-xs px-1 py-0.5 rounded-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                Original
              </span>
            </div>

            {/* Imagem "Depois" - Quadrada */}
            <div className="relative w-1/2 h-full aspect-square group flex items-center justify-center overflow-hidden rounded-lg bg-black/5">
              <Image
                src={getImageSrcModal(currentExample.afterSrc)}
                alt={currentExample.altAfter}
                fill
                style={{ objectFit: "contain" }}
                className="transition-transform duration-300 group-hover:scale-105"
                priority={currentIndex === 0}
                onError={handleImageError}
                sizes="(max-width: 640px) 40vw, 200px" // Ajustar sizes
                unoptimized={currentExample.afterSrc.startsWith('https://placehold.co')}
              />
              <span className="absolute bottom-1 right-1 bg-ghibli-sky bg-opacity-80 text-white text-[10px] sm:text-xs px-1 py-0.5 rounded-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                Transformada
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Elemento para anunciar mudanças de slide a leitores de ecrã */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveRegionText}
      </div>

      {EXAMPLES_DATA.length > 1 && (
        <div className="flex justify-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
          {EXAMPLES_DATA.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-ghibli-moss',
                currentIndex === index
                  ? 'bg-ghibli-moss scale-125'
                  : 'bg-ghibli-stone/50 hover:bg-ghibli-stone/70'
              )}
              aria-label={`Ver exemplo ${index + 1} de ${EXAMPLES_DATA.length}`}
              aria-current={currentIndex === index ? "true" : "false"}
            />
          ))}
        </div>
      )}

      <motion.div
        animate={{ scale: [1, 1.025, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="w-full max-w-[280px] sm:max-w-xs mt-3 sm:mt-4"
      >
        <Button
          onClick={onStartClick}
          size="lg"
          className="w-full ghibli-button shadow-lg hover:shadow-xl transition-shadow" // Adicionado estilo ghibli-button se existir
          aria-label="Experimentar com a sua própria fotografia"
        >
          Experimente com a Sua Foto!
        </Button>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentTipIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease:"easeInOut" }}
          className="mt-2 text-xs sm:text-sm text-ghibli-earth/90 flex items-center text-center px-2"
        >
          <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ghibli-sky mr-1.5 flex-shrink-0" />
          <span>{TIPS[currentTipIndex]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Step0Carousel;