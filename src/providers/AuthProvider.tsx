// src/providers/AuthProvider.tsx
"use client"; 

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js'; // Renomeado User para SupabaseUser para evitar conflito se UserInfo fosse chamado User
import { AuthContext, AuthContextType, UserInfo } from '@/contexts/AuthContext'; // Importa do ficheiro separado
import { usePathname } from 'next/navigation';

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

  const syncUserWithDatabase = useCallback(async (authUser: SupabaseUser) => {
    if (!authUser?.id || !authUser?.email) return;

    try {
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (upsertError) {
        if (process.env.NODE_ENV === 'development') {
          console.error("[syncUserWithDatabase] Error upserting user:", upsertError.message);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[syncUserWithDatabase] Exception:', error);
      }
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[refreshSession] Error getting session:', error.message);
        }
        return;
      }

      if (data.session?.user) {
        setUserInfo({
          id: data.session.user.id,
          email: data.session.user.email || '',
          full_name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'User',
          avatar_url: data.session.user.user_metadata?.avatar_url || '',
        });
        await syncUserWithDatabase(data.session.user);
        setSessionChecked(true);
      } else {
        setUserInfo(null);
        setSessionChecked(true);
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[refreshSession] Exception:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sessionChecked, syncUserWithDatabase]);

  useEffect(() => {
    if (sessionChecked && pathname && !isLoading) { 
      refreshSession();
    }
  }, [pathname, sessionChecked, refreshSession, isLoading]);

  useEffect(() => {
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'visible') {
        await refreshSession(); 
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    
    const periodicRefreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && userInfo) {
        refreshSession();
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
            
            // Não bloqueia isLoading para syncUserWithDatabase; deixa-o correr em background.
            // A UI já tem basicUserInfo e isLoading será false em breve.
            syncUserWithDatabase(currentUser).then(() => {
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
           syncUserWithDatabase(currentUser);
        }
      }
    );

    const checkInitialSession = async () => {
        await refreshSession(); 
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
