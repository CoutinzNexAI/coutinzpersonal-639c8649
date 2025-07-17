import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/sonner';
import { trackEvent } from '@/lib/posthog';

export const useTermsAcceptance = () => {
  const [loading, setLoading] = useState(false);
  const { userInfo, signOut } = useAuth();

  const acceptTerms = useCallback(async () => {
    if (!userInfo?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    
    try {
      // 1. Atualizar a base de dados na Supabase
      const { error } = await supabase
        .from('users')
        .update({
          accepted_terms: true,
          terms_accepted_at: new Date().toISOString()
        })
        .eq('id', userInfo.id);

      if (error) {
        console.error('[acceptTerms] ❌ Database error:', error);
        toast.error('Erro ao guardar aceitação', {
          description: 'Tente novamente ou contacte o suporte.'
        });
        throw error;
      }

      console.log('[acceptTerms] ✅ Terms accepted successfully for user:', userInfo.id);

      // 2. Tracking com PostHog (mantido)
      trackEvent('terms_accepted_successfully', {
        user_id: userInfo.id,
        user_email: userInfo.email,
        timestamp: new Date().toISOString()
      });

      // --- INÍCIO DA LÓGICA DE CONSENTIMENTO FINAL ---
      if (typeof window !== 'undefined') {
        // 3. GUARDAR CONSENTIMENTO NO NAVEGADOR (O "CARIMBO NA MÃO")
        localStorage.setItem('cookie_consent', 'granted');
        console.log('[Consent] ✅ Estado de consentimento guardado no localStorage.');

        // 4. ATUALIZAR O CONSENTIMENTO GLOBAL
        // Para o Google Analytics
        if (typeof window.gtag === 'function') {
          window.gtag('consent', 'update', {
            'ad_storage': 'granted',
            'analytics_storage': 'granted'
          });
          console.log('[Consent] ✅ Google Analytics consent updated to GRANTED.');
        }

        // Para o Píxel da Meta
        const fpixel = await import('@/lib/fpixel');
        fpixel.grantConsent();
        console.log('[Consent] ✅ Meta Pixel consent updated to GRANTED.');
        
        // 5. DISPARAR O PRIMEIRO PAGEVIEW APÓS O CONSENTIMENTO
        fpixel.pageview();
        console.log('[Consent] ✅ First Meta Pixel PageView fired.');
      }
      // --- FIM DA LÓGICA DE CONSENTIMENTO FINAL ---

      // 6. Toast de sucesso
      toast.success('Termos aceites com sucesso!', {
        description: 'Bem-vindo ao PicTuz! 🎉'
      });

      return true;

    } catch (error) {
      console.error('[acceptTerms] ❌ Exception:', error);
      trackEvent('terms_acceptance_error', {
        user_id: userInfo.id,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  const rejectTerms = useCallback(async () => {
    if (!userInfo?.id) return;

    trackEvent('terms_rejected_logout', {
      user_id: userInfo.id,
      user_email: userInfo.email,
      timestamp: new Date().toISOString()
    });

    toast.info('Termos recusados', {
      description: 'A sair da sua conta...'
    });

    await signOut();
  }, [userInfo, signOut]);

  const checkTermsAcceptance = useCallback(async (): Promise<boolean> => {
    if (!userInfo?.id) return false;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('accepted_terms, terms_accepted_at')
        .eq('id', userInfo.id)
        .single();

      if (error) {
        return false;
      }

      return data?.accepted_terms === true;

    } catch (error) {
      return false;
    }
  }, [userInfo]);

  return {
    acceptTerms,
    rejectTerms,
    checkTermsAcceptance,
    loading
  };
};