import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Componente para rotação de mensagens
const MessageRotator: React.FC = () => {
  const messages = [
    { emoji: '🚚', text: 'ENTREGAS GRÁTIS', badge: 'NOVO' },
    { emoji: '⚡', text: 'ENTREGA numa semana', badge: 'RÁPIDO' },
    { emoji: '💎', text: 'QUALIDADE PREMIUM', badge: 'TOP' }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000); // 5 segundos

    return () => clearInterval(interval);
  }, [messages.length]);

  const currentMessage = messages[currentIndex];

  return (
    <div className="relative h-6 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="flex items-center space-x-3 text-sm font-bold"
        >
          <motion.span 
            className="text-xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {currentMessage.emoji}
          </motion.span>
          
          <span className="text-white tracking-wide">
            {currentMessage.text}
          </span>
          
          <motion.span 
            className="bg-yellow-400 text-ghibli-wood px-3 py-1 rounded-full text-xs font-black shadow-md"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            {currentMessage.badge}
          </motion.span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const PromotionalBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-ghibli-moss via-ghibli-moss-light to-ghibli-moss text-white py-0.5 relative overflow-hidden z-50">
      {/* Animação de fundo com partículas */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>
      <div className="absolute top-1 left-10 w-1 h-1 bg-yellow-400 rounded-full animate-ping"></div>
      <div className="absolute top-2 right-20 w-1 h-1 bg-white/60 rounded-full animate-bounce"></div>
      
      <div className="container mx-auto px-4">
        <motion.div 
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Texto rotativo - máximo 5 palavras */}
          <MessageRotator />
        </motion.div>
      </div>
      
      {/* Indicador de urgência */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <motion.div
          className="w-2 h-2 bg-yellow-400 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </div>
  );
};

export default PromotionalBanner; 