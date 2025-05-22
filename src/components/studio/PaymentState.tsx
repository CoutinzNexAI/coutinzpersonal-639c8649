import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CreditCard } from 'lucide-react';
// import { Style } from '../StyleSelectorModal'; // No longer needed here
// import { supabase } from '@/lib/supabase/client'; // No longer needed here

interface PaymentStateProps {
  // uploadedImageUrl: string; // Removed
  // selectedStyle: Style | null; // Removed
  // jobId: string | null; // Removed
  selectedStyleName: string; // Added to display the chosen style
  // originalImagePreviewUrl?: string; // Optional: Added to display a preview of the original image
  onPaymentClick: () => void;
  isRedirecting: boolean;
  errorMessage?: string | null;
}

const PaymentState: React.FC<PaymentStateProps> = ({
  // uploadedImageUrl, // Removed
  // selectedStyle, // Removed
  // jobId, // Removed
  selectedStyleName, // Added
  // originalImagePreviewUrl, // Added
  onPaymentClick,
  isRedirecting,
  errorMessage,
}) => {
  // Removed state and useEffect for fetching image

  return (
    // Centered content vertically and horizontally
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">

      <h2 className="text-2xl font-semibold text-ghibli-charcoal mb-4">Passo 3: Pagamento</h2>

      {/* {originalImagePreviewUrl && (
        <div className="mb-6">
          <img
            src={originalImagePreviewUrl}
            alt="Pré-visualização da imagem original"
            className="rounded-lg shadow-md max-w-xs mx-auto h-auto object-contain"
            style={{ maxHeight: '150px' }} // Adjust as needed
          />
        </div>
      )} */}

      <div className="bg-ghibli-cream p-6 rounded-lg shadow-lg w-full max-w-md mb-8">
        <p className="text-sm text-ghibli- 次元洞察 mb-1">Estilo Selecionado:</p>
        <h3 className="text-xl font-bold text-ghibli-ocean-deep mb-4">{selectedStyleName}</h3>
        <p className="text-sm text-ghibli- 次元洞察">
          Confirme o pagamento de <strong>2€</strong> para iniciar a transformação.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
            O resultado estará disponível em breve.
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
          {isRedirecting ? 'A Redirecionar...' : 'Pagar e Transformar (2€)'}
        </Button>
      </div>

    </div>
  );
};

export default PaymentState;
