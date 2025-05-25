import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ErrorStateProps {
  uploadedImageUrl: string | null; // Pode ser null se o erro ocorrer antes do upload da imagem
  errorMessage: string | null;    // Nova prop para a mensagem de erro específica
  onReset: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ uploadedImageUrl, errorMessage, onReset }) => {
  const displayErrorMessage = errorMessage || "Não foi possível processar sua imagem. Por favor tente novamente.";

  return (
    <div className="relative w-full h-full">
      {uploadedImageUrl && (
        <div className="absolute inset-0">
          <Image 
            src={uploadedImageUrl}
            alt="Imagem original com erro" 
            fill
            style={{ objectFit: "cover", opacity: 0.3, filter: "blur(4px)" }}
            priority={false} // Pode ser true se for LCP, mas geralmente não para um estado de erro com overlay
          />
        </div>
      )}
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center bg-background/80 backdrop-blur-sm p-6 sm:p-8 rounded-xl w-11/12 sm:w-4/5 max-w-md shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" />
            </div>
          </div>
          
          <p className="font-semibold text-lg sm:text-xl mb-2 text-foreground">
            Ops! Algo correu mal.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 px-2 whitespace-pre-line">
            {displayErrorMessage}
          </p>
          
          <Button 
            onClick={onReset}
            variant="outline"
            className="w-full py-3 text-base"
            aria-label="Tentar Novamente ou Escolher Outra Imagem"
          >
            Tentar Novamente ou Escolher Outra Imagem
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;