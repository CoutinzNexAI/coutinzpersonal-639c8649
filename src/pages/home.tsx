import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import GhibliHero from '@/components/GhibliHero'; // Componente principal com texto e área interativa
import InteractiveGallery from '@/components/InteractiveGallery'; // Secção da galeria de exemplos
import HowItWorks from '@/components/HowItWorks'; // Secção "Como Funciona"
import Footer from '@/components/Footer'; // Rodapé
import { FAQSection } from '@/components/FAQSection'; // Ajusta o caminho se necessário
import { FirstPurchasePromoModal } from '@/components/FirstPurchasePromoModal';
import { TermsAcceptanceModal } from '@/components/TermsAcceptanceModal';
import { useAuth } from '@/hooks/useAuth';
import { usePicCoins } from '@/hooks/usePicCoins';
import { useFirstPurchaseCheck } from '@/hooks/useFirstPurchaseCheck';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import { useTransformationCount } from '@/hooks/useTransformationCount';
import { trackLandingPageVisit, trackSessionStart, trackTimeOnPage, trackReturnVisit, trackUserLifecycleStage, trackEvent } from '@/lib/posthog';
import { trackOrganicTraffic } from '@/lib/seo-tracking';
import { toast } from '@/components/ui/sonner';

// Componente funcional para a página inicial (rota '/')
export default function HomePage() {
  const { userInfo, isLoading: isAuthLoading } = useAuth();
  const { balance, purchaseCoins } = usePicCoins();
  const { isFirstPurchase, markFirstPurchaseAsUsed } = useFirstPurchaseCheck();
  const { acceptTerms, rejectTerms, checkTermsAcceptance, loading: termsLoading } = useTermsAcceptance();
  const { count: transformationCount, isLoading: countLoading } = useTransformationCount();
  
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Mostrar modal quando:
  // 1. first_purchase_used = false (isFirstPurchase = true)
  // 2. Fez 2 ou 3 transformações (pode ter ganho 1 na comunidade)
  useEffect(() => {
    if (userInfo && !countLoading && isFirstPurchase === true && (transformationCount === 2 || transformationCount === 3)) {
      // Aguardar um pouco para a página carregar completamente
      const timer = setTimeout(() => {
        setIsPromoModalOpen(true);
      }, 1500); // 1.5 segundos delay

      return () => clearTimeout(timer);
    }
  }, [userInfo, isFirstPurchase, transformationCount, countLoading]);

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
      has_transformations: (transformationCount || 0) > 0,
      is_eligible_for_promo: isFirstPurchase,
      entry_point: 'homepage'
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
      let lifecycleStage = 'new_user';
      if ((transformationCount || 0) > 0) {
        if ((transformationCount || 0) > 5) {
          lifecycleStage = 'power_user';
        } else {
          lifecycleStage = 'active_user';
        }
      }
      trackUserLifecycleStage(lifecycleStage, {
        user_id: userInfo.id,
        transformation_count: transformationCount || 0
      });
    }

    // Track time on page when component unmounts
    return () => {
      const timeOnPage = Math.floor((Date.now() - sessionStartTime) / 1000);
      trackTimeOnPage(timeOnPage, 'homepage', {
        user_id: userInfo?.id || null,
        session_duration: timeOnPage
      });
    };
  }, [userInfo?.id, transformationCount, isFirstPurchase]);

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
        <meta property="og:url" content="https://pictuz.com" />
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
        <link rel="canonical" href="https://pictuz.com" />
        
        {/* Performance e UX */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preload" href="/fonts/ghibli-font.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//eu.i.posthog.com" />
        
        {/* PWA hints */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "Pictuz",
                "description": "Transforme fotografias em arte com inteligência artificial",
                "url": "https://pictuz.com",
                "applicationCategory": "MultimediaApplication",
                "operatingSystem": "Web Browser",
                "inLanguage": ["pt-PT", "pt-BR"],
                "creator": {
                  "@type": "Organization",
                  "name": "Pictuz",
                  "url": "https://pictuz.com"
                },
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "EUR",
                  "description": "Créditos gratuitos disponíveis para começar",
                  "availability": "https://schema.org/InStock"
                },
                "featureList": [
                  "Transformação de fotos com AI",
                  "Estilo Simpson, Ghibli, LEGO, Azulejo",
                  "Mais de 20 estilos artísticos",
                  "Upload fácil e rápido",
                  "Galeria da comunidade",
                  "Créditos gratuitos",
                  "Resultados em segundos",
                  "Interface em português"
                ],
                "applicationSubCategory": "Photo Editing Software",
                "audience": {
                  "@type": "Audience",
                  "geographicArea": ["Portugal", "Brasil"]
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "Transformação de Fotos AI",
                "description": "Serviço de transformação de fotografias em arte usando inteligência artificial",
                "provider": {
                  "@type": "Organization",
                  "name": "Pictuz"
                },
                "serviceType": "Photo Editing",
                "areaServed": ["PT", "BR"],
                "hasOfferCatalog": {
                  "@type": "OfferCatalog",
                  "name": "Estilos de Arte AI",
                  "itemListElement": [
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Estilo Simpson",
                        "description": "Transforme fotos no estilo dos Simpsons"
                      }
                    },
                    {
                      "@type": "Offer", 
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Estilo Ghibli",
                        "description": "Arte no estilo Studio Ghibli"
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service", 
                        "name": "Estilo LEGO",
                        "description": "Transforme em blocos LEGO"
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Azulejo Português",
                        "description": "Estilo tradicional azulejo português"
                      }
                    }
                  ]
                }
              }
            ])
          }}
        />
      </Head>

      {/* Container principal da página com layout flexível vertical e cor de fundo */}
    <div className="min-h-screen bg-ghibli-cream flex flex-col">
      {/* Renderiza o cabeçalho */}
      <Header />

      {/* Conteúdo principal da página */}
      {/* flex-grow garante que ocupa o espaço disponível, empurrando o footer para baixo */}
      {/* pt-* adiciona padding no topo para compensar a altura do header fixo */}
      <main className="flex-grow pt-16 md:pt-20">

        {/* Renderiza a secção principal (Hero + Estúdio Interativo) */}
        {/* Toda a lógica de passos (upload, estilo, pagamento, etc.) está encapsulada aqui */}
        <GhibliHero />

        {/* Renderiza as secções inferiores da página */}

        {/* Separador visual customizado (assume que a classe ghibli-divider está definida no CSS global) */}
        <div className="ghibli-divider my-12 md:my-16 lg:my-20" />

        {/* Renderiza a secção da galeria interativa */}
        <InteractiveGallery />

        {/* Outro separador visual */}
        <div className="ghibli-divider my-12 md:my-16 lg:my-20" />

        {/* Renderiza a secção "Como Funciona" */}
        <HowItWorks />

        {/* Renderiza a secção de Perguntas Frequentes */}
        <FAQSection />

      </main> {/* Fim do conteúdo principal */}

      {/* Renderiza o rodpé */}
      <Footer />

      {/* Modal de promoção primeira compra */}
      <FirstPurchasePromoModal
        isOpen={isPromoModalOpen}
        onClose={handleClosePromoModal}
        onAcceptPromo={handleAcceptPromo}
      />

      {/* Terms Acceptance Modal */}
      <TermsAcceptanceModal
        isOpen={showTermsModal}
        onAccept={handleTermsAccept}
        onReject={handleTermsReject}
        userEmail={userInfo?.email}
        loading={termsLoading}
      />
    </div> {/* Fim do container principal */}
    </>
  );
}
