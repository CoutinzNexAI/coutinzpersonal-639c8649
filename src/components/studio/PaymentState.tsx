import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CreditCard } from 'lucide-react';
// import { Style } from '../StyleSelectorModal'; // No longer needed here
// import { supabase } from '@/lib/supabase/client'; // No longer needed here

interface PaymentStateProps {
  // uploadedImageUrl: string; // Removed
  // selectedStyle: Style | null; // Removed
  // jobId: string | null; // Removed
  onPaymentClick: () => void;
  isRedirecting: boolean;
  errorMessage?: string | null;
}

const PaymentState: React.FC<PaymentStateProps> = ({
  // uploadedImageUrl, // Removed
  // selectedStyle, // Removed
  // jobId, // Removed
  onPaymentClick,
  isRedirecting,
  errorMessage,
}) => {
  // Removed state and useEffect for fetching image

  return (
    // Centered content vertically and horizontally
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">

      {/* Title and Info Text */}
      <div className="mb-8">
         <h4 className="text-xl font-semibold text-ghibli-wood mb-3">Passo 3: Pagamento</h4>
         <p className="text-md text-muted-foreground mb-2">
             Sua imagem está quase pronta!
         </p>
         <p className="text-sm text-muted-foreground">
             Após a confirmação do pagamento (1€), a transformação começará e o resultado estará disponível em breve.
         </p>
      </div>


      {/* Payment Button and Error Message */}
      <div className="w-full max-w-xs">
        {errorMessage && (
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-red-600 bg-red-100 p-2 rounded-md">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-center">{errorMessage}</span>
          </div>
        )}
        <Button
          onClick={onPaymentClick}
          // Disable button only if redirecting
          disabled={isRedirecting}
          className="w-full ghibli-button" // Use consistent button style
          size="lg" // Make button slightly larger
        >
          {isRedirecting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
             <CreditCard className="mr-2 h-5 w-5" />
          )}
          {isRedirecting ? 'A Redirecionar...' : 'Pagar e Transformar (1€)'}
        </Button>
      </div>

    </div>
  );
};

export default PaymentState;
