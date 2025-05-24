// src/components/TransformationStudio.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, LoaderCircle, Check } from "lucide-react";
import Image from 'next/image';

// Componentes de UI e estado importados
import ImageUpload from './ImageUpload';
// StyleSelectorModal será aberto pelo GhibliHero, mas openStyleSelector é uma prop
import ProcessingState from './studio/ProcessingState';
import PaymentState from './studio/PaymentState';
import ErrorState from './studio/ErrorState';
import CompletedState from './studio/CompletedState';
import { Step0Carousel } from './gallery/Step0Carousel'; // Carrossel do Passo 0
import { cn } from '@/lib/utils';
import { UseImageProcessingResult } from '@/hooks/useImageProcessing'; // Importa tipo necessário
import { Style } from '@/components/StyleSelectorModal'; // Importa o tipo Style do seu local correto

// --- Props para o TransformationStudio ---
interface TransformationStudioProps extends Omit<UseImageProcessingResult, 'handleNewImage' | 'currentJobId' | 'setIsStyleModalOpen' | 'isStyleModalOpen'> {
  // Omitimos props que não são diretamente usadas pelo render ou são geridas pelo GhibliHero
  // Adicionamos as que são específicas para o controlo deste componente
  showStepZeroContent: boolean;
  onStartClickForCarousel: () => void; // Para o botão "Começar" do carrossel
  onResetToStepZero: () => void; // Para voltar ao carrossel a partir dos passos do estúdio
  // setActiveStep é parte de UseImageProcessingResult, então já está incluído
}

// --- Componente de Preview Interno (anteriormente em GhibliHero) ---
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
  // Props do useImageProcessing
  uploadedImage,
  selectedStyle,
  processingState,
  transformedImage,
  activeStep,
  isLoading,
  errorMessage,
  availableStyles,
  stylesLoading,
  stylesError,
  handleFileChange,
  openStyleSelector,
  handleStyleSelect,
  handleStartTransformation: initiatePayment,
  // handleNewImage é substituído por onResetToStepZero para o contexto deste componente
  handleDownload,
  setActiveStep, // Adicionado para navegação interna
}) => {

  // Se showStepZeroContent for true, mostra o carrossel
  if (showStepZeroContent) {
    return <Step0Carousel onStartClick={onStartClickForCarousel} />;
  }

  // Caso contrário, mostra o fluxo normal do estúdio baseado no activeStep
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
              <p className="text-sm text-red-600 text-center p-4">Erro ao carregar estilos.</p>
            ) : availableStyles.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableStyles.map((style: Style) => ( // Especificar tipo Style
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
            disabled={!uploadedImage || stylesLoading}
            onClick={openStyleSelector} // Esta função vem das props
          >
            {selectedStyle ? `Estilo: ${selectedStyle.name}` : (stylesLoading ? 'Carregando...' : 'Ver Todos / Escolher')}
          </Button>
          <Button variant="link" onClick={() => setActiveStep(1)} className="mt-2 text-ghibli-moss">Voltar ao Upload</Button>
        </div>
      );
    case 3: // Pagamento / Processamento / Resultado
      if (['awaiting_payment', 'creating_job', 'uploading_image', 'redirecting_to_payment', 'checking_balance', 'spending_coins'].includes(processingState)) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full flex-grow relative">
              <PaymentState
                selectedStyleName={selectedStyle?.name || 'Estilo não definido'}
                onPaymentClick={initiatePayment} // Esta função vem das props
                isRedirecting={isLoading}
                errorMessage={errorMessage}
                processingState={processingState}
              />
            </div>
            <Button variant="link" onClick={() => setActiveStep(2)} className="mt-2 text-ghibli-moss">Escolher outro estilo</Button>
          </div>
        );
      } else if (processingState === 'processing' || processingState === 'polling_status') {
        if (!selectedStyle) return ( <div className="w-full h-full flex flex-col items-center justify-center p-4"> <LoaderCircle className="h-12 w-12 text-ghibli-moss animate-spin mb-4" /> <p>Carregando detalhes...</p> </div> );
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <h3 className="text-xl font-ghibli text-ghibli-wood mb-2 text-center">Processando...</h3>
            <Step3Preview imageUrl={uploadedImage?.preview} styleName={selectedStyle?.name} />
            <p className="text-ghibli-earth text-center text-sm mb-4">A magia está a acontecer!</p>
            <div className="w-full flex-grow">
              <ProcessingState
                uploadedImageUrl={uploadedImage?.preview || ''}
                selectedStyle={selectedStyle}
                progressValue={0} // O progresso real viria do hook se implementado
              />
            </div>
          </div>
        );
      } else if (processingState === 'completed' && transformedImage && selectedStyle) {
        return (
          <div className="w-full h-full flex flex-col p-0">
            <CompletedState
              transformedImageUrl={transformedImage}
              selectedStyle={selectedStyle}
              onDownload={handleDownload} // Esta função vem das props
            />
            <div className="p-4 pt-2 flex-shrink-0">
              <Button className="w-full ghibli-button mt-2" onClick={onResetToStepZero} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Nova Imagem
              </Button>
            </div>
          </div>
        );
      } else if (processingState === 'error') {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <h3 className="text-xl font-ghibli text-ghibli-wood mb-2 text-center text-destructive">Erro</h3>
            <Step3Preview imageUrl={uploadedImage?.preview} styleName={selectedStyle?.name} />
            <div className="w-full flex-grow">
              <ErrorState
                uploadedImageUrl={uploadedImage?.preview || ''}
                errorMessage={errorMessage}
                onReset={onResetToStepZero} // Volta ao início (carrossel)
              />
            </div>
          </div>
        );
      } else {
        // Estado de fallback ou inicial dentro do passo 3
        return ( <div className="text-center p-4 flex flex-col items-center justify-center h-full"> <LoaderCircle className="h-12 w-12 text-ghibli-moss animate-spin mb-4" /> <p>Aguardando...</p> </div> );
      }
    default: // Passo inválido
      return (
        <div className="text-center p-4">
          <p className="text-destructive">Erro: Passo inválido ({activeStep}).</p>
          <Button onClick={onResetToStepZero} variant="outline" size="sm" className="mt-4">Recomeçar</Button>
        </div>
      );
  }
};
