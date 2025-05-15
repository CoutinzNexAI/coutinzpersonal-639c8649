// --- CORREÇÃO DO IMPORT CSS ---
// import '@/styles/globals.css'; // Ficheiro não existe
import '@/index.css'; // Importa o index.css que está em src/
// --- FIM DA CORREÇÃO ---
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
console.log("[_app.tsx] Ficheiro _app.tsx carregado");

function MyApp({ Component, pageProps }: AppProps) {
  console.log("[_app.tsx] Rendering MyApp component...");

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