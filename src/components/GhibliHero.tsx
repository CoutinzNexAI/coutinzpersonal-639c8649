
import React from 'react';
import { Button } from "@/components/ui/button";
import { Wand } from "lucide-react";

const GhibliHero = () => {
  // Function to scroll to studio section
  const scrollToStudio = () => {
    const studioSection = document.getElementById('studio');
    if (studioSection) {
      studioSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-20 pb-16 md:py-24 overflow-hidden">
      {/* Decorative elements */}
      <div className="leaf-decoration top-20 left-10 text-3xl">🍃</div>
      <div className="leaf-decoration bottom-28 right-16 text-2xl">🍂</div>
      <div className="star-decoration top-40 right-28 text-xl">✨</div>
      <div className="star-decoration bottom-16 left-20 text-2xl">✨</div>
      
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          {/* Left side - Text Content */}
          <div className="w-full md:w-5/12 mb-10 md:mb-0 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-ghibli font-bold text-ghibli-wood leading-tight mb-6">
              Dê Magia Ghibli às Suas Fotos
            </h1>
            
            <p className="text-lg text-ghibli-earth mb-8 max-w-md">
              Transforme suas fotografias em obras de arte inspiradas no estilo encantador do famoso estúdio de animação. Uma jornada visual única à espera da sua criatividade.
            </p>
            
            <Button 
              onClick={scrollToStudio}
              className="ghibli-accent-button text-base font-medium flex items-center gap-2"
            >
              <Wand className="h-5 w-5" />
              Começar a Transformar
            </Button>
          </div>
          
          {/* Right side - Tool Placeholder */}
          <div className="w-full md:w-7/12 md:pl-16">
            <div className="ghibli-card p-8 h-72 md:h-96 flex flex-col items-center justify-center animate-fade-in">
              <Wand className="h-16 w-16 text-ghibli-moss mb-6 animate-pulse-gentle" />
              <h3 className="text-2xl font-ghibli text-ghibli-wood mb-2">A sua jornada criativa começa aqui</h3>
              <p className="text-ghibli-earth text-center max-w-md">
                Faça upload da sua foto e veja-a transformada pelo encanto da nossa magia digital
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GhibliHero;
