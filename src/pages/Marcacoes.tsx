import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CalendarGrid } from '@/components/booking/CalendarGrid';
import { Sparkles } from 'lucide-react';

const Marcacoes = () => {
  return (
    <div className="min-h-screen bg-cosmic-black text-white overflow-x-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center justify-center pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300">Disponível para consultas</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 orbitron">
                Vamos conversar?
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                Diogo Coutinho
              </span>
              {' '}— AI & Automações
            </p>
            
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              Escolha um horário disponível para agendar a sua sessão. 
              Segunda a Sexta, das 09:00 às 19:00.
            </p>
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <CalendarGrid />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Marcacoes;


