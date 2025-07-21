import React, { useEffect } from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import * as fpixel from '@/lib/fpixel';

const TestePage: React.FC = () => {
  useEffect(() => {
    // Conceder consentimento para testes
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie_consent', 'granted');
      fpixel.grantConsent();
    }
  }, []);

  const testPageView = () => {
    fpixel.pageview();
  };

  const testViewContent = () => {
    fpixel.trackViewContent({
      content_name: 'Teste Produto - Caneca Personalizada',
      content_ids: ['test_mug_001'],
      content_type: 'product',
      value: 19.99,
      currency: 'EUR',
      content_category: 'personalized_mugs'
    });
  };

  const testSearch = () => {
    fpixel.trackSearch({
      search_string: 'caneca personalizada',
      content_category: 'products',
      content_ids: ['mug_category']
    });
  };

  const testAddToWishlist = () => {
    fpixel.trackAddToWishlist({
      content_name: 'Caneca Coração Personalizada',
      content_ids: ['heart_mug_test'],
      content_type: 'product',
      value: 24.99
    });
  };

  const testInitiateCheckout = () => {
    fpixel.trackInitiateCheckout({
      content_ids: ['test_mug_001', 'test_canvas_002'],
      contents: [
        { id: 'test_mug_001', quantity: 2, item_price: 19.99 },
        { id: 'test_canvas_002', quantity: 1, item_price: 45.00 }
      ],
      value: 84.98,
      currency: 'EUR',
      num_items: 3
    });
  };

  const testAddPaymentInfo = () => {
    fpixel.trackAddPaymentInfo({
      content_ids: ['test_mug_001'],
      value: 19.99,
      currency: 'EUR',
      payment_method: 'card'
    });
  };

  const testPurchase = () => {
    fpixel.trackPurchase({
      value: 84.98,
      currency: 'EUR',
      content_ids: ['test_mug_001', 'test_canvas_002'],
      contents: [
        { id: 'test_mug_001', quantity: 2, item_price: 19.99 },
        { id: 'test_canvas_002', quantity: 1, item_price: 45.00 }
      ],
      num_items: 3,
      order_id: 'TEST_ORDER_' + Date.now(),
      content_type: 'product'
    });
  };

  const testCompleteRegistration = () => {
    fpixel.trackCompleteRegistration({
      content_name: 'Test Account Registration',
      status: true,
      method: 'google'
    });
  };

  const testLead = () => {
    fpixel.trackLead({
      content_name: 'Newsletter Subscription',
      content_category: 'engagement',
      value: 0,
      currency: 'EUR'
    });
  };

  const testStartTrial = () => {
    fpixel.trackStartTrial({
      content_name: 'Free Daily Transformations Trial',
      value: 5,
      currency: 'EUR',
      predicted_ltv: 25
    });
  };

  const testSubscribe = () => {
    fpixel.trackSubscribe({
      content_name: 'Premium Subscription',
      value: 9.99,
      currency: 'EUR',
      predicted_ltv: 120
    });
  };

  return (
    <>
      <Head>
        <title>Teste Facebook Pixel - PicTuz</title>
        <meta name="description" content="Página para testar eventos do Facebook Pixel" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🧪 Teste Facebook Pixel
            </h1>
            <p className="text-lg text-gray-600">
              Teste todos os eventos implementados do Facebook Pixel
            </p>
            <div className="mt-4 p-4 bg-green-100 rounded-lg">
              <p className="text-green-800 font-medium">
                ✅ Consentimento de cookies concedido automaticamente para testes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Eventos Base */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">📄 Eventos Base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={testPageView} className="w-full">
                  PageView
                </Button>
              </CardContent>
            </Card>

            {/* Eventos de Produto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">🛍️ Eventos de Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={testViewContent} className="w-full">
                  ViewContent
                </Button>
                <Button onClick={testSearch} className="w-full">
                  Search
                </Button>
                <Button onClick={testAddToWishlist} className="w-full">
                  AddToWishlist
                </Button>
              </CardContent>
            </Card>

            {/* Eventos de Checkout */}
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">💳 Eventos de Checkout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={testInitiateCheckout} className="w-full">
                  InitiateCheckout
                </Button>
                <Button onClick={testAddPaymentInfo} className="w-full">
                  AddPaymentInfo
                </Button>
                <Button onClick={testPurchase} className="w-full bg-green-600 hover:bg-green-700">
                  Purchase ⭐
                </Button>
              </CardContent>
            </Card>

            {/* Eventos de Registo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">👤 Eventos de Registo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={testCompleteRegistration} className="w-full">
                  CompleteRegistration
                </Button>
                <Button onClick={testLead} className="w-full">
                  Lead
                </Button>
              </CardContent>
            </Card>

            {/* Eventos de Subscrição */}
            <Card>
              <CardHeader>
                <CardTitle className="text-pink-600">⭐ Eventos de Subscrição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={testStartTrial} className="w-full">
                  StartTrial
                </Button>
                <Button onClick={testSubscribe} className="w-full">
                  Subscribe
                </Button>
              </CardContent>
            </Card>

            {/* Informações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-600">ℹ️ Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p>• Abra o Developer Tools (F12)</p>
                  <p>• Vá para Console</p>
                  <p>• Clique nos botões para ver logs</p>
                  <p>• Verifique se eventos são enviados</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seção de Status */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">📊 Status do Pixel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Pixel ID</h3>
                    <p className="text-sm text-blue-600">{process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || 'Não configurado'}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800">Consentimento</h3>
                    <p className="text-sm text-green-600">✅ Concedido</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-800">Eventos Disponíveis</h3>
                    <p className="text-sm text-purple-600">11 Eventos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botão de Volta */}
          <div className="mt-8 text-center">
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="px-8 py-3"
            >
              ← Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestePage;