// src/components/gallery/StyleExamplesModal.tsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Wand, X, ChevronLeft, ChevronRight, ArrowRight, ImageOff } from 'lucide-react';

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
import { cn } from '@/lib/utils';
import { STYLE_EXAMPLES_DATA } from '@/lib/data/exampleData'; // Corrigido conforme a tua indicação

// Helper function para obter o src da imagem
const getImageSrc = (path: string | undefined | null): string => {
  if (!path) return 'https://placehold.co/300x300/EEE/31343C?text=Indisponível'; // Reduzido placeholder
  return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
};

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
  const [swipeDirection, setSwipeDirection] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalTitleId = "style-examples-modal-title";
  const modalDescriptionId = "style-examples-modal-description";

  const currentStyleData = useMemo(() => {
    return STYLE_EXAMPLES_DATA.find(s => s.id === selectedStyleId);
  }, [selectedStyleId]);

  const [itemsPerPage, setItemsPerPage] = useState(2); 
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 768) { 
        setItemsPerPage(1);
      } else { 
        setItemsPerPage(2);
      }
    };
    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const examplesToShow = useMemo(() => {
    return currentStyleData?.examples || [];
  }, [currentStyleData]);

  const totalExamplePages = Math.ceil(examplesToShow.length / itemsPerPage);

  const currentPagedExamples = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    return examplesToShow.slice(startIndex, startIndex + itemsPerPage);
  }, [examplesToShow, currentPage, itemsPerPage]);

  const handleStyleChange = (styleId: string) => {
    setSelectedStyleId(styleId);
    setCurrentPage(0);
    setSwipeDirection(0);
  };

  const changeExamplePage = useCallback((direction: number) => {
    setSwipeDirection(direction);
    setCurrentPage((prev) => {
      const newPage = prev + direction;
      if (newPage < 0) return totalExamplePages > 0 ? totalExamplePages - 1 : 0;
      if (newPage >= totalExamplePages) return 0;
      return newPage;
    });
  }, [totalExamplePages]);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || totalExamplePages <= 1) return;
      if (e.key === 'ArrowRight') {
        changeExamplePage(1);
      } else if (e.key === 'ArrowLeft') {
        changeExamplePage(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, changeExamplePage, totalExamplePages]);

  const pageVariants = {
    hidden: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 30 : -30, // Reduzido o deslocamento X
      scale: 0.97,
    }),
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 120, damping: 22, duration: 0.3 } // Ajuste na animação
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction < 0 ? 30 : -30,
      scale: 0.97,
      transition: { duration: 0.15, ease: "easeIn" } // Saída mais rápida
    })
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[75vw] xl:max-w-[65vw] p-0 max-h-[90vh] overflow-hidden flex flex-col bg-ghibli-cream rounded-xl shadow-2xl"
        aria-labelledby={modalTitleId}
        aria-describedby={modalDescriptionId}
      >
        <DialogHeader className="p-4 sm:p-6 border-b border-ghibli-sand/30 sticky top-0 bg-ghibli-cream/95 backdrop-blur-sm z-20">
          <DialogTitle id={modalTitleId} className="text-2xl sm:text-3xl font-ghibli text-ghibli-wood">
            ✨ Galeria de Estilos Mágicos
          </DialogTitle>
          {/* Descrição do modal ainda presente para acessibilidade, mas a descrição do estilo foi removida abaixo */}
          <DialogDescription id={modalDescriptionId} className="sr-only"> 
            Explore os exemplos dos diferentes estilos de transformação de imagem.
          </DialogDescription>
          <DialogClose ref={closeButtonRef} className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full p-1.5 hover:bg-ghibli-sand/50 focus-visible:ring-ghibli-moss" aria-label="Fechar galeria de estilos">
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-ghibli-stone" />
          </DialogClose>
        </DialogHeader>

        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-ghibli-sand/20 flex justify-center">
          <Select value={selectedStyleId} onValueChange={handleStyleChange}>
            <SelectTrigger className="w-full max-w-xs sm:max-w-sm md:max-w-md text-base min-h-[48px] bg-white border-ghibli-stone/40 focus:ring-ghibli-moss text-ghibli-wood" aria-label="Selecionar um estilo para ver exemplos">
              <SelectValue placeholder="Selecione um estilo..." />
            </SelectTrigger>
            <SelectContent className="bg-ghibli-cream border-ghibli-sand shadow-lg">
              {STYLE_EXAMPLES_DATA.map(style => (
                <SelectItem 
                  key={style.id} 
                  value={style.id}
                  className="text-base p-3 hover:bg-ghibli-sand/50 focus:bg-ghibli-sand/70 text-ghibli-wood cursor-pointer"
                >
                  {style.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6"> {/* Reduzido padding geral */}
          {currentStyleData ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStyleData.id}
                initial={{ opacity: 0 }} // Animação mais simples para a mudança de estilo
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {/* Nome do Estilo (mantido, mas descrição removida) */}
                <div className="mb-3 sm:mb-4 text-center">
                  <motion.h3 
                    key={`title-${currentStyleData.id}`}
                    initial={{ opacity: 0, y:10 }} animate={{ opacity:1, y:0}} transition={{delay:0.05, duration:0.25}}
                    className="font-ghibli text-ghibli-wood text-xl sm:text-2xl"
                  >
                    {currentStyleData.name}
                  </motion.h3>
                  {/* A DESCRIÇÃO DO ESTILO FOI REMOVIDA DAQUI */}
                </div>

                {examplesToShow.length > 0 ? (
                  <div className="relative">
                    {totalExamplePages > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => changeExamplePage(-1)}
                          className="absolute left-[-8px] sm:left-[-12px] md:left-[-18px] top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white border-ghibli-sand/60 text-ghibli-wood rounded-full p-1.5 sm:p-2 shadow-lg hover:shadow-xl transition-all"
                          aria-label="Exemplos anteriores"
                        >
                          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => changeExamplePage(1)}
                          className="absolute right-[-8px] sm:right-[-12px] md:right-[-18px] top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white border-ghibli-sand/60 text-ghibli-wood rounded-full p-1.5 sm:p-2 shadow-lg hover:shadow-xl transition-all"
                          aria-label="Próximos exemplos"
                        >
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                      </>
                    )}
                    <AnimatePresence initial={false} custom={swipeDirection} mode="popLayout">
                      <motion.div
                        key={currentStyleData.id + currentPage}
                        custom={swipeDirection}
                        variants={pageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={cn(
                            "grid gap-3 sm:gap-4 md:gap-6", 
                            itemsPerPage === 1 && "grid-cols-1",
                            itemsPerPage === 2 && "grid-cols-1 sm:grid-cols-2", 
                        )}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(_e, i) => {
                            const offset = i.offset.x;
                            const velocity = i.velocity.x;
                            if (offset < -40 || velocity < -250) { changeExamplePage(1); } 
                            else if (offset > 40 || velocity > 250) { changeExamplePage(-1); }
                        }}
                      >
                        {currentPagedExamples.map((example, index) => (
                          <motion.div 
                            key={`${currentStyleData.id}-example-${example.before}-${index}`}
                            className="bg-white/50 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg border border-ghibli-sand/30 flex flex-col items-center transition-shadow duration-300"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ y: -3, boxShadow: "0px 8px 20px -4px rgba(76, 89, 67, 0.12), 0px 6px 8px -5px rgba(76, 89, 67, 0.08)"}}
                          >
                            {/* Em mobile (itemsPerPage === 1), as imagens ficam lado a lado */}
                            {/* Em desktop (itemsPerPage === 2), mantém a estrutura de coluna */}
                            <div className={cn(
                                "flex items-center justify-around w-full gap-1 sm:gap-2",
                                itemsPerPage === 1 ? "flex-row" : "flex-col sm:flex-row" // Lado a lado em mobile se for 1 item por página
                            )}>
                              {/* Container da Imagem Original */}
                              <div className={cn(
                                "relative aspect-square group overflow-hidden rounded-md bg-slate-100/80",
                                itemsPerPage === 1 ? "w-1/2" : "w-full sm:w-1/2" // Ajusta largura para mobile
                              )}>
                                <Image
                                  src={getImageSrc(example.before)}
                                  alt={`Original - ${currentStyleData.name} Exemplo ${index + 1}`}
                                  fill
                                  style={{ objectFit: "contain" }}
                                  className="transition-transform duration-300 group-hover:scale-105"
                                  sizes={itemsPerPage === 1 ? "40vw" : "(max-width: 767px) 80vw, 35vw"} // Tamanhos menores para mobile
                                  loading="lazy"
                                  onError={(e) => { (e.target as HTMLImageElement).src = getImageSrc(null); }}
                                />
                                {/* Legenda removida para mobile, opcional para desktop */}
                                <span className="hidden sm:block absolute top-1 left-1 bg-black/40 text-white text-[9px] px-1 py-0.5 rounded-sm">Original</span>
                              </div>

                              {/* Seta de transformação */}
                              <div className="text-ghibli-moss shrink-0"> {/* shrink-0 para não esmagar a seta */}
                                <ArrowRight className={cn("w-3 h-3 sm:w-4 sm:h-4", itemsPerPage === 1 ? "rotate-0" : "transform sm:rotate-0 rotate-90 my-1 sm:my-0")} />
                              </div>
                              
                              {/* Container da Imagem Transformada */}
                              <div className={cn(
                                "relative aspect-square group overflow-hidden rounded-md bg-slate-100/80",
                                itemsPerPage === 1 ? "w-1/2" : "w-full sm:w-1/2" // Ajusta largura para mobile
                              )}>
                                <Image
                                  src={getImageSrc(example.after)}
                                  alt={`Transformada - ${currentStyleData.name} Exemplo ${index + 1}`}
                                  fill
                                  style={{ objectFit: "contain" }}
                                  className="transition-transform duration-300 group-hover:scale-105"
                                  sizes={itemsPerPage === 1 ? "40vw" : "(max-width: 767px) 80vw, 35vw"} // Tamanhos menores para mobile
                                  loading="lazy"
                                  onError={(e) => { (e.target as HTMLImageElement).src = getImageSrc(null); }}
                                />
                                <span className="hidden sm:block absolute top-1 left-1 bg-ghibli-sky/70 text-white text-[9px] px-1 py-0.5 rounded-sm">Transformada</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                    {totalExamplePages > 1 && (
                      <div className="mt-3 sm:mt-4 flex justify-center items-center gap-1.5 sm:gap-2">
                        {Array.from({ length: totalExamplePages }).map((_, idx) => (
                          <button
                            key={`dot-${idx}`}
                            onClick={() => {
                              setSwipeDirection(idx > currentPage ? 1 : (idx < currentPage ? -1 : 0));
                              setCurrentPage(idx);
                            }}
                            className={cn(
                              "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-ghibli-moss",
                              currentPage === idx ? "bg-ghibli-moss scale-125 shadow-sm" : "bg-ghibli-stone/40 hover:bg-ghibli-stone/60"
                            )}
                            aria-label={`Ir para página de exemplos ${idx + 1}`}
                            aria-current={currentPage === idx}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-ghibli-earth flex flex-col items-center min-h-[200px] justify-center">
                    <ImageOff className="w-12 h-12 text-ghibli-stone/70 mb-3" />
                    Ainda não existem exemplos para este estilo.
                  </div>
                )}
                
                {onStartTransformationClick && examplesToShow.length > 0 && currentStyleData && (
                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-ghibli-sand/30 text-center">
                     <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-block"
                      >
                        <Button
                          className="ghibli-button px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base" // Ajuste no padding e texto
                          onClick={() => {
                            if (currentStyleData) {
                                onOpenChange(false); 
                                onStartTransformationClick(currentStyleData.id); 
                            }
                          }}
                          aria-label={`Começar transformação com o estilo ${currentStyleData.name}`}
                        >
                          <Wand className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:h-5" />
                          Experimente o Estilo {currentStyleData.name}
                        </Button>
                      </motion.div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
             <div className="text-center py-12 text-ghibli-earth flex flex-col items-center min-h-[200px] justify-center">
                <ImageOff className="w-16 h-16 text-ghibli-stone/60 mb-4" />
                <p className="text-lg">Selecione um estilo para ver os exemplos.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};