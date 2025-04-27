
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Travel from '@/components/Travel';
import Diary from '@/components/Diary';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-cosmic-black text-white">
      <Navbar />
      <Hero />
      <Experience />
      <Projects />
      <Travel />
      <Diary />
      <Footer />
    </div>
  );
};

export default Index;
