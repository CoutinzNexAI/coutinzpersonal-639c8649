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
  
  // Callbacks
  onAddToCart: () => void;
  onOpenGallery?: () => void; // ✅ NOVA PROP
  
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
  onOpenGallery,
  className = '',
  size = 'desktop'
}) => {
  // Se está processando mockup, mostra loading especial
  if (isProcessingMockup) {
    const processingClasses = size === 'mobile' 
      ? 'w-full py-4 bg-gradient-to-r from-ghibli-moss/50 to-ghibli-moss-light/50 rounded-xl text-center'
      : 'w-full py-5 sm:py-6 bg-gradient-to-r from-ghibli-moss/50 to-ghibli-moss-light/50 rounded-xl lg:rounded-2xl text-center';

    return (
      <div className={`${processingClasses} ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <span className={size === 'mobile' ? 'text-sm text-ghibli-moss font-medium' : 'text-sm sm:text-base text-ghibli-moss font-medium'}>
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
      const spinnerSize = size === 'mobile' ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5';
      return (
        <>
          <div className={`${spinnerSize} border-2 border-white border-t-transparent rounded-full animate-spin`} />
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
    
    const iconSize = size === 'mobile' ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6';
    const chevronSize = size === 'mobile' ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4';
    const textSize = size === 'mobile' ? 'text-lg' : 'text-lg sm:text-xl';
    
    return (
      <>
        <span className={textSize}>🛒</span>
        <span>Adicionar ao Carrinho</span>
        <div className={`${iconSize} rounded-full bg-white/20 flex items-center justify-center`}>
          <ChevronRight className={chevronSize} />
        </div>
      </>
    );
  };

  // Determina a ação do botão e se está habilitado
  const getButtonAction = () => {
    if (!userInfo || loading) return { onClick: () => {}, disabled: true };
    
    // ✅ NOVA LÓGICA: Se não há arte, abrir galeria (se onOpenGallery disponível)
    if (!selectedImageUrl && onOpenGallery) {
      return { onClick: onOpenGallery, disabled: false };
    }
    
    // Caso contrário, usar lógica normal
    return { onClick: onAddToCart, disabled: !canPurchase };
  };

  // Simplified button styles
  const getButtonStyles = () => {
    const baseStyles = 'group relative w-full font-bold rounded-xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02] border-0';
    
    const sizeStyles = size === 'mobile' 
      ? 'py-4 text-lg shadow-xl'
      : 'py-5 sm:py-6 text-base sm:text-lg lg:rounded-2xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl';
    
    // ✅ NOVA LÓGICA: Se não há arte mas há onOpenGallery, usar cor "escolher arte"
    const shouldShowArtSelection = !selectedImageUrl && onOpenGallery && userInfo;
    
    const stateStyles = shouldShowArtSelection
      ? 'bg-gradient-to-br from-ghibli-wood via-ghibli-earth to-ghibli-wood hover:from-ghibli-earth hover:via-ghibli-earth hover:to-ghibli-earth text-white'
      : canPurchase
      ? 'bg-gradient-to-br from-ghibli-moss via-ghibli-moss-light to-ghibli-moss hover:from-ghibli-moss-light hover:via-ghibli-moss hover:to-ghibli-moss-light text-white'
      : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60';
    
    return `${baseStyles} ${sizeStyles} ${stateStyles} ${className}`;
  };

  const gapSize = size === 'mobile' ? 'gap-2' : 'gap-2 sm:gap-3';
  const { onClick, disabled } = getButtonAction();

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={getButtonStyles()}
    >
      {/* Shimmer effect */}
      {(canPurchase || (!selectedImageUrl && onOpenGallery && userInfo)) && (
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000"></div>
      )}
      
      <span className={`relative z-10 flex items-center justify-center ${gapSize}`}>
        {getButtonText()}
      </span>
    </Button>
  );
};

export default ProductAddToCartButton; 