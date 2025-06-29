import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface ProductAddToCartButtonProps {
  // Estados de validação
  canPurchase: boolean;
  isProcessingMockup: boolean;
  loading: boolean;
  
  // Informações do usuário
  userInfo: { id: string } | null;
  selectedImageUrl: string;
  selectedPrintifyVariantId: number | null;
  
  // Callback
  onAddToCart: () => void;
  
  // Customização
  className?: string;
  size?: 'mobile' | 'desktop';
}

export const ProductAddToCartButton: React.FC<ProductAddToCartButtonProps> = ({
  canPurchase,
  isProcessingMockup,
  loading,
  userInfo,
  selectedImageUrl,
  selectedPrintifyVariantId,
  onAddToCart,
  className = '',
  size = 'desktop'
}) => {
  // Se está processando mockup, mostra loading especial
  if (isProcessingMockup) {
    return (
      <div className={`w-full py-${size === 'mobile' ? '4' : '5 sm:py-6'} bg-gradient-to-r from-ghibli-moss/50 to-ghibli-moss-light/50 rounded-xl ${size === 'desktop' ? 'lg:rounded-2xl' : ''} text-center ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <span className={`text-ghibli-moss font-medium ${size === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'}`}>
            Criando o seu produto...
          </span>
        </div>
        {size === 'desktop' && (
          <div className="mt-2 text-xs text-ghibli-earth/70">✨ Aplicando transformação AI</div>
        )}
      </div>
    );
  }

  // Determina o texto do botão baseado no estado
  const getButtonText = () => {
    if (loading) {
      return (
        <>
          <div className={`${size === 'mobile' ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} border-2 border-white border-t-transparent rounded-full animate-spin`} />
          <span>A adicionar...</span>
        </>
      );
    }
    
    if (!userInfo) {
      return <span className="text-center">Faça Login para Continuar</span>;
    }
    
    if (!selectedImageUrl) {
      return <span className="text-center">Escolha uma Arte Primeiro</span>;
    }
    
    if (!selectedPrintifyVariantId) {
      return <span className="text-center">Selecione o Tamanho</span>;
    }
    
    return (
      <>
        <span className={size === 'mobile' ? 'text-lg' : 'text-lg sm:text-xl'}>🛒</span>
        <span className={size === 'mobile' ? '' : 'hidden sm:inline'}>Adicionar ao Carrinho</span>
        {size === 'mobile' && <span className="sm:hidden">Adicionar</span>}
        <div className={`${size === 'mobile' ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6'} rounded-full bg-white/20 flex items-center justify-center`}>
          <ChevronRight className={`${size === 'mobile' ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4'}`} />
        </div>
      </>
    );
  };

  return (
    <Button
      onClick={onAddToCart}
      disabled={!canPurchase || loading}
      className={`group relative w-full py-${size === 'mobile' ? '4' : '5 sm:py-6'} text-${size === 'mobile' ? 'lg' : 'base sm:text-lg'} font-bold rounded-xl ${size === 'desktop' ? 'lg:rounded-2xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl' : 'shadow-xl'} transition-all duration-300 overflow-hidden transform hover:scale-[1.02] border-0 ${
        canPurchase
          ? 'bg-gradient-to-br from-ghibli-moss via-ghibli-moss-light to-ghibli-moss hover:from-ghibli-moss-light hover:via-ghibli-moss hover:to-ghibli-moss-light text-white' 
          : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
      } ${className}`}
    >
      {/* Shimmer effect */}
      {canPurchase && (
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000"></div>
      )}
      
      <span className={`relative z-10 flex items-center justify-center gap-${size === 'mobile' ? '2' : '2 sm:gap-3'}`}>
        {getButtonText()}
      </span>
    </Button>
  );
};

export default ProductAddToCartButton; 