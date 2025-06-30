import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import GhibliHero from '@/components/GhibliHero'; // Componente principal com texto e área interativa
import InteractiveGallery from '@/components/InteractiveGallery'; // Secção da galeria de exemplos
import Footer from '@/components/Footer'; // Rodapé

import { FirstPurchasePromoModal } from '@/components/FirstPurchasePromoModal';
import { TermsAcceptanceModal } from '@/components/TermsAcceptanceModal';
import { useAuth } from '@/hooks/useAuth';
import { usePicCoins } from '@/hooks/usePicCoins';
import { useFirstPurchasePromo } from '@/hooks/useFirstPurchasePromo';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import { trackLandingPageVisit, trackSessionStart, trackTimeOnPage, trackReturnVisit, trackUserLifecycleStage } from '@/lib/posthog';
import { trackOrganicTraffic } from '@/lib/seo-tracking';
import { toast } from '@/components/ui/sonner';

// Componente funcional para a página de transformações (antiga rota '/')
export default function TransformacoesPage() {
  const { userInfo, isLoading: isAuthLoading } = useAuth();
  const { purchaseCoins } = usePicCoins();
  const { shouldShowPromo, markFirstPurchaseAsUsed, markPromoShown, dismissPromo } = useFirstPurchasePromo();
  const { acceptTerms, rejectTerms, checkTermsAcceptance, loading: termsLoading } = useTermsAcceptance();
  
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Nova lógica: mostrar modal automaticamente quando elegível
  useEffect(() => {
    if (shouldShowPromo) {
      // Pequeno delay para página carregar
      const timer = setTimeout(() => {
        setIsPromoModalOpen(true);
        markPromoShown(); // Incrementar contagem quando modal efetivamente abre
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [shouldShowPromo, markPromoShown]);

  // 🔥 FUNNEL TRACKING: Landing page visit and session tracking
  useEffect(() => {
    const sessionStartTime = Date.now();
    
    // Track SEO and organic traffic
    trackOrganicTraffic({
      user_id: userInfo?.id || null
    });
    
    // Track landing page visit with funnel context
    trackLandingPageVisit({
      user_id: userInfo?.id || null,
      is_authenticated: !!userInfo,
      has_transformations: false, // Simplified - not needed for new promo logic
      is_eligible_for_promo: shouldShowPromo,
      entry_point: 'transformacoes'
    });

    // Track session start
    trackSessionStart({
      user_id: userInfo?.id || null,
      is_authenticated: !!userInfo,
      user_type: userInfo ? 'returning' : 'anonymous'
    });

    // Check if returning visitor and track accordingly
    const lastVisit = localStorage.getItem('last_visit_timestamp');
    if (lastVisit) {
      const daysSinceLastVisit = Math.floor((Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24));
      trackReturnVisit(daysSinceLastVisit, {
        user_id: userInfo?.id || null,
        returning_after_days: daysSinceLastVisit
      });
    }
    localStorage.setItem('last_visit_timestamp', Date.now().toString());

    // Track user lifecycle stage
    if (userInfo) {
      const lifecycleStage = 'new_user'; // Simplified for new promo logic
      trackUserLifecycleStage(lifecycleStage, {
        user_id: userInfo.id,
        transformation_count: 0 // Simplified - not tracking transformations anymore
      });
    }

    // Track time on page when component unmounts
    return () => {
      const timeOnPage = Math.floor((Date.now() - sessionStartTime) / 1000);
      trackTimeOnPage(timeOnPage, 'transformacoes', {
        user_id: userInfo?.id || null,
        session_duration: timeOnPage
      });
    };
  }, [userInfo?.id, shouldShowPromo]);

  // Check terms acceptance after authentication
  useEffect(() => {
    if (userInfo && !isAuthLoading) {
      checkTermsAcceptance().then(hasAccepted => {
        if (!hasAccepted) {
          setShowTermsModal(true);
        }
      });
    }
  }, [userInfo, isAuthLoading, checkTermsAcceptance]);

  // Função para executar o checkout do Stripe
  const executeStripeCheckout = async (packageId: string) => {
    try {
      const sessionId = await purchaseCoins(packageId);
      
      // Redirect to Stripe Checkout
      const stripe = await import('@stripe/stripe-js').then(m => 
        m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      );
      
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Erro na compra', {
        description: error instanceof Error ? error.message : 'Tenta novamente'
      });
    }
  };

  // Quando aceita a promoção
  const handleAcceptPromo = async (promoPackageId: string) => {
    // Marcar primeira compra como usada
    const success = await markFirstPurchaseAsUsed();
    if (!success) {
      toast.error('Erro ao processar promoção');
      return;
    }

    setIsPromoModalOpen(false);
    
    // Executar checkout com preço promocional
    await executeStripeCheckout(promoPackageId);
  };

  const handleClosePromoModal = () => {
    setIsPromoModalOpen(false);
    dismissPromo(); // Track dismissal e manter rate limiting
  };

  const handleTermsAccept = async () => {
    try {
      await acceptTerms();
      setShowTermsModal(false);
    } catch (error) {
      // Error is handled in the hook
      console.error('Failed to accept terms:', error);
    }
  };

  const handleTermsReject = async () => {
    await rejectTerms();
    setShowTermsModal(false);
  };

  return (
    <>
      {/* SEO Meta Tags para Portugal/Brasil */}
      <Head>
        <title>Transformar Fotos com AI - Editor Inteligência Artificial | Pictuz</title>
        <meta name="description" content="🎨 Transforme fotos em arte AI em segundos! Estilo Simpson, Ghibli, LEGO, Azulejo Português e +15 estilos. Gratuito para começar. Resultados profissionais." />
        <meta name="keywords" content="transformar fotos AI Portugal, editor fotos inteligência artificial, arte AI Simpson Ghibli, converter foto pintura azulejo, gerador arte artificial grátis, AI photo editor português" />
        
        {/* Open Graph para redes sociais */}
        <meta property="og:title" content="Pictuz - Transformar Fotos com Inteligência Artificial" />
        <meta property="og:description" content="🎨 Editor AI que transforma fotos em arte Simpson, Ghibli, LEGO, Azulejo. +15 estilos disponíveis. Grátis para começar!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pictuz.com/transformacoes" />
        <meta property="og:image" content="https://pictuz.com/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="pt_PT" />
        <meta property="og:site_name" content="Pictuz" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pictuz - Transformar Fotos com AI" />
        <meta name="twitter:description" content="Transforme fotografias em arte com inteligência artificial" />
        <meta name="twitter:image" content="https://pictuz.com/twitter-image.jpg" />
        
        {/* SEO Técnico */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="language" content="pt-PT" />
        <meta name="geo.region" content="PT" />
        <meta name="geo.country" content="Portugal" />
        <meta name="author" content="Pictuz" />
        <meta name="theme-color" content="#4F6F52" />
        <link rel="canonical" href="https://pictuz.com/transformacoes" />
        
        {/* Google Site Verification */}
        <meta name="google-site-verification" content="l211-Gj4ukj2TaZmwAxFZ8k90fq4Xjc631PfNAhvppM" />
        
        {/* Performance e UX */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Preload critical assets */}
        <link rel="preload" href="/pictuzlogooficial.png" as="image" />
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="" />
        
        {/* Structured Data para SEO */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Pictuz - Editor AI de Fotos",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": ["Windows", "macOS", "iOS", "Android"],
              "description": "Transforme fotos em arte com inteligência artificial. +15 estilos disponíveis incluindo Simpson, Ghibli, LEGO e Azulejo Português.",
              "url": "https://pictuz.com",
              "author": {
                "@type": "Organization",
                "name": "Pictuz"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR",
                "description": "Versão gratuita disponível"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "1200"
              }
            })
          }}
        />
      </Head>

      {/* Layout Ghibli estruturado com cabeçalho, hero, galeria e rodapé */}
      <div className="bg-ghibli-paper min-h-screen relative overflow-hidden">
        {/* Header principal */}
        <Header />

        {/* Componente Hero: título principal + área de upload/demo */}
        <GhibliHero />

        {/* Galeria interativa com exemplos de transformações */}
        <InteractiveGallery />

        {/* Rodapé com links e informações */}
        <Footer />

        {/* Modal de Promoção Primeira Compra - com nova lógica */}
        <FirstPurchasePromoModal 
          isOpen={isPromoModalOpen}
          onClose={handleClosePromoModal}
          onAcceptPromo={handleAcceptPromo}
        />

        {/* Modal de Termos */}
        <TermsAcceptanceModal
          isOpen={showTermsModal}
          onAccept={handleTermsAccept}
          onReject={handleTermsReject}
          loading={termsLoading}
        />
      </div>
    </>
  );
} 