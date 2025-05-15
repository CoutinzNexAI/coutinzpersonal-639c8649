// src/providers/AuthProvider.tsx (VERSÃO SIMPLIFICADA - Com Correções ESLint)
"use client"; 

import React, { useState, useEffect, useCallback, createContext, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase/client';
import { Session } // Removida a importação 'User' que não estava a ser usada diretamente
from '@supabase/supabase-js';

export interface UserInfo {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AuthContextType {
  userInfo: UserInfo | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  session: Session | null;
}

// TODO: (Recomendação ESLint) Mover AuthContext para um ficheiro separado para otimizar o Fast Refresh.
// eslint-disable-next-line react-refresh/only-export-components 
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('%c[AuthProvider SIMPLIFICADO] Component INSTANCE created / re-rendered', 'color: orange; font-weight: bold;');
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
  
  const setupEffectHasRun = useRef(false);

  useEffect(() => {
    console.log('%c[AuthProvider SIMPLIFICADO] Main useEffect RUNS', 'color: blue; font-weight: bold;', { isLoadingVal: isLoading, sessionValIsPresent: !!session });

    if (setupEffectHasRun.current) {
      console.log('%c[AuthProvider SIMPLIFICADO] Main useEffect - Setup already run for this instance, skipping full setup.', 'color: blue;');
      // Se o setup já correu e isLoading é true mas não há sessão (estado do componente),
      // pode ser um re-render desnecessário que deixou isLoading true.
      // O onAuthStateChange deve ser a fonte da verdade para isLoading após o setup.
      // Esta condição é uma salvaguarda, mas a lógica principal de isLoading está no onAuthStateChange.
      if (isLoading && !session) { 
           console.log('%c[AuthProvider SIMPLIFICADO] Main useEffect - No session and isLoading is true after setup, setting isLoading false (safeguard).', 'color: blue;');
           setIsLoading(false);
      }
      return; 
    }

    console.log('%c[AuthProvider SIMPLIFICADO] Main useEffect - Performing initial setup (attaching listener, initial check).', 'color: blue;');
    setIsLoading(true); 

    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log(`%c[AuthProvider SIMPLIFICADO] onAuthStateChange event: ${event}`, 'color: green;', { sessionIsPresent: !!currentSession });
      
      setSession(currentSession); 

      if (currentSession?.user) {
        const currentUser = currentSession.user;
        setUserInfo({
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário',
          avatar_url: currentUser.user_metadata?.avatar_url || '',
        });
        console.log('%c[AuthProvider SIMPLIFICADO] onAuthStateChange - UserInfo SET', 'color: green;');
      } else {
        setUserInfo(null);
        console.log('%c[AuthProvider SIMPLIFICADO] onAuthStateChange - UserInfo set to NULL', 'color: green;');
      }
      
      console.log('%c[AuthProvider SIMPLIFICADO] onAuthStateChange - Setting isLoading: false.', 'color: green;');
      setIsLoading(false);
    });

    const checkInitialSession = async () => {
        console.log('%c[AuthProvider SIMPLIFICADO] checkInitialSession - Calling getSession().', 'color: purple;');
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error('[AuthProvider SIMPLIFICADO] checkInitialSession - Error getting session:', error);
            }
            console.log('%c[AuthProvider SIMPLIFICADO] checkInitialSession - getSession() completed. Session found:', 'color: purple;', !!data.session);
            
            // O onAuthStateChange (evento INITIAL_SESSION) é acionado por getSession()
            // e é responsável por definir userInfo, session, e isLoading.
            // Se, após esta chamada, não houver sessão e isLoading ainda for true (vindo do setIsLoading(true) no início deste useEffect),
            // o onAuthStateChange (INITIAL_SESSION com session null) deve tratar de definir isLoading para false.
            // Esta verificação adicional é uma dupla segurança.
            if (!data.session && isLoading) { 
                 console.log('%c[AuthProvider SIMPLIFICADO] checkInitialSession - No session from getSession, ensuring isLoading is false if not handled by onAuthStateChange.', 'color: purple;');
                 setIsLoading(false);
            }
        } catch (e: unknown) { // Corrigido para unknown
            console.error('[AuthProvider SIMPLIFICADO] checkInitialSession - Exception:', e);
            setIsLoading(false); 
        }
    };

    checkInitialSession();
    setupEffectHasRun.current = true; 

    return () => {
      console.log('%c[AuthProvider SIMPLIFICADO] Main useEffect - CLEANUP. Unsubscribing listener. AuthProvider instance is being UNMOUNTED.', 'color: red; font-weight: bold;');
      authListener?.subscription?.unsubscribe();
    };
  // Adicionadas isLoading e session para satisfazer o linter. A lógica setupEffectHasRun.current
  // previne que o setup principal (anexar listener, checkInitialSession) corra mais de uma vez por montagem.
  }, [isLoading, session]); 

  const signInWithGoogle = useCallback(async () => {
    console.log('[AuthProvider SIMPLIFICADO] signInWithGoogle - Attempting...');
    setIsLoading(true);
    try {
      const redirectUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;
      console.log('[AuthProvider SIMPLIFICADO] signInWithGoogle - OAuth call initiated.');
    } catch (error: unknown) { // Corrigido para unknown
      console.error('[AuthProvider SIMPLIFICADO] signInWithGoogle - Error:', error);
      if (error instanceof Error) {
        toast.error("Erro no login com Google", { description: error.message });
      } else {
        toast.error("Erro no login com Google", { description: "Ocorreu um erro desconhecido." });
      }
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('[AuthProvider SIMPLIFICADO] signOut - Attempting...');
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('[AuthProvider SIMPLIFICADO] signOut - signOut call successful.');
      // O onAuthStateChange (evento SIGNED_OUT) deve tratar de limpar userInfo, session, e definir isLoading false.
    } catch (error: unknown) { // Corrigido para unknown
      console.error('[AuthProvider SIMPLIFICADO] signOut - Error:', error);
      if (error instanceof Error) {
        toast.error("Erro ao sair", { description: error.message });
      } else {
        toast.error("Erro ao sair", { description: "Ocorreu um erro desconhecido." });
      }
      // Garante que o estado é limpo e o loading termina em caso de erro no signOut
      setUserInfo(null); 
      setSession(null);
      setIsLoading(false);
    }
  }, []);

  const authContextValue: AuthContextType = {
    userInfo,
    isLoading,
    signInWithGoogle,
    signOut,
    session,
  };

  console.log('%c[AuthProvider SIMPLIFICADO] RENDERING Provider with value:', 'color: orange;', { isLoading, userId: userInfo?.id, sessionIsPresent: !!session });

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
