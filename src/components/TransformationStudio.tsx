// src/components/TransformationStudio.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, LoaderCircle, Check } from "lucide-react";
import Image from 'next/image';

import ImageUpload from './ImageUpload';
import ProcessingState from './studio/ProcessingState';
import PaymentState from './studio/PaymentState';
import ErrorState from './studio/ErrorState';
import CompletedState from './studio/CompletedState';
import { Step0Carousel } from './gallery/Step0Carousel';
import { cn } from '@/lib/utils';
import { UseImageProcessingResult } from '@/hooks/useImageProcessing';
import { Style } from '@/components/StyleSelectorModal';

interface TransformationStudioProps extends Omit<UseImageProcessingResult, 
  'handleNewImage' | 
  'currentJobId' | 
  'setIsStyleModalOpen' | 
  'isStyleModalOpen' |
  'handlePaymentClick' // Remover se existir, pois foi substituído
> {
  showStepZeroContent: boolean;
  onStartClickForCarousel: () => void;
  onResetToStepZero: () => void;
  simulatedProgress: number;
  currentJobId: string | null;
  currentRating: number;
}

const Step3Preview: React.FC<{ imageUrl: string | undefined; styleName: string | undefined }> = ({ imageUrl, styleName }) => {
  if (!imageUrl || !styleName) return null;
  return (
    <div className="mb-4 p-3 border rounded-lg bg-white/50 backdrop-blur-sm flex items-center gap-3 w-full max-w-sm mx-auto">
      <div className="w-12 h-12 relative flex-shrink-0 rounded-md overflow-hidden">
        <Image
          src={imageUrl}
          alt="Pré-visualização da imagem carregada"
          fill
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className="text-sm overflow-hidden">
        <p className="text-muted-foreground text-xs">A transformar:</p>
        <p className="font-medium truncate" title={styleName}>Estilo: {styleName}</p>
      </div>
    </div>
  );
};

export const TransformationStudio: React.FC<TransformationStudioProps> = ({
  showStepZeroContent,
  onStartClickForCarousel,
  onResetToStepZero,
  uploadedImage,
  selectedStyle,
  processingState,
  transformedImage,
  activeStep,
  isLoading,
  errorMessage,
  simulatedProgress,
  availableStyles,
  stylesLoading,
  stylesError,
  handleFileChange,
  openStyleSelector,
  handleStyleSelect,
  //  handlePaymentClick: initiatePayment, // <<< LINHA ANTIGA
  handleStartTransformation, // <<< NOVO: Usar o nome da função do hook atualizado
  handleDownload,
  setActiveStep,
  currentJobId,
  currentRating,
}) => {

  if (showStepZeroContent) {
    return <Step0Carousel onStartClick={onStartClickForCarousel} />;
  }

  switch (activeStep) {
    case 1: // Upload
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <h3 className="text-xl font-ghibli text-ghibli-wood mb-2 text-center">Passo 1: Upload</h3>
          <p className="text-ghibli-earth text-center text-sm mb-4">Carregue a sua fotografia para começar</p>
          <div className="w-full max-w-xs aspect-square">
            <ImageUpload onFileChange={handleFileChange} />
          </div>
          <Button variant="link" onClick={onResetToStepZero} className="mt-4 text-ghibli-moss">Voltar</Button>
        </div>
      );
    case 2: // Seleção de Estilo
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <h3 className="text-xl font-ghibli text-ghibli-wood mb-2 text-center">Passo 2: Estilo</h3>
          <p className="text-ghibli-earth text-center text-sm mb-4">Escolha um estilo artístico</p>
          <div className="flex-grow w-full max-w-md overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-ghibli-moss/50 scrollbar-track-ghibli-cream mb-4">
            {stylesLoading ? (
              <div className="flex justify-center items-center h-full"> <LoaderCircle className="h-8 w-8 text-ghibli-moss animate-spin" /> </div>
            ) : stylesError ? (
              <p className="text-sm text-red-600 text-center p-4">Erro ao carregar estilos: {stylesError}</p>
            ) : availableStyles.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableStyles.map((style: Style) => (
                  <button
                    key={style.id}
                    onClick={() => handleStyleSelect(style)}
                    title={style.name}
                    className={cn(
                      `relative w-full aspect-square rounded-lg border-2 overflow-hidden
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ghibli-moss
                       transition-all duration-200 ease-in-out group`,
                      selectedStyle?.id === style.id
                        ? 'border-ghibli-sky ring-2 ring-ghibli-sky'
                        : 'border-ghibli-stone/30 hover:border-ghibli-sky/50'
                    )}
                  >
                    {style.example_image_url ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={style.example_image_url}
                          alt={style.name}
                          fill
                          style={{ objectFit: "cover" }}
                          className="transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-ghibli-stone/10 flex items-center justify-center p-1">
                        <span className="text-xs text-center text-ghibli-wood">{style.name}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs text-center p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">
                      {style.name}
                    </div>
                    {style.is_limited_edition && (
                      <div className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow">P</div>
                    )}
                    {selectedStyle?.id === style.id && (
                      <div className="absolute inset-0 bg-ghibli-sky/20 flex items-center justify-center">
                        <div className="rounded-full bg-ghibli-sky p-1 shadow">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">Nenhum estilo disponível.</p>
            )}
          </div>
          <Button
            className="w-full max-w-xs ghibli-button mt-2"
            disabled={!uploadedImage || stylesLoading || !availableStyles.length} // Adicionado !availableStyles.length
            onClick={openStyleSelector}
          >
            {selectedStyle ? `Estilo: ${selectedStyle.name}` : (stylesLoading ? 'Carregando...' : 'Ver Todos / Escolher')}
          </Button>
          <Button variant="link" onClick={() => setActiveStep(1)} className="mt-2 text-ghibli-moss">Voltar ao Upload</Button>
        </div>
      );
      case 3: // "Pagamento" com PicCoins / Processamento / Resultado
      
      // Estados que mostram o PaymentState (antes de iniciar o processamento real)
      if (['idle', 'checking_balance', 'spending_coins', 'uploading_image', 'creating_job_record', 'triggering_processing'].includes(processingState)) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full flex-grow relative"> {/* Mantém flex-grow para que PaymentState possa usar o espaço */}
              <PaymentState
                selectedStyleName={selectedStyle?.name || 'Estilo não definido'}
                onPaymentClick={handleStartTransformation}
                isRedirecting={isLoading || ['checking_balance', 'spending_coins', 'triggering_processing'].includes(processingState)}
                errorMessage={errorMessage}
                processingState={processingState}
              />
            </div>
            <Button variant="link" onClick={() => setActiveStep(2)} className="mt-2 text-ghibli-moss" disabled={isLoading}>Escolher outro estilo</Button>
          </div>
        );
      } 
      // Estado de Processamento (Polling ou Processando Ativamente)
      else if (processingState === 'processing' || processingState === 'polling_status') {
        // Se o estilo ainda não estiver carregado (caso raro, mas seguro verificar)
        if (!selectedStyle) {
          return ( 
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <LoaderCircle className="h-12 w-12 text-ghibli-moss animate-spin mb-4" />
              <p>Carregando detalhes...</p>
            </div> 
          );
        }
        // Renderiza APENAS o ProcessingState, centrado
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4"> {/* Container pai que centra */}
            <div className="w-full flex-1 flex items-center justify-center"> 
              <ProcessingState
                uploadedImageUrl={uploadedImage?.preview || ''} 
                selectedStyle={selectedStyle} 
                progressValue={simulatedProgress} 
              />
            </div>
          </div>
        );
      } 
      // Estado Concluído
      else if (processingState === 'completed' && transformedImage && selectedStyle) {
        return (
          <div className="w-full h-full flex flex-col"> 
            <div className="flex-1 min-h-0"> 
              <CompletedState
                transformedImageUrl={transformedImage}
                selectedStyle={selectedStyle}
                onDownload={handleDownload}
                transformationId={currentJobId}
                initialRating={currentRating}
              />
            </div>
            <div className="p-4 pt-2 flex-shrink-0 bg-white/90 backdrop-blur-sm border-t border-gray-200">
              <Button className="w-full ghibli-button" onClick={onResetToStepZero} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Nova Imagem
              </Button>
            </div>
          </div>
        );
      } 
      // Estado de Erro
      else if (processingState === 'error') {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            {/* <Step3Preview imageUrl={uploadedImage?.preview} styleName={selectedStyle?.name} />  // <<< REMOVIDO/COMENTADO PARA MELHOR CENTRAMENTO DO ERRO */}
            <div className="w-full flex-grow flex items-center justify-center"> {/* Para centrar o ErrorState */}
              <ErrorState
                uploadedImageUrl={uploadedImage?.preview || ''}
                _errorMessage={errorMessage}
                onReset={onResetToStepZero}
              />
            </div>
          </div>
        );
      } 
      // Estado de Fallback (se activeStep for 3 mas processingState for 'idle' ou desconhecido)
      else {
        return ( 
          <div className="text-center p-4 flex flex-col items-center justify-center h-full"> 
            <LoaderCircle className="h-12 w-12 text-ghibli-moss animate-spin mb-4" /> 
            <p>A preparar o estúdio...</p> 
            <Button onClick={onResetToStepZero} variant="outline" size="sm" className="mt-4">Recomeçar</Button>
          </div> 
        );
      }
  }
}
