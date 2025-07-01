import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { CartService } from '@/lib/cart/cartService';

interface OrderResult {
  success: boolean;
  message: string;
  orderId: string;
  orderReference: string;
  printifyOrderId?: string;
  printifyStatus?: string;
  gelatoOrderId?: string;
  status: string;
  estimatedDelivery?: string;
  customerEmail: string;
  customerName: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  tax?: number;
  error?: string;
  supportNeeded?: boolean;
}

const CheckoutSuccessPage: React.FC = () => {
  const router = useRouter();
  const { session_id } = router.query;
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session_id) return;

    const processOrder = async () => {
      try {
        setLoading(true);
        
        console.log('🔄 Processando pedido após pagamento...');
        console.log('Frontend: Chamando endpoint de processamento de pedido:', '/api/stripe/process-printify-order');
        console.log('Frontend: Método da chamada:', 'POST');
        console.log('Frontend: Session ID:', session_id);
        
        const response = await fetch('/api/stripe/process-printify-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session_id
          })
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log('✅ Pedido processado com sucesso:', result);
          setOrderResult(result);
          
          CartService.clearCart();
          console.log('🛒 Carrinho limpo após sucesso da compra');
          
          toast.success('Pedido finalizado com sucesso!');
          
        } else if (!response.ok && result.supportNeeded) {
          console.error('⚠️ Pagamento processado mas erro na Printify:', result);
          setOrderResult(result);
          
          CartService.clearCart();
          console.log('🛒 Carrinho limpo (pagamento processado, erro Printify)');
          
          toast.error('Pedido parcialmente processado. Contacte o suporte.');
          
        } else {
          console.error('❌ Erro ao processar pedido:', result);
          setError(result.error || 'Erro desconhecido ao processar pedido');
          toast.error('Erro ao processar pedido');
        }
        
      } catch (error) {
        console.error('❌ Erro inesperado:', error);
        setError('Erro de conexão ao processar pedido');
        toast.error('Erro de conexão');
      } finally {
        setLoading(false);
      }
    };

    processOrder();
  }, [session_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream via-ghibli-paper to-ghibli-sky relative overflow-hidden">
        <div className="absolute top-20 left-10 text-3xl animate-leaf-float opacity-20">🍃</div>
        <div className="absolute bottom-28 right-16 text-2xl animate-leaf-float opacity-20">🍂</div>
        
        <Header />
        
        <main className="container mx-auto px-4 py-20 md:py-24 relative z-10">
          <div className="max-w-md mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-ghibli-moss/10"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-ghibli-moss/20 border-t-ghibli-moss mx-auto mb-6"></div>
              <h1 className="text-xl md:text-2xl font-ghibli text-ghibli-wood mb-4">
                A processar o seu pedido...
              </h1>
              <p className="text-sm md:text-base text-ghibli-earth">
                Aguarde enquanto confirmamos o pagamento.
              </p>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream via-ghibli-paper to-ghibli-sky relative overflow-hidden">
        <div className="absolute top-20 left-10 text-3xl animate-leaf-float opacity-20">🍃</div>
        <div className="absolute bottom-28 right-16 text-2xl animate-leaf-float opacity-20">🍂</div>
        
        <Head>
          <title>Erro no Processamento - PicTuz</title>
        </Head>
        
        <Header />
        
        <main className="container mx-auto px-4 py-20 md:py-24 relative z-10">
          <div className="max-w-md mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-red-200"
            >
              <div className="text-4xl md:text-6xl mb-6">❌</div>
              <h1 className="text-2xl md:text-3xl font-ghibli text-red-600 mb-4">
                Erro no Processamento
              </h1>
              <p className="text-sm md:text-base text-ghibli-earth mb-6">{error}</p>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => router.push('/')}
                  className="w-full bg-ghibli-moss hover:bg-ghibli-moss-light text-white px-6 py-3 rounded-xl"
                >
                  Página Inicial
                </Button>
                
                <div className="text-xs md:text-sm text-ghibli-earth">
                  <p>Se o problema persistir, contacte o nosso suporte:</p>
                  <a href="mailto:suporte@pictuz.com" className="text-ghibli-moss hover:underline">
                    suporte@pictuz.com
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  if (!orderResult) return null;

  const isSuccess = orderResult.success;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghibli-cream via-ghibli-paper to-ghibli-sky relative overflow-hidden">
      <div className="absolute top-20 left-10 text-2xl md:text-3xl animate-leaf-float opacity-20">🍃</div>
      <div className="absolute bottom-28 right-16 text-xl md:text-2xl animate-leaf-float opacity-20">🍂</div>
      <div className="absolute top-40 right-28 text-lg md:text-xl animate-star-twinkle opacity-30">✨</div>
      
      <Head>
        <title>Pedido Confirmado - PicTuz</title>
      </Head>
      
      <Header />
      
      <main className="container mx-auto px-4 py-20 md:py-24 relative z-10">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-green-200"
          >
            {/* Cabeçalho */}
            <div className="text-center mb-6">
              <div className="text-4xl md:text-6xl mb-4">🎉</div>
              
              <h1 className="text-2xl md:text-3xl font-ghibli text-green-600 mb-2">
                Pedido Confirmado!
              </h1>
              
              <p className="text-sm md:text-base text-ghibli-earth">
                Pedido processado com sucesso e enviado para a Printify!
              </p>
            </div>

            {/* Detalhes Simplificados */}
            <div className="bg-ghibli-cream/30 rounded-xl p-4 md:p-6 mb-6">
              <div className="space-y-3 text-sm md:text-base">
                <div className="flex justify-between items-center">
                  <span className="text-ghibli-earth">Referência:</span>
                  <span className="font-mono text-ghibli-wood text-xs md:text-sm">{orderResult.orderReference}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-ghibli-earth">Total:</span>
                  <span className="font-bold text-ghibli-moss">€{(orderResult.total || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-ghibli-earth">Cliente:</span>
                  <span className="text-ghibli-wood">{orderResult.customerName}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-ghibli-earth">Email:</span>
                  <span className="text-ghibli-wood text-xs md:text-sm break-all">{orderResult.customerEmail}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-ghibli-earth">Status:</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    processing
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-ghibli-earth">Entrega:</span>
                  <span className="text-ghibli-wood">3-6 dias úteis</span>
                </div>
              </div>
            </div>

            {/* Status de Produção */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center text-green-600 mb-3">
                <span className="mr-2">✅</span>
                <span className="font-medium text-sm md:text-base">Pedido em Produção</span>
              </div>
              <p className="text-xs md:text-sm text-green-700 text-center leading-relaxed">
                O seu pedido está a começar a ser preparado. Pode obter mais informações no seu perfil em 
                <span className="font-medium"> "As minhas encomendas"</span>.
              </p>
            </div>

            {/* Botões */}
            <div className="space-y-3">
              <Link href="/" className="block">
                <Button className="w-full bg-ghibli-moss hover:bg-ghibli-moss-light text-white py-3 rounded-xl text-sm md:text-base">
                  Página Inicial
                </Button>
              </Link>
              
              <Link href="/shop" className="block">
                <Button variant="outline" className="w-full border-ghibli-moss text-ghibli-moss hover:bg-ghibli-moss/10 py-3 rounded-xl text-sm md:text-base">
                  Voltar a Comprar
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CheckoutSuccessPage; 