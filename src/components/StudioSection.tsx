
import React, { useState } from 'react';
import { FileImage, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import ImageUpload, { UploadedFile } from './ImageUpload';
import StyleSelectorModal, { Style } from './StyleSelectorModal';

const StudioSection = () => {
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  
  const handleFileChange = (file: UploadedFile | null) => {
    setUploadedImage(file);
  };
  
  const handleStyleSelect = (style: Style) => {
    setSelectedStyle(style);
    toast.success(`Estilo "${style.name}" selecionado!`);
  };
  
  const openStyleSelector = () => {
    if (uploadedImage) {
      setIsModalOpen(true);
    } else {
      toast.error("Por favor, carregue uma imagem primeiro.");
    }
  };

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
              <div className="h-8 w-8 text-primary flex items-center justify-center font-bold">1</div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Upload</h3>
            <p className="text-muted-foreground text-center mb-6">
              Carregue a sua fotografia para começar a transformação
            </p>
            <div className="w-full aspect-square">
              <ImageUpload onFileChange={handleFileChange} />
            </div>
          </div>

          {/* Step 2: Choose Style */}
          <div className={`step-card ${uploadedImage ? 'opacity-100' : 'opacity-60'}`}>
            <div className="mb-6 rounded-full bg-primary/10 p-4">
              <div className="h-8 w-8 text-primary flex items-center justify-center font-bold">2</div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Estilo</h3>
            <p className="text-muted-foreground text-center mb-6">
              Escolha um estilo artístico para aplicar à sua imagem
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className={`aspect-square ghibli-card p-1 ${uploadedImage ? 'hover:border-primary cursor-pointer transition-all hover:scale-105' : 'opacity-50'}`}
                  onClick={() => uploadedImage && openStyleSelector()}
                >
                  <img 
                    src={`https://images.unsplash.com/photo-${1500375592092 + i * 10000}-40eb2168fd21?auto=format&fit=crop&w=300&q=80`} 
                    alt={`Estilo ${i}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
            <Button 
              className="mt-4 w-full" 
              disabled={!uploadedImage}
              onClick={openStyleSelector}
            >
              {selectedStyle ? `Estilo: ${selectedStyle.name}` : 'Escolher Estilo'}
            </Button>
          </div>

          {/* Step 3: Result */}
          <div className={`step-card ${selectedStyle ? 'opacity-100' : 'opacity-60'}`}>
            <div className="mb-6 rounded-full bg-primary/10 p-4">
              <div className="h-8 w-8 text-primary flex items-center justify-center font-bold">3</div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Resultado</h3>
            <p className="text-muted-foreground text-center mb-6">
              Veja o resultado da transformação da sua imagem
            </p>
            <div className="ghibli-card w-full aspect-square flex items-center justify-center bg-muted/30">
              {selectedStyle ? (
                <div className="relative w-full h-full">
                  {uploadedImage && (
                    <img 
                      src={uploadedImage.preview}
                      alt="Imagem original" 
                      className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center bg-background/80 backdrop-blur-sm p-4 rounded-xl">
                      <p className="font-medium text-lg mb-2">Processando...</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Aplicando o estilo "{selectedStyle.name}"
                      </p>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-2/3 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Sua imagem transformada aparecerá aqui
                  </p>
                </div>
              )}
            </div>
            <Button 
              className="mt-4 w-full" 
              variant="outline" 
              disabled={!selectedStyle}
            >
              Baixar Resultado
            </Button>
          </div>
        </div>

        {/* Style selector modal */}
        <StyleSelectorModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onStyleSelect={handleStyleSelect}
          selectedStyleId={selectedStyle?.id || null}
        />

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
