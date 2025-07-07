import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import GhibliHero from '@/components/GhibliHero'; // Componente principal com texto e área interativa
import InteractiveGallery from '@/components/InteractiveGallery'; // Secção da galeria de exemplos
import Footer from '@/components/Footer'; // Rodapé

import { TermsAcceptanceModal } from '@/components/TermsAcceptanceModal';
import { useAuth } from '@/hooks/useAuth';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import { trackLandingPageVisit, trackSessionStart, trackTimeOnPage, trackReturnVisit, trackUserLifecycleStage } from '@/lib/posthog';
import { trackOrganicTraffic } from '@/lib/seo-tracking';

// Componente funcional para a página home (antiga rota '/')
export default function HomePage() {
  const { userInfo, isLoading: isAuthLoading } = useAuth();
  const { acceptTerms, rejectTerms, checkTermsAcceptance, loading: termsLoading } = useTermsAcceptance();
  
  const [showTermsModal, setShowTermsModal] = useState(false);

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
      has_transformations: false,
      entry_point: 'home'
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
      const lifecycleStage = 'new_user';
      trackUserLifecycleStage(lifecycleStage, {
        user_id: userInfo.id,
        transformation_count: 0
      });
    }

    // Track time on page when component unmounts
    return () => {
      const timeOnPage = Math.floor((Date.now() - sessionStartTime) / 1000);
      trackTimeOnPage(timeOnPage, 'home', {
        user_id: userInfo?.id || null,
        session_duration: timeOnPage
      });
    };
  }, [userInfo]);

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
        
        {/* Google Site Verification */}
        <meta name="google-site-verification" content="l211-Gj4ukj2TaZmwAxFZ8k90fq4Xjc631PfNAhvppM" />
        
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
                  "description": "Transformações gratuitas disponíveis",
                  "availability": "https://schema.org/InStock"
                },
                "featureList": [
                  "Transformação de fotos com AI",
                  "Estilo Simpson, Ghibli, LEGO, Azulejo",
                  "Mais de 20 estilos artísticos",
                  "Upload fácil e rápido",
                  "Galeria da comunidade",
                  "10 transformações gratuitas por dia",
                  "Resultados em segundos",
                  "Interface em português"
                ],
                "applicationSubCategory": "Photo Editing Software",
                "audience": {
                  "@type": "Audience",
                  "geographicArea": ["Portugal", "Brasil"]
                }
              }
            ])
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
