import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize, Minimize, AlertTriangle } from 'lucide-react';
import { ReactCompareSlider, ReactCompareSliderImage, ReactCompareSliderHandle } from 'react-compare-slider';
import { Button } from '@/components/ui/button'; // Certifique-se que este caminho está correto
import { cn } from '@/lib/utils'; // Assumindo que tem a função cn para classnames

// Definindo e exportando a interface GalleryItem aqui
export interface GalleryItem {
  id: number | string; // ID pode ser número ou string
  title: string;
  style: string;
  before: string;
  after: string;
}

// Reutilizando a função getImageSrc do GalleryCard.tsx ou definindo uma similar
const getImageSrcModal = (path: string | undefined | null): string => {
  if (!path) return 'https://placehold.co/800x800/333/555?text=Imagem+Indisponível'; // Placeholder mais genérico para modal
  return path.startsWith('http') || path.startsWith('/') ? path : `/${path}`;
};

interface ImageCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItem[];
  initialIndex?: number; // Tornar opcional com um fallback
}

const ImageCompareModal: React.FC<ImageCompareModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Garantir que o currentIndex é válido
  useEffect(() => {
    if (items && items.length > 0) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, items.length - 1)));
    }
  }, [initialIndex, items]);

  const currentItem = items && items.length > 0 ? items[currentIndex] : null;

  const goToNext = useCallback(() => {
    if (!items || items.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  }, [items]);

  const goToPrevious = useCallback(() => {
    if (!items || items.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  }, [items]);

  const toggleFullscreen = useCallback(() => {
    const element = modalContentRef.current?.querySelector('.fullscreen-target') || document.documentElement;
    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Erro ao tentar ativar ecrã completo: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToNext, goToPrevious, toggleFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Focar o botão de fechar quando o modal abre
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => closeButtonRef.current?.focus(), 100); // Pequeno delay para garantir que está renderizado
    }
  }, [isOpen]);


  if (!isOpen) return null;

  const beforeImgSrc = currentItem ? getImageSrcModal(currentItem.before) : getImageSrcModal(null);
  const afterImgSrc = currentItem ? getImageSrcModal(currentItem.after) : getImageSrcModal(null);
  const modalTitleId = "image-compare-modal-title";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 md:p-8" // Padding responsivo
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        role="dialog" // Melhoria de Acessibilidade
        aria-modal="true" // Melhoria de Acessibilidade
        aria-labelledby={modalTitleId} // Melhoria de Acessibilidade
        onClick={(e) => { // Fechar ao clicar no overlay
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Botão de Fechar */}
        <Button
          ref={closeButtonRef}
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white hover:bg-white/20 z-[52] rounded-full"
          onClick={onClose}
          aria-label="Fechar modal de comparação" // Melhoria de Acessibilidade
        >
          <X className="h-6 w-6 sm:h-7 sm:w-7" />
        </Button>

        {/* Botão de Ecrã Completo */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-14 sm:top-4 sm:right-16 text-white hover:bg-white/20 z-[52] rounded-full"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Sair do ecrã completo" : "Entrar em ecrã completo"} // Melhoria de Acessibilidade
        >
          {isFullscreen ? (
            <Minimize className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Maximize className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </Button>

        {/* Botão Anterior (apenas se houver mais de 1 item) */}
        {items && items.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-1 sm:left-2 md:left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-[52] rounded-full p-2"
            onClick={goToPrevious}
            aria-label="Imagem anterior" // Melhoria de Acessibilidade
          >
            <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" />
          </Button>
        )}

        {/* Botão Próximo (apenas se houver mais de 1 item) */}
        {items && items.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 sm:right-2 md:right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-[52] rounded-full p-2"
            onClick={goToNext}
            aria-label="Próxima imagem" // Melhoria de Acessibilidade
          >
            <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" />
          </Button>
        )}

        {/* Conteúdo Principal do Modal */}
        <motion.div
          ref={modalContentRef}
          className={cn(
            "bg-ghibli-wood/10 p-3 sm:p-4 rounded-xl shadow-2xl w-full flex flex-col items-center relative", // Ajustes no padding e bg
            isFullscreen ? "h-full max-h-full max-w-full" : "max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh]" // Tamanho dinâmico
          )}
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()} // Previne fechar o modal ao clicar no conteúdo
        >
          {!currentItem ? (
            <div className="flex flex-col items-center justify-center text-white h-64">
              <AlertTriangle className="h-12 w-12 text-ghibli-poppy mb-4" />
              <p className="text-lg">Nenhuma imagem para exibir.</p>
              <p className="text-sm text-white/70">Por favor, tente novamente mais tarde.</p>
            </div>
          ) : (
            <>
              {/* Informação da Imagem */}
              <div className="mb-3 sm:mb-4 text-center text-white w-full px-4">
                <h2 id={modalTitleId} className="text-xl sm:text-2xl font-ghibli text-ghibli-cream">
                  {currentItem.title || "Comparação de Imagem"}
                </h2>
                <p className="text-sm sm:text-base text-ghibli-sky/80">
                  Estilo: {currentItem.style || "Não especificado"}
                </p>
              </div>

              {/* Slider de Comparação de Imagens */}
              <div className={cn(
                "relative rounded-lg overflow-hidden shadow-lg w-full fullscreen-target",
                isFullscreen ? "aspect-video max-h-[calc(100vh-120px)]" : "aspect-square max-h-[calc(90vh-180px)]" // Ajuste para aspect ratio
              )}
                style={{
                  // Para o modo não fullscreen, tenta manter quadrado mas limitado pela altura da viewport
                  // Para fullscreen, tenta aspect-video, mas limitado pela altura.
                  maxWidth: isFullscreen ? '100%' : 'min(75vh, 75vw)', // Limita o tamanho máximo em não-fullscreen
                }}
              >
                <ReactCompareSlider
                  itemOne={
                    <ReactCompareSliderImage
                      src={beforeImgSrc}
                      alt={`Imagem original de ${currentItem.title || 'exemplo'}`}
                      className="object-contain" // Alterado para object-contain para ver a imagem toda
                      style={{ backgroundColor: 'rgba(0,0,0,0.1)'}} // Fundo para letterboxing
                    />
                  }
                  itemTwo={
                    <ReactCompareSliderImage
                      src={afterImgSrc}
                      alt={`Imagem de ${currentItem.title || 'exemplo'} transformada no estilo ${currentItem.style || 'artístico'}`}
                      className="object-contain" // Alterado para object-contain
                      style={{ backgroundColor: 'rgba(0,0,0,0.1)'}}
                    />
                  }
                  handle={
                    <ReactCompareSliderHandle
                      buttonStyle={{
                        backdropFilter: 'blur(3px)',
                        WebkitBackdropFilter: 'blur(3px)', // Para Safari
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        color: '#fff',
                        width: '40px',
                        height: '40px',
                      }}
                      linesStyle={{ opacity: 0.5, width: 2 }}
                    />
                  }
                  // O style aqui é aplicado ao container do slider
                  // A proporção é agora controlada pelo div pai
                  style={{ width: '100%', height: '100%'}}
                />
                
                {/* Legendas Original/Transformada e Instrução */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-2 sm:p-3 pointer-events-none">
                  <div className="flex justify-between text-xs sm:text-sm text-white font-medium">
                    <span>Original</span>
                    <span>Transformada</span>
                  </div>
                  <p className="text-white/80 text-xs sm:text-sm mt-1 text-center">
                    Arraste o controlo para comparar
                  </p>
                </div>
              </div>

              {/* Indicador de Navegação (apenas se houver mais de 1 item) */}
              {items && items.length > 1 && (
                <div className="mt-3 sm:mt-4 flex justify-center space-x-1.5 sm:space-x-2">
                  {items.map((_, index) => (
                    <button
                      key={`dot-${index}`}
                      className={cn(
                        "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ease-in-out",
                        index === currentIndex ? 'bg-ghibli-sky scale-125' : 'bg-white/40 hover:bg-white/70'
                      )}
                      onClick={() => setCurrentIndex(index)}
                      aria-label={`Ir para imagem ${index + 1} de ${items.length}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageCompareModal;