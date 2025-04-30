
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

interface UserInfo {
  email: string;
  full_name: string;
  avatar_url: string;
}

interface AuthContextType {
  userInfo: UserInfo | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for stored user info on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('estudioUser');
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('estudioUser');
      }
    }
  }, []);

  // Simulated Supabase login with Google
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock user data
      const mockUser: UserInfo = {
        email: 'user@example.com',
        full_name: 'Demo User',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user123',
      };
      
      setUserInfo(mockUser);
      localStorage.setItem('estudioUser', JSON.stringify(mockUser));
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta!",
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: "Não foi possível fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated Supabase logout
  const signOut = async () => {
    try {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUserInfo(null);
      localStorage.removeItem('estudioUser');
      toast({
        title: "Logout bem-sucedido",
        description: "Até breve!",
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ userInfo, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
