import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import { 
  trackPicCoinEarning, 
  trackPicCoinSpending, 
  trackPicCoinPurchase, 
  trackPicCoinBalance, 
  trackPicCoinRefund,
  trackEvent 
} from '@/lib/posthog';

export const usePicCoins = () => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!userInfo?.id) return;

    try {
      const response = await fetch('/api/piccoins/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
        const data = await response.json();
        setBalance(data.balance);

      // 🔥 TRACKING: Balance check
      trackPicCoinBalance(data.balance, {
        user_id: userInfo.id,
        balance_check_timestamp: new Date().toISOString(),
        balance_fetch_success: true
      });

    } catch (error) {
      console.error('Error fetching balance:', error);
      
      // 🔥 TRACKING: Balance check failure
      trackEvent('piccoin_balance_fetch_error', {
        user_id: userInfo.id,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        balance_fetch_failed: true
      });
      
      setError('Failed to fetch balance');
    }
  }, [userInfo?.id]);

  const spendCoins = useCallback(async (amount: number, jobId?: string) => {
    if (!userInfo?.id) {
      throw new Error('User not authenticated');
    }

    // 🔥 TRACKING: PicCoin spending start
    trackPicCoinSpending(amount, 'transformation', {
      user_id: userInfo.id,
      job_id: jobId || null,
      balance_before: balance,
      transaction_timestamp: new Date().toISOString()
    });

    trackEvent('spend_coins_start', {
      user_id: userInfo.id,
      amount: amount,
      transformation_id: jobId || null,
      balance_before: balance
    });

    const response = await fetch('/api/piccoins/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        transformationId: jobId || null
      })
    });

    if (!response.ok) {
      const error = await response.json();

      trackEvent('spend_coins_error', {
        user_id: userInfo.id,
        amount: amount,
        transformation_id: jobId || null,
        http_status: response.status,
        error_message: error.message || 'Unknown spend error'
      });

      throw new Error(error.message);
    }

    const data = await response.json();
    setBalance(data.newBalance);

    // 🔥 TRACKING: PicCoin spending success
    trackPicCoinSpending(amount, 'transformation_success', {
      user_id: userInfo.id,
      job_id: jobId || null,
      balance_before: balance,
      balance_after: balance - amount,
      transaction_success: true
    });

    trackEvent('spend_coins_success', {
      user_id: userInfo.id,
      amount: amount,
      transformation_id: jobId || null,
      balance_before: balance,
      balance_after: data.newBalance
    });

    await fetchBalance();

    return data;
  }, [userInfo?.id, balance, fetchBalance]);

  const refundCoins = useCallback(async (amount: number, jobId: string, reason = 'transformation_failed') => {
    if (!userInfo?.id) {
      throw new Error('User not authenticated');
    }

    // 🔥 TRACKING: PicCoin refund start
    trackPicCoinRefund(amount, reason, {
      user_id: userInfo.id,
      job_id: jobId,
      balance_before: balance,
      refund_reason: reason,
      transaction_timestamp: new Date().toISOString()
    });

    trackEvent('refund_coins_start', {
      user_id: userInfo.id,
      amount: amount,
      transformation_id: jobId,
      balance_before: balance
    });

    const response = await fetch('/api/piccoins/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transformationId: jobId,
        amount
      })
    });

    if (!response.ok) {
      const error = await response.json();

      trackEvent('refund_coins_error', {
        user_id: userInfo.id,
        amount: amount,
        transformation_id: jobId,
        http_status: response.status,
        error_message: error.message || 'Unknown refund error'
      });

      throw new Error(error.message);
    }

    const data = await response.json();
    setBalance(data.newBalance);

    // 🔥 TRACKING: PicCoin refund success
    trackPicCoinRefund(amount, reason + '_success', {
      user_id: userInfo.id,
      job_id: jobId,
      balance_before: balance,
      balance_after: balance + amount,
      refund_success: true
    });

    trackEvent('refund_coins_success', {
      user_id: userInfo.id,
      amount: amount,
      transformation_id: jobId,
      balance_before: balance,
      balance_after: data.newBalance,
      refunded_amount: data.refundedAmount
    });

    await fetchBalance();

    return data;
  }, [userInfo?.id, balance, fetchBalance]);

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
    refetchBalance: fetchBalance,
    error
  };
}; 