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
import { OrdersModalProvider } from '@/hooks/ordersModalContext';
import TransformationsModal from '@/components/TransformationsModal';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import { OrdersModal } from '@/components/OrdersModal';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import PostHogProvider from '@/providers/PostHogProvider'; // <<< NOVO: Import PostHog Provider
import { CartProvider } from '@/providers/CartProvider';
import * as fpixel from '@/lib/fpixel';

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
      fpixel.pageview();
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Initial page load
    pageView(router.pathname);
    fpixel.pageview();

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, router.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Preconnect para performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://eu.i.posthog.com" />
      <link rel="preconnect" href="https://connect.facebook.net" />
      
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
      
      {/* Meta Pixel Scripts */}
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fpixel.FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{display: 'none'}}
          src={`https://www.facebook.com/tr?id=${fpixel.FB_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
          <PostHogProvider>
            <TransformationsModalProvider>
              <AccountSettingsModalProvider>
                <OrdersModalProvider>
                  
                  <Component {...pageProps} />

                  <Sonner richColors position="top-right" />

                  <TransformationsModal />
                  <AccountSettingsModal />
                  <OrdersModal />
                  <Analytics /> {/* Adiciona o componente Analytics aqui */}

                </OrdersModalProvider>
              </AccountSettingsModalProvider>
            </TransformationsModalProvider>
          </PostHogProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default MyApp;