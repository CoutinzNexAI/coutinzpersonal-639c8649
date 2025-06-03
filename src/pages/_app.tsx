// --- CORREÇÃO DO IMPORT CSS ---
import '@/index.css'; // Importa o index.css que está em src/
// --- FIM DA CORREÇÃO ---
import type { AppProps } from 'next/app';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Analytics } from '@vercel/analytics/react'; // Importa o componente Analytics
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/providers/AuthProvider';
import { TransformationsModalProvider } from '@/hooks/transformationsModalContext';
import { AccountSettingsModalProvider } from '@/hooks/accountSettingsModalContext';
import TransformationsModal from '@/components/TransformationsModal';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import FallingElements from '@/components/effects/FallingElements';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import PostHogProvider from '@/providers/PostHogProvider'; // <<< NOVO: Import PostHog Provider

const queryClient = new QueryClient();

// Google Analytics page view tracking
const pageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || 'G-10LV3QKS59', {
      page_path: url,
    });
  }
};

// Add gtag to Window interface
declare global {
  interface Window {
    gtag: (
      command: string,
      ...args: (string | object | number | boolean)[]
    ) => void;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Track page views on route change
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      pageView(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Initial page load
    pageView(router.pathname);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, router.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Google Analytics Scripts */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || 'G-10LV3QKS59'}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || 'G-10LV3QKS59'}', {
              page_path: window.location.pathname,
              'consent': 'default',
              'ad_storage': 'denied',
              'analytics_storage': 'denied'
            });
            // GDPR consent mode
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'analytics_storage': 'denied',
              'wait_for_update': 500
            });
          `,
        }}
      />
      <PostHogProvider>
        <TooltipProvider>
          <AuthProvider>
            <TransformationsModalProvider>
              <AccountSettingsModalProvider>
                
                <FallingElements />
                
                <Component {...pageProps} />

                <Sonner richColors position="top-right" />

                <TransformationsModal />
                <AccountSettingsModal />
                <Analytics /> {/* Adiciona o componente Analytics aqui */}

              </AccountSettingsModalProvider>
            </TransformationsModalProvider>
          </AuthProvider>
        </TooltipProvider>
      </PostHogProvider>
    </QueryClientProvider>
  );
}

export default MyApp;