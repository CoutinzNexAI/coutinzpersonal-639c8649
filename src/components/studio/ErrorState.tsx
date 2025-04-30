
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  uploadedImageUrl: string;
  onReset: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  uploadedImageUrl,
  onReset,
}) => {
  return (
    <div className="relative w-full h-full">
      {uploadedImageUrl && (
        <img 
          src={uploadedImageUrl}
          alt="Imagem original" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm grayscale"
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center bg-background/80 backdrop-blur-sm p-6 rounded-xl">
          <div className="flex items-center justify-center mb-3">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <p className="font-medium text-lg mb-2 text-destructive">Erro no processamento</p>
          <p className="text-sm text-muted-foreground mb-4">
            Não foi possível aplicar o estilo. Por favor, tente novamente.
          </p>
          <Button 
            onClick={onReset}
            variant="outline"
            size="sm"
            className="mr-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> 
            Tentar Novamente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
