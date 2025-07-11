import { useRouter } from 'next/router';
import { useEffect, ReactNode } from 'react';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/hooks/useAuth';

interface PostHogProviderProps {
  children: ReactNode;
}

// Função para verificar se é conta admin (evita tracking excessivo)
const isAdminAccount = (email?: string | null): boolean => {
  // Em produção, usa role check da BD, mas para performance usa email fallback
  return email ? email.includes('admin') || email.includes('diogolemecoutinho') : false;
};

const PostHogProvider = ({ children }: PostHogProviderProps) => {
  const router = useRouter();
  const { userInfo } = useAuth();

  useEffect(() => {
    // Track page views apenas se não for conta de teste
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        // Verifica se é conta admin
        if (isAdminAccount(userInfo?.email)) {
          return;
        }
        
        posthog.capture('$pageview');
      }
    };

    // Track initial page load
    handleRouteChange();

    // Track route changes
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, userInfo?.email]);

  return <>{children}</>;
};

export default PostHogProvider; 