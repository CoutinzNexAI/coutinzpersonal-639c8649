import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import GenericProductPage from '@/components/templates/GenericProductPage';
import { mugConfig } from '@/config/products/mug.config';

interface MugDetailPageProps {
  product: PrintifyProductMapping;
}

const MugDetailPage: React.FC<MugDetailPageProps> = ({ product }) => {
  return <GenericProductPage product={product} config={mugConfig} />;
};

// Geração estática dos paths para produtos de caneca
export const getStaticPaths: GetStaticPaths = async () => {
  const mugProducts = getPrintifyProductsByCategory('mug');
  const paths = Object.keys(mugProducts).map((productId) => ({
    params: { productId }
  }));

  return {
    paths,
    fallback: false
  };
};

// Geração estática das props
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productId = params?.productId as string;
  const product = getPrintifyProduct(productId);

  if (!product || product.category !== 'mug') {
    return {
      notFound: true
    };
  }

  return {
    props: { product }
  };
};

export default MugDetailPage; 