import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface ProductMobileControlsProps {
  // Estados
  selectedImageUrl: string;
  userImageDimensions: { width: number; height: number } | null;
  product: PrintifyProductMapping;
  imagePosition: 'top' | 'center' | 'bottom' | 'left' | 'right';
  isGeneratingMockup: boolean;
  userInfo: { id: string } | null;
  
  // Callbacks
  onOpenGallery: () => void;
  onAdjustPosition: (position: 'top' | 'center' | 'bottom' | 'left' | 'right') => void;
  
  // Configurações
  positionType?: 'vertical' | 'horizontal';
  className?: string;
}

export const ProductMobileControls: React.FC<ProductMobileControlsProps> = ({
  selectedImageUrl,
  userImageDimensions,
  product,
  imagePosition,
  isGeneratingMockup,
  userInfo,
  onOpenGallery,
  onAdjustPosition,
  positionType = 'vertical',
  className = ''
}) => {
  if (!userInfo) {
    return null;
  }

  // Se não há imagem selecionada, não mostra nada (botão está no topo)
  if (!selectedImageUrl || !userImageDimensions || !product) {
    return null;
  }

  // Configura posições baseado no tipo
  const positions = positionType === 'vertical' 
    ? [
        { key: 'top' as const, title: 'Cima', icon: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z' },
        { key: 'center' as const, title: 'Centro', icon: 'circle' },
        { key: 'bottom' as const, title: 'Baixo', icon: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z' }
      ]
    : [
        { key: 'left' as const, title: 'Esquerda', icon: 'M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z' },
        { key: 'center' as const, title: 'Centro', icon: 'circle' },
        { key: 'right' as const, title: 'Direita', icon: 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z' }
      ];

  return (
    <div className={`px-4 ${className}`}>
      <div className="flex gap-4 items-center justify-center">
        {/* Botão Trocar Arte - Mobile */}
        <Button
          onClick={onOpenGallery}
          className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white rounded-lg shadow-lg transition-all duration-300"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Trocar
        </Button>

        {/* Controlos de Posição - Mobile Pequenos */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-ghibli-sand/30">
          {positions.map(({ key, title, icon }) => (
            <Button 
              key={key}
              onClick={() => onAdjustPosition(key)} 
              variant="ghost"
              size="sm"
              className={`h-8 w-8 rounded-full transition-all duration-200 ${imagePosition === key 
                ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                : 'text-ghibli-earth hover:bg-ghibli-moss/10'
              }`}
              disabled={isGeneratingMockup}
              title={title}
            >
              {icon === 'circle' ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d={icon}/>
                </svg>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Status Compacto Mobile */}
      <div className="mt-2 text-center">
        <span className="inline-flex items-center gap-1 text-xs text-ghibli-moss bg-ghibli-moss/5 px-2 py-1 rounded-full font-medium border border-ghibli-moss/20">
          <div className="w-1 h-1 bg-ghibli-moss rounded-full animate-pulse"></div>
          {positions.find(p => p.key === imagePosition)?.title}
        </span>
      </div>
    </div>
  );
};

export default ProductMobileControls; 