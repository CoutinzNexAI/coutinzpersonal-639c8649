import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartService } from '@/lib/cart/cartService';
import { CartSummary } from '@/lib/cart/cartTypes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

interface ShippingMethod {
  uid: string;
  name: string;
  price: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  description?: string;
}

interface UserData {
  full_name: string;
  email: string;
}

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const { userInfo } = useAuth();
  
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Método de envio fixo - só um
  const shippingMethod: ShippingMethod = {
    uid: 'express',
    name: 'Envio Expresso',
    price: 5.39,
    deliveryDaysMin: 4,
    deliveryDaysMax: 5,
    description: 'Entrega rápida em 4-5 dias úteis'
  };

  // Carregar dados do utilizador do Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userInfo?.id) return;

      try {
        setLoadingUserData(true);
        
        const { data, error } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', userInfo.id)
          .single();

        if (error) {
          console.error('Erro ao carregar dados do utilizador:', error);
          toast.error('Erro ao carregar dados do perfil');
          return;
        }

        if (data) {
          setUserData(data);
        }
      } catch (error) {
        console.error('Erro inesperado ao carregar dados:', error);
        toast.error('Erro ao carregar dados do perfil');
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [userInfo?.id]);

  // Carregar resumo do carrinho
  useEffect(() => {
    const summary = CartService.getCartSummary();
    
    if (summary.itemCount === 0) {
      router.push('/shop');
      toast.error('Carrinho vazio! Adicione produtos primeiro.');
      return;
    }
    
    setCartSummary(summary);
  }, [router]);

  const calculateTotal = () => {
    if (!cartSummary) return 0;
    return cartSummary.subtotal + shippingMethod.price + cartSummary.tax;
  };

  const handleCheckout = async () => {
    if (!cartSummary || !userInfo || !userData) {
      toast.error('Dados incompletos para finalizar compra');
      return;
    }

    setLoadingPayment(true);

    try {
      // 1. Validar carrinho
      const validation = CartService.validateCart();
      if (!validation.valid) {
        toast.error('Carrinho inválido: ' + validation.issues.join(', '));
        return;
      }

      // 2. Calcular total final
      const finalTotal = calculateTotal();

      toast.info('A preparar sessão de pagamento...', { duration: 2000 });

      // 3. Criar sessão de pagamento Stripe
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartSummary.items,
          shippingMethod: shippingMethod,
          userId: userInfo.id,
          userName: userData.full_name,
          userEmail: userData.email,
          subtotal: cartSummary.subtotal,
          shipping: shippingMethod.price,
          tax: cartSummary.tax,
          total: finalTotal
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar sessão de pagamento');
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirecionar para Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('URL de pagamento não recebida');
      }
      
    } catch (error) {
      console.error('Erro no checkout:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao processar compra: ' + errorMessage);
    } finally {
      setLoadingPayment(false);
    }
  };

  const removeFromCart = (itemId: string) => {
    CartService.removeFromCart(itemId);
    const newSummary = CartService.getCartSummary();
    setCartSummary(newSummary);
    
    if (newSummary.itemCount === 0) {
      router.push('/shop');
      toast.info('Carrinho vazio. Redirecionando para a loja...');
    } else {
      toast.success('Produto removido do carrinho');
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream via-ghibli-paper to-ghibli-sky relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-20 left-10 text-3xl animate-leaf-float">🍃</div>
        <div className="absolute bottom-28 right-16 text-2xl animate-leaf-float">🍂</div>
        <div className="absolute top-40 right-28 text-xl animate-star-twinkle">✨</div>
        
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-ghibli-moss/20"
          >
            <div className="text-6xl mb-4">🌸</div>
            <h2 className="text-2xl font-ghibli text-ghibli-wood mb-4">Acesso necessário</h2>
            <p className="text-ghibli-earth mb-6">Precisa de fazer login para aceder ao checkout.</p>
            <Link href="/login">
              <Button className="bg-ghibli-moss hover:bg-ghibli-moss-light text-white px-8 py-3 rounded-xl">
                Fazer Login
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loadingUserData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream via-ghibli-paper to-ghibli-sky relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-20 left-10 text-3xl animate-leaf-float">🍃</div>
        <div className="absolute bottom-28 right-16 text-2xl animate-leaf-float">🍂</div>
        
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-ghibli-moss/20"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-ghibli-moss/20 border-t-ghibli-moss mx-auto mb-4"></div>
            <p className="text-ghibli-earth">A carregar dados do perfil...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!cartSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream via-ghibli-paper to-ghibli-sky relative overflow-hidden">
        <div className="absolute top-20 left-10 text-3xl animate-leaf-float">🍃</div>
        <div className="absolute bottom-28 right-16 text-2xl animate-leaf-float">🍂</div>
        
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-ghibli-moss/20"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-ghibli-moss/20 border-t-ghibli-moss mx-auto mb-4"></div>
            <p className="text-ghibli-earth">A carregar carrinho...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghibli-cream via-ghibli-paper to-ghibli-sky relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-20 left-10 text-3xl animate-leaf-float opacity-20">🍃</div>
      <div className="absolute bottom-28 right-16 text-2xl animate-leaf-float opacity-20">🍂</div>
      <div className="absolute top-40 right-28 text-xl animate-star-twinkle opacity-30">✨</div>
      <div className="absolute bottom-40 left-20 text-2xl animate-star-twinkle opacity-30">✨</div>
      
      <Head>
        <title>Checkout - PicTuz</title>
        <meta name="description" content="Finalize a sua compra de produtos personalizados no PicTuz" />
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Cabeçalho estilo Ghibli */}
            <div className="mb-12 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-block mb-4"
              >
                <div className="text-6xl mb-2">🛒</div>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-ghibli text-ghibli-wood mb-4">
                Finalizar Compra
              </h1>
              <p className="text-xl text-ghibli-earth max-w-2xl mx-auto">
                Reveja o seu pedido e prossiga para o pagamento seguro
              </p>
              <div className="mt-6 h-1 w-32 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light mx-auto rounded-full"></div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Resumo do Pedido - span 2 colunas */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-ghibli-moss/10 p-8"
                >
                  <div className="flex items-center mb-6">
                    <div className="text-3xl mr-3">📦</div>
                    <h2 className="text-2xl font-ghibli text-ghibli-wood">Resumo do Pedido</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {cartSummary.items.map((item) => (
                      <motion.div 
                        key={item.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 p-6 border border-ghibli-moss/20 rounded-xl bg-ghibli-cream/30 hover:bg-ghibli-cream/50 transition-colors"
                      >
                        {item.userImageUrl && (
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                            <Image
                              src={item.userImageUrl}
                              alt={item.productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-ghibli-wood mb-1">
                            {item.productName}
                          </h3>
                          <p className="text-sm text-ghibli-earth">
                            {item.customizations?.size && `Tamanho: ${item.customizations.size}`}
                          </p>
                          <p className="text-sm text-ghibli-earth">
                            Quantidade: {item.quantity}
                          </p>
                        </div>
                        
                        <div className="text-right w-full sm:w-auto">
                          <p className="text-xl font-bold text-ghibli-moss mb-2">
                            €{(item.price * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-sm text-ghibli-poppy hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg"
                          >
                            Remover
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Dados do Cliente */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-ghibli-moss/10 p-8"
                >
                  <div className="flex items-center mb-6">
                    <div className="text-3xl mr-3">👤</div>
                    <h2 className="text-2xl font-ghibli text-ghibli-wood">Dados do Cliente</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-ghibli-cream/30 rounded-xl">
                      <label className="text-sm font-medium text-ghibli-earth block mb-1">Nome</label>
                      <p className="text-ghibli-wood font-semibold">{userData?.full_name || 'Não disponível'}</p>
                    </div>
                    <div className="p-4 bg-ghibli-cream/30 rounded-xl">
                      <label className="text-sm font-medium text-ghibli-earth block mb-1">Email</label>
                      <p className="text-ghibli-wood font-semibold">{userData?.email || 'Não disponível'}</p>
                    </div>
                    <div className="text-sm text-ghibli-earth p-4 bg-ghibli-sky/30 rounded-xl border border-ghibli-sky/50">
                      <div className="flex items-start">
                        <span className="text-lg mr-2">ℹ️</span>
                        <p>Os dados de envio serão recolhidos no próximo passo através do sistema seguro do Stripe.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Sidebar - Resumo Financeiro e Checkout */}
              <div className="space-y-6">
                {/* Método de Envio */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-ghibli-moss/10 p-6"
                >
                  <div className="flex items-center mb-4">
                    <div className="text-2xl mr-2">🚚</div>
                    <h2 className="text-xl font-ghibli text-ghibli-wood">Método de Envio</h2>
                  </div>
                  
                  <div className="border border-ghibli-moss/30 rounded-xl p-4 bg-ghibli-moss/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-ghibli-wood">{shippingMethod.name}</h3>
                        <p className="text-sm text-ghibli-earth">{shippingMethod.description}</p>
                        <p className="text-sm text-ghibli-earth mt-1">
                          Entrega em {shippingMethod.deliveryDaysMin}-{shippingMethod.deliveryDaysMax} dias úteis
                        </p>
                      </div>
                      <span className="text-lg font-bold text-ghibli-moss">
                        €{shippingMethod.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Resumo Financeiro */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-ghibli-moss/10 p-6"
                >
                  <div className="flex items-center mb-6">
                    <div className="text-2xl mr-2">💰</div>
                    <h2 className="text-xl font-ghibli text-ghibli-wood">Resumo Financeiro</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-ghibli-moss/20">
                      <span className="text-ghibli-earth">Subtotal</span>
                      <span className="text-ghibli-wood font-semibold">€{cartSummary.subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-ghibli-moss/20">
                      <span className="text-ghibli-earth">Envio</span>
                      <span className="text-ghibli-wood font-semibold">€{shippingMethod.price.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-ghibli-moss/20">
                      <span className="text-ghibli-earth">IVA (23%)</span>
                      <span className="text-ghibli-wood font-semibold">€{cartSummary.tax.toFixed(2)}</span>
                    </div>
                    
                    <div className="bg-ghibli-moss/10 rounded-xl p-4 mt-4">
                      <div className="flex justify-between text-xl font-bold">
                        <span className="text-ghibli-wood">Total</span>
                        <span className="text-ghibli-moss">€{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Checkout */}
                  <Button
                    onClick={handleCheckout}
                    disabled={loadingPayment}
                    className="w-full mt-6 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light hover:from-ghibli-moss-light hover:to-ghibli-moss text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loadingPayment ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                        A processar...
                      </div>
                    ) : (
                      <>
                        <span className="mr-2">🌟</span>
                        Finalizar Compra
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-ghibli-earth text-center mt-3">
                    Será redirecionado para o Stripe para pagamento seguro
                  </p>
                </motion.div>

                {/* Informações de Segurança */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-ghibli-moss/10 p-6"
                >
                  <div className="flex items-center mb-4">
                    <div className="text-2xl mr-2">🛡️</div>
                    <h3 className="text-lg font-ghibli text-ghibli-wood">Compra Segura</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm text-ghibli-earth">
                    <div className="flex items-center p-2 bg-green-50 rounded-lg">
                      <span className="text-green-500 mr-3 text-lg">🔒</span>
                      <span>Pagamento processado pelo Stripe</span>
                    </div>
                    <div className="flex items-center p-2 bg-blue-50 rounded-lg">
                      <span className="text-blue-500 mr-3 text-lg">🛡️</span>
                      <span>Dados protegidos com SSL</span>
                    </div>
                    <div className="flex items-center p-2 bg-purple-50 rounded-lg">
                      <span className="text-purple-500 mr-3 text-lg">💳</span>
                      <span>Aceitamos Visa, Mastercard, etc.</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage; 