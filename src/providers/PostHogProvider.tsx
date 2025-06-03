import { useRouter } from 'next/router';
import { useEffect, ReactNode } from 'react';
import { posthog } from '@/lib/posthog';

interface PostHogProviderProps {
  children: ReactNode;
}

const PostHogProvider = ({ children }: PostHogProviderProps) => {
  const router = useRouter();

  useEffect(() => {
    // Track page views
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
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
  }, [router.events]);

  return <>{children}</>;
};

export default PostHogProvider; 