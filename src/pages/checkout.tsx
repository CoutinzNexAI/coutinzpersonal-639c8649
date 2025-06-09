import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartService } from '@/lib/cart/cartService';
import { CartSummary, ShippingInfo } from '@/lib/cart/cartTypes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

// Schema simplificado - só endereço, cidade, código postal e país
const shippingSchema = z.object({
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  postalCode: z.string().regex(/^\d{4}-\d{3}$/, 'Código postal deve ter formato 0000-000'),
  country: z.string().min(2, 'País é obrigatório')
});

type ShippingFormData = z.infer<typeof shippingSchema>;

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

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      country: 'PT'
    }
  });

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

  const handleCheckout = async (data: ShippingFormData) => {
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

      toast.info('A preparar pedido...', { duration: 2000 });

      // 3. Preparar dados completos da encomenda
      const fullShippingData = {
        name: userData.full_name,
        email: userData.email,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country
      };

      // 4. Criar sessão de pagamento Stripe
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartSummary.items,
          shippingInfo: fullShippingData,
          shippingMethod: shippingMethod,
          userId: userInfo.id,
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
      toast.info('Carrinho vazio! Redirecionando para a loja.');
    }
  };

  if (!cartSummary || loadingUserData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-ghibli-moss border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ghibli-earth">
            {loadingUserData ? 'A carregar dados...' : 'A carregar carrinho...'}
          </p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand flex items-center justify-center">
        <div className="text-center">
          <p className="text-ghibli-earth mb-4">Erro ao carregar dados do perfil</p>
          <Button onClick={() => router.push('/profile')}>
            Ir para Perfil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout - PicTuz</title>
        <meta name="description" content="Finalize a sua compra de produtos personalizados com arte AI" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-4 py-8 sm:py-12">
          {/* Breadcrumb */}
          <div className="mb-8">
            <nav className="text-sm text-ghibli-earth">
              <Link href="/shop" className="hover:text-ghibli-moss transition-colors">
                Loja
              </Link>
              <span className="mx-2">→</span>
              <span className="text-ghibli-wood font-medium">Checkout</span>
            </nav>
          </div>

          {/* Título */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-ghibli font-bold text-ghibli-wood mb-4">
              🛒 Finalizar Compra
            </h1>
            <p className="text-ghibli-earth text-lg">
              Último passo para receber os seus produtos personalizados
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Coluna Esquerda - Formulário de Envio */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Dados do Cliente (só leitura) */}
              <div className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-ghibli-wood mb-6">
                  👤 Dados do Cliente
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ghibli-earth mb-2">
                      Nome Completo
                    </label>
                    <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-ghibli-wood">
                      {userData.full_name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ghibli-earth mb-2">
                      Email
                    </label>
                    <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-ghibli-wood">
                      {userData.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados de Envio */}
              <div className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-ghibli-wood mb-6">
                  📦 Endereço de Envio
                </h2>

                <form onSubmit={handleSubmit(handleCheckout)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ghibli-earth mb-2">
                      Endereço
                    </label>
                    <Input
                      {...register('address')}
                      placeholder="Rua, número, andar, porta"
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ghibli-earth mb-2">
                        Cidade
                      </label>
                      <Input
                        {...register('city')}
                        placeholder="Lisboa"
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ghibli-earth mb-2">
                        Código Postal
                      </label>
                      <Input
                        {...register('postalCode')}
                        placeholder="1000-001"
                        className={errors.postalCode ? 'border-red-500' : ''}
                      />
                      {errors.postalCode && (
                        <p className="text-red-500 text-xs mt-1">{errors.postalCode.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ghibli-earth mb-2">
                      País
                    </label>
                    <select
                      {...register('country')}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ghibli-moss focus:border-ghibli-moss"
                    >
                      <option value="PT">Portugal</option>
                      <option value="ES">Espanha</option>
                      <option value="FR">França</option>
                      <option value="DE">Alemanha</option>
                      <option value="IT">Itália</option>
                    </select>
                  </div>
                </form>
              </div>

              {/* Método de Envio Fixo */}
              <div className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-ghibli-wood mb-4">
                  🚚 Método de Envio
                </h3>
                
                <div className="p-4 border border-ghibli-moss bg-green-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-ghibli-wood">
                        {shippingMethod.name}
                      </div>
                      <div className="text-sm text-ghibli-earth">
                        {shippingMethod.deliveryDaysMin}-{shippingMethod.deliveryDaysMax} dias úteis
                      </div>
                      <div className="text-xs text-ghibli-earth/80 mt-1">
                        {shippingMethod.description}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-ghibli-wood">
                      €{shippingMethod.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Coluna Direita - Resumo do Carrinho */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-2xl p-6 shadow-lg sticky top-6">
                <h2 className="text-xl font-semibold text-ghibli-wood mb-6">
                  📋 Resumo do Pedido
                </h2>

                {/* Itens do Carrinho */}
                <div className="space-y-4 mb-6">
                  {cartSummary.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-white/50 rounded-lg">
                      <div className="w-16 h-16 bg-ghibli-sand/20 rounded-lg flex-shrink-0 relative overflow-hidden">
                        <Image
                          src={item.userImageUrl}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-ghibli-wood text-sm truncate">
                          {item.productName}
                        </h4>
                        <p className="text-xs text-ghibli-earth">
                          Qtd: {item.quantity}
                        </p>
                        {item.customizations?.size && (
                          <p className="text-xs text-ghibli-earth">
                            {item.customizations.size}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-ghibli-wood">
                          €{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumo Financeiro */}
                <div className="border-t border-ghibli-sand/30 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-ghibli-earth">Subtotal:</span>
                    <span className="text-ghibli-wood">€{cartSummary.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-ghibli-earth">Envio:</span>
                    <span className="text-ghibli-wood">€{shippingMethod.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-ghibli-earth">IVA (23%):</span>
                    <span className="text-ghibli-wood">€{cartSummary.tax.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-ghibli-sand/30 pt-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-ghibli-wood">Total:</span>
                      <span className="text-ghibli-wood">€{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Botão de Finalizar Compra */}
                <Button
                  onClick={handleSubmit(handleCheckout)}
                  disabled={!isValid || loadingPayment}
                  className="w-full mt-6 bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white py-4 text-lg font-semibold disabled:opacity-50"
                >
                  {loadingPayment ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    '💳 Finalizar Compra'
                  )}
                </Button>

                {/* Garantias */}
                <div className="mt-4 text-xs text-ghibli-earth space-y-1">
                  <div className="flex items-center gap-2">
                    <span>🔒</span>
                    <span>Pagamento seguro via Stripe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📦</span>
                    <span>Envio com tracking incluído</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>↩️</span>
                    <span>Garantia de devolução em 30 dias</span>
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
};

export default CheckoutPage; 