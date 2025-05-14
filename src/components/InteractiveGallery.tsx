import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GalleryHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import GalleryCard from './gallery/GalleryCard';
import ImageCompareModal, { GalleryItem } from './gallery/ImageCompareModal';
import { Button } from "@/components/ui/button";

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: "Camo",
    style: "Camo",
    before: "barbarabandeiranormal.webp",
    after: "barbarabandeiralego.png"
  },
  {
    id: 2,
    title: "Azulejo Português",
    style: "Aquarela",
    before: "pastoralentejonormal.png",
    after: "pastoralentejoazulejo.png"
  },
  {
    id: 3,
    title: "Ghibli Style",
    style: "David e Mickael carreira",
    before: "tonymickaelcarreiranormal.jpg",
    after: "tonymickaelghibli.png"
  },
  {
    id: 4,
    title: "Arquitetura moderna",
    style: "Neo-Futurista",
    before: "gyokerespotenormal.jpeg",
    after: "gyopoteghibli.png"
  }
];

const InteractiveGallery = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  
  // Calcular o número total de páginas
  const itemsPerPage = 3;
  const totalPages = Math.ceil(GALLERY_ITEMS.length / itemsPerPage);
  
  // Obter os itens atuais com base na página
  const currentItems = GALLERY_ITEMS.slice(
    pageIndex * itemsPerPage, 
    (pageIndex + 1) * itemsPerPage
  );

  const openModal = (index: number) => {
    // Converter o índice local para o índice global na lista completa
    const globalIndex = pageIndex * itemsPerPage + index;
    setSelectedImageIndex(globalIndex);
    setModalOpen(true);
  };

  const goToNextPage = () => {
    setPageIndex((prev) => (prev + 1) % totalPages);
  };

  const goToPrevPage = () => {
    setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  // Indicadores de página
  const renderPageIndicators = () => {
    return (
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setPageIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              pageIndex === idx 
                ? "bg-ghibli-moss scale-110" 
                : "bg-ghibli-stone/40 hover:bg-ghibli-stone/60"
            }`}
            aria-label={`Página ${idx + 1}`}
          />
        ))}
      </div>
    );
  };

  return (
    <section id="galeria" className="py-16 md:py-24 bg-gradient-to-b from-ghibli-cream/30 to-transparent">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title text-center">Inspire-se na Magia</h2>
          <p className="section-subtitle text-center text-ghibli-earth mb-4">
            Descubra as possibilidades criativas e inspire-se com nossas transformações
          </p>
          
          <div className="flex justify-center mb-12">
            <motion.div 
              className="h-1 w-24 bg-ghibli-moss/70 rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>
        </motion.div>
        
        {GALLERY_ITEMS.length > 0 ? (
          <div className="relative">
            {/* Botão de navegação à esquerda */}
            {totalPages > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full hover:bg-white hidden md:flex"
                onClick={goToPrevPage}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-5 w-5 text-ghibli-wood" />
              </Button>
            )}
            
            {/* Animação de transição entre páginas */}
            <AnimatePresence mode="wait">
              <motion.div
                key={pageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {currentItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="aspect-[3/4]" // Proporção mais alta que larga
                  >
                    <GalleryCard
                      item={item}
                      onClick={() => openModal(index)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
            
            {/* Botão de navegação à direita */}
            {totalPages > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm shadow-md rounded-full hover:bg-white hidden md:flex"
                onClick={goToNextPage}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-5 w-5 text-ghibli-wood" />
              </Button>
            )}
          </div>
        ) : (
          <div className="ghibli-card p-8 mt-8 flex flex-col items-center justify-center min-h-[300px]">
            <GalleryHorizontal className="h-16 w-16 text-ghibli-moss-light mb-6" />
            <h3 className="text-xl font-ghibli text-ghibli-wood mb-2">Galeria em Construção</h3>
            <p className="text-ghibli-earth text-center max-w-lg">
              Em breve teremos uma coleção de exemplos incríveis para você se inspirar.
            </p>
          </div>
        )}
        
        {/* Indicadores de página e controles móveis */}
        {totalPages > 1 && (
          <div className="mt-8">
            {renderPageIndicators()}
            
            {/* Controles para dispositivos móveis */}
            <div className="flex justify-center gap-4 mt-6 md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                className="flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                className="flex items-center"
              >
                Próximo <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de comparação de imagens */}
      <ImageCompareModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        items={GALLERY_ITEMS}
        initialIndex={selectedImageIndex}
      />
    </section>
  );
};

export default InteractiveGallery; 