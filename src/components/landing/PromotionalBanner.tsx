import React from 'react';
import { motion } from 'framer-motion';

const PromotionalBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-ghibli-moss via-ghibli-moss-light to-ghibli-moss text-white py-2 relative overflow-hidden z-50">
      {/* Animação de fundo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>
      
      <div className="container mx-auto px-4">
        <motion.div 
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Texto principal com animação de scroll */}
          <div className="relative overflow-hidden h-6 flex items-center">
            <motion.div
              className="flex items-center space-x-8 whitespace-nowrap"
              animate={{ x: [0, -100] }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {/* Primeira mensagem */}
              <div className="flex items-center space-x-2 text-sm font-semibold">
                <span className="text-lg">🚚</span>
                <span>ENTREGAS GRÁTIS - TEMPO LIMITADO!</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs">NOVO</span>
              </div>
              
              {/* Segunda mensagem */}
              <div className="flex items-center space-x-2 text-sm font-semibold">
                <span className="text-lg">🎁</span>
                <span>COMPRA 2+ PRODUTOS = 15% DESCONTO</span>
                <span className="bg-yellow-400 text-ghibli-wood px-2 py-1 rounded-full text-xs font-bold">POUPA!</span>
              </div>
              
              {/* Terceira mensagem */}
              <div className="flex items-center space-x-2 text-sm font-semibold">
                <span className="text-lg">⚡</span>
                <span>ENTREGA EM 3-5 DIAS ÚTEIS</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs">RÁPIDO</span>
              </div>
              
              {/* Repetir para continuidade */}
              <div className="flex items-center space-x-2 text-sm font-semibold">
                <span className="text-lg">🚚</span>
                <span>ENTREGAS GRÁTIS - TEMPO LIMITADO!</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs">NOVO</span>
              </div>
            </motion.div>
          </div>
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