import { useRouter } from 'next/router';
import { useEffect, ReactNode } from 'react';
import { posthog } from '@/lib/posthog';
import { useAuth } from '@/hooks/useAuth';

interface PostHogProviderProps {
  children: ReactNode;
}

// Função para verificar se é conta de teste (mesma do posthog.ts)
const isTestAccount = (email?: string | null): boolean => {
  const testEmails = ['diogolemecoutinho@gmail.com'];
  return email ? testEmails.includes(email.toLowerCase()) : false;
};

const PostHogProvider = ({ children }: PostHogProviderProps) => {
  const router = useRouter();
  const { userInfo } = useAuth();

  useEffect(() => {
    // Track page views apenas se não for conta de teste
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        // Verifica se é conta de teste
        if (isTestAccount(userInfo?.email)) {
          console.log('PostHog: Pageview bloqueado para conta de teste');
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