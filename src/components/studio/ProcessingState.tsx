import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Style } from '../StyleSelectorModal';
import Image from 'next/image';

interface ProcessingStateProps {
  uploadedImageUrl: string;
  selectedStyle: Style;
  progressValue: number;
}

const ProcessingState: React.FC<ProcessingStateProps> = ({
  uploadedImageUrl,
  selectedStyle,
  progressValue,
}) => {
  return (
    <div className="relative w-full h-full">
      {uploadedImageUrl && (
        <div className="absolute inset-0">
          <Image 
            src={uploadedImageUrl}
            alt="Imagem original" 
            fill
            style={{ objectFit: "cover", opacity: 0.5, filter: "blur(4px)" }}
            priority={false}
          />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center bg-background/80 backdrop-blur-sm p-6 rounded-xl w-4/5 max-w-xs">
          <div className="flex items-center justify-center mb-3">
            <LoaderCircle className="h-8 w-8 text-primary animate-spin" />
          </div>
          <p className="font-medium text-lg mb-2">Processando...</p>
          <p className="text-sm text-muted-foreground mb-4">
            Aplicando o estilo "{selectedStyle.name}"
          </p>
          <Progress value={progressValue} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {progressValue}% concluído
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingState;
