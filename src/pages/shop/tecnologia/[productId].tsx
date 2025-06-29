import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import GenericProductPage from '@/components/templates/GenericProductPage';
import phoneCaseConfig from '@/config/products/phoneCase.config';

interface PhoneCaseDetailPageProps {
  product: PrintifyProductMapping;
}

const PhoneCaseDetailPage: React.FC<PhoneCaseDetailPageProps> = ({ product }) => {
  return (
    <GenericProductPage 
      product={product} 
      config={phoneCaseConfig}
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const tecnologiaProducts = getPrintifyProductsByCategory('tecnologia');
  const productIds = Object.keys(tecnologiaProducts);
  
  const paths = productIds.map((productId) => ({
    params: { productId },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productId = params?.productId as string;
  const product = getPrintifyProduct(productId);

  if (!product || product.category !== 'tecnologia') {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      product,
    },
  };
};

export default PhoneCaseDetailPage; 