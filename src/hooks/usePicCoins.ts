import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { trackEvent } from '@/lib/posthog';

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

    trackEvent('balance_fetch_start', {
      user_id: userInfo.id
    });

    try {
      const response = await fetch('/api/piccoins/balance');

      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);

        trackEvent('balance_fetch_success', {
          user_id: userInfo.id,
          current_balance: data.balance
        });
      } else {
        const errorText = await response.text();
        console.error('[usePicCoins] Failed to fetch balance:', response.status, response.statusText);
        console.error('[usePicCoins] Error response:', errorText);

        trackEvent('balance_fetch_error', {
          user_id: userInfo.id,
          http_status: response.status,
          error_message: errorText || response.statusText
        });
      }
    } catch (error) {
      console.error('[usePicCoins] Error fetching balance:', error);

      trackEvent('balance_fetch_exception', {
        user_id: userInfo.id,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  const spendCoins = async (amount: number, transformationId: string) => {
    if (!userInfo) throw new Error('User not authenticated');

    trackEvent('spend_coins_start', {
      user_id: userInfo.id,
      amount: amount,
      transformation_id: transformationId,
      balance_before: balance
    });

    const response = await fetch('/api/piccoins/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        transformationId
      })
    });

    if (!response.ok) {
      const error = await response.json();

      trackEvent('spend_coins_error', {
        user_id: userInfo.id,
        amount: amount,
        transformation_id: transformationId,
        http_status: response.status,
        error_message: error.message || 'Unknown spend error'
      });

      throw new Error(error.message);
    }

    const data = await response.json();
    setBalance(data.newBalance);

    trackEvent('spend_coins_success', {
      user_id: userInfo.id,
      amount: amount,
      transformation_id: transformationId,
      balance_before: balance,
      balance_after: data.newBalance
    });

    return data;
  };

  const refundCoins = async (transformationId: string, amount: number = 1) => {
    if (!userInfo) throw new Error('User not authenticated');

    trackEvent('refund_coins_start', {
      user_id: userInfo.id,
      amount: amount,
      transformation_id: transformationId,
      balance_before: balance
    });

    const response = await fetch('/api/piccoins/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transformationId,
        amount
      })
    });

    if (!response.ok) {
      const error = await response.json();

      trackEvent('refund_coins_error', {
        user_id: userInfo.id,
        amount: amount,
        transformation_id: transformationId,
        http_status: response.status,
        error_message: error.message || 'Unknown refund error'
      });

      throw new Error(error.message);
    }

    const data = await response.json();
    setBalance(data.newBalance);

    trackEvent('refund_coins_success', {
      user_id: userInfo.id,
      amount: amount,
      transformation_id: transformationId,
      balance_before: balance,
      balance_after: data.newBalance,
      refunded_amount: data.refundedAmount
    });

    return data;
  };

  const purchaseCoins = async (packageId: string) => {
    if (!userInfo) throw new Error('User not authenticated');

    trackEvent('purchase_coins_start', {
      user_id: userInfo.id,
      package_id: packageId,
      balance_before: balance
    });

    const response = await fetch('/api/piccoins/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId })
    });

    if (!response.ok) {
      const error = await response.json();

      trackEvent('purchase_coins_error', {
        user_id: userInfo.id,
        package_id: packageId,
        http_status: response.status,
        error_message: error.message || 'Unknown purchase error'
      });

      throw new Error(error.message);
    }

    const data = await response.json();

    trackEvent('purchase_coins_redirect', {
      user_id: userInfo.id,
      package_id: packageId,
      session_id: data.sessionId
    });

    return data.sessionId;
  };

  const fetchHistory = async () => {
    if (!userInfo) return [];

    trackEvent('history_fetch_start', {
      user_id: userInfo.id
    });

    try {
      const response = await fetch('/api/piccoins/history');
      if (response.ok) {
        const data = await response.json();

        trackEvent('history_fetch_success', {
          user_id: userInfo.id,
          transactions_count: data.transactions?.length || 0
        });

        return data.transactions;
      } else {
        trackEvent('history_fetch_error', {
          user_id: userInfo.id,
          http_status: response.status
        });
      }
    } catch (error) {
      console.error('Error fetching history:', error);

      trackEvent('history_fetch_exception', {
        user_id: userInfo.id,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
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
    refundCoins,
    purchaseCoins,
    fetchHistory,
    refetchBalance: fetchBalance
  };
}; 