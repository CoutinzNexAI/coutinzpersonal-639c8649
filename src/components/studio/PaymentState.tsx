import React from 'react';
import { Button } from '@/components/ui/button';
import { LoaderCircle, CreditCard, Coins } from 'lucide-react';

interface PaymentStateProps {
  selectedStyleName: string; 
  onPaymentClick: () => void;
  isRedirecting: boolean;
  errorMessage?: string | null;
  processingState?: string;
}

const PaymentState: React.FC<PaymentStateProps> = ({
  selectedStyleName,
  onPaymentClick,
  isRedirecting,
  errorMessage,
  processingState
}) => {
  const getStateMessage = () => {
    switch (processingState) {
      case 'checking_balance':
        return { icon: Coins, text: "A verificar saldo de PicCoins...", color: "text-amber-600" };
      case 'spending_coins':
        return { icon: Coins, text: "A gastar PicCoin...", color: "text-green-600" };
      case 'uploading_image':
        return { icon: LoaderCircle, text: "A fazer upload da imagem...", color: "text-blue-600" };
      case 'creating_job':
        return { icon: LoaderCircle, text: "A preparar transformação...", color: "text-purple-600" };
      case 'redirecting_to_payment':
        return { icon: CreditCard, text: "A redirecionar para pagamento...", color: "text-orange-600" };
      default:
        return { icon: CreditCard, text: "Pronto para pagar", color: "text-gray-600" };
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
          <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-800">Custo: 1 PicCoin</span>
            </div>
            <p className="text-xs text-amber-700">
              Se não tiver saldo suficiente, será redirecionado para comprar PicCoins
            </p>
          </div>
          
        <Button
          onClick={onPaymentClick}
            className="w-full ghibli-button"
          disabled={isRedirecting}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Pagar e Transformar
        </Button>
      </div>
      )}
    </div>
  );
};

export default PaymentState;