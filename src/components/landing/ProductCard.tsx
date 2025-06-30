import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price: number) => `€${price.toFixed(2)}`;

  return (
    <motion.div
      className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-ghibli-sand/20"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      
      {/* Product Badge */}
      {product.badge && (
        <div className="absolute top-4 left-4 z-10">
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
            product.badge === 'Mais Vendido' 
              ? 'bg-ghibli-poppy text-white'
              : product.badge === 'Novo'
              ? 'bg-ghibli-moss text-white'
              : 'bg-yellow-400 text-ghibli-wood'
          }`}>
            {product.badge}
          </span>
        </div>
      )}

      {/* Discount Badge */}
      {product.discount > 0 && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-red-500 text-white px-2 py-1 text-xs font-bold rounded-full">
            -{product.discount}%
          </span>
        </div>
      )}

      {/* Like Button */}
      <button
        onClick={() => setIsLiked(!isLiked)}
        className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all duration-300 group-hover:scale-110"
        style={{ marginTop: product.discount > 0 ? '2rem' : '0' }}
      >
        <Heart 
          className={`w-4 h-4 transition-colors duration-300 ${
            isLiked ? 'text-ghibli-poppy fill-current' : 'text-ghibli-earth'
          }`} 
        />
      </button>

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-ghibli-paper">
        {!imageError ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          // Placeholder quando imagem falha
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ghibli-sand to-ghibli-paper">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {product.category === 'Canecas' && '☕'}
                {product.category === 'Canvas' && '🖼️'}
                {product.category === 'Tecnologia' && '📱'}
                {product.category === 'Posters' && '🎨'}
              </div>
              <div className="text-ghibli-earth font-medium">{product.category}</div>
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex space-x-2">
            <Link href={product.href}>
              <Button
                size="sm"
                className="bg-white/90 text-ghibli-wood hover:bg-white shadow-lg backdrop-blur-sm"
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver
              </Button>
            </Link>
            <Button
              size="sm"
              className="bg-ghibli-moss/90 text-white hover:bg-ghibli-moss shadow-lg backdrop-blur-sm"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Comprar
            </Button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        {/* Category */}
        <div className="text-sm text-ghibli-moss font-medium mb-2">
          {product.category}
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-ghibli-wood text-lg mb-3 leading-tight group-hover:text-ghibli-moss transition-colors duration-300">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="flex items-center mr-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-ghibli-earth">
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-ghibli-moss">
              {formatPrice(product.salePrice)}
            </span>
            {product.originalPrice > product.salePrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          {/* Savings */}
          {product.originalPrice > product.salePrice && (
            <div className="text-sm text-green-600 font-medium">
              Poupa {formatPrice(product.originalPrice - product.salePrice)}
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <Link href={product.href} className="block">
          <Button 
            className="w-full bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light hover:from-ghibli-moss-light hover:to-ghibli-moss text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Personalizar Agora
          </Button>
        </Link>
      </div>

      {/* Subtle hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-ghibli-moss/5 to-ghibli-sky/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </motion.div>
  );
};

export default ProductCard; 