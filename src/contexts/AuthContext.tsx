// src/contexts/AuthContext.ts
import { createContext } from 'react';
import { Session } from '@supabase/supabase-js';

export interface UserInfo {
  id: string;
  email: string;
  full_name?: string; // Opcional é mais seguro aqui
  avatar_url?: string; // Opcional é mais seguro aqui
  accepted_terms?: boolean; // Estado de consentimento GDPR
  terms_accepted_at?: string; // Data de aceitação dos termos
  terms_accepted?: boolean;
}

export interface AuthContextType {
  userInfo: UserInfo | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  session: Session | null; // Corresponde ao que auth_provider_simplified fornece
}

// O teu hook useAuth lida bem com 'undefined'
export const AuthContext = createContext<AuthContextType | undefined>(undefined);