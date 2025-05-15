// src/providers/AuthProvider.tsx
"use client"; 

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js'; // Renomeado User para SupabaseUser para evitar conflito se UserInfo fosse chamado User
import { AuthContext, AuthContextType, UserInfo } from '@/contexts/AuthContext'; // Importa do ficheiro separado
import { usePathname } from 'next/navigation';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[AuthProvider Component] Function execution started.');
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
    console.log('[syncUserWithDatabase] Attempting to sync user:', user.id);
    if (updateLoadingState) setIsLoading(true);
    try {
      const userData: UserInfo = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
        avatar_url: user.user_metadata?.avatar_url || '',
      };
      console.log('[syncUserWithDatabase] User data (from session/metadata) prepared:', userData);
      setUserInfo(userData); // Atualiza UI com dados básicos primeiro

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
        console.log('[refreshSession] Session found, user ID:', currentSupabaseSession.user.id);
        await syncUserWithDatabase(currentSupabaseSession.user, false); 
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
      async (event, currentSession) => {
        console.log(`[onAuthStateChange] Event received: ${event}. Session exists: ${!!currentSession}`);
        if (!isMounted) return;

        setSession(currentSession); // Guarda a sessão completa
        const currentUser = currentSession?.user ?? null;
        console.log('[onAuthStateChange] Current user from event:', currentUser?.id || 'null');

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
            console.log('[onAuthStateChange] Basic userInfo set from session.');
            
            // Não bloqueia isLoading para syncUserWithDatabase; deixa-o correr em background.
            // A UI já tem basicUserInfo e isLoading será false em breve.
            syncUserWithDatabase(currentUser, false).then(() => {
                 console.log('[onAuthStateChange] syncUserWithDatabase (async) completed.');
            });
          } else {
            setUserInfo(null); 
          }
          setIsLoading(false); 
          setSessionChecked(true);
        } else if (event === 'SIGNED_OUT') {
          setIsLoading(true);
          setUserInfo(null);
          setSession(null); // Limpa a sessão também
          setIsLoading(false);
          setSessionChecked(true);
        } else if (event === 'USER_UPDATED' && currentUser) {
           console.log('[onAuthStateChange] USER_UPDATED event, re-syncing user data (async).');
           syncUserWithDatabase(currentUser, false);
        }
      }
    );

    const checkInitialSession = async () => {
        console.log('[checkInitialSession] Explicitly checking initial session (will call refreshSession).');
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
      setSession(null); // Limpa a sessão também
      setIsLoading(false);
      setSessionChecked(true); 
    } catch (error: unknown) {
      console.error('[signOut] Error caught during sign out:', error);
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
