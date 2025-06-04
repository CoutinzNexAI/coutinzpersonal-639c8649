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
      // Update user's terms acceptance in database
      const { error } = await supabase
        .from('users')
        .update({
          accepted_terms: true,
          terms_accepted_at: new Date().toISOString()
        })
        .eq('id', userInfo.id);

      if (error) {
        console.error('Error updating terms :', error);
        toast.error('Erro ao guardar aceitação', {
          description: 'Tente novamente ou contacte o suporte.'
        });
        throw error;
      }

      // Track successful acceptance
      trackEvent('terms_accepted_successfully', {
        user_id: userInfo.id,
        user_email: userInfo.email,
        timestamp: new Date().toISOString()
      });

      toast.success('Termos aceites com sucesso!', {
        description: 'Bem-vindo ao PicTuz! 🎉'
      });

      return true;

    } catch (error) {
      console.error('Terms acceptance error:', error);
      
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

    // Track rejection
    trackEvent('terms_rejected_logout', {
      user_id: userInfo.id,
      user_email: userInfo.email,
      timestamp: new Date().toISOString()
    });

    toast.info('Termos recusados', {
      description: 'A sair da sua conta...'
    });

    // Sign out user
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
        console.error('Error checking terms acceptance:', error);
        return false;
      }

      return data?.accepted_terms === true;

    } catch (error) {
      console.error('Terms check error:', error);
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