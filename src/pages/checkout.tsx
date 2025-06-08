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
import Image from 'next/image';

// Schema de validação para dados de envio
const shippingSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  postalCode: z.string().regex(/^\d{4}-\d{3}$/, 'Código postal deve ter formato 0000-000'),
  country: z.string().min(2, 'País é obrigatório'),
  phone: z.string().optional()
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

const CheckoutPage: React.FC = () => {
  const router = useRouter();
  const { userInfo } = useAuth();
  
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [quoteError, setQuoteError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      country: 'PT'
    }
  });

  const watchedValues = watch();

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

  // Buscar cotações de envio quando dados de envio mudarem
  useEffect(() => {
    if (isValid && cartSummary && cartSummary.items.length > 0) {
      const timer = setTimeout(() => {
        fetchShippingQuotes(watchedValues);
      }, 1000); // Debounce

      return () => clearTimeout(timer);
    }
  }, [watchedValues, isValid, cartSummary]);

  const fetchShippingQuotes = async (shippingData: ShippingFormData) => {
    if (!cartSummary) return;

    setLoadingShipping(true);
    setQuoteError('');

    try {
      const response = await fetch('/api/gelato/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: cartSummary.items,
          shippingAddress: shippingData
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao obter cotações de envio');
      }

      const data = await response.json();
      
      if (data.shipmentMethods && data.shipmentMethods.length > 0) {
        setShippingMethods(data.shipmentMethods);
        // Selecionar automaticamente o primeiro método
        setSelectedShippingMethod(data.shipmentMethods[0].uid);
      } else {
        setShippingMethods([]);
        setQuoteError('Nenhum método de envio disponível para esta localização');
      }
      
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      setQuoteError('Erro ao calcular envio. Tente novamente.');
      
      // Fallback com métodos simulados
      setShippingMethods([
        {
          uid: 'standard',
          name: 'Envio Standard',
          price: 4.99,
          deliveryDaysMin: 5,
          deliveryDaysMax: 7,
          description: 'CTT - Entrega em 5-7 dias úteis'
        },
        {
          uid: 'express',
          name: 'Envio Expresso',
          price: 9.99,
          deliveryDaysMin: 2,
          deliveryDaysMax: 3,
          description: 'CTT Expresso - Entrega em 2-3 dias úteis'
        }
      ]);
      setSelectedShippingMethod('standard');
    } finally {
      setLoadingShipping(false);
    }
  };

  const calculateTotal = () => {
    if (!cartSummary) return 0;
    
    const selectedMethod = shippingMethods.find(m => m.uid === selectedShippingMethod);
    const shippingCost = selectedMethod ? selectedMethod.price : 0;
    
    return cartSummary.subtotal + shippingCost + cartSummary.tax;
  };

  const handleCheckout = async (data: ShippingFormData) => {
    if (!cartSummary || !selectedShippingMethod || !userInfo) {
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

      toast.info('A gerar ficheiros de impressão...', { duration: 3000 });

      // 3. Gerar ficheiros de impressão para cada item
      const printFilePromises = cartSummary.items.map(async (item) => {
        try {
          const response = await fetch('/api/gelato/generate-print-file', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrl: item.userImageUrl,
              productUid: item.productUid,
              productId: item.productId,
              userId: userInfo.id,
              transformationId: item.userImageId
            })
          });

          if (!response.ok) {
            throw new Error(`Erro ao gerar print file para ${item.productName}`);
          }

          const printFileData = await response.json();
          return {
            ...item,
            printFileUrl: printFileData.fileUrl,
            printFileName: printFileData.fileName
          };
        } catch (error) {
          console.error(`Error generating print file for ${item.productName}:`, error);
          throw error;
        }
      });

      const itemsWithPrintFiles = await Promise.all(printFilePromises);

      toast.success('Ficheiros de impressão gerados! Processando pagamento...', { duration: 2000 });

      // 4. Criar ordem no sistema local (simulado)
      const orderData = {
        userId: userInfo.id,
        items: itemsWithPrintFiles,
        shippingInfo: data,
        shippingMethod: shippingMethods.find(m => m.uid === selectedShippingMethod),
        subtotal: cartSummary.subtotal,
        shipping: shippingMethods.find(m => m.uid === selectedShippingMethod)?.price || 0,
        tax: cartSummary.tax,
        total: finalTotal,
        status: 'pending_payment'
      };

      // 5. Processar pagamento via Stripe (simulado)
      toast.info('Redirecionando para pagamento seguro...', { duration: 3000 });
      
      // Simular redirecionamento e pagamento Stripe
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simular confirmação de pagamento
      const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo
      
      if (!paymentSuccess) {
        throw new Error('Pagamento foi recusado. Tente outro cartão.');
      }

      toast.success('Pagamento confirmado! Enviando para produção...', { duration: 3000 });

      // 6. Enviar pedido para Gelato
      try {
        const gelatoOrderResponse = await fetch('/api/gelato/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderReferenceId: `order_${Date.now()}_${userInfo.id}`,
            customerReferenceId: userInfo.id,
            currency: 'EUR',
            recipient: {
              name: data.name,
              email: data.email,
              address: {
                line1: data.address,
                city: data.city,
                postalCode: data.postalCode,
                country: data.country
              }
            },
            products: itemsWithPrintFiles.map((item, index) => ({
              itemReferenceId: `item_${index + 1}`,
              productUid: item.productUid,
              quantity: item.quantity,
              files: [
                {
                  url: item.printFileUrl,
                  type: 'default'
                }
              ]
            })),
            shipmentMethodUid: selectedShippingMethod
          })
        });

        if (gelatoOrderResponse.ok) {
          const gelatoOrderData = await gelatoOrderResponse.json();
          toast.success('Pedido enviado para produção! Receberá email de confirmação.', { duration: 5000 });
          console.log('Gelato order created:', gelatoOrderData);
        } else {
          console.warn('Gelato order failed, but payment was successful');
          toast.warning('Pagamento processado. Pedido será enviado para produção manualmente.');
        }
      } catch (gelatoError) {
        console.error('Gelato integration error:', gelatoError);
        toast.warning('Pagamento processado. Pedido será enviado para produção manualmente.');
      }

      // 7. Limpar carrinho e redirecionar
      CartService.clearCart();
      
      toast.success('Compra finalizada com sucesso! Redirecionando...', { 
        duration: 3000,
        description: 'Receberá updates do pedido por email'
      });
      
      setTimeout(() => {
        router.push('/orders');
      }, 2000);
      
    } catch (error) {
      console.error('Erro no checkout:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (errorMessage.includes('print file') || errorMessage.includes('ficheiro')) {
        toast.error('Erro ao preparar ficheiros para impressão. Tente novamente.');
      } else if (errorMessage.includes('pagamento') || errorMessage.includes('payment')) {
        toast.error('Erro no pagamento: ' + errorMessage);
      } else {
        toast.error('Erro ao processar compra: ' + errorMessage);
      }
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

  if (!cartSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-ghibli-moss border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ghibli-earth">A carregar carrinho...</p>
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
              <div className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-ghibli-wood mb-6">
                  📦 Dados de Envio
                </h2>

                <form onSubmit={handleSubmit(handleCheckout)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ghibli-earth mb-2">
                      Nome Completo
                    </label>
                    <Input
                      {...register('name')}
                      placeholder="O seu nome completo"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ghibli-earth mb-2">
                      Email
                    </label>
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="o.seu.email@exemplo.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium text-ghibli-earth mb-2">
                      Telefone (opcional)
                    </label>
                    <Input
                      {...register('phone')}
                      placeholder="+351 912 345 678"
                    />
                  </div>
                </form>
              </div>

              {/* Métodos de Envio */}
              {shippingMethods.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-ghibli-wood mb-4">
                    🚚 Método de Envio
                  </h3>
                  
                  {loadingShipping && (
                    <div className="flex items-center gap-2 text-ghibli-earth mb-4">
                      <div className="w-4 h-4 border-2 border-ghibli-moss border-t-transparent rounded-full animate-spin" />
                      <span>A calcular opções de envio...</span>
                    </div>
                  )}

                  {quoteError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-700 text-sm">{quoteError}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {shippingMethods.map((method) => (
                      <label
                        key={method.uid}
                        className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedShippingMethod === method.uid
                            ? 'border-ghibli-moss bg-green-50'
                            : 'border-gray-200 hover:border-ghibli-sand'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          value={method.uid}
                          checked={selectedShippingMethod === method.uid}
                          onChange={(e) => setSelectedShippingMethod(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-ghibli-wood">
                              {method.name}
                            </div>
                            <div className="text-sm text-ghibli-earth">
                              {method.deliveryDaysMin === method.deliveryDaysMax
                                ? `${method.deliveryDaysMin} dias úteis`
                                : `${method.deliveryDaysMin}-${method.deliveryDaysMax} dias úteis`
                              }
                            </div>
                            {method.description && (
                              <div className="text-xs text-ghibli-earth/80 mt-1">
                                {method.description}
                              </div>
                            )}
                          </div>
                          <div className="text-lg font-semibold text-ghibli-wood">
                            €{method.price.toFixed(2)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
                  
                  {selectedShippingMethod && (
                    <div className="flex justify-between text-sm">
                      <span className="text-ghibli-earth">Envio:</span>
                      <span className="text-ghibli-wood">
                        €{shippingMethods.find(m => m.uid === selectedShippingMethod)?.price.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  )}
                  
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
                  disabled={!isValid || !selectedShippingMethod || loadingPayment || loadingShipping}
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