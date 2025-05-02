
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Travel from '@/components/Travel';
import Testimonials from '@/components/Testimonials';
import Diary from '@/components/Diary';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

const Index = () => {
  // Add a class to better handle the global mobile styling
  return (
    <div className="min-h-screen bg-cosmic-black text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Skills />
      <Experience />
      <Projects />
      <Testimonials />
      <Travel />
      <Diary />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
