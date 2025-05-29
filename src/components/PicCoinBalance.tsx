import { usePicCoins } from '@/hooks/usePicCoins';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export const PicCoinBalance = () => {
  const { balance, loading } = usePicCoins();
  const { userInfo } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!userInfo || loading) return null;

  // Dynamic padding based on number of digits - more compact for mobile
  const digits = balance.toString().length;
  const paddingClass = digits <= 2 ? 'px-2 md:px-3' : digits <= 3 ? 'px-3 md:px-4' : 'px-4 md:px-5';

  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link 
        href="/pricing" 
        className={`
          flex items-center gap-1.5 md:gap-2 transition-all duration-300 text-sm font-medium cursor-pointer
          ${paddingClass} py-2 rounded-xl
          bg-gradient-to-r from-amber-400/20 to-yellow-500/20 
          hover:from-amber-400/30 hover:to-yellow-500/30
          border border-amber-400/30 hover:border-amber-400/50
          text-amber-700 hover:text-amber-800
          backdrop-blur-sm shadow-lg hover:shadow-xl
          relative
          before:absolute before:inset-0 before:rounded-xl 
          before:bg-gradient-to-r before:from-amber-400/10 before:to-yellow-500/10 
          before:opacity-0 before:transition-opacity before:duration-300
          hover:before:opacity-100
        `}
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-amber-500"
        >
          ⭐
        </motion.span>
        <span className="relative z-10 whitespace-nowrap">
          {/* Mobile: only number, Desktop: full text */}
          <span className="md:hidden">{balance}</span>
          <span className="hidden md:inline">{balance} PicCoins</span>
        </span>
      </Link>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
          >
            <div className="bg-ghibli-wood text-ghibli-cream px-3 py-2 rounded-lg text-xs font-medium shadow-lg whitespace-nowrap">
              Ganha mais explorando a comunidade! ✨
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-ghibli-wood"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}; 