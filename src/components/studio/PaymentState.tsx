import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CreditCard } from 'lucide-react';

interface PaymentStateProps {
  selectedStyleName: string; 
  onPaymentClick: () => void;
  isRedirecting: boolean;
  errorMessage?: string | null;
}

const PaymentState: React.FC<PaymentStateProps> = ({
  selectedStyleName,
  onPaymentClick,
  isRedirecting,
  errorMessage,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">

      <h2 className="text-2xl font-semibold text-ghibli-charcoal mb-4">Passo 3: Pagamento</h2>

      <div className="bg-ghibli-cream p-6 rounded-lg shadow-lg w-full max-w-md mb-8">
        {/* Texto para o estilo selecionado */}
        <p className="text-sm text-ghibli-charcoal mb-1">Estilo Selecionado:</p>
        <h3 className="text-xl font-bold text-ghibli-ocean-deep mb-4">{selectedStyleName}</h3>
        
        {/* Informação do preço */}
        <p className="text-sm text-ghibli-charcoal">
          Confirme o pagamento de <strong>2€</strong> para iniciar a transformação.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
            O resultado estará disponível em breve.
        </p>
      </div>

      {/* Secção do botão de pagamento e mensagem de erro */}
      <div className="w-full max-w-xs">
        {errorMessage && (
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-red-600 bg-red-100 p-3 rounded-md shadow-sm">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="text-center">{errorMessage}</span>
          </div>
        )}
        <Button
          onClick={onPaymentClick}
          disabled={isRedirecting}
          className="w-full ghibli-button" // Certifique-se que 'ghibli-button' está definido no seu CSS/Tailwind
          size="lg" 
        >
          {isRedirecting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
             <CreditCard className="mr-2 h-5 w-5" />
          )}
          {isRedirecting ? 'A Redirecionar...' : 'Pagar e Transformar (2€)'}
        </Button>
      </div>

    </div>
  );
};

export default PaymentState;