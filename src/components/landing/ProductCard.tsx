import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  category: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  href: string;
  badge?: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price: number) => `€${price.toFixed(2)}`;

  return (
    <Link href={product.href} className="block">
      <motion.div
        className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-ghibli-sand/20"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-ghibli-paper">
          {!imageError ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            // Placeholder quando imagem falha
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ghibli-sand to-ghibli-paper">
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {product.category === 'Canecas' && '☕'}
                  {product.category === 'Canvas' && '🖼️'}
                  {product.category === 'Tecnologia' && '📱'}
                  {product.category === 'Posters' && '🎨'}
                </div>
                <div className="text-ghibli-earth font-medium text-sm">{product.category}</div>
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-ghibli-wood text-base mb-2 leading-tight group-hover:text-ghibli-moss transition-colors duration-300">
            {product.name}
          </h3>

          {/* Price */}
          <div className="text-xl font-bold text-ghibli-moss">
            {formatPrice(product.salePrice)}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard; 