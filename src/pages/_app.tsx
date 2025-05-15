// src/pages/_app.tsx (VERSÃO ORIGINAL RESTAURADA)
import '@/index.css'; // Importa o index.css que está em src/
import type { AppProps } from 'next/app';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/providers/AuthProvider';
import { TransformationsModalProvider } from '@/hooks/transformationsModalContext';
import { AccountSettingsModalProvider } from '@/hooks/accountSettingsModalContext';
import TransformationsModal from '@/components/TransformationsModal';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import FallingElements from '@/components/effects/FallingElements';

const queryClient = new QueryClient();

// Adicionando console.log para verificar se o ficheiro é carregado durante o build/runtime no servidor
console.log("[_app.tsx ORIGINAL] Ficheiro _app.tsx (original) carregado.");

function MyApp({ Component, pageProps, router }: AppProps) { // Adicionado router para logar o caminho
  // Adicionando console.log para verificar a renderização do componente e o caminho
  console.log(`[_app.tsx ORIGINAL] Componente MyApp (original) a renderizar para o caminho: ${router?.asPath || 'caminho desconhecido'}`);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <TransformationsModalProvider>
            <AccountSettingsModalProvider>
              
              <FallingElements />
              
              <Component {...pageProps} />

              <Sonner richColors position="top-right" />

              <TransformationsModal />
              <AccountSettingsModal />

            </AccountSettingsModalProvider>
          </TransformationsModalProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default MyApp;