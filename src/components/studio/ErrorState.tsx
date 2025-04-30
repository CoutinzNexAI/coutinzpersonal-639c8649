
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  uploadedImageUrl: string;
  onReset: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ uploadedImageUrl, onReset }) => {
  return (
    <div className="relative w-full h-full">
      {uploadedImageUrl && (
        <img 
          src={uploadedImageUrl}
          alt="Imagem original" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
        />
      )}
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center bg-background/80 backdrop-blur-sm p-6 rounded-xl w-4/5 max-w-xs">
          <div className="flex items-center justify-center mb-3">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          
          <p className="font-medium text-lg mb-2">Ocorreu um erro</p>
          <p className="text-sm text-muted-foreground mb-4">
            Não foi possível processar sua imagem. Por favor tente novamente.
          </p>
          
          <Button 
            onClick={onReset}
            variant="outline"
            className="w-full"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
