import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface CartButtonProps {
  cartCount: number;
  onClick: () => void;
  className?: string;
}

export const CartButton: React.FC<CartButtonProps> = ({
  cartCount,
  onClick,
  className = ''
}) => {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className={`relative p-3 rounded-xl hover:bg-ghibli-moss/10 transition-all duration-300 group ${className}`}
    >
      {/* Ícone do carrinho */}
      <ShoppingCart className="w-6 h-6 text-ghibli-wood group-hover:text-ghibli-moss transition-colors" />
      
      {/* Badge com número de items */}
      {cartCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-ghibli-poppy text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg"
        >
          {cartCount > 99 ? '99+' : cartCount}
        </motion.div>
      )}
    </Button>
  );
}; 