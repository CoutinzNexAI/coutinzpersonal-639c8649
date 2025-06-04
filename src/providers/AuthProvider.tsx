// src/providers/AuthProvider.tsx
"use client"; 

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js'; // Renomeado User para SupabaseUser para evitar conflito se UserInfo fosse chamado User
import { AuthContext, AuthContextType, UserInfo } from '@/contexts/AuthContext'; // Importa do ficheiro separado
import { usePathname } from 'next/navigation';
import { trackEvent, identifyUser, resetUser } from '@/lib/posthog'; // <<< NOVO: Import tracking

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [session, setSession] = useState<Session | null>(null); // Adicionado para guardar a sessão completa
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

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
    if (updateLoadingState) setIsLoading(true);
    try {
      const userData: UserInfo = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        avatar_url: user.user_metadata?.avatar_url || '',
      };
      setUserInfo(userData); // Atualiza UI com dados básicos primeiro

      // Check if this is a new user by checking if they exist in database
      const { error: checkError } = await supabase
        .from('users')
        .select('id, created_at')
        .eq('id', userData.id)
        .single();

      const isNewUser = checkError && checkError.code === 'PGRST116'; // Not found error

      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (upsertError) {
        console.error("[syncUserWithDatabase] Error upserting user:", upsertError.message);
        toast.error("Erro ao sincronizar perfil", { description: upsertError.message });
      } else {
        console.log("[syncUserWithDatabase] ✅ User profile synced/updated successfully in DB.");
        
        // Award welcome bonus for new users
        if (isNewUser) {
          // 🔥 TRACKING: New user registration
          trackEvent('user_registered', {
            user_id: userData.id,
            email: userData.email,
            signup_method: 'google',
            welcome_bonus: 2
          });

          try {
            console.log("[syncUserWithDatabase] 🎁 New user detected, awarding welcome bonus...");
                        
            const { error: bonusError } = await supabase.rpc('earn_piccoins', {
              p_user_id: userData.id,
              p_amount: 2,
              p_type: 'bonus_first_login',
              p_reference_id: `welcome_bonus_${userData.id}_${Date.now()}`,
              p_description: 'Bónus de boas-vindas - Bem-vindo ao PicTuz!'
            });
            
            if (bonusError) {
              console.error("[syncUserWithDatabase] Error awarding welcome bonus:", bonusError);
              console.error("[syncUserWithDatabase] Full bonus error details:", JSON.stringify(bonusError));
              
              // 🔥 TRACKING: Welcome bonus error
              trackEvent('welcome_bonus_error', {
                user_id: userData.id,
                error_message: bonusError.message
              });
            } else {
              console.log("[syncUserWithDatabase] ✅ Welcome bonus awarded successfully!");
              
              // 🔥 TRACKING: Welcome bonus success
              trackEvent('welcome_bonus_awarded', {
                user_id: userData.id,
                amount: 2,
                total_credits: 2
              });
              
              setTimeout(() => {
                toast.success("🎁 Bem-vindo ao PicTuz!", {
                  description: "Recebeste 2 PicCoins grátis para começares a transformar as tuas fotos!"
                });
              }, 1500);
            }
          } catch (bonusError) {
            console.error("[syncUserWithDatabase] Exception during welcome bonus:", bonusError);
            
            // 🔥 TRACKING: Welcome bonus exception
            trackEvent('welcome_bonus_exception', {
              user_id: userData.id,
              error: String(bonusError)
            });
          }
        } else {
          // 🔥 TRACKING: Returning user login
          trackEvent('returning_user_login', {
            user_id: userData.id,
            email: userData.email
          });
        }
      }
    } catch (error) {
      console.error('[syncUserWithDatabase] Exception:', error);
    } finally {
      if (updateLoadingState) setIsLoading(false);
    }
  }, []); 

  const refreshSession = useCallback(async (manageLoadingState = false) => {
    if (manageLoadingState) setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      setSession(data.session); // Guarda a sessão atual
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

        setSession(currentSession); // Guarda a sessão completa
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

            // 🔥 TRACKING: Identify user in PostHog
            identifyUser(currentUser.id, {
              email: currentUser.email || '',
              full_name: basicUserInfo.full_name,
              signup_date: currentUser.created_at,
              provider: 'google'
            });

            // 🔥 TRACKING: Login success
            if (event === 'SIGNED_IN') {
              trackEvent('login_success', {
                method: 'google',
                user_id: currentUser.id,
                is_new_user: false // Will be updated in syncUserWithDatabase
              });
            }
            
            // Não bloqueia isLoading para syncUserWithDatabase; deixa-o correr em background.
            // A UI já tem basicUserInfo e isLoading será false em breve.
            syncUserWithDatabase(currentUser, false).then(() => {
            });
          } else {
            setUserInfo(null); 
          }
          setIsLoading(false); 
          setSessionChecked(true);
        } else if (event === 'SIGNED_OUT') {
          // 🔥 TRACKING: Reset user tracking
          resetUser();
          
          // 🔥 TRACKING: Sign out event
          trackEvent('user_signed_out', {
            session_duration: Date.now() // Could be calculated properly
          });

          setIsLoading(true);
          setUserInfo(null);
          setSession(null); // Limpa a sessão também
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
      const redirectUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl }
      });
      if (error) throw error;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      // 🔥 TRACKING: Login failure
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
      setSession(null); // Limpa a sessão também
      setIsLoading(false);
      setSessionChecked(true); 
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao sair", { description: errorMessage });
      setUserInfo(null);
      setSession(null);
      setIsLoading(false);
      setSessionChecked(true);
    }
  };

  // O valor do contexto agora inclui a sessão completa para debugging, se necessário
  const authContextValue: AuthContextType = {
    userInfo,
    isLoading,
    signInWithGoogle,
    signOut,
    session, // Adicionado para debugging
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
