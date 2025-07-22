import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getImageSrc } from '@/lib/utils';

// Copiado de InteractiveGallery.tsx
const GALLERY_ITEMS = [
  { id: 1, title: "Pixar", before: "fotousar/raparigasala.png", after: "fotousar/raparigasala2.png" },
  { id: 2, title: "Rei de Portugal", before: "fotousar/rapazfaculdade.png", after: "fotousar/rapazfaculdaderei.png" },
  { id: 3, title: "Graffiti", before: "fotousar/afonso.jpg", after: "fotousar/afonsograf.jpg" },
  { id: 4, title: "Ghibli", before: "fotousar/criancacao.webp", after: "fotousar/criancacaoghibli.png" },
  { id: 5, title: "Cartoon", before: "fotousar/homempraia.png", after: "fotousar/homempraia6.png" },
  { id: 6, title: "Azulejo Português", before: "fotousar/maiamota.jpg", after: "fotousar/maiaazulejo.jpg" },
  { id: 7, title: "Simspon", before: "fotousar/rapazcao.png", after: "fotousar/rapazcao4.png" },
  { id: 8, title: "Lego", before: "fotousar/raparigalisboa.png", after: "fotousar/raparigalisboa3.png" },
  { id: 9, title: "GTA", before: "fotousar/raparigaalgarve.png", after: "fotousar/raparigaalgarve7.jpg" },
];

const ORIGINAL_DURATION = 2200; // ms
const REVEAL_DURATION = 1200; // ms
const AFTER_DURATION = 3500; // ms
const TRANSITION_DURATION = 400; // ms - nova duração para transição suave

export const AutoImageRevealCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'original' | 'reveal' | 'after' | 'transitioning'>('original');
  const [nextIndex, setNextIndex] = useState(1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preload próxima imagem
  useEffect(() => {
    setNextIndex((index + 1) % GALLERY_ITEMS.length);
  }, [index]);

  useEffect(() => {
    if (phase === 'original') {
      timeoutRef.current = setTimeout(() => setPhase('reveal'), ORIGINAL_DURATION);
    } else if (phase === 'reveal') {
      timeoutRef.current = setTimeout(() => setPhase('after'), REVEAL_DURATION);
    } else if (phase === 'after') {
      timeoutRef.current = setTimeout(() => setPhase('transitioning'), AFTER_DURATION);
    } else if (phase === 'transitioning') {
      timeoutRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % GALLERY_ITEMS.length);
        setPhase('original');
      }, TRANSITION_DURATION);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phase, index]);

  const currentItem = GALLERY_ITEMS[index];
  const nextItem = GALLERY_ITEMS[nextIndex];

  return (
    <Link href="/transformacoes" className="block w-full h-full">
      <div className="relative w-full h-full aspect-square rounded-xl overflow-hidden shadow-xl cursor-pointer group bg-ghibli-cream/80 border border-ghibli-sand/30">
        
        {/* Preload da próxima imagem (invisível) */}
        <div className="absolute inset-0 opacity-0 pointer-events-none">
          <Image
            src={getImageSrc('/' + nextItem.before)}
            alt={nextItem.title + ' preload'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 25vw"
            priority={false}
          />
          <Image
            src={getImageSrc('/' + nextItem.after)}
            alt={nextItem.title + ' preload transformada'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 25vw"
            priority={false}
          />
        </div>

        {/* Container principal com animação de fade na transição */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`carousel-${index}`}
            initial={phase === 'transitioning' ? { opacity: 0, scale: 1.05 } : false}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: phase === 'transitioning' ? TRANSITION_DURATION / 1000 : 0.3,
              ease: "easeInOut" 
            }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Título (desktop only) */}
            <motion.div 
              className="hidden md:block absolute top-2 left-2 z-20 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow text-ghibli-wood text-base font-semibold"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span>{currentItem.title}</span>
            </motion.div>

            {/* Imagem original (base) */}
            <div className="absolute inset-0 w-full h-full bg-ghibli-cream/80">
              <Image
                src={getImageSrc('/' + currentItem.before)}
                alt={currentItem.title + ' original'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 25vw"
                priority
              />
            </div>

            {/* Reveal da transformada */}
            <AnimatePresence>
              {phase === 'reveal' && (
                <motion.div
                  key={`reveal-${index}`}
                  initial={{ clipPath: 'inset(0 100% 0 0)' }}
                  animate={{ clipPath: 'inset(0 0% 0 0)' }}
                  exit={{ clipPath: 'inset(0 0% 0 0)' }}
                  transition={{ duration: REVEAL_DURATION / 1000, ease: 'easeInOut' }}
                  className="absolute inset-0 z-10"
                >
                  <div className="absolute inset-0 w-full h-full bg-ghibli-cream/80" />
                  <Image
                    src={getImageSrc('/' + currentItem.after)}
                    alt={currentItem.title + ' transformada'}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 25vw"
                    priority
                  />
                </motion.div>
              )}
              
              {phase === 'after' && (
                <motion.div
                  key={`after-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute inset-0 z-10"
                >
                  <div className="absolute inset-0 w-full h-full bg-ghibli-cream/80" />
                  <Image
                    src={getImageSrc('/' + currentItem.after)}
                    alt={currentItem.title + ' transformada'}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 25vw"
                    priority
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Risca só durante o reveal */}
            <AnimatePresence>
              {phase === 'reveal' && (
                <motion.div
                  key={`bar-${index}`}
                  initial={{ left: '0%' }}
                  animate={{ left: '100%' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: REVEAL_DURATION / 1000, ease: 'easeInOut' }}
                  className="absolute top-0 bottom-0 w-1.5 bg-white/90 shadow-lg rounded-full z-20"
                  style={{ left: 0 }}
                />
              )}
            </AnimatePresence>

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30" />
            <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
              <p className="text-xs font-medium text-center">Clique para experimentar</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Link>
  );
};

export default AutoImageRevealCarousel; 