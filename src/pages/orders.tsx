import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const OrdersPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Os Seus Pedidos - PicTuz</title>
        <meta name="description" content="Acompanhe o estado dos seus pedidos personalizados" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Ícone de sucesso */}
            <motion.div
              className="w-24 h-24 mx-auto mb-8 bg-green-100 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-4xl">✅</span>
            </motion.div>

            {/* Título */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-ghibli font-bold text-ghibli-wood mb-6">
              🎉 Pedido Realizado com Sucesso!
            </h1>

            <p className="text-lg text-ghibli-earth mb-8 leading-relaxed">
              O seu pedido foi enviado para produção na nossa gráfica parceira. 
              Receberá um email de confirmação com todos os detalhes e o número de tracking assim que o produto for enviado.
            </p>

            {/* Informações do processo */}
            <div className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-2xl p-6 mb-8 text-left">
              <h3 className="text-xl font-semibold text-ghibli-wood mb-4 text-center">
                📋 Próximos Passos
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-ghibli-moss text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-ghibli-wood">Preparação da Arte</h4>
                    <p className="text-sm text-ghibli-earth">Os nossos técnicos verificam a qualidade e preparam os ficheiros para impressão (1-2 dias úteis)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-ghibli-sand text-ghibli-wood rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-ghibli-wood">Impressão e Produção</h4>
                    <p className="text-sm text-ghibli-earth">O produto é impresso com materiais premium na nossa gráfica europeia (2-3 dias úteis)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-ghibli-sand text-ghibli-wood rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-ghibli-wood">Embalagem e Envio</h4>
                    <p className="text-sm text-ghibli-earth">Controlo de qualidade, embalagem cuidadosa e envio com tracking (1 dia útil)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-ghibli-moss text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-medium text-ghibli-wood">Entrega na Sua Casa</h4>
                    <p className="text-sm text-ghibli-earth">Recebe o seu produto personalizado em casa (2-7 dias úteis após envio)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Garantias */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                🛡️ As Nossas Garantias
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-blue-800">
                  <span>✅</span>
                  <span>Qualidade premium garantida</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <span>🔄</span>
                  <span>Devolução grátis em 30 dias</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <span>📦</span>
                  <span>Embalagem protetora</span>
                </div>
                <div className="flex items-center gap-2 text-blue-800">
                  <span>🎨</span>
                  <span>Cores fiéis à sua arte AI</span>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop">
                <Button className="bg-ghibli-moss hover:bg-ghibli-moss/90 text-white px-8 py-3">
                  🛍️ Continuar Comprando
                </Button>
              </Link>
              
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="border-ghibli-sand text-ghibli-earth hover:bg-ghibli-sand/30 px-8 py-3"
                >
                  🎨 Criar Mais Arte AI
                </Button>
              </Link>
            </div>

            {/* Suporte */}
            <div className="mt-12 p-6 bg-white/60 backdrop-blur-sm border border-ghibli-sand/20 rounded-xl">
              <h4 className="font-semibold text-ghibli-wood mb-2">
                💬 Precisa de Ajuda?
              </h4>
              <p className="text-sm text-ghibli-earth mb-3">
                A nossa equipa está disponível para esclarecer qualquer dúvida sobre o seu pedido.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
                <span className="text-ghibli-earth">📧 suporte@pictuz.com</span>
                <span className="hidden sm:inline text-ghibli-earth">•</span>
                <span className="text-ghibli-earth">📱 +351 123 456 789</span>
              </div>
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default OrdersPage; 