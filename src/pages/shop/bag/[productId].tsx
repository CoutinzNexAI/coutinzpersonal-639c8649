import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import GenericProductPage from '@/components/templates/GenericProductPage';
import { bagConfig } from '@/config/products/bag.config';

interface BagDetailPageProps {
  product: PrintifyProductMapping;
}

const BagDetailPage: React.FC<BagDetailPageProps> = ({ product }) => {
  return (
    <GenericProductPage 
      product={product} 
      config={bagConfig}
    />
  );
};

export default BagDetailPage;

// ✅ STATIC PATHS: Gerar páginas para todos os sacos
export const getStaticPaths: GetStaticPaths = async () => {
  const bagProducts = getPrintifyProductsByCategory('bags');
  const paths = Object.keys(bagProducts).map((productId) => ({
    params: { productId }
  }));

  return {
    paths,
    fallback: false
  };
};

// ✅ STATIC PROPS: Carregar dados do produto específico
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productId = params?.productId as string;
  const product = getPrintifyProduct(productId);

  if (!product || product.category !== 'bags') {
    return { notFound: true };
  }

  return {
    props: { product },
  };
};