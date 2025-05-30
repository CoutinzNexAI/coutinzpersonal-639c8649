import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const usePicCoins = () => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();

  const fetchBalance = useCallback(async () => {
    if (!userInfo) {
      setBalance(0);
      setLoading(false);
      return;
    }


    try {
      const response = await fetch('/api/piccoins/balance');

      if (response.ok) {
        const data = await response.json();

        setBalance(data.balance);
      } else {
        const errorText = await response.text();
        console.error('[usePicCoins] Failed to fetch balance:', response.status, response.statusText);
        console.error('[usePicCoins] Error response:', errorText);
      }
    } catch (error) {
      console.error('[usePicCoins] Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]); // Only depend on stable user ID, not entire userInfo object

  const spendCoins = async (amount: number, transformationId: string) => {
    if (!userInfo) throw new Error('User not authenticated');

    const response = await fetch('/api/piccoins/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        transformationId // userId comes from auth server-side
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    setBalance(data.newBalance);
    return data;
  };

  const purchaseCoins = async (packageId: string) => {
    if (!userInfo) throw new Error('User not authenticated');

    const response = await fetch('/api/piccoins/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    return data.sessionId;
  };

  const fetchHistory = async () => {
    if (!userInfo) return [];

    try {
      const response = await fetch('/api/piccoins/history');
      if (response.ok) {
        const data = await response.json();
        return data.transactions;
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
    return [];
  };

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    spendCoins,
    purchaseCoins,
    fetchHistory,
    refetchBalance: fetchBalance
  };
}; 