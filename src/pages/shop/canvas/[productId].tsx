import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import GenericProductPage from '@/components/templates/GenericProductPage';
import { canvasConfig } from '@/config/products/canvas.config';

interface CanvasPageProps {
  product: PrintifyProductMapping;
}

const CanvasDetailPage: React.FC<CanvasPageProps> = ({ product }) => {
  return <GenericProductPage product={product} config={canvasConfig} />;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const canvasProducts = getPrintifyProductsByCategory('canvas');
  const paths = Object.keys(canvasProducts).map((productId) => ({
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
  
  if (!product || product.category !== 'canvas') {
    return { notFound: true };
  }

  return {
    props: {
      product
    }
  };
};

export default CanvasDetailPage; 