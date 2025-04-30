
import React from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Style } from '../StyleSelectorModal';

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
    <div className="relative w-full h-full">
      {transformedImageUrl && (
        <img 
          src={transformedImageUrl}
          alt="Imagem transformada" 
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute top-3 right-3 flex gap-2">
        <Button
          size="sm"
          className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/95"
          onClick={onDownload}
        >
          <Download className="mr-1 h-4 w-4" />
          Baixar
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="flex items-center">
          <div className="mr-3">
            <div className="rounded-full bg-primary p-1">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <p className="text-white font-medium text-sm">
              Transformação concluída! 
            </p>
            <p className="text-white/80 text-xs">
              Estilo: {selectedStyle.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedState;
