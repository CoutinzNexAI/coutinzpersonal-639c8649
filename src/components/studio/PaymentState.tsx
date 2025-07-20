import React from 'react';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Sparkles, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { Style } from '../StyleSelectorModal';

interface PaymentStateProps {
  selectedStyleName: string;
  selectedStyle?: Style;
  onPaymentClick: () => void;
  isRedirecting: boolean;
  errorMessage: string | null;
  processingState: string;
}

const PaymentState: React.FC<PaymentStateProps> = ({
  selectedStyleName,
  selectedStyle,
  onPaymentClick,
  isRedirecting,
  errorMessage,
  processingState
}) => {
  const getStateMessage = () => {
    switch (processingState) {
      case 'checking_transformations':
        return { icon: Sparkles, text: "A verificar transformações disponíveis...", color: "text-amber-600" };
      case 'uploading_image':
        return { icon: LoaderCircle, text: "A fazer upload da imagem...", color: "text-blue-600" };
      case 'creating_job':
        return { icon: LoaderCircle, text: "A preparar transformação...", color: "text-purple-600" };
      case 'triggering_processing':
        return { icon: LoaderCircle, text: "A iniciar transformação AI...", color: "text-green-600" };
      default:
        return { icon: LoaderCircle, text: "Pronto para transformar", color: "text-gray-600" };
    }
  };

  const { icon: StateIcon, text: stateText, color: stateColor } = getStateMessage();

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
      <div className="mb-6">
        <div className="flex items-center justify-center mb-4">
          <StateIcon className={`h-12 w-12 ${stateColor} ${isRedirecting ? 'animate-spin' : ''}`} />
        </div>
        <h3 className="text-xl font-ghibli text-ghibli-wood mb-2">
          {isRedirecting ? stateText : 'Último Passo!'}
        </h3>
        
        {/* Aviso para estilos de uma pessoa só */}
        {!isRedirecting && selectedStyle?.single_person_only && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <User className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-red-700 text-sm">Estilo para 1 pessoa</span>
            </div>
            <p className="text-red-600 text-xs">
              Para melhores resultados, certifique-se que a sua foto tem apenas uma pessoa claramente visível
            </p>
          </div>
        )}
        
        <p className="text-ghibli-earth text-sm">
          {isRedirecting 
            ? `Estilo "${selectedStyleName}" a ser processado...`
            : `Transforme com o estilo "${selectedStyleName}"`
          }
        </p>
      </div>

        {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errorMessage}</p>
        </div>
      )}

      {!isRedirecting && (
        <div className="space-y-4 w-full max-w-xs">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Transformação Gratuita</span>
            </div>
          </div>
          
        <Button
          onClick={onPaymentClick}
            className="w-full ghibli-button"
          disabled={isRedirecting}
          >
            ✨ Transformar Agora
        </Button>
      </div>
      )}
    </div>
  );
};

export default PaymentState;