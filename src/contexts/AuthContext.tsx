import { createContext } from 'react';

// Interface for user information
export interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

// Interface for the context value
export interface AuthContextType {
  userInfo: UserInfo | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// --- Define a Default State ---
// This represents the state before the AuthProvider has initialized
const defaultAuthValue: AuthContextType = {
  userInfo: null,
  isLoading: true, // Start in loading state by default
  signInWithGoogle: async () => { console.warn("AuthProvider not yet initialized"); }, // Placeholder function
  signOut: async () => { console.warn("AuthProvider not yet initialized"); },         // Placeholder function
  refreshSession: async () => { console.warn("AuthProvider not yet initialized"); },  // Placeholder for refreshSession
};
// --- End Default State ---


// Contexto de autenticação
// Provide the default value instead of undefined
export const AuthContext = createContext<AuthContextType>(defaultAuthValue);


