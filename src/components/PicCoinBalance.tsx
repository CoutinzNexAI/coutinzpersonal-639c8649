import { usePicCoins } from '@/hooks/usePicCoins';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export const PicCoinBalance = () => {
  const { balance, loading } = usePicCoins();
  const { userInfo } = useAuth();

  if (!userInfo || loading) return null;

  return (
    <Link 
      href="/pricing" 
      className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer"
    >
      <span>⭐</span>
      <span>{balance} PicCoins</span>
    </Link>
  );
}; 