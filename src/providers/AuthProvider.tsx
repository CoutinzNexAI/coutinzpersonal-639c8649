// src/providers/AuthProvider.tsx (VERSÃO SIMPLIFICADA)
"use client"; 

import React, { useState, useEffect, useCallback, createContext } from 'react';
import { toast } from '@/components/ui/sonner'; // Assumindo que ainda queres toasts para erros
import { supabase } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// Tipos (mantidos para consistência, mas UserInfo pode ser mais simples)
export interface UserInfo {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  // Outros campos que vêm diretamente da tua tabela 'users' podem ser omitidos por agora
}

export interface AuthContextType {
  userInfo: UserInfo | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  session: Session | null; // Expor a sessão completa pode ser útil para debugging
}

// Criação do Contexto (movido para aqui para ser auto-contido neste exemplo)
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[AuthProvider SIMPLIFICADO] Component Function execution started.');
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Começa true até a sessão inicial ser verificada

  // Efeito principal para ouvir o estado de autenticação do Supabase
  useEffect(() => {
    console.log('[AuthProvider SIMPLIFICADO] useEffect - Setting up onAuthStateChange listener.');
    setIsLoading(true); // Define loading no início da configuração

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthProvider SIMPLIFICADO] onAuthStateChange event: ${event}, session:`, session);
      
      setSession(session); // Guarda a sessão completa

      if (session?.user) {
        const currentUser = session.user;
        setUserInfo({
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário',
          avatar_url: currentUser.user_metadata?.avatar_url || '',
        });
      } else {
        setUserInfo(null);
      }
      
      // Define isLoading como false APÓS o primeiro evento (INITIAL_SESSION) ser processado
      // ou qualquer evento subsequente de login/logout.
      setIsLoading(false);
    });

    // Verifica a sessão inicial explicitamente uma vez para acionar o INITIAL_SESSION mais rapidamente
    // e definir isLoading corretamente.
    const checkInitialSession = async () => {
        console.log('[AuthProvider SIMPLIFICADO] checkInitialSession - Explicitly calling getSession().');
        const { data } = await supabase.auth.getSession();
        // O onAuthStateChange deverá tratar de definir os estados com base nesta chamada,
        // mas garantimos que isLoading é falso se não houver sessão após esta verificação.
        if (!data.session) {
            console.log('[AuthProvider SIMPLIFICADO] checkInitialSession - No session found, setting isLoading false.');
            setIsLoading(false);
        }
    };
    checkInitialSession();

    return () => {
      console.log('[AuthProvider SIMPLIFICADO] useEffect - Cleaning up onAuthStateChange listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Corre apenas uma vez na montagem

  const signInWithGoogle = useCallback(async () => {
    console.log('[AuthProvider SIMPLIFICADO] signInWithGoogle - Attempting...');
    setIsLoading(true); // Define loading antes de iniciar o OAuth
    try {
      const redirectUrl = window.location.origin; // Para produção, deve ser o teu URL de produção
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) {
        throw error;
      }
      // Não definimos isLoading(false) aqui; o onAuthStateChange tratará disso após o redirecionamento.
      console.log('[AuthProvider SIMPLIFICADO] signInWithGoogle - signInWithOAuth called. Waiting for redirect.');
    } catch (error: unknown) {
      console.error('[AuthProvider SIMPLIFICADO] signInWithGoogle - Error:', error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro.";
      toast.error("Erro no login com Google", { description: errorMessage });
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('[AuthProvider SIMPLIFICADO] signOut - Attempting...');
    setIsLoading(true); // Define loading antes de chamar signOut
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // setUserInfo(null) e setIsLoading(false) serão tratados pelo onAuthStateChange (evento SIGNED_OUT)
      console.log('[AuthProvider SIMPLIFICADO] signOut - signOut called successfully.');
    } catch (error: unknown) {
      console.error('[AuthProvider SIMPLIFICADO] signOut - Error:', error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro.";
      toast.error("Erro ao sair", { description: errorMessage });
      // Mesmo com erro, tenta garantir que a UI reflete um estado de "não logado"
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

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
