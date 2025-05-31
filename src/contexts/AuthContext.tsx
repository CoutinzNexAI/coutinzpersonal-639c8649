// src/contexts/AuthContext.ts
import { createContext } from 'react';
import { Session } from '@supabase/supabase-js';

export interface UserInfo {
  id: string;
  email: string;
  full_name?: string; // Opcional é mais seguro aqui
  avatar_url?: string; // Opcional é mais seguro aqui
  first_purchase_used?: boolean; // Novo campo para controlar desconto de primeira compra
}

export interface AuthContextType {
  userInfo: UserInfo | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  session: Session | null; // Corresponde ao que auth_provider_simplified fornece
  refreshUserInfo: () => Promise<void>; // Nova função para forçar refresh
}

// O teu hook useAuth lida bem com 'undefined'
export const AuthContext = createContext<AuthContextType | undefined>(undefined);