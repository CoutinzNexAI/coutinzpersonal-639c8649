"use client"; // Add this directive at the very top

import React, { useState, useEffect, useCallback } from 'react';
// Assuming you are using sonner based on previous logs
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
// Import context, types, and hook from the dedicated context file
import { AuthContext, AuthContextType, UserInfo } from '@/contexts/AuthContext'; // Ajusta o caminho se necessário

/**
 * Provider de autenticação para a aplicação
 * Gerencia o estado de autenticação e sincronização com o banco de dados
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // *** NEW DEBUG LOG: Check if the component function itself is running ***
  console.log('[AuthProvider Component] Function execution started.');

  // State remains here
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true

  // Sincroniza dados do usuário com o banco de dados
  const syncUserWithDatabase = useCallback(async (user: User) => {
    console.log('[syncUserWithDatabase] Attempting to sync user:', user.id);
    try {
      // Extrai informações do usuário
      const userData: UserInfo = {
        id: user.id,
        email: user.email || '',
        // Ensure metadata exists before accessing properties
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário', // Added fallback name
        avatar_url: user.user_metadata?.avatar_url || '',
      };
      console.log('[syncUserWithDatabase] User data prepared:', userData);

      // Atualiza o banco de dados com as informações do usuário
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: userData.id, // Chave primária
          email: userData.email,
          full_name: userData.full_name,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id' // Se o ID já existir, atualiza em vez de erro
        });

      if (upsertError) {
        console.error("[syncUserWithDatabase] Error upserting user:", upsertError.message);
        toast.error("Erro ao sincronizar perfil", {
          description: upsertError.message,
          // variant: "destructive", // Sonner might not use variant prop
        });
      } else {
        console.log("[syncUserWithDatabase] ✅ User profile synced successfully.");
      }

      // Atualiza o estado da UI
      setUserInfo(userData);

    } catch (error) {
      console.error('[syncUserWithDatabase] Exception:', error);
    }
  }, []); // Removed toast from dependencies

  // Configura o listener de estado de autenticação e sincroniza com a tabela de usuários
  useEffect(() => {
    let isMounted = true; // Flag para evitar updates após desmontar
    console.log('[AuthProvider useEffect] Setting up auth listener and checking session.');

    // Flag to track if the initial state has been set by onAuthStateChange
    let initialAuthStateSet = false;

    // Ouve por futuras mudanças no estado de autenticação FIRST
    console.log('[AuthProvider useEffect] Subscribing to onAuthStateChange...');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[onAuthStateChange] Event received: ${event}. Session exists: ${!!session}`);

        if (!isMounted) {
            console.log('[onAuthStateChange] Component unmounted, ignoring event.');
            return;
        }

        // Set loading true only when starting a significant auth change
         if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
             console.log(`[onAuthStateChange] Setting isLoading: true for event ${event}`);
             setIsLoading(true);
         }
         // For INITIAL_SESSION, we might already be loading from checkSession,
         // but setting it true ensures consistency if checkSession finishes first.
         if (event === 'INITIAL_SESSION') {
             console.log(`[onAuthStateChange] Setting isLoading: true for event ${event}`);
             setIsLoading(true);
             initialAuthStateSet = true; // Mark that the initial state event was received
         }


        const currentUser = session?.user ?? null;
        console.log('[onAuthStateChange] Current user from event:', currentUser?.id || 'null');

        let processed = false; // Flag to track if event led to state change

        // Atualiza o estado da UI com base no evento
        if (currentUser) {
           const currentUserInfo: UserInfo = {
                id: currentUser.id,
                email: currentUser.email || '',
                full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuário',
                avatar_url: currentUser.user_metadata?.avatar_url || ''
            };
           // Avoid unnecessary state updates if user info hasn't changed
           setUserInfo(prevInfo => {
               if (JSON.stringify(prevInfo) !== JSON.stringify(currentUserInfo)) {
                   console.log('[onAuthStateChange] User found, setting userInfo state.');
                   processed = true;
                   return currentUserInfo;
               }
               console.log('[onAuthStateChange] User info unchanged, skipping setUserInfo.');
               return prevInfo;
           });


          // Sincroniza com DB se usuário existe e é um evento relevante
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') { // Sync on initial session too
             console.log(`[onAuthStateChange] Event is ${event}, triggering sync...`);
             await syncUserWithDatabase(currentUser);
             processed = true; // Sync counts as processing
          } else if (event === 'USER_UPDATED') {
              console.log(`[onAuthStateChange] Event is ${event}, triggering sync...`);
              await syncUserWithDatabase(currentUser); // Sync on update too
              processed = true;
          }

        } else { // No currentUser
           console.log(`[onAuthStateChange] No user from event ${event}, setting userInfo to null.`);
           // Only update if userInfo is not already null
           setUserInfo(prevInfo => {
               if (prevInfo !== null) {
                   processed = true;
                   return null;
               }
               return prevInfo;
           });
        }

        // Set loading false only after relevant concluding events have been processed
         if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
            console.log(`[onAuthStateChange] Finished processing ${event}. Setting isLoading: false.`);
            setIsLoading(false);
         } else {
             console.log(`[onAuthStateChange] Event ${event} doesn't conclude loading state.`);
             // Don't set isLoading false here for non-concluding events like USER_UPDATED or TOKEN_REFRESHED
             // Let the next concluding event handle it.
         }
      }
    );

    // Função para verificar a sessão atual (runs AFTER subscribing)
    const checkSession = async () => {
      console.log('[checkSession] Checking initial session...');
      setIsLoading(true); // Set loading true before checking
      try {
        // Add a small delay to potentially allow INITIAL_SESSION to fire first
        // await new Promise(resolve => setTimeout(resolve, 50));

        const { data, error: sessionError } = await supabase.auth.getSession();
        const session = data?.session;
        console.log('[checkSession] getSession response:', { session: !!session, sessionError });

        if (!isMounted) {
            console.log('[checkSession] Component unmounted, aborting state update.');
            return;
        }

        // If onAuthStateChange hasn't already set the initial state AND there's no session,
        // it means the user is definitely logged out initially. Set loading false.
        if (!initialAuthStateSet && !session) {
             console.log('[checkSession] No session and INITIAL_SESSION event likely missed/delayed. Setting isLoading false.');
             setUserInfo(null); // Ensure user info is null
             setIsLoading(false);
        } else if (sessionError) {
             console.error("[checkSession] Error getting initial session:", sessionError.message);
             // If there was an error, ensure loading is false if the listener hasn't handled it
             if (!initialAuthStateSet) {
                 console.log('[checkSession] Error occurred, setting isLoading false.');
                 setUserInfo(null);
                 setIsLoading(false);
             }
        } else {
            // Session check successful, rely on onAuthStateChange to set loading false
            console.log('[checkSession] Session check successful. Relying on onAuthStateChange.');
        }

      } catch (error) {
        console.error("[checkSession] Exception:", error);
        if (isMounted) {
          setUserInfo(null);
          // Ensure loading becomes false on exception too
          console.log('[checkSession] Exception caught, setting isLoading false.');
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // Limpa o listener ao desmontar
    return () => {
      console.log('[AuthProvider useEffect] Cleaning up auth listener.');
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [syncUserWithDatabase]); // Apenas syncUserWithDatabase como dependência

  // Login com Google
  const signInWithGoogle = async () => {
     console.log('[signInWithGoogle] Attempting Google Sign In...');
    try {
      // Set loading true immediately when attempting sign-in
      setIsLoading(true);

      // Ensure window.location.origin is available and correct
      const redirectUrl = window.location.origin;
      console.log(`[signInWithGoogle] Using redirect URL: ${redirectUrl}`);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
          console.error('[signInWithGoogle] Supabase OAuth error:', error);
          throw error; // Rethrow the error to be caught below
      }
      console.log('[signInWithGoogle] signInWithOAuth called successfully. Waiting for redirect...');
      // Keep isLoading true, let onAuthStateChange handle setting it false after redirect

    } catch (error: unknown) {
      console.error('[signInWithGoogle] Login error caught:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro no login", {
        description: errorMessage || "Não foi possível fazer login. Tente novamente.",
      });
       // Ensure loading is false if sign-in fails before redirect
       setIsLoading(false);
    }
  };

  // Logout
  const signOut = async () => {
    console.log('[signOut] Attempting Sign Out...');
    try {
      // Set loading true immediately for sign out
      setIsLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
          console.error('[signOut] Supabase sign out error:', error);
          throw error;
      }

      console.log('[signOut] Sign out successful.');
      // Let onAuthStateChange handle setting userInfo to null and isLoading to false

      toast.success("Logout bem-sucedido", {
        description: "Até breve!",
      });

    } catch (error: unknown) {
      console.error('[signOut] Logout error caught:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao fazer logout", {
        description: errorMessage || "Não foi possível fazer logout. Tente novamente.",
      });
       // Ensure loading is false if sign out fails
       setIsLoading(false);
    }
  };

  // Provide the context value using the imported AuthContext
  const authContextValue = { userInfo, isLoading, signInWithGoogle, signOut };

  // Log less frequently
  // console.log('[AuthProvider Render] Rendering Provider with value:', { isLoading, hasUserInfo: !!userInfo });

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
