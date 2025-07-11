// src/pages/index.tsx
// Página inicial do Pictuz - Redireciona para home.tsx para manter organização
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PromotionalBanner from '@/components/landing/PromotionalBanner';
import HeroSection from '@/components/landing/HeroSection';
import BestSellersSection from '@/components/landing/BestSellersSection';
import ReviewsSection from '@/components/ReviewsSection';
import HowItWorks from '@/components/HowItWorks';
import { FAQSection } from '@/components/FAQSection';
import { TermsAcceptanceModal } from '@/components/TermsAcceptanceModal';
import { useAuth } from '@/hooks/useAuth';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';

const HomePage: React.FC = () => {
  const { userInfo, isLoading: isAuthLoading } = useAuth();
  const { acceptTerms, rejectTerms, checkTermsAcceptance, loading: termsLoading } = useTermsAcceptance();
  
  const [showTermsModal, setShowTermsModal] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-b from-ghibli-paper to-ghibli-cream/50 relative overflow-hidden">
      <Head>
        <title>PicTuz - Produtos Personalizados com IA | Canecas, Canvas, Posters</title>
        <meta name="description" content="Transforma as tuas fotos em produtos únicos! Canecas, canvas, posters personalizados com arte gerada por IA. Entrega grátis em Portugal." />
        <meta name="keywords" content="produtos personalizados, canecas personalizadas, canvas personalizado, posters personalizados, arte IA, Portugal" />
        
        {/* Open Graph */}
        <meta property="og:title" content="PicTuz - Produtos Personalizados com IA" />
        <meta property="og:description" content="Transforma as tuas fotos em produtos únicos com arte gerada por IA" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pictuz.com" />
        
        {/* SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://pictuz.com" />
      </Head>

      {/* Banner Promocional */}
      <PromotionalBanner />

      {/* Header com margem ajustada */}
      <div className="relative z-40 mt-8">
        <Header />
      </div>

      {/* Elementos decorativos de fundo melhorados */}
      <motion.div 
        className="absolute top-32 left-10 text-3xl opacity-20 z-10"
        animate={{ y: [0, -20, 0], rotate: [0, 15, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        🍃
      </motion.div>
      <motion.div 
        className="absolute bottom-96 right-16 text-2xl opacity-20 z-10"
        animate={{ y: [0, 20, 0], rotate: [0, -15, 15, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      >
        🍂
      </motion.div>
      <motion.div 
        className="absolute top-64 right-28 text-2xl opacity-30 z-10"
        animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      >
        ✨
      </motion.div>
      <motion.div 
        className="absolute bottom-64 left-20 text-2xl opacity-30 z-10"
        animate={{ scale: [1, 1.2, 1], rotate: [0, -180, -360] }}
        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
      >
        ⭐
      </motion.div>
      <motion.div 
        className="absolute top-1/2 right-10 text-xl opacity-15 z-10"
        animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      >
        🎨
      </motion.div>

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Best Sellers Section */}
        <BestSellersSection />

        {/* How It Works Section */}
        <HowItWorks />

        {/* Reviews Section */}
        <ReviewsSection />

        {/* FAQ Section */}
        <FAQSection />
      </main>

      <Footer />

      {/* Modal de Termos */}
      <TermsAcceptanceModal
        isOpen={showTermsModal}
        onAccept={handleTermsAccept}
        onReject={handleTermsReject}
        loading={termsLoading}
      />
    </div>
  );
};

export default HomePage; 