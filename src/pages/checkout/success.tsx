import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartService } from '@/lib/cart/cartService';
import { useAuth } from '@/hooks/useAuth';

const CheckoutSuccessPage: React.FC = () => {
  const router = useRouter();
  const { userInfo } = useAuth();
  const { session_id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<{
    orderReference?: string;
    items?: Array<{ productName: string; quantity: number; price: number }>;
    subtotal?: number;
    shipping?: number;
    tax?: number;
    total?: number;
  } | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!session_id || typeof session_id !== 'string') {
      return;
    }

    const processOrder = async () => {
      try {
        setLoading(true);

        // Verificar sessão do Stripe e processar pedido
        const response = await fetch('/api/stripe/process-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session_id,
            userId: userInfo?.id
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao processar pedido');
        }

        const data = await response.json();
        setOrderData(data);

        // Limpar carrinho após compra bem-sucedida
        CartService.clearCart();

        toast.success('Pedido processado com sucesso!', {
          description: 'Receberá um email de confirmação em breve'
        });

      } catch (error) {
        console.error('Erro ao processar pedido:', error);
        setError('Erro ao confirmar pedido. Contacte o suporte se o problema persistir.');
        
        toast.error('Erro ao processar pedido', {
          description: 'O pagamento foi processado mas houve um erro. Contacte o suporte.'
        });
      } finally {
        setLoading(false);
      }
    };

    processOrder();
  }, [session_id, userInfo?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-ghibli-moss border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-ghibli-wood mb-2">
            A processar o seu pedido...
          </h2>
          <p className="text-ghibli-earth">
            Por favor aguarde enquanto confirmamos o pagamento
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Erro no Pedido - PicTuz</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
          <Header />
          
          <main className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-8">
                  <div className="text-6xl mb-4">❌</div>
                  <h1 className="text-2xl font-bold text-red-800 mb-4">
                    Erro no Processamento
                  </h1>
                  <p className="text-red-700 mb-6">
                    {error}
                  </p>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => router.push('/orders')}
                      className="bg-ghibli-moss hover:bg-ghibli-moss/80"
                    >
                      Ver Meus Pedidos
                    </Button>
                    <div>
                      <Link href="/support" className="text-sm text-ghibli-earth hover:text-ghibli-moss">
                        Contactar Suporte
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </main>

          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Compra Finalizada - PicTuz</title>
        <meta name="description" content="Obrigado pela sua compra! O seu pedido foi processado com sucesso." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Confirmação Principal */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-2xl p-8 shadow-lg">
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-3xl md:text-4xl font-ghibli font-bold text-ghibli-wood mb-4">
                  Compra Finalizada com Sucesso!
                </h1>
                <p className="text-lg text-ghibli-earth mb-6">
                  Obrigado pela sua compra! O seu pedido foi processado e será enviado para produção.
                </p>
                
                {orderData?.orderReference && (
                  <div className="bg-ghibli-moss/10 border border-ghibli-moss/30 rounded-lg p-4 mb-6">
                    <p className="text-sm text-ghibli-earth mb-1">Referência do Pedido:</p>
                    <p className="font-mono text-lg font-semibold text-ghibli-wood">
                      {orderData.orderReference}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Detalhes do Pedido */}
            {orderData && (
              <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* Resumo do Pedido */}
                <div className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-ghibli-wood mb-4">
                    📋 Resumo do Pedido
                  </h2>
                  
                  {orderData.items && (
                    <div className="space-y-3">
                      {orderData.items.map((item: { productName: string; quantity: number; price: number }, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-ghibli-sand/10 rounded-lg">
                          <div>
                            <p className="font-medium text-ghibli-wood text-sm">
                              {item.productName}
                            </p>
                            <p className="text-xs text-ghibli-earth">
                              Qtd: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-ghibli-wood">
                              €{(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-t border-ghibli-sand/30 pt-3 mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-ghibli-earth">Subtotal:</span>
                          <span>€{orderData.subtotal?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-ghibli-earth">Envio:</span>
                          <span>€{orderData.shipping?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-ghibli-earth">IVA:</span>
                          <span>€{orderData.tax?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total:</span>
                          <span>€{orderData.total?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Próximos Passos */}
                <div className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold text-ghibli-wood mb-4">
                    📦 Próximos Passos
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-ghibli-moss text-white rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-ghibli-wood text-sm">
                          Confirmação por Email
                        </p>
                        <p className="text-xs text-ghibli-earth">
                          Receberá um email de confirmação em poucos minutos
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-ghibli-moss text-white rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-ghibli-wood text-sm">
                          Produção
                        </p>
                        <p className="text-xs text-ghibli-earth">
                          Os seus produtos serão impressos com qualidade premium
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-ghibli-moss text-white rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-ghibli-wood text-sm">
                          Envio
                        </p>
                        <p className="text-xs text-ghibli-earth">
                          Entrega em 4-5 dias úteis com tracking incluído
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Ações */}
            <motion.div
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="space-x-4">
                <Button 
                  onClick={() => router.push('/orders')}
                  className="bg-ghibli-moss hover:bg-ghibli-moss/80"
                >
                  Ver Meus Pedidos
                </Button>
                <Button 
                  onClick={() => router.push('/shop')}
                  variant="outline"
                  className="border-ghibli-moss text-ghibli-moss hover:bg-ghibli-moss/10"
                >
                  Continuar Comprando
                </Button>
              </div>
              
              <p className="text-sm text-ghibli-earth">
                Tem dúvidas? {' '}
                <Link href="/support" className="text-ghibli-moss hover:underline">
                  Contacte o nosso suporte
                </Link>
              </p>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CheckoutSuccessPage; 