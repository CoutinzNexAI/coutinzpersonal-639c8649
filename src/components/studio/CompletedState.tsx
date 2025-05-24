import React from 'react';
import { Button } from '@/components/ui/button';
import { Style } from '../StyleSelectorModal';
import Image from 'next/image';

interface CompletedStateProps {
  transformedImageUrl: string;
  selectedStyle: Style;
  onDownload: () => void;
}

const CompletedState: React.FC<CompletedStateProps> = ({
  transformedImageUrl,
  selectedStyle,
  onDownload,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Transformed image result */}
      <div className="flex-1 overflow-hidden relative">
        <Image 
          src={transformedImageUrl} 
          alt="Imagem transformada" 
          key={transformedImageUrl}
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>
      
      {/* Result info */}
      <div className="p-4 bg-white/90 backdrop-blur-sm">
        <div className="mb-2">
          <p className="text-sm font-medium text-ghibli-wood">
            Transformação concluída!
          </p>
          <p className="text-xs text-muted-foreground">
            Estilo: {selectedStyle.name}
          </p>
        </div>
        
        <Button 
          onClick={onDownload}
          size="sm" 
          className="ghibli-button w-full"
        >
          Baixar Imagem
        </Button>
      </div>
    </div>
  );
};

export default CompletedState;
