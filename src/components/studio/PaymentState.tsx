
import React from 'react';
import { Button } from '@/components/ui/button';

interface PaymentStateProps {
  uploadedImageUrl: string;
  onPaymentClick: () => void;
}

const PaymentState: React.FC<PaymentStateProps> = ({ uploadedImageUrl, onPaymentClick }) => {
  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Original image preview */}
      <div className="flex-1 overflow-hidden">
        <img 
          src={uploadedImageUrl} 
          alt="Imagem original" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Payment call to action */}
      <div className="p-4 bg-white/90 backdrop-blur-sm flex flex-col items-center">
        <p className="text-sm text-ghibli-earth mb-3">
          Sua imagem está pronta para transformação!
        </p>
        <Button 
          onClick={onPaymentClick}
          className="ghibli-accent-button w-full"
        >
          Pagar 1.00€ e Transformar
        </Button>
      </div>
    </div>
  );
};

export default PaymentState;
