
import React from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentStateProps {
  uploadedImageUrl: string;
  onPaymentClick: () => void;
}

const PaymentState: React.FC<PaymentStateProps> = ({
  uploadedImageUrl,
  onPaymentClick,
}) => {
  return (
    <div className="relative w-full h-full">
      {uploadedImageUrl && (
        <img 
          src={uploadedImageUrl}
          alt="Imagem original" 
          className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm"
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center bg-background/80 backdrop-blur-sm p-6 rounded-xl w-4/5 max-w-xs">
          <div className="flex items-center justify-center mb-3">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <p className="font-medium text-lg mb-2">Pronto para transformar</p>
          <p className="text-sm text-muted-foreground mb-4">
            Clique no botão abaixo para pagar e iniciar a transformação
          </p>
          <Button 
            onClick={onPaymentClick}
            className="w-full"
          >
            Pagar 1.00€ e Transformar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentState;
