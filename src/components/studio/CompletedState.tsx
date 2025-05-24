import React from 'react';
import { Button } from '@/components/ui/button';
import { Style } from '../StyleSelectorModal'; // Confirma se este é o caminho correto para Style
import Image from 'next/image';
import { Download } from 'lucide-react'; // Assuming you might want this for the button
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
  return (
    <div className="relative w-full h-full flex flex-col"> {/* Container principal do CompletedState */}
      
      {/* Área da Imagem (Modificada) */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 md:p-6"> {/* Contentor para centrar a caixa da imagem */}
        <div className="w-full max-w-lg aspect-square relative rounded-xl shadow-xl overflow-hidden border-2 border-gray-200"> {/* Caixa da imagem com aspect-ratio e max-width */}
          <Image 
            key={transformedImageUrl} // Importante para forçar re-renderização se a URL mudar
            src={transformedImageUrl} 
            alt={`Imagem transformada no estilo ${selectedStyle.name}`} 
            fill
            style={{ objectFit: "contain" }} // 'contain' para ver a imagem toda, ou 'cover' para preencher e cortar
            className="bg-gray-100" // Fundo enquanto a imagem carrega ou se houver transparência
            priority // Se esta é a imagem principal a ser vista
            // unoptimized={true} // Descomenta se estiveres a ter problemas com a otimização do Next/Image ou URLs externas
            onError={(e) => {
              console.error('[CompletedState Image] Erro ao carregar a imagem:', e.currentTarget.src);
              // Poderias mostrar uma mensagem de erro ou placeholder aqui
              toast.error("Erro ao carregar a imagem final.");
            }}
          />
        </div>
      </div>
      
      {/* Informações do Resultado e Botão de Download */}
      <div className="p-4 pt-2 bg-white/90 backdrop-blur-sm flex-shrink-0 border-t border-gray-200">
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
          size="lg" // Botão um pouco maior para destaque
          className="ghibli-button w-full flex items-center justify-center" // Garante que o ícone e texto estão centrados
        >
          <Download className="mr-2 h-5 w-5" /> 
          Baixar Imagem
        </Button>
      </div>
    </div>
  );
};

export default CompletedState;