import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const PaymentFailedPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghibli-cream via-ghibli-paper to-ghibli-sky relative overflow-hidden">
      <div className="absolute top-20 left-10 text-3xl animate-leaf-float opacity-20">🍃</div>
      <div className="absolute bottom-28 right-16 text-2xl animate-leaf-float opacity-20">🍂</div>
      <div className="absolute top-40 right-28 text-xl animate-star-twinkle opacity-30">✨</div>
      
      <Head>
        <title>Pagamento Não Processado - PicTuz</title>
        <meta name="description" content="Ocorreu um problema com o seu pagamento" />
      </Head>
      
      <Header />
      
      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-red-200"
          >
            <div className="text-6xl mb-6">😞</div>
            
            <h1 className="text-3xl font-ghibli text-amber-600 mb-4">
              Checkout Cancelado
            </h1>
            
            <p className="text-ghibli-earth text-lg mb-6">
              O processo de pagamento foi cancelado. Os seus produtos continuam guardados no carrinho para quando estiver pronto.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center text-blue-600 mb-2">
                <span className="mr-2">💡</span>
                <span className="font-medium">Isto é normal!</span>
              </div>
              <ul className="text-sm text-blue-700 text-left space-y-1">
                <li>• Usou o botão "voltar" do navegador</li>
                <li>• Decidiu continuar a comprar mais tarde</li>
                <li>• Quer rever os detalhes do pedido</li>
                <li>• Mudou de ideias temporariamente</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <div className="flex items-center justify-center text-amber-600 mb-2">
                <span className="mr-2">🛒</span>
                <span className="font-medium">Os seus produtos estão seguros</span>
              </div>
              <p className="text-sm text-amber-700">
                Nada se perdeu! Pode continuar a comprar ou finalizar a compra quando quiser. 
                O seu carrinho mantém-se igual.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button 
                onClick={() => router.back()}
                className="bg-ghibli-moss hover:bg-ghibli-moss-light text-white px-8 py-3 rounded-xl"
              >
                <span className="mr-2">🔄</span>
                Tentar Novamente
                </Button>
              
              <Link href="/shop">
                <Button variant="outline" className="border-ghibli-moss text-ghibli-moss hover:bg-ghibli-moss/10 px-8 py-3 rounded-xl">
                  <span className="mr-2">🛍️</span>
                  Continuar a Comprar
                </Button>
              </Link>
            </div>

            <div className="border-t border-ghibli-sand/30 pt-6">
              <div className="text-sm text-ghibli-earth mb-3">
                <p className="font-medium">Precisa de ajuda imediata?</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <a 
                  href="mailto:suporte@pictuz.com" 
                  className="text-ghibli-moss hover:underline text-sm flex items-center"
                >
                  <span className="mr-1">📧</span>
                  suporte@pictuz.com
                </a>
                <span className="hidden sm:inline text-ghibli-earth">|</span>
                <a 
                  href="https://wa.me/351123456789" 
                  className="text-ghibli-moss hover:underline text-sm flex items-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="mr-1">📱</span>
                  WhatsApp Suporte
                </a>
              </div>
              <p className="text-xs text-ghibli-earth/70 mt-3">
                Respondemos normalmente em 2-4 horas
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PaymentFailedPage; 