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
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acesso necessário</h2>
          <p className="text-gray-600 mb-6">Precisa de fazer login para aceder ao checkout.</p>
          <Link href="/login">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadingUserData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar dados do perfil...</p>
        </div>
      </div>
    );
  }

  if (!cartSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">A carregar carrinho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-100">
      <Head>
        <title>Checkout - PicTuz</title>
        <meta name="description" content="Finalize a sua compra de produtos personalizados no PicTuz" />
      </Head>

      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Cabeçalho */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Finalizar Compra</h1>
              <p className="text-gray-600">
                Reveja o seu pedido e prossiga para o pagamento seguro
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Resumo do Pedido */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumo do Pedido</h2>
                  
                  <div className="space-y-4">
                    {cartSummary.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        {item.userImageUrl && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                            <Image
                              src={item.userImageUrl}
                              alt={item.productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-800 truncate">
                            {item.productName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {item.customizations?.size && `Tamanho: ${item.customizations.size}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            Qtd: {item.quantity}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">
                            €{(item.price * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-xs text-red-500 hover:text-red-700 mt-1"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dados do Cliente */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Dados do Cliente</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nome</label>
                      <p className="text-gray-800">{userData?.full_name || 'Não disponível'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-800">{userData?.email || 'Não disponível'}</p>
                    </div>
                    <div className="text-sm text-gray-500 mt-4 p-3 bg-blue-50 rounded-lg">
                      <p>ℹ️ Os dados de envio serão recolhidos no próximo passo através do sistema seguro do Stripe.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo Financeiro e Checkout */}
              <div className="space-y-6">
                {/* Método de Envio */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Método de Envio</h2>
                  <div className="border rounded-lg p-4 bg-emerald-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">{shippingMethod.name}</h3>
                        <p className="text-sm text-gray-600">{shippingMethod.description}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Entrega em {shippingMethod.deliveryDaysMin}-{shippingMethod.deliveryDaysMax} dias úteis
                        </p>
                      </div>
                      <span className="text-lg font-semibold text-emerald-600">
                        €{shippingMethod.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumo Financeiro */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumo Financeiro</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-800">€{cartSummary.subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Envio</span>
                      <span className="text-gray-800">€{shippingMethod.price.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">IVA (23%)</span>
                      <span className="text-gray-800">€{cartSummary.tax.toFixed(2)}</span>
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-gray-800">Total</span>
                        <span className="text-emerald-600">€{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Checkout */}
                  <Button
                    onClick={handleCheckout}
                    disabled={loadingPayment}
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
                  >
                    {loadingPayment ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        A processar...
                      </div>
                    ) : (
                      'Finalizar Compra'
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-3">
                    Ao continuar, será redirecionado para o Stripe para pagamento seguro
                  </p>
                </div>

                {/* Informações de Segurança */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Compra Segura</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">🔒</span>
                      Pagamento processado pelo Stripe
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">🛡️</span>
                      Dados protegidos com SSL
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">💳</span>
                      Aceitamos Visa, Mastercard, etc.
                    </div>
                  </div>
                </div>
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