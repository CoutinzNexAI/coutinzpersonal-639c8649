import React, { useState, useEffect } from 'react';
import { FileImage, ArrowRight, Download, RefreshCw, CheckCircle2, AlertTriangle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Progress } from "@/components/ui/progress";
import ImageUpload, { UploadedFile } from './ImageUpload';
import StyleSelectorModal, { Style } from './StyleSelectorModal';

const StudioSection = () => {
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [progressValue, setProgressValue] = useState(0);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  
  const handleFileChange = (file: UploadedFile | null) => {
    setUploadedImage(file);
    // Reset other states when a new image is uploaded
    setSelectedStyle(null);
    setProcessingState('idle');
    setProgressValue(0);
    setTransformedImage(null);
  };
  
  const handleStyleSelect = (style: Style) => {
    setSelectedStyle(style);
    toast.success(`Estilo "${style.name}" selecionado!`);
    
    // Start the processing simulation
    setProcessingState('processing');
    setProgressValue(0);
    simulateProcessing();
  };
  
  const simulateProcessing = () => {
    // Reset progress
    setProgressValue(0);
    
    // Simulate processing with progress updates
    const interval = setInterval(() => {
      setProgressValue(prev => {
        const newValue = prev + 5;
        
        if (newValue >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Complete the process after full progress
            handleProcessingComplete();
          }, 500);
          return 100;
        }
        
        return newValue;
      });
    }, 300);
  };
  
  const handleProcessingComplete = () => {
    // 10% chance of error for demonstration
    const shouldError = Math.random() < 0.1;
    
    if (shouldError) {
      setProcessingState('error');
      toast.error("Erro ao processar a imagem", {
        description: "Ocorreu um problema durante a transformação."
      });
    } else {
      setProcessingState('completed');
      // Use the original image as the transformed result for placeholder
      setTransformedImage(uploadedImage?.preview || null);
      toast.success("Transformação concluída!", {
        description: "Sua imagem foi transformada com sucesso."
      });
    }
  };
  
  const handleReset = () => {
    // Reset just the processing states but keep the image and style
    setProcessingState('idle');
    setProgressValue(0);
    setTransformedImage(null);
  };
  
  const handleNewImage = () => {
    // Reset everything
    setUploadedImage(null);
    setSelectedStyle(null);
    setProcessingState('idle');
    setProgressValue(0);
    setTransformedImage(null);
  };
  
  const handleDownload = () => {
    if (!transformedImage) return;
    
    // Create an anchor and trigger download
    const link = document.createElement('a');
    link.href = transformedImage;
    link.download = `transformed-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Download iniciado", {
      description: "Sua obra de arte está sendo baixada."
    });
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
            <div className="ghibli-card w-full aspect-square flex items-center justify-center bg-muted/30 overflow-hidden">
              {!selectedStyle ? (
                <div className="text-center">
                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Sua imagem transformada aparecerá aqui
                  </p>
                </div>
              ) : processingState === 'processing' ? (
                <div className="relative w-full h-full">
                  {uploadedImage && (
                    <img 
                      src={uploadedImage.preview}
                      alt="Imagem original" 
                      className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center bg-background/80 backdrop-blur-sm p-6 rounded-xl w-4/5 max-w-xs">
                      <div className="flex items-center justify-center mb-3">
                        <LoaderCircle className="h-8 w-8 text-primary animate-spin" />
                      </div>
                      <p className="font-medium text-lg mb-2">Processando...</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Aplicando o estilo "{selectedStyle.name}"
                      </p>
                      <Progress value={progressValue} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {progressValue}% concluído
                      </p>
                    </div>
                  </div>
                </div>
              ) : processingState === 'error' ? (
                <div className="relative w-full h-full">
                  {uploadedImage && (
                    <img 
                      src={uploadedImage.preview}
                      alt="Imagem original" 
                      className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm grayscale"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center bg-background/80 backdrop-blur-sm p-6 rounded-xl">
                      <div className="flex items-center justify-center mb-3">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                      </div>
                      <p className="font-medium text-lg mb-2 text-destructive">Erro no processamento</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Não foi possível aplicar o estilo. Por favor, tente novamente.
                      </p>
                      <Button 
                        onClick={handleReset}
                        variant="outline"
                        size="sm"
                        className="mr-2"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> 
                        Tentar Novamente
                      </Button>
                    </div>
                  </div>
                </div>
              ) : processingState === 'completed' ? (
                <div className="relative w-full h-full">
                  {transformedImage && (
                    <img 
                      src={transformedImage}
                      alt="Imagem transformada" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/95"
                      onClick={handleDownload}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Baixar
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <div className="rounded-full bg-primary p-1">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          Transformação concluída! 
                        </p>
                        <p className="text-white/80 text-xs">
                          Estilo: {selectedStyle.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button 
                className="flex-1" 
                variant="outline" 
                disabled={processingState !== 'completed'}
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar
              </Button>
              
              <Button
                className="flex-1"
                disabled={!selectedStyle}
                onClick={handleNewImage}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Nova Imagem
              </Button>
            </div>
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
