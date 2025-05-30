import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Style } from '../StyleSelectorModal';

interface ProcessingStateProps {
  uploadedImageUrl: string;
  selectedStyle: Style;
  progressValue: number;
}

const ProcessingState: React.FC<ProcessingStateProps> = ({
  selectedStyle,
  progressValue,
}) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-ghibli-cream/30 to-ghibli-paper/30">
      <div className="text-center bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-ghibli-stone/20 w-4/5 max-w-sm">
        <div className="flex items-center justify-center mb-4">
          <LoaderCircle className="h-10 w-10 text-ghibli-moss animate-spin" />
        </div>
        <p className="font-medium text-xl mb-2 text-ghibli-wood">Processando...</p>
        <p className="text-sm text-ghibli-earth mb-6">
          Aplicando o estilo "{selectedStyle.name}"
        </p>
        <Progress value={progressValue} className="h-3 mb-3" />
        <p className="text-xs text-ghibli-earth/70">
          {Math.round(progressValue)}% concluído
        </p>
      </div>
    </div>
  );
};

export default ProcessingState;
