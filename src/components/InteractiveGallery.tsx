import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GalleryHorizontal } from "lucide-react";
import GalleryCard from './gallery/GalleryCard';
import ImageCompareModal, { GalleryItem } from './gallery/ImageCompareModal';

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: "Simpson Style",
    style: "Wet Bed Gang Transformaram-se em Simpsons",
    before: "/wbgnormal.jpg",
    after: "/wbgsimpson.png"
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
    before: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&q=80",
    after: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80"
  }
];

const InteractiveGallery = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
    setModalOpen(true);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {GALLERY_ITEMS.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <GalleryCard
                  item={item}
                  onClick={() => openModal(index)}
                />
              </motion.div>
            ))}
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