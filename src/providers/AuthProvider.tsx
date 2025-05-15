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
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let safetyTimeoutId: NodeJS.Timeout | null = null;
    if (isLoading) {
      safetyTimeoutId = setTimeout(() => {
        if (isLoading) { // Verifica novamente se ainda está loading
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

  const syncUserWithDatabase = useCallback(async (user: User, updateLoadingState = true) => {
    console.log('[syncUserWithDatabase] Attempting to sync user:', user.id);
    if (updateLoadingState) setIsLoading(true); // Opcional: definir loading se esta função for chamada isoladamente
    try {
      const userData: UserInfo = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        avatar_url: user.user_metadata?.avatar_url || '',
      };
      console.log('[syncUserWithDatabase] User data (from session/metadata) prepared:', userData);

      // Primeiro, atualiza a UI com os dados básicos para resposta rápida
      setUserInfo(userData);

      // Depois, sincroniza com a base de dados
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString(),
          // last_seen_at: new Date().toISOString(), // Exemplo: atualizar last_seen
        }, { onConflict: 'id' });

      if (upsertError) {
        console.error("[syncUserWithDatabase] Error upserting user:", upsertError.message);
        toast.error("Erro ao sincronizar perfil", { description: upsertError.message });
        // Não reverte userInfo aqui, pois já temos dados básicos da sessão
      } else {
        console.log("[syncUserWithDatabase] ✅ User profile synced/updated successfully in DB.");
        // Opcional: Se a BD tiver mais dados (ex: créditos), pode ser necessário refazer o fetch do perfil
        // e chamar setUserInfo novamente com os dados completos da BD.
        // Por agora, assumimos que os dados da sessão + metadata são suficientes para UserInfo.
      }
    } catch (error) {
      console.error('[syncUserWithDatabase] Exception:', error);
    } finally {
      if (updateLoadingState) setIsLoading(false);
    }
  }, []); 

  const refreshSession = useCallback(async (manageLoadingState = false) => {
    console.log(`[refreshSession] Refreshing session state. Manage loading: ${manageLoadingState}`);
    if (manageLoadingState) setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[refreshSession] Error getting session:', error.message);
        setUserInfo(null);
        if (manageLoadingState) setIsLoading(false);
        setSessionChecked(true);
        return;
      }
      
      const session = data?.session;
      if (session?.user) {
        console.log('[refreshSession] Session found, user ID:', session.user.id);
        // Aqui, syncUserWithDatabase não precisa gerir o loading, pois refreshSession já o faz
        await syncUserWithDatabase(session.user, false); 
        console.log('[refreshSession] User data synced with database after session refresh.');
      } else {
        console.log('[refreshSession] No active session found after refresh.');
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
      console.log(`[PathChange] Detected navigation to: ${pathname}. Refreshing session (no loading indicator).`);
      refreshSession(false);
    }
  }, [pathname, sessionChecked, refreshSession, isLoading]);

  useEffect(() => {
    console.log('[visibilityChange] Setting up visibility and focus handlers');
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[visibilityOrFocus] Tab visible again, calling refreshSession (will manage loading).');
        await refreshSession(true); 
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    
    const periodicRefreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && userInfo) {
        console.log('[periodicRefresh] Running scheduled session refresh for logged-in user.');
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
    console.log('[AuthProvider Main useEffect] Setting up auth listener and initial session check.');
    setIsLoading(true); 

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[onAuthStateChange] Event received: ${event}. Session exists: ${!!session}`);
        if (!isMounted) return;

        const currentUser = session?.user ?? null;
        console.log('[onAuthStateChange] Current user from event:', currentUser?.id || 'null');

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          setIsLoading(true); // Garante que estamos a carregar
          if (currentUser) {
            // Define userInfo com dados básicos da sessão imediatamente para resposta rápida da UI
            const basicUserInfo: UserInfo = {
              id: currentUser.id,
              email: currentUser.email || '',
              full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário',
              avatar_url: currentUser.user_metadata?.avatar_url || '',
            };
            setUserInfo(basicUserInfo);
            console.log('[onAuthStateChange] Basic userInfo set from session.');
            
            // Sincroniza com a base de dados em segundo plano (ou aguarda se for crucial)
            // O segundo parâmetro 'false' em syncUserWithDatabase indica que ele não deve gerir o isLoading,
            // pois o onAuthStateChange já o está a fazer.
            await syncUserWithDatabase(currentUser, false); 
            console.log('[onAuthStateChange] syncUserWithDatabase completed.');
          } else {
            setUserInfo(null); // Não há utilizador, limpa o estado
          }
          setIsLoading(false); // Define isLoading false APÓS ter userInfo básico e tentado a sincronização
          setSessionChecked(true);
        } else if (event === 'SIGNED_OUT') {
          setIsLoading(true);
          setUserInfo(null);
          setIsLoading(false);
          setSessionChecked(true);
        } else if (event === 'USER_UPDATED' && currentUser) {
           // Para USER_UPDATED, podemos apenas querer re-sincronizar sem mostrar um loader global
           console.log('[onAuthStateChange] USER_UPDATED event, re-syncing user data.');
           await syncUserWithDatabase(currentUser, false); // Não mostra loader global
        }
        // Outros eventos como TOKEN_REFRESHED, USER_DELETED podem ser tratados aqui se necessário
      }
    );

    // Verificação inicial da sessão
    const checkInitialSession = async () => {
        console.log('[checkInitialSession] Explicitly checking initial session (will call refreshSession).');
        // refreshSession com manageLoadingState=true irá definir isLoading e sessionChecked
        await refreshSession(true); 
    };
    checkInitialSession();

    return () => {
      console.log('[AuthProvider Main useEffect] Cleaning up auth listener.');
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [syncUserWithDatabase, refreshSession]);

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
