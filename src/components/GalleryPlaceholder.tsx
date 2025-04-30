
import React from 'react';
import { GalleryHorizontal } from "lucide-react";

const GalleryPlaceholder = () => {
  return (
    <section id="galeria" className="py-16 md:py-24 bg-ghibli-cream/30">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Inspire-se na Magia</h2>
        <p className="section-subtitle text-center text-ghibli-earth">
          Descubra as possibilidades criativas e inspire-se com nossas transformações
        </p>
        
        <div className="ghibli-card p-8 mt-12 flex flex-col items-center justify-center min-h-[300px]">
          <GalleryHorizontal className="h-16 w-16 text-ghibli-moss-light mb-6" />
          <h3 className="text-xl font-ghibli text-ghibli-wood mb-2">Galeria de Exemplos</h3>
          <p className="text-ghibli-earth text-center max-w-lg">
            Aqui você encontrará uma coleção de transformações "Antes e Depois" com diferentes filtros de estilo.
            Explore as possibilidades e descubra qual melhor combina com suas fotos.
          </p>
        </div>
      </div>
    </section>
  );
};

export default GalleryPlaceholder;
