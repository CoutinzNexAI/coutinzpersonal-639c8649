
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen pt-20 flex items-center">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-ghibli-purple/10 to-transparent"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-ghibli-pink/20 rounded-full filter blur-3xl animate-pulse-gentle"></div>
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-ghibli-blue/20 rounded-full filter blur-3xl animate-pulse-gentle" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Transforme suas fotos com <span className="text-gradient">magia IA</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground">
              Dê vida às suas fotografias com estilos artísticos únicos, 
              criados através da combinação da estética do Studio Ghibli com 
              tecnologia de inteligência artificial avançada.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="#studio">
                <Button className="ghibli-button group">
                  Começar a Criar
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                Ver Galeria
              </Button>
            </div>
          </div>
          
          <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {/* Main Image */}
            <div className="ghibli-card p-2 rotate-2 animate-float">
              <img 
                src="https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?auto=format&fit=crop&w=800&q=80" 
                alt="Imagem transformada com IA" 
                className="rounded-xl w-full h-auto object-cover"
              />
            </div>
            
            {/* Decorative Images */}
            <div className="absolute -bottom-10 -left-10 ghibli-card p-1 w-32 h-32 -rotate-6 animate-float" style={{ animationDelay: '1s' }}>
              <img 
                src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=300&q=80" 
                alt="Estilo artístico" 
                className="rounded-xl w-full h-full object-cover"
              />
            </div>
            
            <div className="absolute -top-5 -right-5 ghibli-card p-1 w-24 h-24 rotate-12 animate-float" style={{ animationDelay: '2s' }}>
              <img 
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80" 
                alt="Estilo artístico" 
                className="rounded-xl w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
