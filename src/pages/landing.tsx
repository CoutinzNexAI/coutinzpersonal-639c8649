import React from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PromotionalBanner from '@/components/landing/PromotionalBanner';
import HeroSection from '@/components/landing/HeroSection';
import BestSellersSection from '@/components/landing/BestSellersSection';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-ghibli-cream">
      <Head>
        <title>PicTuz - Produtos Personalizados com IA | Canecas, Canvas, Posters</title>
        <meta name="description" content="Transforma as tuas fotos em produtos únicos! Canecas, canvas, posters personalizados com arte gerada por IA. Entrega grátis em Portugal." />
        <meta name="keywords" content="produtos personalizados, canecas personalizadas, canvas personalizado, posters personalizados, arte IA, Portugal" />
        
        {/* Open Graph */}
        <meta property="og:title" content="PicTuz - Produtos Personalizados com IA" />
        <meta property="og:description" content="Transforma as tuas fotos em produtos únicos com arte gerada por IA" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pictuz.com/landing" />
        
        {/* SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://pictuz.com/landing" />
      </Head>

      {/* Banner Promocional */}
      <PromotionalBanner />

      {/* Header */}
      <Header />

      {/* Elementos decorativos de fundo */}
      <div className="absolute top-32 left-10 text-2xl animate-leaf-float opacity-20">🍃</div>
      <div className="absolute bottom-96 right-16 text-xl animate-leaf-float opacity-20">🍂</div>
      <div className="absolute top-64 right-28 text-lg animate-star-twinkle opacity-30">✨</div>
      <div className="absolute bottom-64 left-20 text-xl animate-star-twinkle opacity-30">⭐</div>

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Best Sellers Section */}
        <BestSellersSection />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage; 