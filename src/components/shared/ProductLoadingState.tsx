import React from 'react';

interface ProductLoadingStateProps {
  message?: string;
}

/**
 * Componente genérico para estado de carregamento
 * Usado em todas as páginas de produto quando ainda não carregou
 */
export const ProductLoadingState: React.FC<ProductLoadingStateProps> = ({ 
  message = 'A carregar produto...' 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-ghibli-moss border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-ghibli-earth">{message}</p>
      </div>
    </div>
  );
};

export default ProductLoadingState; 