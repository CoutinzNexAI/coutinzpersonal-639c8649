import { usePicCoins } from '@/hooks/usePicCoins';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { trackEvent } from '@/lib/posthog';

export const PicCoinBalance = () => {
  const { balance, loading } = usePicCoins();
  const { userInfo, isLoading: authLoading } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);

  if (!userInfo || authLoading) return null;

  const digits = balance.toString().length;
  const paddingClass = digits <= 2 ? 'px-2 md:px-3' : digits <= 3 ? 'px-3 md:px-4' : 'px-4 md:px-5';

  const handleBalanceClick = () => {
    // 🔥 TRACKING: Balance clicked
    trackEvent('balance_click', {
      user_id: userInfo.id,
      current_balance: balance,
      click_source: 'header_balance_display'
    });
  };

  const handleTooltipShow = () => {
    // 🔥 TRACKING: Balance tooltip shown
    trackEvent('balance_tooltip_shown', {
      user_id: userInfo.id,
      current_balance: balance
    });

    setShowTooltip(true);
  };

  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={handleTooltipShow}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link 
        href="/pricing" 
        onClick={handleBalanceClick}
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
    </motion.div>
  );
}; 