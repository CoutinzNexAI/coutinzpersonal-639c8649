import React from 'react';
import { GetStaticProps } from 'next';
import { getPrintifyProduct, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import GenericProductPage from '@/components/templates/GenericProductPage';
import { pelucheConfig } from '@/config/products/peluche.config';

interface PlushToyTShirtPageProps {
  product: PrintifyProductMapping;
}

const PlushToyTShirtPage: React.FC<PlushToyTShirtPageProps> = ({ product }) => {
  return <GenericProductPage product={product} config={pelucheConfig} />;
};

// Geração estática das props
export const getStaticProps: GetStaticProps = async () => {
  const product = getPrintifyProduct('plush_toy_tshirt');

  if (!product) {
    return {
      notFound: true
    };
  }

  return {
    props: { product }
  };
};

export default PlushToyTShirtPage; 