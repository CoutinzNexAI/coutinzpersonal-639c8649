import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFirstPurchaseCheck = () => {
  const { userInfo, isLoading: authLoading } = useAuth();
  const [isFirstPurchase, setIsFirstPurchase] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkFirstPurchase = async () => {
    if (!userInfo?.id || authLoading) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('first_purchase_used')
        .eq('id', userInfo.id)
        .single();

      if (error) {
        console.error('[useFirstPurchaseCheck] Error checking first purchase:', error);
        setIsFirstPurchase(false); // Assume não é primeira compra em caso de erro
      } else {
        // Se first_purchase_used é null ou false, é primeira compra
        setIsFirstPurchase(!data.first_purchase_used);
      }
    } catch (error) {
      console.error('[useFirstPurchaseCheck] Error:', error);
      setIsFirstPurchase(false);
    } finally {
      setIsLoading(false);
    }
  };

  const markFirstPurchaseAsUsed = async () => {
    if (!userInfo?.id) return false;

    try {
      const { error } = await supabase
        .from('users')
        .update({ first_purchase_used: true })
        .eq('id', userInfo.id);

      if (error) {
        console.error('[useFirstPurchaseCheck] Error marking first purchase as used:', error);
        return false;
      }

      setIsFirstPurchase(false); // Atualizar estado local
      return true;
    } catch (error) {
      console.error('[useFirstPurchaseCheck] Error:', error);
      return false;
    }
  };

  useEffect(() => {
    checkFirstPurchase();
  }, [userInfo?.id, authLoading]);

  return {
    isFirstPurchase,
    isLoading,
    markFirstPurchaseAsUsed,
    refreshCheck: checkFirstPurchase
  };
}; 