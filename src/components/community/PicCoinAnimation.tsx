import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CurrencyDollarIcon } from '@heroicons/react/24/solid';

// =====================================================
// PICCOIN ANIMATION
// Animação épica quando o utilizador ganha PicCoins
// =====================================================

interface PicCoinAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
  message?: string;
}

const PicCoinAnimation: React.FC<PicCoinAnimationProps> = ({
  isVisible,
  onComplete,
  message = 'Ganhaste 1 PicCoin! 🪙'
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            setTimeout(onComplete, 2000); // Keep visible for 2s after animation
          }}
        >
          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Coin animation container */}
          <div className="relative">
            {/* Main coin */}
            <motion.div
              className="relative w-24 h-24 mx-auto"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [0, 360, 720]
              }}
              transition={{ 
                duration: 1.5,
                ease: "easeOut",
                times: [0, 0.6, 1]
              }}
            >
              {/* Coin glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(245, 158, 11, 0.5)',
                    '0 0 40px rgba(245, 158, 11, 0.8)',
                    '0 0 20px rgba(245, 158, 11, 0.5)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Coin face */}
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-2xl border-4 border-yellow-300">
                <CurrencyDollarIcon className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            {/* Sparkles around coin */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transformOrigin: '0 0'
                }}
                initial={{ 
                  scale: 0,
                  x: 0,
                  y: 0,
                  opacity: 0
                }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 8) * 80,
                  y: Math.sin((i * Math.PI * 2) / 8) * 80,
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.5 + i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* Message */}
            <motion.div
              className="text-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <motion.div
                className="inline-block px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 text-white rounded-full shadow-2xl font-bold text-lg"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {message}
              </motion.div>
            </motion.div>

            {/* Success particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: `hsl(${45 + Math.random() * 30}, 90%, 60%)`,
                  top: '50%',
                  left: '50%'
                }}
                initial={{ 
                  scale: 0,
                  x: 0,
                  y: 0,
                  opacity: 1
                }}
                animate={{
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 2,
                  delay: 1 + Math.random() * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PicCoinAnimation; 