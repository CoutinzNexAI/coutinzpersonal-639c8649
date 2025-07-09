import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Loader2, Heart, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCommunity, CommunityTransformation } from '@/hooks/useCommunity';

// =====================================================
// COMMUNITY EXAMPLES MODAL
// Modal simples para mostrar exemplos da comunidade
// =====================================================

interface CommunityExamplesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStartTransformationClick?: () => void;
}

export const CommunityExamplesModal: React.FC<CommunityExamplesModalProps> = ({
  isOpen,
  onOpenChange,
  onStartTransformationClick,
}) => {
  // Estados locais para o modal
  const [transformations, setTransformations] = useState<CommunityTransformation[]>([]);
  const [loadingTransformations, setLoadingTransformations] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const isMobile = useIsMobile();
  
  // Configuração responsiva: 4x1 desktop, 2x1 mobile
  const itemsPerPage = isMobile ? 2 : 4;
  const totalItemsToShow = isMobile ? 8 : 16; // 4 páginas fixas
  const fixedTotalPages = 4;
  
  // Fetch transformações quando abre o modal - buscar mais para preencher 4 páginas
  useEffect(() => {
    if (isOpen) {
      const fetchCommunityExamples = async () => {
        try {
          setLoadingTransformations(true);
          
          const params = new URLSearchParams({
            page: '1',
            limit: totalItemsToShow.toString(), // Buscar exatamente o que precisamos
            sort: 'recent',
            timeframe: 'all',
            search: ''
          });

          const response = await fetch(`/api/community/get-public-transformations?${params}`);
          const data = await response.json();

          if (data.success) {
            setTransformations(data.transformations || []);
          }
        } catch (error) {
          console.error('Error fetching community examples:', error);
        } finally {
          setLoadingTransformations(false);
        }
      };
      
      fetchCommunityExamples();
      setCurrentPage(0);
    }
  }, [isOpen, totalItemsToShow]);

  // Limitar transformações às mais recentes para 4 páginas fixas
  const limitedTransformations = transformations.slice(0, totalItemsToShow);
  
  // Calcular páginas - sempre 4 páginas fixas
  const totalPages = fixedTotalPages;
  const currentTransformations = limitedTransformations.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Navegação - 4 páginas fixas
  const goToNext = useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % fixedTotalPages);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + fixedTotalPages) % fixedTotalPages);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'ArrowLeft') goToPrevious();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrevious]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[95vw] md:max-w-[85vw] lg:max-w-[80vw] max-h-[90vh] p-0 flex flex-col bg-gradient-to-br from-white via-ghibli-cream/30 to-white backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20"
      >
        {/* Header */}
        <DialogHeader className="relative p-6 border-b border-ghibli-sand/20 bg-gradient-to-b from-white/95 to-ghibli-cream/50 backdrop-blur-sm">
          <div className="text-center">
            <div className="inline-flex items-center justify-center bg-gradient-to-r from-ghibli-moss/10 to-green-100 p-3 rounded-full mb-3">
              <Heart className="w-6 h-6 text-ghibli-moss" />
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-ghibli-wood mb-2 font-sans">
              Fotos da Comunidade
            </DialogTitle>
            <p className="text-ghibli-earth/80 text-sm">
              Veja criações incríveis dos nossos utilizadores
            </p>
          </div>
        </DialogHeader>

        {/* Conteúdo principal */}
        <div className="flex-1 p-6 md:p-8">
          {loadingTransformations ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-ghibli-moss/20 border-t-ghibli-moss rounded-full animate-spin"></div>
                <Heart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-ghibli-moss" />
              </div>
              <p className="text-ghibli-earth mt-6 font-medium">A carregar fotos da comunidade...</p>
              <p className="text-ghibli-earth/60 text-sm mt-1">Isto pode demorar uns segundos</p>
            </div>
          ) : limitedTransformations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="bg-ghibli-sand/10 p-6 rounded-full mb-6">
                <ImageOff className="h-12 w-12 text-ghibli-earth/50" />
              </div>
              <h3 className="text-ghibli-wood font-semibold text-lg mb-2">Ainda não há transformações</h3>
              <p className="text-ghibli-earth/70 text-center">
                A comunidade ainda está a crescer.
                <br />
                Seja o primeiro a partilhar a sua criação!
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Navegação - setas modernas sempre visíveis */}
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-[-24px] top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white border border-ghibli-moss/20 hover:border-ghibli-moss text-ghibli-wood hover:text-ghibli-moss rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 w-12 h-12"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-[-24px] top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white border border-ghibli-moss/20 hover:border-ghibli-moss text-ghibli-wood hover:text-ghibli-moss rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 w-12 h-12"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              {/* Grid das transformações */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "grid gap-4",
                    isMobile ? "grid-cols-2" : "grid-cols-4"
                  )}
                >
                  {currentTransformations.map((transformation, index) => (
                    <motion.div
                      key={transformation.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                      className="group cursor-pointer"
                    >
                                             {/* Card moderno da comunidade */}
                       <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-white/50 hover:border-ghibli-moss/30 hover:scale-[1.02]">
                         {/* Imagem */}
                         <div className="relative aspect-square overflow-hidden">
                           <Image
                             src={transformation.output_url}
                             alt={transformation.public_title || 'Transformação'}
                             fill
                             className="object-cover transition-transform duration-500 group-hover:scale-110"
                             sizes="(max-width: 768px) 50vw, 25vw"
                           />
                           {/* Overlay com likes - design moderno */}
                           <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-ghibli-wood px-2.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-lg">
                             <Heart className="w-3 h-3 text-red-500" />
                             <span className="font-medium">{transformation.like_count || 0}</span>
                           </div>
                         </div>
                         
                         {/* Info card - design limpo */}
                         <div className="p-4">
                           {/* Título - só mostrar se existir */}
                           {transformation.public_title && (
                             <h3 className="font-semibold text-ghibli-wood text-sm mb-2 line-clamp-2 leading-relaxed">
                               {transformation.public_title}
                             </h3>
                           )}
                           
                                                       {/* Estilo - design moderno */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-white bg-gradient-to-r from-ghibli-moss to-green-600 px-3 py-1.5 rounded-full font-medium shadow-sm">
                                {transformation.style_name || 'Estilo'}
                              </span>
                            </div>
                         </div>
                       </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Indicador de página - sempre 4 páginas */}
              <div className="flex justify-center mt-8 gap-3">
                {Array.from({ length: fixedTotalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={cn(
                      "rounded-full transition-all duration-300 hover:scale-125",
                      index === currentPage
                        ? "bg-ghibli-moss w-8 h-3 shadow-lg"
                        : "bg-ghibli-sand/40 hover:bg-ghibli-moss/60 w-3 h-3"
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer com botão CTA */}
        <div className="p-6 border-t border-ghibli-sand/20 bg-gradient-to-t from-ghibli-cream/30 to-transparent">
          <div className="flex justify-center">
            <Button
              onClick={() => {
                onOpenChange(false);
                onStartTransformationClick?.();
              }}
              className="px-8 py-2.5 bg-gradient-to-r from-ghibli-moss via-green-600 to-ghibli-moss-light hover:from-green-700 hover:via-ghibli-moss hover:to-green-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span className="mr-2">🎨</span>
              Transforme já a sua foto!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 