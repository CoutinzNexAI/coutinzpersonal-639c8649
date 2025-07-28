
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Projects from '@/components/Projects';
import Experience from '@/components/Experience';
import Skills from '@/components/Skills';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-cosmic-black text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Projects />
      <Experience />
      <Skills />
      <Footer />
    </div>
  );
};

export default Index;
