import { createContext } from 'react';
import { Session } from '@supabase/supabase-js';

// A "certidão de nascimento" do seu utilizador.
export interface UserInfo {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  terms_accepted?: boolean; // Única propriedade de consentimento necessária aqui
  terms_accepted_at?: string;
}

// A "etiqueta" que descreve o nosso pacote de autenticação completo.
export interface AuthContextType {
  userInfo: UserInfo | null;
  isLoading: boolean;
  isSyncing: boolean; // Propriedade do estado do processo, corretamente aqui.
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  session: Session | null;
}

// O Contexto React que vai transportar estes dados.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);