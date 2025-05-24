import React from 'react';
import { Button } from '@/components/ui/button';
import { Style } from '../StyleSelectorModal';
import Image from 'next/image';
import { Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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
  const [imageError, setImageError] = React.useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('[CompletedState Image] Erro ao carregar a imagem:', e.currentTarget.src);
    console.error('[CompletedState Image] URL que falhou:', transformedImageUrl);
    setImageError(true);
    toast.error("Erro ao carregar a imagem final.");
  };

  return (
    <div className="relative w-full h-full flex flex-col min-h-0"> {/* Adicionado min-h-0 para melhor flex behavior */}
      
      {/* Área da Imagem - Layout Melhorado */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6 min-h-0"> {/* min-h-0 importante para flex-1 */}
        <div className="w-full max-w-md min-h-[250px] max-h-[400px] aspect-square relative rounded-xl shadow-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
          {imageError ? (
            // Placeholder para erro de imagem
            <div className="absolute inset-0 w-full h-full bg-gray-200 flex flex-col items-center justify-center text-center text-sm text-gray-600 p-4">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <p className="font-medium mb-1">Erro ao carregar imagem</p>
              <p className="text-xs text-gray-500 break-all">{transformedImageUrl}</p>
            </div>
          ) : (
            <Image 
              key={transformedImageUrl} // Force re-render se URL mudar
              src={transformedImageUrl} 
              alt={`Imagem transformada no estilo ${selectedStyle.name}`} 
              fill
              sizes="(max-width: 768px) 70vw, (max-width: 1200px) 40vw, 25vw"
              style={{ 
                objectFit: "contain",
                width: "100%",
                height: "100%" 
              }}
              className="bg-gray-100"
              priority
              unoptimized={true} // Importante para URLs do Supabase
              onError={handleImageError}
              onLoad={() => {
                console.log('[CompletedState Image] Imagem carregada com sucesso:', transformedImageUrl);
                setImageError(false);
              }}
            />
          )}
        </div>
      </div>
      
      {/* Informações do Resultado e Botão de Download */}
      <div className="p-4 pt-2 flex-shrink-0 border-t border-gray-200">
        <div className="mb-3 text-center">
          <p className="text-lg font-medium text-ghibli-wood">
            Transformação concluída!
          </p>
          <p className="text-sm text-muted-foreground">
            Estilo: {selectedStyle.name}
          </p>
        </div>
        
        <Button 
          onClick={onDownload}
          size="lg"
          className="ghibli-button w-full flex items-center justify-center"
          disabled={imageError}
        >
          <Download className="mr-2 h-5 w-5" /> 
          {imageError ? 'Imagem Indisponível' : 'Baixar Imagem'}
        </Button>
      </div>
    </div>
  );
};

export default CompletedState;