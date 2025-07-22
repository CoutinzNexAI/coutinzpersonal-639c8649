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

export const AutoImageRevealCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'original' | 'reveal' | 'after'>('original');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());

  // Precarregar próximas imagens
  useEffect(() => {
    const preloadImage = (src: string) => {
      if (!imagesLoaded.has(src)) {
        const img = new window.Image();
        img.onload = () => {
          setImagesLoaded(prev => new Set(prev).add(src));
        };
        img.src = getImageSrc('/' + src);
      }
    };

    // Precarregar imagem atual e próxima
    const currentItem = GALLERY_ITEMS[index];
    const nextIndex = (index + 1) % GALLERY_ITEMS.length;
    const nextItem = GALLERY_ITEMS[nextIndex];
    
    preloadImage(currentItem.before);
    preloadImage(currentItem.after);
    preloadImage(nextItem.before);
    preloadImage(nextItem.after);
  }, [index, imagesLoaded]);

  useEffect(() => {
    if (phase === 'original') {
      timeoutRef.current = setTimeout(() => setPhase('reveal'), ORIGINAL_DURATION);
    } else if (phase === 'reveal') {
      timeoutRef.current = setTimeout(() => setPhase('after'), REVEAL_DURATION);
    } else if (phase === 'after') {
      // AQUI é que muda para a próxima imagem E volta ao original
      timeoutRef.current = setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % GALLERY_ITEMS.length);
        setPhase('original');
      }, AFTER_DURATION);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phase, index]);

  const item = GALLERY_ITEMS[index];

  return (
    <Link href="/transformacoes" className="block w-full h-full">
      <div className="relative w-full h-full aspect-square rounded-xl overflow-hidden shadow-xl cursor-pointer group bg-ghibli-cream/80 border border-ghibli-sand/30">
        {/* Título (desktop only) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`title-${index}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="hidden md:block absolute top-2 left-2 z-20 bg-white/80 rounded-lg px-3 py-1 shadow text-ghibli-wood text-base font-semibold"
          >
            <span>{item.title}</span>
          </motion.div>
        </AnimatePresence>

        {/* Imagem original (sempre visível como base) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${index}`}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full bg-ghibli-cream/80"
          >
            <Image
              src={getImageSrc('/' + item.before)}
              alt={item.title + ' original'}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 25vw"
              priority
            />
          </motion.div>
        </AnimatePresence>

        {/* Reveal da transformada - só aparece nas fases reveal e after */}
        <AnimatePresence>
          {(phase === 'reveal' || phase === 'after') && (
            <motion.div
              key={`transform-${index}`}
              initial={phase === 'reveal' ? { clipPath: 'inset(0 100% 0 0)' } : { opacity: 0 }}
              animate={phase === 'reveal' 
                ? { clipPath: 'inset(0 0% 0 0)' }
                : { opacity: 1, clipPath: 'inset(0 0% 0 0)' }
              }
              exit={{ opacity: 0, scale: 0.95 }}
              transition={phase === 'reveal' 
                ? { duration: REVEAL_DURATION / 1000, ease: 'easeInOut' }
                : { duration: 0.3, ease: 'easeOut' }
              }
              className="absolute inset-0"
              style={{ zIndex: 2 }}
            >
              <div className="absolute inset-0 w-full h-full bg-ghibli-cream/80" />
              <Image
                src={getImageSrc('/' + item.after)}
                alt={item.title + ' transformada'}
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
              className="absolute top-0 bottom-0 w-1.5 bg-white/80 shadow-lg rounded-full z-10"
              style={{ left: 0 }}
            />
          )}
        </AnimatePresence>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
        <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <p className="text-xs font-medium text-center">Clique para experimentar</p>
        </div>
      </div>
    </Link>
  );
};

export default AutoImageRevealCarousel; 