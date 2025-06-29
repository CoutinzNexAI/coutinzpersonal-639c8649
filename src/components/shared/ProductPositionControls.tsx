import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface ProductPositionControlsProps {
  // Dados necessários
  selectedImageUrl: string;
  userImageDimensions: { width: number; height: number } | null;
  product: PrintifyProductMapping;
  
  // Estados
  imagePosition: 'top' | 'center' | 'bottom' | 'left' | 'right'; // Suporte para múltiplas posições
  isGeneratingMockup: boolean;
  
  // Callbacks
  onOpenGallery: () => void;
  onAdjustPosition: (position: 'top' | 'center' | 'bottom' | 'left' | 'right') => void;
  
  // Configurações
  positionType?: 'vertical' | 'horizontal'; // Para canecas (vertical) vs capas (horizontal)
  className?: string;
}

export const ProductPositionControls: React.FC<ProductPositionControlsProps> = ({
  selectedImageUrl,
  userImageDimensions,
  product,
  imagePosition,
  isGeneratingMockup,
  onOpenGallery,
  onAdjustPosition,
  positionType = 'vertical',
  className = ''
}) => {
  // Se não há imagem ou dimensões, mostra apenas botão de escolher arte
  if (!selectedImageUrl || !userImageDimensions || !product) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className={`flex justify-center ${className}`}
      >
        <Button
          onClick={onOpenGallery}
          className="px-8 py-4 text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white"
        >
          <Sparkles className="w-5 h-5 mr-2 lg:mr-3" />
          Escolher Arte
        </Button>
      </motion.div>
    );
  }

  // Controla se renderiza verticalmente (canecas) ou horizontalmente (capas)
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className={className}
    >
      <div className="flex gap-8 items-center justify-center">
        {/* Botão Trocar Arte */}
        <Button
          onClick={onOpenGallery}
          className="px-8 py-4 text-base font-semibold bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Trocar Arte
        </Button>

        {/* Controlos de Posição */}
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-ghibli-sand/30">
          {positions.map(({ key, title, icon }) => (
            <Button 
              key={key}
              onClick={() => onAdjustPosition(key)} 
              variant="ghost"
              size="sm"
              className={`h-12 w-12 rounded-full transition-all duration-200 ${imagePosition === key 
                ? 'bg-ghibli-moss text-white shadow-md scale-110' 
                : 'text-ghibli-earth hover:bg-ghibli-moss/10 hover:scale-105'
              }`}
              disabled={isGeneratingMockup}
              title={title}
            >
              {icon === 'circle' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d={icon}/>
                </svg>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Indicador de Status */}
      <div className="mt-3 text-center">
        <span className="inline-flex items-center gap-2 text-xs text-ghibli-moss bg-ghibli-moss/5 px-3 py-1 rounded-full font-medium border border-ghibli-moss/20">
          <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full animate-pulse"></div>
          Posição: {positions.find(p => p.key === imagePosition)?.title}
        </span>
        
        {/* Loading indicator quando a gerar */}
        {isGeneratingMockup && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-ghibli-earth/70">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span>Reposicionando arte...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductPositionControls; 