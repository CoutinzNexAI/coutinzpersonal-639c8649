import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import GenericProductPage from '@/components/templates/GenericProductPage';
import posterConfig from '@/config/products/poster.config';

interface PosterDetailPageProps {
  product: PrintifyProductMapping;
}

const PosterDetailPage: React.FC<PosterDetailPageProps> = ({ product }) => {
  return (
    <GenericProductPage 
      product={product} 
      config={posterConfig}
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posterProducts = getPrintifyProductsByCategory('poster');
  const productIds = Object.keys(posterProducts);
  
  const paths = productIds.map((productId) => ({
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
  
  if (!product || product.category !== 'poster') {
    return {
      notFound: true
    };
  }

  return {
    props: {
      product
    }
  };
};

export default PosterDetailPage; 