// src/providers/AuthProvider.tsx
"use client"; 

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { AuthContext, AuthContextType, UserInfo } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[AuthProvider Component] Function execution started.');
  const pathname = usePathname();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false); // Para saber se a verificação inicial já ocorreu

  // Timeout de segurança para isLoading
  useEffect(() => {
    let safetyTimeoutId: NodeJS.Timeout | null = null;
    if (isLoading) {
      safetyTimeoutId = setTimeout(() => {
        console.warn('[Safety Timeout] Forcing isLoading to false after 8s timeout');
        setIsLoading(false);
        if (!sessionChecked) {
            setSessionChecked(true); // Garante que não fica preso esperando a sessão inicial
        }
      }, 8000); 
    }
    return () => {
      if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
    };
  }, [isLoading, sessionChecked]);

  // Sincroniza dados do utilizador com a base de dados
  const syncUserWithDatabase = useCallback(async (user: User) => {
    console.log('[syncUserWithDatabase] Attempting to sync user:', user.id);
    try {
      const userData: UserInfo = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        avatar_url: user.user_metadata?.avatar_url || '',
      };
      console.log('[syncUserWithDatabase] User data prepared:', userData);

      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (upsertError) {
        console.error("[syncUserWithDatabase] Error upserting user:", upsertError.message);
        toast.error("Erro ao sincronizar perfil", { description: upsertError.message });
      } else {
        console.log("[syncUserWithDatabase] ✅ User profile synced successfully.");
      }
      setUserInfo(userData); // Atualiza o estado da UI com os dados sincronizados
    } catch (error) {
      console.error('[syncUserWithDatabase] Exception:', error);
      // Não define isLoading aqui, a função chamadora deve tratar disso
    }
  }, []); // Não depende de 'toast'

  // Função para refrescar a sessão; o parâmetro controla se isLoading é afetado
  const refreshSession = useCallback(async (manageLoadingState = false) => {
    console.log(`[refreshSession] Refreshing session state. Manage loading: ${manageLoadingState}`);
    if (manageLoadingState) {
        setIsLoading(true);
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[refreshSession] Error getting session:', error.message);
        setUserInfo(null);
        if (manageLoadingState) setIsLoading(false); // Só mexe no loading se esta chamada for responsável
        setSessionChecked(true); // Mesmo com erro, a tentativa de verificação foi feita
        return;
      }
      
      const session = data?.session;
      if (session?.user) {
        console.log('[refreshSession] Session found, user ID:', session.user.id);
        await syncUserWithDatabase(session.user); // syncUserWithDatabase vai chamar setUserInfo
        console.log('[refreshSession] User data synced with database after session refresh.');
      } else {
        console.log('[refreshSession] No active session found after refresh.');
        setUserInfo(null);
      }
    } catch (e) {
      console.error('[refreshSession] Exception:', e);
      setUserInfo(null);
    } finally {
      if (manageLoadingState) {
          setIsLoading(false);
      }
      setSessionChecked(true); // A tentativa de refresh implica que a sessão foi "verificada"
    }
  }, [syncUserWithDatabase]);

  // Efeito para mudança de rota
  useEffect(() => {
    // Só faz refresh na mudança de rota se a sessão inicial já foi verificada
    // e não estamos no meio de um carregamento de autenticação.
    if (sessionChecked && pathname && !isLoading) { 
      console.log(`[PathChange] Detected navigation to: ${pathname}. Refreshing session without forcing loading state.`);
      refreshSession(false); // false para não mostrar loader em cada navegação
    }
  }, [pathname, sessionChecked, refreshSession, isLoading]);

  // Efeito para visibilidade/foco da aba
  useEffect(() => {
    console.log('[visibilityChange] Setting up visibility and focus handlers');
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[visibilityOrFocus] Tab visible again, forcing session refresh and managing loading state.');
        await refreshSession(true); // true para gerir o estado de loading
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    
    const periodicRefreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && userInfo) {
        console.log('[periodicRefresh] Running scheduled session refresh for logged-in user');
        refreshSession(true); // Gerir loading state para refresh periódico
      }
    }, 5 * 60 * 1000); // A cada 5 minutos
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(periodicRefreshInterval);
    };
  }, [syncUserWithDatabase, userInfo, refreshSession]); // Adicionado refreshSession

  // Efeito principal para onAuthStateChange e verificação inicial da sessão
  useEffect(() => {
    let isMounted = true;
    console.log('[AuthProvider Main useEffect] Setting up auth listener and initial session check.');
    setIsLoading(true); 

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[onAuthStateChange] Event received: ${event}. Session exists: ${!!session}`);
        if (!isMounted) {
          console.log('[onAuthStateChange] Component unmounted, ignoring event.');
          return;
        }

        // setIsLoading(true) no início de eventos significativos
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
           console.log(`[onAuthStateChange] Event ${event} - setting isLoading true.`);
           setIsLoading(true);
        }

        const currentUser = session?.user ?? null;
        console.log('[onAuthStateChange] Current user from event:', currentUser?.id || 'null');

        if (currentUser) {
          await syncUserWithDatabase(currentUser);
        } else {
          setUserInfo(null);
        }

        // setIsLoading(false) no final de eventos conclusivos
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          console.log(`[onAuthStateChange] Finished processing ${event}. Setting isLoading: false.`);
          setIsLoading(false);
          setSessionChecked(true);
        }
      }
    );

    // Verifica a sessão inicial explicitamente
    const checkInitialSession = async () => {
        console.log('[checkInitialSession] Explicitly checking initial session...');
        // O evento INITIAL_SESSION do onAuthStateChange deve tratar disso.
        // Esta chamada é uma salvaguarda ou para acelerar a deteção inicial.
        await refreshSession(true); // true para gerir o estado de loading e sessionChecked
    };
    checkInitialSession();

    return () => {
      console.log('[AuthProvider Main useEffect] Cleaning up auth listener.');
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [syncUserWithDatabase, refreshSession]); // Adicionado refreshSession

  // Funções de login e logout
  const signInWithGoogle = async () => {
    console.log('[signInWithGoogle] Attempting Google Sign In...');
    setIsLoading(true);
    try {
      const redirectUrl = window.location.origin;
      console.log(`[signInWithGoogle] Using redirect URL: ${redirectUrl}`);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl }
      });
      if (error) throw error;
      console.log('[signInWithGoogle] signInWithOAuth called. Waiting for redirect...');
      // isLoading permanece true; onAuthStateChange tratará de o definir como false.
    } catch (error: unknown) {
      console.error('[signInWithGoogle] Login error caught:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro no login", { description: errorMessage });
      setIsLoading(false); 
    }
  };

  const signOut = async () => {
    console.log('[signOut] Attempting to sign out...');
    setIsLoading(true); 
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' }); 
      if (error) {
        console.error('[signOut] Supabase sign out error:', error);
        throw error; 
      }
      console.log('[signOut] Supabase signOut successful. Manually setting user to null and isLoading to false.');
      setUserInfo(null);
      setIsLoading(false);
      setSessionChecked(true); 
    } catch (error: unknown) {
      console.error('[signOut] Error caught during sign out:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao sair", { description: errorMessage });
      setUserInfo(null);
      setIsLoading(false);
      setSessionChecked(true);
    }
  };

  const authContextValue: AuthContextType = {
    userInfo,
    isLoading,
    signInWithGoogle,
    signOut,
    refreshSession: () => refreshSession(false) 
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};