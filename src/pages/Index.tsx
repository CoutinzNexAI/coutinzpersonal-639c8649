
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import SkillsShowcase from '@/components/SkillsShowcase';
import WorldMap from '@/components/WorldMap';
import Testimonials from '@/components/Testimonials';
import Newsletter from '@/components/Newsletter';
import Travel from '@/components/Travel';
import Diary from '@/components/Diary';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-cosmic-black text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <SkillsShowcase />
      <Experience />
      <Projects />
      <WorldMap />
      <Travel />
      <Testimonials />
      <Diary />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Index;
