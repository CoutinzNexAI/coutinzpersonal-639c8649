
import React from 'react';
import { Upload, FileImage, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const StudioSection = () => {
  return (
    <section id="studio" className="py-24 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-ghibli-purple/5 to-transparent"></div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="section-title">Seu Estúdio Criativo</h2>
          <p className="section-subtitle">
            Transforme suas fotografias em verdadeiras obras de arte em apenas três passos simples
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1: Upload */}
          <div className="step-card">
            <div className="mb-6 rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">1. Upload</h3>
            <p className="text-muted-foreground text-center mb-6">
              Carregue a sua fotografia para começar a transformação
            </p>
            <div className="ghibli-card w-full aspect-square flex items-center justify-center border-dashed border-2 border-muted hover:border-primary transition-colors p-4">
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Arraste e solte ou clique para carregar
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Choose Style */}
          <div className="step-card">
            <div className="mb-6 rounded-full bg-primary/10 p-4">
              <div className="h-8 w-8 text-primary flex items-center justify-center font-bold">AI</div>
            </div>
            <h3 className="text-xl font-semibold mb-3">2. Estilo</h3>
            <p className="text-muted-foreground text-center mb-6">
              Escolha um estilo artístico para aplicar à sua imagem
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square ghibli-card p-1 hover:border-primary cursor-pointer transition-all hover:scale-105">
                  <img 
                    src={`https://images.unsplash.com/photo-${1500375592092 + i * 10000}-40eb2168fd21?auto=format&fit=crop&w=300&q=80`} 
                    alt={`Estilo ${i}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full">Escolher Estilo</Button>
          </div>

          {/* Step 3: Result */}
          <div className="step-card">
            <div className="mb-6 rounded-full bg-primary/10 p-4">
              <FileImage className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">3. Resultado</h3>
            <p className="text-muted-foreground text-center mb-6">
              Veja o resultado da transformação da sua imagem
            </p>
            <div className="ghibli-card w-full aspect-square flex items-center justify-center bg-muted/30">
              <div className="text-center">
                <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Sua imagem transformada aparecerá aqui
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full" variant="outline">
              Baixar Resultado
            </Button>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">
            Quer explorar ainda mais possibilidades criativas?
          </p>
          <Button className="ghibli-button group">
            Criar Conta Premium
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default StudioSection;
