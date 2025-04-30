import React, { useState } from 'react';
import { ArrowRight, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import ImageUpload, { UploadedFile } from './ImageUpload';
import StyleSelectorModal, { Style } from './StyleSelectorModal';
import StepCard from './studio/StepCard';
import ProcessingState from './studio/ProcessingState';
import PaymentState from './studio/PaymentState';
import ErrorState from './studio/ErrorState';
import CompletedState from './studio/CompletedState';
import StyleThumbnails from './studio/StyleThumbnails';
import { useProcessingSimulation } from '@/hooks/useProcessingSimulation';

const StudioSection = () => {
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [processingState, setProcessingState] = useState<'idle' | 'awaiting_payment' | 'processing' | 'completed' | 'error'>('idle');
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  
  const { progressValue, startProcessing } = useProcessingSimulation({
    onComplete: (success) => {
      if (success) {
        setProcessingState('completed');
        // Use the original image as the transformed result for placeholder
        setTransformedImage(uploadedImage?.preview || null);
        toast.success("Transformação concluída!", {
          description: "Sua imagem foi transformada com sucesso."
        });
      } else {
        setProcessingState('error');
        toast.error("Erro ao processar a imagem", {
          description: "Ocorreu um problema durante a transformação."
        });
      }
    }
  });
  
  const handleFileChange = (file: UploadedFile | null) => {
    setUploadedImage(file);
    // Reset other states when a new image is uploaded
    setSelectedStyle(null);
    setProcessingState('idle');
    setTransformedImage(null);
    
    // Update active step
    setActiveStep(file ? 2 : 1);
  };
  
  const handleStyleSelect = (style: Style) => {
    setSelectedStyle(style);
    toast.success(`Estilo "${style.name}" selecionado!`);
    
    // Move to payment step
    setProcessingState('awaiting_payment');
    setActiveStep(3);
    setIsModalOpen(false);
  };
  
  const handlePaymentClick = () => {
    // Start the processing simulation
    setProcessingState('processing');
    startProcessing();
    
    toast.success("Pagamento processado!", {
      description: "Iniciando transformação da sua imagem..."
    });
  };
  
  const handleReset = () => {
    // Reset just the processing states but keep the image and style
    setProcessingState('awaiting_payment');
    setTransformedImage(null);
  };
  
  const handleNewImage = () => {
    // Reset everything
    setUploadedImage(null);
    setSelectedStyle(null);
    setProcessingState('idle');
    setTransformedImage(null);
    setActiveStep(1);
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
          <StepCard 
            stepNumber={1}
            title="Upload"
            description="Carregue a sua fotografia para começar a transformação"
            isActive={activeStep === 1}
            isEnabled={true}
          >
            <div className="w-full aspect-square">
              <ImageUpload onFileChange={handleFileChange} />
            </div>
          </StepCard>

          {/* Step 2: Choose Style */}
          <StepCard 
            stepNumber={2}
            title="Estilo"
            description="Escolha um estilo artístico para aplicar à sua imagem"
            isActive={activeStep === 2}
            isEnabled={!!uploadedImage}
          >
            <StyleThumbnails 
              uploadedImage={!!uploadedImage}
              onStyleSelectorClick={openStyleSelector}
            />
            <Button 
              className="mt-4 w-full" 
              disabled={!uploadedImage}
              onClick={openStyleSelector}
            >
              {selectedStyle ? `Estilo: ${selectedStyle.name}` : 'Escolher Estilo'}
            </Button>
          </StepCard>

          {/* Step 3: Result */}
          <StepCard 
            stepNumber={3}
            title="Resultado"
            description="Veja o resultado da transformação da sua imagem"
            isActive={activeStep === 3}
            isEnabled={!!selectedStyle}
          >
            <div className="ghibli-card w-full aspect-square flex items-center justify-center bg-muted/30 overflow-hidden">
              {!selectedStyle ? (
                <div className="text-center">
                  <div className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Sua imagem transformada aparecerá aqui
                  </p>
                </div>
              ) : processingState === 'awaiting_payment' ? (
                <PaymentState 
                  uploadedImageUrl={uploadedImage?.preview || ''}
                  onPaymentClick={handlePaymentClick}
                />
              ) : processingState === 'processing' ? (
                <ProcessingState 
                  uploadedImageUrl={uploadedImage?.preview || ''}
                  selectedStyle={selectedStyle}
                  progressValue={progressValue}
                />
              ) : processingState === 'error' ? (
                <ErrorState 
                  uploadedImageUrl={uploadedImage?.preview || ''}
                  onReset={handleReset}
                />
              ) : processingState === 'completed' ? (
                <CompletedState 
                  transformedImageUrl={transformedImage || ''}
                  selectedStyle={selectedStyle}
                  onDownload={handleDownload}
                />
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
          </StepCard>
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
