"use client"; 

import React, { useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { AuthContext, AuthContextType, UserInfo } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { trackEvent, identifyUser, resetUser } from '@/lib/posthog';
import { posthog } from '@/lib/posthog';

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let safetyTimeoutId: NodeJS.Timeout | null = null;
    if (isLoading) {
      safetyTimeoutId = setTimeout(() => {
        if (isLoading) { 
          console.warn('[Safety Timeout] Forcing isLoading to false after 8s timeout');
          setIsLoading(false);
          if (!sessionChecked) {
            setSessionChecked(true); 
          }
        }
      }, 8000); 
    }
    return () => {
      if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
    };
  }, [isLoading, sessionChecked]);

  const syncUserWithDatabase = useCallback(async (user: SupabaseUser, updateLoadingState = true) => {
    // --- ALTERAÇÃO #1: Iniciar o estado de sincronização ---
    setIsSyncing(true); 
    if (updateLoadingState) setIsLoading(true);
    
    try {
      const userData: UserInfo = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        avatar_url: user.user_metadata?.avatar_url || '',
      };
      setUserInfo(userData);

      try {
        const { data: userRole } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (userRole?.role === 'admin') {
          if (typeof window !== 'undefined') {
            posthog.stopSessionRecording();
          }
        }
      } catch (roleError) {
        // Continue silently if role check fails
      }

      try {
        if (!session?.access_token) {
          console.warn('[syncUserWithDatabase] No session or access_token available, skipping API sync');
          // --- ALTERAÇÃO #2: Terminar a sincronização mesmo em caso de skip ---
          setIsSyncing(false);
          if (updateLoadingState) setIsLoading(false);
          return;
        }
        
        const response = await fetch('/api/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            userData: {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
              avatar_url: user.user_metadata?.avatar_url || null,
              provider: user.app_metadata?.provider || 'email',
              created_at: user.created_at
            }
          })
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log('[syncUserWithDatabase] ✅ User sync successful:', responseData);
          
          if (responseData.user) {
            setUserInfo(responseData.user);
          }
        } else {
          const errorData = await response.json();
          console.error("[syncUserWithDatabase] ❌ Error syncing user via API:", errorData);
        }
      } catch (error) {
        console.error('[syncUserWithDatabase] ❌ Exception:', error);
      }
    } catch (error) {
      console.error('[syncUserWithDatabase] ❌ Exception:', error);
    } finally {
      if (updateLoadingState) setIsLoading(false);
      // --- ALTERAÇÃO #3: Terminar a sincronização no bloco finally para garantir que é sempre executado ---
      setIsSyncing(false); 
    }
  }, [session?.access_token]);

  const refreshSession = useCallback(async (manageLoadingState = false) => {
    if (manageLoadingState) setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      setSession(data.session);
      if (error) {
        console.error('[refreshSession] Error getting session:', error.message);
        setUserInfo(null);
        if (manageLoadingState) setIsLoading(false);
        setSessionChecked(true);
        return;
      }
      
      const currentSupabaseSession = data?.session;
      if (currentSupabaseSession?.user) {
        await syncUserWithDatabase(currentSupabaseSession.user, false); 
      } else {
        setUserInfo(null);
      }
    } catch (e) {
      console.error('[refreshSession] Exception:', e);
      setUserInfo(null);
    } finally {
      if (manageLoadingState) setIsLoading(false);
      setSessionChecked(true); 
    }
  }, [syncUserWithDatabase]);

  useEffect(() => {
    if (sessionChecked && pathname && !isLoading) { 
      refreshSession(false);
    }
  }, [pathname, sessionChecked, refreshSession, isLoading]);

  useEffect(() => {
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'visible') {
        await refreshSession(true); 
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    
    const periodicRefreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && userInfo) {
        refreshSession(true);
      }
    }, 5 * 60 * 1000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(periodicRefreshInterval);
    };
  }, [userInfo, refreshSession]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true); 

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          setIsLoading(true); 
          if (currentUser) {
            const basicUserInfo: UserInfo = {
              id: currentUser.id,
              email: currentUser.email || '',
              full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário',
              avatar_url: currentUser.user_metadata?.avatar_url || '',
            };
            setUserInfo(basicUserInfo);

            identifyUser(currentUser.id, {
              email: currentUser.email || '',
              full_name: basicUserInfo.full_name,
              signup_date: currentUser.created_at,
              provider: 'google'
            });

            if (event === 'SIGNED_IN') {
              trackEvent('login_success', {
                method: 'google',
                user_id: currentUser.id,
                is_new_user: false
              });
            }
            
            syncUserWithDatabase(currentUser, false).then(() => {
            });
          } else {
            setUserInfo(null); 
          }
          setIsLoading(false); 
          setSessionChecked(true);
        } else if (event === 'SIGNED_OUT') {
          resetUser();
          
          trackEvent('user_signed_out', {
            session_duration: Date.now()
          });

          setIsLoading(true);
          setUserInfo(null);
          setSession(null);
          setIsLoading(false);
          setSessionChecked(true);
        } else if (event === 'USER_UPDATED' && currentUser) {
            syncUserWithDatabase(currentUser, false);
        }
      }
    );

    const checkInitialSession = async () => {
        await refreshSession(true); 
    };
    checkInitialSession();

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [syncUserWithDatabase, refreshSession]);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
            hd: ''
          }
        }
      });
      if (error) throw error;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      trackEvent('login_failure', {
        method: 'google',
        error_message: errorMessage,
        redirect_url: window.location.origin
      });
      
      toast.error("Erro no login", { description: errorMessage });
      setIsLoading(false); 
    }
  };

  const signOut = async () => {
    setIsLoading(true); 
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' }); 
      if (error) {
        console.error('[signOut] Supabase sign out error:', error);
        throw error; 
      }

      setUserInfo(null);
      setSession(null);

      try {
        localStorage.removeItem('pictuz_cart');
        localStorage.removeItem('cookie_consent');
        
        const keysToRemove = [
          'welcome_shown_',
          'funnel_',
          'upload_attempts',
          'last_visit_timestamp'
        ];
        
        Object.keys(localStorage).forEach(key => {
          keysToRemove.forEach(prefix => {
            if (key.startsWith(prefix)) {
              localStorage.removeItem(key);
            }
          });
        });

        sessionStorage.clear();
        
        console.log('✅ [signOut] Local storage cleaned');
      } catch (storageError) {
        console.warn('[signOut] Error cleaning localStorage:', storageError);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cartUpdated'));
      }

      setIsLoading(false);
      setSessionChecked(true);

      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao sair", { description: errorMessage });
      
      setUserInfo(null);
      setSession(null);
      setIsLoading(false);
      setSessionChecked(true);

      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    }
  };

  const authContextValue: AuthContextType = {
    userInfo,
    isLoading,
    signInWithGoogle,
    signOut,
    session,
    isSyncing, // <<< EXPORTAR O NOVO ESTADO
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};