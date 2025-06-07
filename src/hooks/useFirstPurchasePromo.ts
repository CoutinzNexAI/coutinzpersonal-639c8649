import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { trackEvent } from '@/lib/posthog';

export const useFirstPurchasePromo = () => {
  const { userInfo, isLoading: authLoading } = useAuth();
  const [isEligible, setIsEligible] = useState(false);
  const [shouldShowPromo, setShouldShowPromo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificação real-time da elegibilidade para promoção
  const checkEligibility = async () => {
    if (!userInfo?.id || authLoading) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Verificação direta na BD (sem delays)
      const { data, error } = await supabase
        .from('users')
        .select('piccoin_balance, first_purchase_used')
        .eq('id', userInfo.id)
        .single();

      if (error) {
        console.error('[useFirstPurchasePromo] Error checking eligibility:', error);
        setIsEligible(false);
        setShouldShowPromo(false);
        return;
      }

      // Verificar localStorage para rate limiting
      const shownCountKey = `promo_count_${userInfo.id}`;
      const lastShownKey = `promo_last_${userInfo.id}`;
      
      const shownCount = parseInt(localStorage.getItem(shownCountKey) || '0');
      const lastShown = localStorage.getItem(lastShownKey);
      const today = new Date().toDateString();

      // Condições para mostrar promoção:
      const hasZeroBalance = data.piccoin_balance === 0;
      const hasNotPurchased = !data.first_purchase_used;
      const underLimit = shownCount < 5;
      const notShownToday = lastShown !== today;

      const eligible = hasZeroBalance && hasNotPurchased;
      const shouldShow = eligible && underLimit && notShownToday;

      setIsEligible(eligible);

      if (shouldShow) {
        // Incrementar contagem e marcar data
        localStorage.setItem(shownCountKey, (shownCount + 1).toString());
        localStorage.setItem(lastShownKey, today);
        
        // Track promo eligibility
        trackEvent('first_purchase_promo_eligible', {
          user_id: userInfo.id,
          piccoin_balance: data.piccoin_balance,
          shown_count: shownCount + 1,
          days_since_signup: 'unknown' // Would need created_at from user data if needed
        });

        setShouldShowPromo(true);
      } else {
        setShouldShowPromo(false);
        
        // Track why not eligible
        if (eligible && !shouldShow) {
          trackEvent('first_purchase_promo_rate_limited', {
            user_id: userInfo.id,
            shown_count: shownCount,
            last_shown: lastShown,
            reason: !underLimit ? 'max_attempts' : 'shown_today'
          });
        }
      }
    } catch (error) {
      console.error('[useFirstPurchasePromo] Error:', error);
      setIsEligible(false);
      setShouldShowPromo(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Marcar primeira compra como usada (aceitar promoção)
  const markFirstPurchaseAsUsed = async () => {
    if (!userInfo?.id) return false;

    try {
      const { error } = await supabase
        .from('users')
        .update({ first_purchase_used: true })
        .eq('id', userInfo.id);

      if (error) {
        console.error('[useFirstPurchasePromo] Error marking first purchase as used:', error);
        return false;
      }

      // Atualizar estados locais
      setIsEligible(false);
      setShouldShowPromo(false);

      // Track promo acceptance
      trackEvent('first_purchase_promo_marked_used', {
        user_id: userInfo.id
      });

      return true;
    } catch (error) {
      console.error('[useFirstPurchasePromo] Error:', error);
      return false;
    }
  };

  // Fechar modal sem aceitar (manter elegibilidade mas respeitar rate limiting)
  const dismissPromo = () => {
    setShouldShowPromo(false);
    
    // Track dismissal
    trackEvent('first_purchase_promo_dismissed_new_logic', {
      user_id: userInfo?.id || null,
      remains_eligible: isEligible
    });
  };

  // Verificar elegibilidade ao carregar
  useEffect(() => {
    if (userInfo?.id && !authLoading) {
      checkEligibility();
    }
  }, [userInfo?.id, authLoading]);

  return {
    isEligible,
    shouldShowPromo,
    isLoading,
    markFirstPurchaseAsUsed,
    dismissPromo,
    refreshCheck: checkEligibility
  };
}; 