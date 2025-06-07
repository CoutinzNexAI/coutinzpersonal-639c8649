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
      // Removido limite "1x por dia" - pode aparecer várias vezes no mesmo dia até 5 tentativas

      const eligible = hasZeroBalance && hasNotPurchased;
      const shouldShow = eligible && underLimit;

      setIsEligible(eligible);

      if (shouldShow) {
        // Só incrementar contagem se o modal for efetivamente mostrado
        // (vamos fazer isso quando o modal abrir, não aqui)
        
        // Track promo eligibility
        trackEvent('first_purchase_promo_eligible', {
          user_id: userInfo.id,
          piccoin_balance: data.piccoin_balance,
          shown_count: shownCount,
          current_check: 'eligible'
        });

        setShouldShowPromo(true);
      } else {
        setShouldShowPromo(false);
        
        // Track why not eligible
        if (eligible && !shouldShow) {
          trackEvent('first_purchase_promo_rate_limited', {
            user_id: userInfo.id,
            shown_count: shownCount,
            reason: !underLimit ? 'max_attempts' : 'other'
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

  // Marcar que o modal foi efetivamente mostrado (incrementar contagem)
  const markPromoShown = () => {
    if (!userInfo?.id) return;
    
    const shownCountKey = `promo_count_${userInfo.id}`;
    const lastShownKey = `promo_last_${userInfo.id}`;
    const today = new Date().toDateString();
    
    const currentCount = parseInt(localStorage.getItem(shownCountKey) || '0');
    localStorage.setItem(shownCountKey, (currentCount + 1).toString());
    localStorage.setItem(lastShownKey, today);
    
    trackEvent('first_purchase_promo_actually_shown', {
      user_id: userInfo.id,
      shown_count: currentCount + 1
    });
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
    markPromoShown,
    dismissPromo,
    refreshCheck: checkEligibility
  };
}; 