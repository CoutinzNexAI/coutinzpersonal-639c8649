import React from 'react';

export const ProductCardDecorations: React.FC = () => (
  <>
    {/* Elementos decorativos padronizados */}
    <div className="absolute inset-0 bg-paper-texture opacity-30"></div>
    <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-ghibli-moss/10 to-ghibli-moss-light/10 rounded-full blur-xl"></div>
    <div className="absolute bottom-6 left-6 w-16 h-16 bg-gradient-to-br from-ghibli-sunflower/10 to-ghibli-poppy/10 rounded-full blur-xl"></div>
  </>
);

export default ProductCardDecorations; 