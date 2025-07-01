import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Componente para rotação de mensagens
const MessageRotator: React.FC = () => {
  const messages = [
    { emoji: '🚚', text: 'ENTREGA GRÁTIS' },
    { emoji: '⚡', text: 'Produção e entrega em 3-5 dias úteis' },
    { emoji: '💎', text: 'Produtos de alta qualidade' },
    { emoji: '💰', text: 'Poupa +10% comprando várias unidades!' } // ✅ NOVA MENSAGEM
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000); // 4 segundos para dar tempo de ler

    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages[currentIndex];

  return (
    <div className="relative h-6 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex} // ✅ Key para re-trigger animation
          className="flex items-center space-x-3 text-sm font-bold absolute"
          
          // ✅ ANIMAÇÃO: Entra pela direita
          initial={{ 
            x: 100, 
            opacity: 0 
          }}
          
          // ✅ ESTADO NORMAL: Centrado
          animate={{ 
            x: 0, 
            opacity: 1 
          }}
          
          // ✅ ANIMAÇÃO: Sai pela esquerda
          exit={{ 
            x: -100, 
            opacity: 0 
          }}
          
          transition={{
            duration: 0.5,
            ease: "easeInOut"
          }}
        >
          <span className="text-xl">
            {currentMessage.emoji}
          </span>
          
          <span className="text-white tracking-wide">
            {currentMessage.text}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const PromotionalBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-ghibli-moss via-ghibli-moss-light to-ghibli-moss text-white py-0.5 relative overflow-hidden z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center">
          <MessageRotator />
        </div>
      </div>
    </div>
  );
};

export default PromotionalBanner; 