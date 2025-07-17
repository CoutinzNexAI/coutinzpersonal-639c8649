import '@/index.css';
import type { AppProps } from 'next/app';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Analytics } from '@vercel/analytics/react';
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
import PostHogProvider from '@/providers/PostHogProvider';
import { CartProvider } from '@/providers/CartProvider';
import * as fpixel from '@/lib/fpixel';

const queryClient = new QueryClient();

// Função para o tracking do Google Analytics
const pageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || 'G-10LV3QKS59', {
      page_path: url,
    });
  }
};

// Declaração global para a função gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      ...args: (string | object | number | boolean)[]
    ) => void;
  }
}

// Componente principal da Aplicação
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Preconnects para performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://eu.i.posthog.com" />
      <link rel="preconnect" href="https://connect.facebook.net" />
      
      {/* Scripts do Google Analytics (sem alterações) */}
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
            });
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'analytics_storage': 'denied',
              'wait_for_update': 500
            });
          `,
        }}
      />
      
      {/* --- INÍCIO DAS ALTERAÇÕES FINAIS --- */}
      
      {/* PASSO 1: Script de pré-inicialização do consentimento do Píxel */}
      <Script id="facebook-consent-init" strategy="beforeInteractive">
        {`
          if (typeof window !== 'undefined' && localStorage.getItem('cookie_consent') === 'granted') {
            window.fbq=window.fbq||function(){(fbq.q=fbq.q||[]).push(arguments)};
            window.fbq('consent', 'grant');
            console.log('[Consent Init] Consentimento do Píxel pré-definido para GRANTED.');
          }
        `}
      </Script>

      {/* PASSO 2: Scripts do Meta Pixel (agora sem o 'revoke') */}
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
          `,
        }}
      />
      
      {/* --- FIM DAS ALTERAÇÕES FINAIS --- */}
      
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
          <AppWithAuth Component={Component} pageProps={pageProps} />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Componente "Cérebro" que gere o tracking
const AppWithAuth: React.FC<{ Component: React.ComponentType<Record<string, unknown>>; pageProps: Record<string, unknown> }> = ({ Component, pageProps }) => {
  const router = useRouter();

  useEffect(() => {
    const userConsent = typeof window !== 'undefined' ? localStorage.getItem('cookie_consent') : null;

    if (userConsent === 'granted') {
      const handleRouteChange = (url: string) => {
        pageView(url);
        fpixel.pageview();
      };

      // Dispara o primeiro PageView e adiciona o listener para navegações
      pageView(router.pathname);
      fpixel.pageview();
      router.events.on('routeChangeComplete', handleRouteChange);

      return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
      };
    }
  }, [router.events, router.pathname]);

  return (
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
              <Analytics />
            </OrdersModalProvider>
          </AccountSettingsModalProvider>
        </TransformationsModalProvider>
      </PostHogProvider>
    </CartProvider>
  );
};

export default MyApp;