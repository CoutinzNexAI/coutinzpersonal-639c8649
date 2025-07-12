// src/components/gallery/StyleExamplesModal.tsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Wand, X, ChevronLeft, ChevronRight, ImageOff, Book, Camera } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getImageSrc } from '@/lib/utils'; // ✅ NOVO: Import da função utilitária
import { cn } from '@/lib/utils';
import { STYLE_EXAMPLES_DATA } from '@/lib/data/exampleData';

interface StyleExamplesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStartTransformationClick?: (styleId: string) => void;
}

export const StyleExamplesModal: React.FC<StyleExamplesModalProps> = ({
  isOpen,
  onOpenChange,
  onStartTransformationClick,
}) => {
  const [selectedStyleId, setSelectedStyleId] = useState<string>(STYLE_EXAMPLES_DATA[0]?.id || '');
  const [currentPage, setCurrentPage] = useState(0);
  const [hoveredPhoto, setHoveredPhoto] = useState<number | null>(null);
  const [revealedPhoto, setRevealedPhoto] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalTitleId = "style-examples-modal-title";
  const modalDescriptionId = "style-examples-modal-description";

  const currentStyleData = useMemo(() => {
    return STYLE_EXAMPLES_DATA.find(s => s.id === selectedStyleId);
  }, [selectedStyleId]);

  // Sempre mostra 6 exemplos por página para caber sem scroll
  const EXAMPLES_PER_PAGE = 6;
  const examplesToShow = useMemo(() => {
    return currentStyleData?.examples || [];
  }, [currentStyleData]);

  const totalPages = Math.ceil(examplesToShow.length / EXAMPLES_PER_PAGE);

  const currentPageExamples = useMemo(() => {
    const startIndex = currentPage * EXAMPLES_PER_PAGE;
    return examplesToShow.slice(startIndex, startIndex + EXAMPLES_PER_PAGE);
  }, [examplesToShow, currentPage]);

  const handleStyleChange = (styleId: string) => {
    setSelectedStyleId(styleId);
    setCurrentPage(0);
    setHoveredPhoto(null);
    setRevealedPhoto(null);
  };

  const changePage = useCallback((direction: number) => {
    setCurrentPage((prev) => {
      const newPage = prev + direction;
      if (newPage < 0) return totalPages > 0 ? totalPages - 1 : 0;
      if (newPage >= totalPages) return 0;
      return newPage;
    });
    setHoveredPhoto(null);
    setRevealedPhoto(null);
  }, [totalPages]);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || totalPages <= 1) return;
      if (e.key === 'ArrowRight') {
        changePage(1);
      } else if (e.key === 'ArrowLeft') {
        changePage(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, changePage, totalPages]);

  // Animação de virar página de livro
  const pageVariants = {
    hidden: { opacity: 0, rotateY: -15, scale: 0.95 },
    visible: {
      opacity: 1,
      rotateY: 0, 
      scale: 1,
      transition: { 
        duration: 0.5, 
        ease: "easeOut",
        staggerChildren: 0.08
      }
    },
    exit: { 
      opacity: 0,
      rotateY: 15, 
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  const photoVariants = {
    hidden: { opacity: 0, y: 20, rotateX: -10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] max-h-[85vh] sm:max-h-[80vh] p-0 flex flex-col bg-ghibli-cream rounded-2xl shadow-2xl border-2 border-ghibli-sand/30"
        aria-labelledby={modalTitleId}
        aria-describedby={modalDescriptionId}
      >
        {/* Header estilo livro antigo */}
        <DialogHeader className="relative p-3 sm:p-4 border-b-2 border-ghibli-sand/40 bg-gradient-to-r from-ghibli-cream via-ghibli-sand/20 to-ghibli-cream">
          <div className="absolute inset-0 opacity-30" style={{
             backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23D2B48C\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
           }} />
          <div className="relative z-10 flex items-center gap-3">
            <Book className="w-6 h-6 sm:w-7 sm:h-7 text-ghibli-moss" />
            <div>
              <DialogTitle id={modalTitleId} className="text-xl sm:text-2xl md:text-3xl font-ghibli text-ghibli-wood">
                Álbum Mágico de Estilos
              </DialogTitle>
              <DialogDescription id={modalDescriptionId} className="text-ghibli-earth text-xs sm:text-sm mt-1">
                Descubra as transformações incríveis de cada estilo
              </DialogDescription>
            </div>
          </div>
          <DialogClose 
            ref={closeButtonRef} 
            className="absolute right-2 top-2 sm:right-3 sm:top-3 rounded-full p-2.5 sm:p-3 hover:bg-ghibli-sand/30 focus-visible:ring-2 focus-visible:ring-ghibli-moss transition-all backdrop-blur-sm bg-white/70 hover:bg-white/90 z-20 touch-manipulation" 
            aria-label="Fechar álbum de estilos"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-ghibli-stone" />
          </DialogClose>
        </DialogHeader>

        {/* Seletor de estilo - estilo pergaminho */}
        <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-gradient-to-b from-ghibli-sand/10 to-transparent border-b border-ghibli-sand/20">
          <div className="flex justify-center">
            <div className="relative">
              <Select value={selectedStyleId} onValueChange={handleStyleChange}>
                <SelectTrigger className="w-full max-w-sm text-sm sm:text-base min-h-[40px] sm:min-h-[44px] bg-ghibli-cream border-2 border-ghibli-sand/50 focus:ring-2 focus:ring-ghibli-moss text-ghibli-wood shadow-md rounded-xl font-medium">
                  <Camera className="w-4 h-4 mr-2 text-ghibli-moss" />
                  <SelectValue placeholder="Escolha um estilo..." />
                </SelectTrigger>
                <SelectContent className="bg-ghibli-cream border-ghibli-sand shadow-xl rounded-xl">
                  {STYLE_EXAMPLES_DATA.map(style => (
                    <SelectItem 
                      key={style.id} 
                      value={style.id}
                      className="text-sm sm:text-base p-2 sm:p-3 hover:bg-ghibli-sand/30 focus:bg-ghibli-sand/50 text-ghibli-wood cursor-pointer transition-colors rounded-lg m-1"
                    >
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Conteúdo principal - Páginas do álbum */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {currentStyleData ? (
              <div className="flex flex-col min-h-full">
              {/* Nome do estilo atual */}
              <div className="text-center mb-4">
                <h3 className="text-xl sm:text-2xl font-ghibli text-ghibli-wood mb-1">
                    {currentStyleData.name}
                </h3>
                <div className="w-16 h-0.5 bg-ghibli-moss rounded-full mx-auto opacity-60"></div>
                </div>

                              {currentPageExamples.length > 0 ? (
                  <div className="relative">
                  {/* Navegação entre páginas */}
                  {totalPages > 1 && (
                      <>
                        <Button
                        variant="ghost"
                          size="icon"
                        onClick={() => changePage(-1)}
                        className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-20 bg-ghibli-cream/80 hover:bg-ghibli-sand/30 border border-ghibli-sand/50 text-ghibli-wood rounded-full shadow-lg transition-all"
                        aria-label="Página anterior"
                        >
                        <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                        variant="ghost"
                          size="icon"
                        onClick={() => changePage(1)}
                        className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-20 bg-ghibli-cream/80 hover:bg-ghibli-sand/30 border border-ghibli-sand/50 text-ghibli-wood rounded-full shadow-lg transition-all"
                        aria-label="Próxima página"
                        >
                        <ChevronRight className="h-5 w-5" />
                        </Button>
                      </>
                    )}

                  {/* Grid de fotos polaroid */}
                  <AnimatePresence mode="wait">
                      <motion.div
                                             key={`${currentStyleData.id}-${currentPage}`}
                        variants={pageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                       className="mb-4"
                     >
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                        {currentPageExamples.map((example, index) => (
                          <motion.div 
                            key={`${currentStyleData.id}-example-${index}`}
                            variants={photoVariants}
                            className="group cursor-pointer"
                            onHoverStart={() => setHoveredPhoto(index)}
                            onHoverEnd={() => setHoveredPhoto(null)}
                            onClick={() => setRevealedPhoto(revealedPhoto === index ? null : index)}
                          >
                            {/* Polaroid container */}
                            <div className="relative bg-white p-2 sm:p-3 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:rotate-1 hover:shadow-xl border border-ghibli-sand/30">
                              {/* Tape effect no topo */}
                              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-ghibli-sand/40 rounded-sm rotate-45 shadow-sm"></div>
                              
                              {/* Foto container com reveal effect */}
                              <div className="relative aspect-square rounded overflow-hidden bg-ghibli-sand/10">
                                {/* Imagem original */}
                                <Image
                                  src={getImageSrc(example.before)}
                                  alt={`Original - ${currentStyleData.name}`}
                                  fill
                                  style={{ objectFit: "cover" }}
                                  className="transition-all duration-500"
                                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 25vw"
                                  loading="lazy"
                                />
                                
                                {/* Overlay da imagem transformada */}
                                <div className={cn(
                                  "absolute inset-0 transition-all duration-700 ease-out",
                                  hoveredPhoto === index || revealedPhoto === index 
                                    ? "opacity-100" 
                                    : "opacity-0"
                                )}>
                                  <Image
                                    src={getImageSrc(example.after)}
                                    alt={`Transformada - ${currentStyleData.name}`}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 25vw"
                                    loading="lazy"
                                  />
                                </div>

                                {/* Indicador de hover/reveal */}
                                <div className={cn(
                                  "absolute top-2 right-2 bg-ghibli-moss text-white text-xs px-2 py-1 rounded-full transition-all duration-300 shadow-sm",
                                  hoveredPhoto === index || revealedPhoto === index
                                    ? "opacity-100 scale-100"
                                    : "opacity-0 scale-75"
                                )}>
                                  ✨
                              </div>

                                {/* Efeito de brilho mágico */}
                                {(hoveredPhoto === index || revealedPhoto === index) && (
                                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-pulse"></div>
                                )}
                              </div>
                              
                              {/* Legenda polaroid */}
                              <div className="pt-2 text-center">
                                <p className="text-xs text-ghibli-stone font-medium">
                                  {hoveredPhoto === index || revealedPhoto === index ? "✨ Transformada" : "Original"}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      </motion.div>
                    </AnimatePresence>

                  {/* Indicadores de página estilo livro */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <span className="text-xs text-ghibli-stone mr-2">Página</span>
                      {Array.from({ length: totalPages }).map((_, idx) => (
                          <button
                          key={`page-${idx}`}
                          onClick={() => setCurrentPage(idx)}
                            className={cn(
                            "w-6 h-6 rounded text-xs font-bold transition-all duration-200",
                            currentPage === idx
                              ? "bg-ghibli-moss text-white shadow-md scale-110"
                              : "bg-ghibli-sand/30 text-ghibli-stone hover:bg-ghibli-sand/50"
                            )}
                          aria-label={`Ir para página ${idx + 1}`}
                        >
                          {idx + 1}
                        </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8 min-h-[300px]">
                  <div className="bg-ghibli-sand/20 p-6 rounded-full mb-4">
                    <ImageOff className="w-12 h-12 text-ghibli-stone/60" />
                  </div>
                  <p className="text-lg text-ghibli-earth font-medium mb-2">
                    Esta página está vazia
                  </p>
                  <p className="text-sm text-ghibli-stone">
                    Em breve teremos exemplos mágicos!
                  </p>
                  </div>
                )}
                
              {/* Botão CTA - estilo Ghibli */}
              {onStartTransformationClick && currentPageExamples.length > 0 && currentStyleData && (
                <div className="mt-4 pt-4 border-t border-ghibli-sand/30 text-center">
                     <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                      >
                        <Button
                      className="ghibli-button px-6 py-3 text-base font-semibold shadow-lg"
                          onClick={() => {
                            if (currentStyleData) {
                                onOpenChange(false); 
                                onStartTransformationClick(currentStyleData.id); 
                            }
                          }}
                      aria-label={`Experimentar o estilo ${currentStyleData.name}`}
                        >
                      <Wand className="mr-2 h-5 w-5" />
                      Experimentar {currentStyleData.name}
                        </Button>
                      </motion.div>
                  </div>
                )}
            </div>
          ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 min-h-[400px]">
              <div className="bg-ghibli-sand/20 p-8 rounded-full mb-6">
                <Book className="w-16 h-16 text-ghibli-stone/60" />
              </div>
              <p className="text-xl text-ghibli-earth font-medium">
                Selecione um estilo para abrir o álbum
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};