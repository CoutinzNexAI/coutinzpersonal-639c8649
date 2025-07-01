import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { CartItem } from '@/lib/cart/cartTypes';
import { Trash2, Minus, Plus } from 'lucide-react';

interface MobileProductCardProps {
  item: CartItem;
  onRemove: (itemId: string) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  showQuantityControls?: boolean;
  className?: string;
}

export const MobileProductCard: React.FC<MobileProductCardProps> = ({ 
  item, 
  onRemove, 
  onUpdateQuantity,
  showQuantityControls = false,
  className = '' 
}) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemove(item.id);
    } else {
      onUpdateQuantity?.(item.id, newQuantity);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-ghibli-moss/10
        ${className}
      `}
    >
      <div className="flex gap-3">
        {/* Product Image */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden shadow-md flex-shrink-0">
          {item.userImageUrl ? (
            <Image
              src={item.userImageUrl}
              alt={item.productName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-ghibli-cream/50 flex items-center justify-center">
              <span className="text-2xl opacity-40">📷</span>
            </div>
          )}
          
          {/* Product category badge */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-ghibli-moss rounded-full flex items-center justify-center">
            <span className="text-xs text-white">
              {item.productCategory === 'canvas' ? '🖼️' :
               item.productCategory === 'mug' ? '☕' :
               item.productCategory === 'poster' ? '📄' :
               item.productCategory === 'tecnologia' ? '📱' :
               item.productCategory === 'escritorio' ? '📝' :
               item.productCategory === 'bag' ? '🛍️' : '🎨'}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-bold text-ghibli-wood text-sm leading-tight mb-1 truncate">
              {item.productName}
            </h4>
            
            {/* Remove button */}
            <button
              onClick={() => onRemove(item.id)}
              className="ml-2 p-1 text-ghibli-poppy hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              aria-label="Remover produto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Product Details */}
          <div className="space-y-1 mb-2">
            {item.customizations?.variant && (
              <p className="text-xs text-ghibli-earth">
                <span className="font-medium">Variante:</span> {item.customizations.variant}
              </p>
            )}
            {item.customizations?.size && (
              <p className="text-xs text-ghibli-earth">
                <span className="font-medium">Tamanho:</span> {item.customizations.size}
              </p>
            )}
            {item.customizations?.color && (
              <p className="text-xs text-ghibli-earth">
                <span className="font-medium">Cor:</span> {item.customizations.color}
              </p>
            )}
            {item.customizations?.phoneModel && (
              <p className="text-xs text-ghibli-earth">
                <span className="font-medium">Modelo:</span> {item.customizations.phoneModel}
              </p>
            )}
            {item.customizations?.paperType && (
              <p className="text-xs text-ghibli-earth">
                <span className="font-medium">Papel:</span> {item.customizations.paperType}
              </p>
            )}
            {item.customizations?.frameColor && (
              <p className="text-xs text-ghibli-earth">
                <span className="font-medium">Moldura:</span> {item.customizations.frameColor}
              </p>
            )}
          </div>

          {/* Quantity and Price Row */}
          <div className="flex justify-between items-center">
            {/* Quantity Controls */}
            {showQuantityControls && onUpdateQuantity ? (
              <div className="flex items-center gap-2 bg-ghibli-cream/50 rounded-lg p-1">
                <button
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ghibli-moss/10 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                
                <span className="min-w-[1.5rem] text-center font-bold text-sm text-ghibli-earth">
                  {item.quantity}
                </span>
                
                <button
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center hover:bg-ghibli-moss/10 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="text-xs text-ghibli-earth">
                <span className="font-medium">Qty:</span> {item.quantity}
              </span>
            )}

            {/* Price */}
            <div className="text-right">
              <div className="font-bold text-ghibli-moss">
                €{(item.price * item.quantity).toFixed(2)}
              </div>
              {item.quantity > 1 && (
                <div className="text-xs text-ghibli-earth">
                  €{item.price.toFixed(2)} cada
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customization Preview Bar */}
      {(item.customizations?.scale !== undefined || 
        item.customizations?.x !== undefined || 
        item.customizations?.y !== undefined) && (
        <div className="mt-3 pt-3 border-t border-ghibli-sand/30">
          <div className="flex items-center justify-between text-xs text-ghibli-earth">
            <span className="font-medium">Personalizações:</span>
            <div className="flex gap-2">
              {item.customizations.scale !== undefined && (
                <span className="bg-ghibli-sky/20 px-2 py-1 rounded">
                  Escala: {(item.customizations.scale * 100).toFixed(0)}%
                </span>
              )}
              {item.customizations.angle !== undefined && item.customizations.angle !== 0 && (
                <span className="bg-ghibli-sunflower/20 px-2 py-1 rounded">
                  Rotação: {item.customizations.angle}°
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}; 