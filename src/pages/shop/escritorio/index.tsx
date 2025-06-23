import React from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Notebook, Mouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface EscritorioPageProps {
  notebookProducts: Record<string, PrintifyProductMapping>;
  mousepadProducts: Record<string, PrintifyProductMapping>;
}

const EscritorioPage: React.FC<EscritorioPageProps> = ({ notebookProducts, mousepadProducts }) => {
  const allProducts = [...Object.values(notebookProducts), ...Object.values(mousepadProducts)];

  return (
    <>
      <Head>
        <title>Produtos de Escritório - Loja PicTuz</title>
        <meta name="description" content="Personalize cadernos e mousepads com as suas criações AI. Produtos de escritório únicos e de alta qualidade." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Header com Breadcrumb */}
          <div className="mb-8">
            <Link href="/shop" className="inline-flex items-center text-ghibli-earth hover:text-ghibli-moss transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar à Loja
            </Link>
            
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-ghibli-earth mb-4">
                Produtos de Escritório
              </h1>
              <p className="text-lg text-ghibli-earth/80 max-w-2xl mx-auto">
                Transforme o seu espaço de trabalho com produtos personalizados únicos. 
                Cadernos e mousepads com as suas criações AI.
              </p>
            </div>
          </div>

          {/* Categorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Cadernos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-ghibli-sand/20 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Notebook className="w-8 h-8 text-ghibli-moss" />
                  </div>
                  <h3 className="text-xl font-bold text-ghibli-earth mb-2">Cadernos</h3>
                  <p className="text-ghibli-earth/70 text-sm mb-4">
                    Páginas lisas e capa durável para as suas ideias criativas
                  </p>
                  <p className="text-ghibli-moss font-semibold">
                    {Object.keys(notebookProducts).length} produto{Object.keys(notebookProducts).length !== 1 ? 's' : ''} disponível{Object.keys(notebookProducts).length !== 1 ? 'is' : ''}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Mousepads */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-ghibli-sand/20 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mouse className="w-8 h-8 text-ghibli-moss" />
                  </div>
                  <h3 className="text-xl font-bold text-ghibli-earth mb-2">Mousepads</h3>
                  <p className="text-ghibli-earth/70 text-sm mb-4">
                    Base antiderrapante e superfície lisa para máxima precisão
                  </p>
                  <p className="text-ghibli-moss font-semibold">
                    {Object.keys(mousepadProducts).length} produto{Object.keys(mousepadProducts).length !== 1 ? 's' : ''} disponível{Object.keys(mousepadProducts).length !== 1 ? 'is' : ''}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Grid de Produtos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={`/shop/escritorio/${product.id}`}>
                  <Card className="group bg-white/80 backdrop-blur-sm border-ghibli-sand/20 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-br from-ghibli-cream to-ghibli-sand/50">
                      {product.mockupInitialPath && (
                        <img
                          src={product.mockupInitialPath}
                          alt={product.name}
                          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute top-3 right-3 bg-ghibli-moss text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {product.category === 'stationery' ? '📝' : '🖱️'}
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-ghibli-earth mb-2 group-hover:text-ghibli-moss transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-ghibli-earth/70 mb-3 line-clamp-2">
                        {product.category === 'stationery' ? 'Caderno' : 'Mousepad'} personalizado com a sua arte AI de alta qualidade
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-ghibli-moss">
                          €{(product.basePrice || product.price || 0).toFixed(2)}
                        </span>
                        <Button 
                          size="sm" 
                          className="bg-ghibli-moss hover:bg-ghibli-moss/90 text-white"
                        >
                          Personalizar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* CTA Final */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-12"
          >
            <Card className="bg-gradient-to-br from-ghibli-moss/10 to-ghibli-moss-light/10 border-ghibli-moss/20 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-ghibli-earth mb-4">
                  Crie um Ambiente de Trabalho Único
                </h3>
                <p className="text-ghibli-earth/80 mb-6">
                  Transforme as suas ideias em produtos físicos que inspiram criatividade e produtividade no seu dia a dia.
                </p>
                <Link href="/studio">
                  <Button className="bg-ghibli-moss hover:bg-ghibli-moss/90 text-white px-8 py-3">
                    Começar a Criar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const notebookProducts = getPrintifyProductsByCategory('stationery');
  const mousepadProducts = getPrintifyProductsByCategory('office');

  return {
    props: {
      notebookProducts,
      mousepadProducts
    }
  };
};

export default EscritorioPage;