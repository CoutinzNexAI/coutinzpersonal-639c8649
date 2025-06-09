import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const CheckoutCancelledPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghibli-cream via-ghibli-paper to-ghibli-sky relative overflow-hidden">
      <div className="absolute top-20 left-10 text-3xl animate-leaf-float opacity-20">🍃</div>
      <div className="absolute bottom-28 right-16 text-2xl animate-leaf-float opacity-20">🍂</div>
      <div className="absolute top-40 right-28 text-xl animate-star-twinkle opacity-30">✨</div>
      
      <Head>
        <title>Checkout Cancelado - PicTuz</title>
        <meta name="description" content="O processo de pagamento foi cancelado" />
      </Head>
      
      <Header />
      
      <main className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-yellow-200"
          >
            <div className="text-6xl mb-6">😔</div>
            
            <h1 className="text-3xl font-ghibli text-yellow-600 mb-4">
              Checkout Cancelado
            </h1>
            
            <p className="text-ghibli-earth text-lg mb-8">
              O processo de pagamento foi cancelado. Os seus produtos continuam no carrinho e pode finalizar a compra quando quiser.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
              <div className="flex items-center justify-center text-yellow-600 mb-2">
                <span className="mr-2">💡</span>
                <span className="font-medium">Dica</span>
              </div>
              <p className="text-sm text-yellow-700">
                Os seus produtos personalizados ficam guardados no carrinho. 
                Pode voltar a qualquer altura para finalizar a compra.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/checkout">
                <Button className="bg-ghibli-moss hover:bg-ghibli-moss-light text-white px-8 py-3 rounded-xl">
                  <span className="mr-2">🛒</span>
                  Voltar ao Checkout
                </Button>
              </Link>
              
              <Link href="/shop">
                <Button variant="outline" className="border-ghibli-moss text-ghibli-moss hover:bg-ghibli-moss/10 px-8 py-3 rounded-xl">
                  <span className="mr-2">🛍️</span>
                  Continuar a Comprar
                </Button>
              </Link>
            </div>

            <div className="mt-8 text-sm text-ghibli-earth">
              <p>Precisa de ajuda?</p>
              <a href="mailto:suporte@pictuz.com" className="text-ghibli-moss hover:underline">
                Contacte o nosso suporte
              </a>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CheckoutCancelledPage; 