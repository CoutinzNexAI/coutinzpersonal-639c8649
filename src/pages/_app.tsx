Com certeza. Analisei o seu ficheiro, fiz uma última limpeza e otimização para lhe entregar o código final, pronto para produção.

A lógica é exatamente a mesma que discutimos e que implementámos juntos, mas está um pouco mais limpa e direta, removendo funções intermédias para maior clareza.

Instruções
Abra o seu ficheiro pages/_app.tsx.

Apague todo o conteúdo atual.

Copie e cole o código completo abaixo.

Código Final e Definitivo para pages/_app.tsx
TypeScript

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
import { useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient();

// Função para o tracking do Google Analytics
const pageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || 'G-10LV3QKS59', {
      page_path: url,
    });
  }
};

// Declaração global para a função gtag do Google Analytics
declare global {
  interface Window {
    gtag: (
      command: string,
      ...args: (string | object | number | boolean)[]
    ) => void;
  }
}

// Componente principal da Aplicação - Apenas prepara os providers e os scripts
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Preconnects para performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://eu.i.posthog.com" />
      <link rel="preconnect" href="https://connect.facebook.net" />
      
      {/* Scripts do Google Analytics com modo de consentimento por defeito */}
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
      
      {/* Scripts do Meta Pixel - inicializa em modo "pausado" */}
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
            fbq('consent', 'revoke');
            fbq('init', '${fpixel.FB_PIXEL_ID}');
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
          <AppWithAuth Component={Component} pageProps={pageProps} />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

// Componente "Cérebro" que tem acesso ao contexto de autenticação e gere o tracking
const AppWithAuth: React.FC<{ Component: React.ComponentType<Record<string, unknown>>; pageProps: Record<string, unknown> }> = ({ Component, pageProps }) => {
  const router = useRouter();
  // Obtém o estado de autenticação, incluindo o estado de carregamento e de sincronização
  const { userInfo, isLoading: isAuthLoading, isSyncing } = useAuth();

  useEffect(() => {
    // A CONDIÇÃO FINAL: Só executa a lógica de tracking se a autenticação E a sincronização com a BD tiverem terminado.
    if (!isAuthLoading && !isSyncing) {
      const handleRouteChange = (url: string) => {
        // Track Google Analytics sempre
        pageView(url);
        
        // Track Meta Pixel apenas se houver consentimento
        if (userInfo?.terms_accepted === true) {
          fpixel.pageview();
        }
      };

      // Lógica para o carregamento inicial da página para utilizadores que já deram consentimento
      if (userInfo?.terms_accepted === true) {
        // 1. Dar consentimento ao Píxel para a sessão atual
        fpixel.grantConsent();
        
        // 2. Disparar o primeiro PageView para GA e Meta
        pageView(router.pathname);
        fpixel.pageview();
        
        // 3. Adicionar o listener para as próximas navegações
        router.events.on('routeChangeComplete', handleRouteChange);
      }
      
      // Função de limpeza para remover o listener e evitar memory leaks
      return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
      };
    }
  }, [router.events, router.pathname, userInfo, isAuthLoading, isSyncing]); // Dependências finais e corretas

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