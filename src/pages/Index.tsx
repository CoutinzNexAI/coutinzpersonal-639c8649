
import React from 'react';
import Header from '@/components/Header';
import GhibliHero from '@/components/GhibliHero';
import StudioSection from '@/components/StudioSection';
import GalleryPlaceholder from '@/components/GalleryPlaceholder';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <GhibliHero />
        <StudioSection />
        <div className="ghibli-divider" />
        <GalleryPlaceholder />
        <div className="ghibli-divider" />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
