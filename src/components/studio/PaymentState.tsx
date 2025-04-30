
import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from '@/components/ui/sonner';

// Função helper para carregar o Stripe
const getStripe = () => {
  // Normalmente aqui usaríamos a variável de ambiente NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  // Como estamos em um ambiente de desenvolvimento, usaremos uma chave de teste
  const stripePublishableKey = 'pk_test_placeholder';
  return loadStripe(stripePublishableKey);
};

interface PaymentStateProps {
  uploadedImageUrl: string;
  onPaymentClick: () => void;
}

const PaymentState: React.FC<PaymentStateProps> = ({
  uploadedImageUrl,
  onPaymentClick,
}) => {
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);

  const handleCheckout = async () => {
    setIsRedirectingToCheckout(true);

    try {
      // Simular chamada à API para criar sessão de checkout
      // Num ambiente real, isto seria uma chamada fetch para o backend
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tempJobId: 'temp-' + Date.now(),
          priceId: 'PRECO_MVP'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar o pagamento.');
      }

      const { sessionId } = await response.json();
      
      if (!sessionId) {
        throw new Error('ID de sessão não recebido do servidor.');
      }

      // Carrega o Stripe e redireciona para o checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Falha ao carregar o Stripe.');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Erro durante o checkout:', error);
      toast.error('Falha ao redirecionar para o pagamento', {
        description: error instanceof Error ? error.message : 'Por favor, tente novamente.',
      });
      setIsRedirectingToCheckout(false);
    }
  };

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
            onClick={isRedirectingToCheckout ? undefined : handleCheckout}
            className="w-full"
            disabled={isRedirectingToCheckout}
          >
            {isRedirectingToCheckout ? 'Redirecionando...' : 'Pagar 1.00€ e Transformar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentState;
