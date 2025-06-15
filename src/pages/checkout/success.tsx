import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

interface OrderResult {
  success: boolean;
  message: string;
  orderId: string;
  orderReference: string;
  printifyOrderId?: string; // ✅ ATUALIZADO: printifyOrderId em vez de gelatoOrderId
  printifyStatus?: string; // ✅ ADICIONAR: Status real da Printify (pending, on-hold, etc.)
  gelatoOrderId?: string; // ✅ MANTER PARA COMPATIBILIDADE
  status: string;
  estimatedDelivery?: string;
  customerEmail: string;
  customerName: string;
  total: number;
  subtotal?: number; // ✅ ADICIONAR CAMPOS FINANCEIROS OPCIONAIS
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
          // ✅ SUCESSO TOTAL - Pedido processado e enviado para Gelato
          console.log('✅ Pedido processado com sucesso:', result);
          setOrderResult(result);
          toast.success('Pedido finalizado com sucesso!');
          
        } else if (!response.ok && result.supportNeeded) {
          // ⚠️ PAGAMENTO OK, MAS GELATO FALHOU - Precisa suporte
          console.error('⚠️ Pagamento processado mas erro na Gelato:', result);
          setOrderResult(result);
          toast.error('Pedido parcialmente processado. Contacte o suporte.');
          
        } else {
          // ❌ ERRO COMPLETO
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
        
        <main className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-ghibli-moss/10"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-ghibli-moss/20 border-t-ghibli-moss mx-auto mb-6"></div>
              <h1 className="text-2xl font-ghibli text-ghibli-wood mb-4">
                A processar o seu pedido...
              </h1>
              <p className="text-ghibli-earth">
                Aguarde enquanto confirmamos o pagamento e enviamos o pedido para produção.
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
        
        <main className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-red-200"
            >
              <div className="text-6xl mb-6">❌</div>
              <h1 className="text-3xl font-ghibli text-red-600 mb-4">
                Erro no Processamento
              </h1>
              <p className="text-ghibli-earth mb-6">{error}</p>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => router.push('/shop')}
                  className="bg-ghibli-moss hover:bg-ghibli-moss-light text-white px-6 py-3 rounded-xl"
                >
                  Voltar à Loja
                </Button>
                
                <div className="text-sm text-ghibli-earth">
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
  const needsSupport = orderResult.supportNeeded;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghibli-cream via-ghibli-paper to-ghibli-sky relative overflow-hidden">
      <div className="absolute top-20 left-10 text-3xl animate-leaf-float opacity-20">🍃</div>
      <div className="absolute bottom-28 right-16 text-2xl animate-leaf-float opacity-20">🍂</div>
      <div className="absolute top-40 right-28 text-xl animate-star-twinkle opacity-30">✨</div>
      
      <Head>
        <title>{isSuccess ? 'Pedido Confirmado' : 'Atenção Necessária'} - PicTuz</title>
      </Head>
      
      <Header />
      
      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border ${
              isSuccess ? 'border-green-200' : needsSupport ? 'border-yellow-200' : 'border-red-200'
            }`}
          >
            {/* Cabeçalho */}
            <div className="text-center mb-8">
              <div className={`text-6xl mb-4 ${
                isSuccess ? '🎉' : needsSupport ? '⚠️' : '❌'
              }`}>
                {isSuccess ? '🎉' : needsSupport ? '⚠️' : '❌'}
              </div>
              
              <h1 className={`text-3xl font-ghibli mb-4 ${
                isSuccess ? 'text-green-600' : needsSupport ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {isSuccess ? 'Pedido Confirmado!' : needsSupport ? 'Atenção Necessária' : 'Erro no Processamento'}
              </h1>
              
              <p className="text-ghibli-earth text-lg">
                {orderResult.message}
              </p>
            </div>

            {/* Detalhes do Pedido */}
            <div className="bg-ghibli-cream/30 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-ghibli text-ghibli-wood mb-4">Detalhes do Pedido</h2>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-ghibli-earth">Referência:</span>
                  <span className="ml-2 font-mono text-ghibli-wood">{orderResult.orderReference}</span>
                </div>
                
                <div>
                  <span className="font-medium text-ghibli-earth">Total:</span>
                  <span className="ml-2 font-bold text-ghibli-moss">€{(orderResult.total || 0).toFixed(2)}</span>
                </div>
                
                <div>
                  <span className="font-medium text-ghibli-earth">Cliente:</span>
                  <span className="ml-2 text-ghibli-wood">{orderResult.customerName}</span>
                </div>
                
                <div>
                  <span className="font-medium text-ghibli-earth">Email:</span>
                  <span className="ml-2 text-ghibli-wood">{orderResult.customerEmail}</span>
                </div>
                
                <div>
                  <span className="font-medium text-ghibli-earth">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    isSuccess ? 'bg-green-100 text-green-800' : 
                    needsSupport ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {orderResult.status}
                  </span>
                </div>
                
                {orderResult.printifyStatus && (
                  <div>
                    <span className="font-medium text-ghibli-earth">Status Printify:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      ['pending', 'on-hold', 'created'].includes(orderResult.printifyStatus) ? 'bg-blue-100 text-blue-800' :
                      ['processing', 'submitted'].includes(orderResult.printifyStatus) ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {orderResult.printifyStatus}
                    </span>
                  </div>
                )}
                
                {orderResult.estimatedDelivery && (
                  <div>
                    <span className="font-medium text-ghibli-earth">Entrega:</span>
                    <span className="ml-2 text-ghibli-wood">{orderResult.estimatedDelivery}</span>
                  </div>
                )}
                
                {(orderResult.printifyOrderId || orderResult.gelatoOrderId) && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-ghibli-earth">
                      {orderResult.printifyOrderId ? 'ID Printify:' : 'ID Gelato:'}
                    </span>
                    <span className="ml-2 font-mono text-ghibli-wood">
                      {orderResult.printifyOrderId || orderResult.gelatoOrderId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-4">
              {isSuccess && (
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center text-green-600 mb-2">
                      <span className="mr-2">✅</span>
                      <span className="font-medium">Pedido em Produção</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {orderResult.printifyStatus === 'pending' || orderResult.printifyStatus === 'on-hold' 
                        ? 'O seu pedido foi criado na Printify e está aguardando aprovação do comerciante. Receberá updates por email sobre o progresso.'
                        : 'O seu pedido foi enviado para a Printify e está agora em produção. Receberá updates por email sobre o progresso.'
                      }
                    </p>
                  </div>
                </div>
              )}
              
              {needsSupport && (
                <div className="text-center">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center text-yellow-600 mb-2">
                      <span className="mr-2">⚠️</span>
                      <span className="font-medium">Suporte Necessário</span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-3">
                      O pagamento foi processado mas houve um problema ao enviar para produção.
                      A nossa equipa irá resolver isto em breve.
                    </p>
                    <a 
                      href="mailto:suporte@pictuz.com?subject=Pedido%20precisa%20suporte%20-%20${orderResult.orderReference}"
                      className="text-yellow-600 hover:text-yellow-800 underline"
                    >
                      Contactar Suporte
                    </a>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/shop">
                  <Button className="bg-ghibli-moss hover:bg-ghibli-moss-light text-white px-6 py-3 rounded-xl">
                    Continuar a Comprar
                  </Button>
                </Link>
                
                <Link href="/account/orders">
                  <Button variant="outline" className="border-ghibli-moss text-ghibli-moss hover:bg-ghibli-moss/10 px-6 py-3 rounded-xl">
                    Ver Meus Pedidos
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CheckoutSuccessPage; 