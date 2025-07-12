// src/components/InteractiveGallery.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import GalleryCard from './gallery/GalleryCard'; // Presume-se que este componente existe
import ImageCompareModal, { GalleryItem } from './gallery/ImageCompareModal'; // Presume-se que este componente existe
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { useIsMobile } from "@/hooks/use-mobile";

// Dados da Galeria (Adicionado / no início dos paths para indicar que são da pasta public)
const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: "Pixar",
    style: "Estilo Pixar",
    before: "fotousar/raparigasala.png",
    after: "fotousar/raparigasala2.png"
  },
  {
    id: 2,
    title: "Rei de Portugal",
    style: "Estilo para dominar a tuga!",
    before: "fotousar/rapazfaculdade.png",
    after: "fotousar/rapazfaculdaderei.png"
  },
  {
    id: 3,
    title: "Graffiti",
    style: "Estilo Graffiti",
    before: "fotousar/afonso.jpg",
    after: "fotousar/afonsograf.jpg"
  },
  {
    id: 4,
    title: "Ghibli",
    style: "Transformação no estilo popular de Ghibli",
    before: "fotousar/criancacao.webp",
    after: "fotousar/criancacaoghibli.png"
  },
  {
    id: 5,
    title: "Cartoon",
    style: "Estilo inspirado nos cartoons americanos da TV",
    before: "fotousar/homempraia.png",
    after: "fotousar/homempraia6.png"
  },
  {
    id: 6,
    title: "Azulejo Português",
    style: "Estilo inspirado nos portugueses!",
    before: "fotousar/maiamota.jpg",
    after: "fotousar/maiaazulejo.jpg"
  },
  {
    id: 7,
    title: "Simspon",
    style: "Simpson World",
    before: "fotousar/rapazcao.png",
    after: "fotousar/rapazcao4.png"
  },
  {
    id: 8,
    title: "Lego",
    style: "Veja a transformação e o detalhe do lego",
    before: "fotousar/raparigalisboa.png",
    after: "fotousar/raparigalisboa3.png"
  },
  {
    id: 9,
    title: "GTA",
    style: "Transformação no mundo GTA",
    before: "fotousar/raparigaalgarve.png",
    after: "fotousar/raparigaalgarve7.jpg"
  },
];


const itemsPerPage = 3; // Itens por página para desktop
const itemsPerPageMobile = 1; // Itens por página para mobile (para swipe de item a item)

const InteractiveGallery = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(0);
  const isMobile = useIsMobile();

  // Responsividade real
  const currentItemsPerPage = isMobile ? itemsPerPageMobile : itemsPerPage;
  const totalPages = Math.ceil(GALLERY_ITEMS.length / currentItemsPerPage);
  const currentItems = GALLERY_ITEMS.slice(
    pageIndex * currentItemsPerPage, 
    (pageIndex + 1) * currentItemsPerPage
  );

  const openModal = (galleryItemIndex: number) => {
    // O índice recebido é o índice dentro de currentItems
    // Precisamos do índice global para o modal
    const globalIndex = GALLERY_ITEMS.findIndex(item => item.id === currentItems[galleryItemIndex].id);
    setSelectedImageIndex(globalIndex);
    setModalOpen(true);
  };

  const changePage = (direction: number) => {
    setPageIndex((prev) => (prev + direction + totalPages) % totalPages);
  };
  
  const pageVariants = {
    hidden: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 100 : -100, // Desliza da direita ou esquerda
      scale: 0.95,
    }),
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 80, damping: 20, duration: 0.4 }
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction < 0 ? 100 : -100, // Desliza para a direita ou esquerda
      scale: 0.95,
      transition: { duration: 0.3, ease: "easeIn" }
    })
  };

  // GalleryNavButton para evitar repetição
  interface GalleryNavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    direction: 'left' | 'right';
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
  }
  const GalleryNavButton = ({ direction, onClick, className, children, ...props }: GalleryNavButtonProps) => (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "absolute top-1/2 transform -translate-y-1/2 z-20 bg-ghibli-cream/80 backdrop-blur-sm shadow-lg rounded-full hover:bg-ghibli-cream text-ghibli-wood hover:text-ghibli-moss transition-all hover:scale-105",
        direction === "left" ? "left-0 md:left-[-20px]" : "right-0 md:right-[-20px]",
        className
      )}
      onClick={onClick}
      aria-label={direction === "left" ? "Página anterior" : "Próxima página"}
      {...props}
    >
      {children}
    </Button>
  );

  return (
    <section id="galeria" className="py-12 md:py-24 bg-gradient-to-b from-ghibli-cream/40 to-ghibli-paper/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="section-title text-center font-ghibli text-ghibli-wood">Inspire-se na Magia</h2>
          <p className="section-subtitle text-center text-ghibli-earth mb-6">
            Descubra as possibilidades criativas e inspire-se com nossas transformações.
          </p>
          <div className="flex justify-center mb-12">
            <motion.div 
              className="h-1.5 w-24 bg-ghibli-moss/70 rounded-full"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
            />
          </div>
        </motion.div>
        
        {GALLERY_ITEMS.length > 0 ? (
          <div className="relative">
            {totalPages > 1 && !isMobile && (
              <>
                <GalleryNavButton direction="left" onClick={() => {setSwipeDirection(-1); changePage(-1);}}>
                  <ChevronLeft className="h-6 w-6" />
                </GalleryNavButton>
                <GalleryNavButton direction="right" onClick={() => {setSwipeDirection(1); changePage(1);}}>
                  <ChevronRight className="h-6 w-6" />
                </GalleryNavButton>
              </>
            )}
            <AnimatePresence initial={false} custom={swipeDirection} mode="popLayout">
              <motion.div
                key={pageIndex}
                custom={swipeDirection}
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  "grid gap-6 md:gap-8",
                  currentItemsPerPage === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                )}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e,i) => {
                  const offset = i.offset.x;
                  const velocity = i.velocity.x;
                  if (offset < -50 || velocity < -300) { setSwipeDirection(1); changePage(1); } 
                  else if (offset > 50 || velocity > 300) { setSwipeDirection(-1); changePage(-1); }
                }}
              >
                {currentItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 + 0.1, ease: "easeOut" }}
                    className="rounded-xl overflow-hidden shadow-lg bg-white/50 backdrop-blur-sm border border-ghibli-sand/20 
                               hover:shadow-2xl hover:border-ghibli-moss/40 transition-all duration-300 ease-in-out 
                               transform hover:-translate-y-1 hover:scale-[1.015]"
                  >
                    <GalleryCard
                      item={item}
                      onClick={() => openModal(index)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
            {totalPages > 1 && (
              <div className="mt-8 text-center">
                <div className="flex justify-center gap-2 mb-6" aria-live="polite">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPageIndex(idx)}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all duration-300 ease-in-out",
                        pageIndex === idx 
                          ? "bg-ghibli-moss scale-125 shadow-md" 
                          : "bg-ghibli-stone/30 hover:bg-ghibli-stone/50"
                      )}
                      aria-label={`Ir para página ${idx + 1}`}
                    />
                  ))}
                </div>
                {/* Controles para dispositivos móveis */}
                {isMobile && (
                  <div className="flex justify-center gap-4 md:hidden">
                    <Button variant="outline" size="sm" onClick={() => {setSwipeDirection(-1); changePage(-1);}} className="bg-ghibli-cream/70 border-ghibli-moss/50 text-ghibli-wood hover:bg-ghibli-cream hover:border-ghibli-moss flex items-center gap-1.5 rounded-lg shadow-sm">
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {setSwipeDirection(1); changePage(1);}} className="bg-ghibli-cream/70 border-ghibli-moss/50 text-ghibli-wood hover:bg-ghibli-cream hover:border-ghibli-moss flex items-center gap-1.5 rounded-lg shadow-sm">
                      Próximo <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-ghibli-cream/50 p-8 mt-8 flex flex-col items-center justify-center min-h-[300px] rounded-xl border border-ghibli-sand/30 shadow-lg text-center">
            <GalleryHorizontal className="h-16 w-16 text-ghibli-moss/70 mb-6" />
            <h3 className="text-xl font-ghibli text-ghibli-wood mb-2">Galeria em Construção Mágica</h3>
            <p className="text-ghibli-earth max-w-md">
              Os nossos artistas estão a conjurar novos exemplos! Volte em breve para se maravilhar.
            </p>
          </div>
        )}
      </div>

      <ImageCompareModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        items={GALLERY_ITEMS} // Passa todos os itens para o modal poder navegar
        initialIndex={selectedImageIndex}
      />
    </section>
  );
};

export default InteractiveGallery;