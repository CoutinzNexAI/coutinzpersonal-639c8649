import React, { useState, useEffect } from 'react';

// Componente para rotação de mensagens
const MessageRotator: React.FC = () => {
  const messages = [
    { emoji: '🚚', text: 'ENTREGA GRÁTIS' },
    { emoji: '⚡', text: 'Produção e entrega em 3-5 dias úteis' },
    { emoji: '💎', text: 'Produtos de alta qualidade' }
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
      <div className="flex items-center space-x-3 text-sm font-bold">
        <span className="text-xl">
          {currentMessage.emoji}
        </span>
        
        <span className="text-white tracking-wide">
          {currentMessage.text}
        </span>
      </div>
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