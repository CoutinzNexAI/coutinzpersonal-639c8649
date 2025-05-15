"use client"; // Add this directive at the very top

import React, { useState, useEffect, useCallback } from 'react';
// Assuming you are using sonner based on previous logs
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
// Import context, types, and hook from the dedicated context file
import { AuthContext, AuthContextType, UserInfo } from '@/contexts/AuthContext'; // Ajusta o caminho se necessário
import { usePathname } from 'next/navigation'; // Import for page navigation detection

/**
 * Provider de autenticação para a aplicação
 * Gerencia o estado de autenticação e sincronização com o banco de dados
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // *** NEW DEBUG LOG: Check if the component function itself is running ***
  console.log('[AuthProvider Component] Function execution started.');

  // For detecting navigation changes
  const pathname = usePathname();

  // State remains here
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true
  const [sessionChecked, setSessionChecked] = useState(false);

  // Safety timeout to ensure isLoading is never stuck indefinitely
  useEffect(() => {
    if (isLoading) {
      const safetyTimeout = setTimeout(() => {
        console.log('[Safety Timeout] Forcing isLoading to false after timeout');
        setIsLoading(false);
        setSessionChecked(true);
      }, 8000); // 8 seconds should be more than enough for any auth operation

      return () => clearTimeout(safetyTimeout);
    }
  }, [isLoading]);

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

  // Create a function to refresh the session state that can be called from other effects
  const refreshSession = useCallback(async (setLoadingState = true) => {
    console.log('[refreshSession] Refreshing session state...');
    if (setLoadingState) {
      setIsLoading(true);
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[refreshSession] Error getting session:', error.message);
        return;
      }
      
      const session = data?.session;
      if (session?.user) {
        console.log('[refreshSession] Session found, user ID:', session.user.id);
        const userData: UserInfo = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
          avatar_url: session.user.user_metadata?.avatar_url || ''
        };
        setUserInfo(userData);
        
        // Also sync with database to ensure all user data is properly loaded
        await syncUserWithDatabase(session.user);
        console.log('[refreshSession] User data synced with database');
      } else {
        console.log('[refreshSession] No active session found');
        setUserInfo(null);
      }
    } catch (e) {
      console.error('[refreshSession] Exception:', e);
    } finally {
      setIsLoading(false);
      setSessionChecked(true);
    }
  }, [syncUserWithDatabase]);

  // Check session explicitly on path change to ensure auth state persists across navigations
  useEffect(() => {
    if (sessionChecked) {
      console.log(`[PathChange] Detected navigation to: ${pathname}`);
      refreshSession(false); // Don't set loading on navigation changes
    }
  }, [pathname, sessionChecked, refreshSession]);

  // Add visibility change handler to refresh session when tab becomes visible again
  useEffect(() => {
    console.log('[visibilityChange] Setting up visibility and focus handlers');
    
    const handleVisibilityOrFocus = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[visibilityOrFocus] Tab visible again, forcing session refresh');
        setIsLoading(true); // Define o estado de carregamento no início

        try {
          // Força a atualização da sessão do Supabase
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('[visibilityOrFocus] Error refreshing session:', error.message);
            setUserInfo(null);
            // setIsLoading(false) será tratado no bloco finally
            return; // Sai mais cedo em caso de erro na obtenção da sessão
          }
          
          const session = data?.session;
          console.log('[visibilityOrFocus] Session check result:', !!session);
          
          if (session?.user) {
            // Atualiza a UI com dados básicos da sessão primeiro para feedback rápido (ex: avatar)
            const basicUserData: UserInfo = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
              avatar_url: session.user.user_metadata?.avatar_url || ''
            };
            setUserInfo(basicUserData);

            // DEPOIS, espera pela sincronização completa com a base de dados.
            // syncUserWithDatabase também chama setUserInfo internamente com os dados da BD.
            await syncUserWithDatabase(session.user); 
            console.log('[visibilityOrFocus] Successfully refreshed user session AND synced with DB.');
          } else {
            console.log('[visibilityOrFocus] No session found, setting user to null');
            setUserInfo(null);
          }
        } catch (error) {
          console.error('[visibilityOrFocus] Exception during session refresh:', error);
          setUserInfo(null); // Limpa o estado do utilizador em caso de excepção
        } finally {
          // Define isLoading como false APENAS DEPOIS de todas as operações terem terminado
          setIsLoading(false); 
          setSessionChecked(true); // Confirma que a verificação de sessão (despoletada pelo foco) foi feita
        }
      }
    };
    
    // Anexa os listeners de eventos
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    
    // Configura um refresh periódico da sessão
    const periodicRefreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && userInfo) { // Só faz refresh periódico se houver um utilizador
        console.log('[periodicRefresh] Running scheduled session refresh for logged-in user');
        handleVisibilityOrFocus(); // Reutiliza a mesma lógica
      }
    }, 5 * 60 * 1000); // A cada 5 minutos
    
    // Limpeza
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      clearInterval(periodicRefreshInterval);
    };
  }, [syncUserWithDatabase, userInfo]); // Adiciona userInfo às dependências do useEffect para o refresh periódico

  // Configura o listener de estado de autenticação e sincroniza com a tabela de usuários
  useEffect(() => {
    let isMounted = true; // Flag para evitar updates após desmontar
    console.log('[AuthProvider useEffect] Setting up auth listener and checking session.');

    // Flag to track if the initial state has been set by onAuthStateChange
    let initialAuthStateSet = false;

    // Force a refresh of the auth library to ensure it has latest cookies
    const refreshAuthLibrary = async () => {
      try {
        console.log('[refreshAuthLibrary] Forcing Supabase auth library refresh...');
        // This forces Supabase to check for cookies again
        await supabase.auth.getSession();
        console.log('[refreshAuthLibrary] Auth library refreshed successfully');
      } catch (error) {
        console.error('[refreshAuthLibrary] Error refreshing auth library:', error);
      }
    };

    // Refresh auth library immediately
    refreshAuthLibrary().then(() => {
      if (isMounted) {
        // Only continue with auth checks if component is still mounted
        console.log('[AuthProvider useEffect] Auth library refreshed, continuing with auth setup');
      }
    });

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
                   return currentUserInfo;
               }
               console.log('[onAuthStateChange] User info unchanged, skipping setUserInfo.');
               return prevInfo;
           });


          // Sincroniza com DB se usuário existe e é um evento relevante
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') { // Sync on initial session too
             console.log(`[onAuthStateChange] Event is ${event}, triggering sync...`);
             await syncUserWithDatabase(currentUser);
          } else if (event === 'USER_UPDATED') {
              console.log(`[onAuthStateChange] Event is ${event}, triggering sync...`);
              await syncUserWithDatabase(currentUser); // Sync on update too
          }

        } else { // No currentUser
           console.log(`[onAuthStateChange] No user from event ${event}, setting userInfo to null.`);
           // Only update if userInfo is not already null
           setUserInfo(prevInfo => {
               if (prevInfo !== null) {
                   return null;
               }
               return prevInfo;
           });
        }

        // Set loading false only after relevant concluding events have been processed
         if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
            console.log(`[onAuthStateChange] Finished processing ${event}. Setting isLoading: false.`);
            setIsLoading(false);
            setSessionChecked(true); // Mark that initial session check is complete
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
        // Add a delay to ensure cookies are initialized
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data, error: sessionError } = await supabase.auth.getSession();
        const session = data?.session;
        console.log('[checkSession] getSession response:', { session: !!session, error: !!sessionError });

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
             setSessionChecked(true); // Mark that initial session check is complete
        } 
        // Check if there was an error fetching the session
        else if (sessionError) {
             console.error("[checkSession] Error getting initial session:", sessionError.message);
             // If there was an error, ensure loading is false if the listener hasn't handled it
             if (!initialAuthStateSet) {
                 console.log('[checkSession] Error occurred, setting isLoading false.');
                 setUserInfo(null);
                 setIsLoading(false); 
                 setSessionChecked(true); // Mark that initial session check is complete
             }
        } 
        // User has a session but INITIAL_SESSION event wasn't fired
        else if (session?.user && !initialAuthStateSet) {
            // Session exists but no INITIAL_SESSION event yet - populate user info manually
            console.log('[checkSession] Session exists but no INITIAL_SESSION event yet, populating user data manually');
            const userData: UserInfo = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
              avatar_url: session.user.user_metadata?.avatar_url || ''
            };
            setUserInfo(userData);
            await syncUserWithDatabase(session.user);
            setIsLoading(false);
            setSessionChecked(true); // Mark that initial session check is complete
        } 
        // INITIAL_SESSION has already been handled by the auth listener
        else {
            // Session check successful, rely on onAuthStateChange to set loading false
            console.log('[checkSession] Session check successful. Relying on onAuthStateChange.');
            // Ensure we always exit the loading state after a reasonable timeout
            setTimeout(() => {
                if (isLoading) {
                    console.log('[checkSession] Timeout reached, forcing isLoading to false');
                    setIsLoading(false);
                    setSessionChecked(true);
                }
            }, 3000); // 3 second timeout as safety
        }
      } catch (error) {
        console.error("[checkSession] Exception:", error);
        if (isMounted) {
          setUserInfo(null);
          // Ensure loading becomes false on exception too
          console.log('[checkSession] Exception caught, setting isLoading false.');
          setIsLoading(false);
          setSessionChecked(true); // Mark that initial session check is complete
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncUserWithDatabase, refreshSession]);

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

  // Add explicit session refresh method
  const signOut = async () => {
    console.log('[signOut] Attempting to sign out...');
    // Set loading state to indicate auth change is in progress
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
          console.error('[signOut] Sign out error:', error);
          throw error;
      }
      console.log('[signOut] Signed out successfully.');
      // Set state directly for immediate UI feedback
      setUserInfo(null);
      setIsLoading(false);
      setSessionChecked(true);
      // Let onAuthStateChange handle additional cleanup if needed
    } catch (error: unknown) {
      console.error('[signOut] Error caught during sign out:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao sair", {
        description: errorMessage || "Não foi possível encerrar a sessão corretamente.",
      });
      // Manually reset loading and user state on error
      setIsLoading(false);
      setUserInfo(null);
      setSessionChecked(true);
    }
  };

  // Auth context value to be provided
  const authContextValue: AuthContextType = {
    userInfo,
    isLoading,
    signInWithGoogle,
    signOut,
    // Add the refresh method to the context for external components to use if needed
    refreshSession: () => refreshSession(false)
  };

  // Render the provider
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
