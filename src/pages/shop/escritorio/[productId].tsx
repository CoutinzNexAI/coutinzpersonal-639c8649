import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import GenericProductPage from '@/components/templates/GenericProductPage';
import { notebookConfig } from '@/config/products/notebook.config';
import { mousepadConfig } from '@/config/products/mousepad.config';

interface EscritorioPageProps {
  product: PrintifyProductMapping;
}

const EscritorioDetailPage: React.FC<EscritorioPageProps> = ({ product }) => {
  // LÓGICA DINÂMICA DE CONFIGURAÇÃO
  let config;
  if (product.id === 'spiral_journal') {
    config = notebookConfig;
  } else if (product.id === 'mouse_pad') {
    config = mousepadConfig;
  } else {
    // Fallback para o caso de adicionares mais produtos de escritório
    config = notebookConfig; 
  }

  return <GenericProductPage product={product} config={config} />;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const escritorioProducts = getPrintifyProductsByCategory('escritorio');
  const paths = Object.keys(escritorioProducts).map((productId) => ({
    params: { productId }
  }));

  return {
    paths,
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productId = params?.productId as string;
  const product = getPrintifyProduct(productId);

  if (!product || product.category !== 'escritorio') {
    return { notFound: true };
  }

  return {
    props: {
      product
    }
  };
};

export default EscritorioDetailPage;