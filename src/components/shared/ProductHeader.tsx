import React from 'react';
import Link from 'next/link';
import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface ProductHeaderProps {
  product: PrintifyProductMapping;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({ product }) => (
  <nav className="mb-8">
    <ol className="flex items-center space-x-2 text-sm text-ghibli-earth">
      <li><Link href="/shop" className="hover:text-ghibli-moss transition-colors">Loja</Link></li>
      <li className="text-ghibli-earth/50">/</li>
      <li><Link href={`/shop/${product.category}`} className="hover:text-ghibli-moss transition-colors capitalize">{product.category}</Link></li>
      <li className="text-ghibli-earth/50">/</li>
      <li className="text-ghibli-moss font-medium">{product.name}</li>
    </ol>
  </nav>
);

export default ProductHeader; 