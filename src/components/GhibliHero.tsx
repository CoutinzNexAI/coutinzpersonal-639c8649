// src/components/GhibliHero.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, LoaderCircle, Check, Images } from "lucide-react"; // Adicionado Images de volta
import { useImageProcessing } from '@/hooks/useImageProcessing'; // Hook principal
import Image from 'next/image';
import { motion } from 'framer-motion'; // Adicionado para animações dos botões

// Componentes de UI usados nos passos do estúdio
import ImageUpload from './ImageUpload';
import StyleSelectorModal from './StyleSelectorModal';
// Componentes de estado (usados no passo 3 do estúdio)
import ProcessingState from './studio/ProcessingState';
import PaymentState from './studio/PaymentState';
import ErrorState from './studio/ErrorState';
import CompletedState from './studio/CompletedState';
import { cn } from '@/lib/utils';

// --- IMPORTA OS NOVOS COMPONENTES REATORIZADOS ---
import { StyleExamplesModal } from './gallery/StyleExamplsModal';
// HeroIntroduction não será mais usado da mesma forma, o seu conteúdo textual será integrado aqui
// e o carrossel será chamado diretamente.
import { Step0Carousel } from './gallery/Step0Carousel';


// --- Componente de Preview (mantido para o Passo 3 do estúdio) ---
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

// --- Componente GhibliHero Principal (Agora com texto persistente) ---
const GhibliHero = () => {
  // --- Hook Principal ---
  const imageProcessing = useImageProcessing();
  const {
    uploadedImage, isStyleModalOpen, selectedStyle, processingState,
    transformedImage, activeStep, isLoading, errorMessage, currentJobId,
    setIsStyleModalOpen, handleFileChange, openStyleSelector, handleStyleSelect,
    handlePaymentClick: initiatePayment, handleNewImage, handleDownload,
    availableStyles, stylesLoading, stylesError
  } = imageProcessing;

  // --- Estado para controlar a exibição do Carrossel (Passo 0) vs Estúdio ---
  const [showStepZeroContent, setShowStepZeroContent] = useState(true);

  // --- Estado para controlar a visibilidade do modal de exemplos ---
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  

  // Ref para o cartão interativo (onde o estúdio ou carrossel é renderizado)
  // Não é mais usado para a linha SVG neste layout.
  const interactiveCardRef = useRef<HTMLDivElement>(null);

  // --- Efeito para log de Job em Progresso (pode ser expandido ou removido) ---
  useEffect(() => {
    if (currentJobId && !['idle', 'uploading_image', 'creating_job'].includes(processingState)) {
      if (['processing', 'polling_status', 'completed', 'error'].includes(processingState) && !selectedStyle) {
        // console.log('[GhibliHero Effect] Job ID found, but waiting for selectedStyle to load.');
      } else {
        // console.log('[GhibliHero Effect] Job ID found, continuing process.');
      }
    }
  }, [currentJobId, processingState, selectedStyle]);

  // --- Funções de Handler para controlar o estado ---
  const handleStartProcessing = () => {
    setShowStepZeroContent(false); // Muda o conteúdo do cartão interativo para o estúdio
  };

  const handleOpenExamples = () => {
    setIsExamplesOpen(true);
  };

  // Função para reiniciar o processo, voltando ao carrossel
  const resetToStepZero = () => {
    handleNewImage(); // Limpa o estado do useImageProcessing
    setShowStepZeroContent(true); // Mostra o carrossel novamente
  }

  // --- Função para renderizar conteúdo dinâmico do Estúdio (Passos 1, 2, 3) ---
  const renderStudioContent = () => {
    // Se showStepZeroContent for true, mostra o carrossel
    if (showStepZeroContent) {
      return <Step0Carousel onStartClick={handleStartProcessing} />;
    }

    // Caso contrário, mostra o fluxo normal do estúdio
    switch (activeStep) {
      case 1: // Upload
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <h3 className="text-xl font-ghibli text-ghibli-wood mb-2 text-center">Passo 1: Upload</h3>
            <p className="text-ghibli-earth text-center text-sm mb-4">Carregue a sua fotografia para começar</p>
            <div className="w-full max-w-xs aspect-square">
              <ImageUpload onFileChange={handleFileChange} />
            </div>
             <Button variant="link" onClick={resetToStepZero} className="mt-4 text-ghibli-moss">Voltar</Button>
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
                  {availableStyles.map((style) => (
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
              onClick={openStyleSelector}
            >
              {selectedStyle ? `Estilo: ${selectedStyle.name}` : (stylesLoading ? 'Carregando...' : 'Ver Todos / Escolher')}
            </Button>
             <Button variant="link" onClick={() => imageProcessing.setActiveStep(1)} className="mt-2 text-ghibli-moss">Voltar ao Upload</Button>
          </div>
        );
      case 3: // Pagamento / Processamento / Resultado
        if (['awaiting_payment', 'creating_job', 'uploading_image', 'redirecting_to_payment'].includes(processingState)) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <div className="w-full flex-grow relative">
                <PaymentState
                  selectedStyleName={selectedStyle?.name || 'Estilo não definido'}
                  onPaymentClick={initiatePayment}
                  isRedirecting={isLoading}
                  errorMessage={errorMessage}
                />
              </div>
               <Button variant="link" onClick={() => imageProcessing.setActiveStep(2)} className="mt-2 text-ghibli-moss">Escolher outro estilo</Button>
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
                  progressValue={0}
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
                onDownload={handleDownload}
              />
              <div className="p-4 pt-2 flex-shrink-0">
                <Button className="w-full ghibli-button mt-2" onClick={resetToStepZero} disabled={isLoading}>
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
              <p className="text-ghibli-earth text-center text-sm mb-4 text-destructive">{errorMessage || "Ocorreu um erro."}</p>
              <div className="w-full flex-grow">
                <ErrorState
                  uploadedImageUrl={uploadedImage?.preview || ''}
                  onReset={resetToStepZero} // Volta ao início
                />
              </div>
            </div>
          );
        } else {
          return ( <div className="text-center p-4 flex flex-col items-center justify-center h-full"> <LoaderCircle className="h-12 w-12 text-ghibli-moss animate-spin mb-4" /> <p>Aguardando...</p> </div> );
        }
      default: // Passo inválido
        return (
          <div className="text-center p-4">
            <p className="text-destructive">Erro: Passo inválido ({activeStep}).</p>
            <Button onClick={resetToStepZero} variant="outline" size="sm" className="mt-4">Recomeçar</Button>
          </div>
        );
    }
  };

  // ---- Renderização Principal do GhibliHero ----
  return (
    <section className="relative pt-20 pb-16 md:py-24 overflow-hidden">
      {/* Elementos Decorativos Flutuantes */}
      <div className="leaf-decoration top-20 left-10 text-3xl">🍃</div>
      <div className="leaf-decoration bottom-28 right-16 text-2xl">🍂</div>
      <div className="star-decoration top-40 right-28 text-xl">✨</div>
      <div className="star-decoration bottom-16 left-20 text-2xl">✨</div>

      {/* Container principal que organiza o texto e o cartão interativo */}
      <div className="container relative mx-auto px-4">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start">
          {/* Lado Esquerdo: Texto Introdutório (Sempre Visível) */}
          <div className="w-full md:w-5/12 mb-10 md:mb-0 md:pr-8 animate-fade-in"> {/* Adicionado pr-8 para espaçamento em desktop */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-ghibli font-bold text-ghibli-wood leading-tight mb-6">
              Transforme as suas Fotos em Obras de Arte!
            </h1>
            <p className="text-lg text-ghibli-earth mb-8 max-w-md leading-relaxed">
              🪄 Transforme fotografias comuns em arte verdadeiramente mágica.<br />
              👍 O processo é simples: envie a foto, escolha o estilo e está feito!<br />
              🖼️ Crie imagens fantásticas, prontas para partilhar onde quiser!
            </p>
            {/* Botões de ação principais, visíveis com o texto */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="ghost" // Pode querer um estilo mais proeminente como 'ghibli-button'
                  className="w-full sm:w-auto text-lg px-6 py-3 text-ghibli-earth hover:text-ghibli-moss inline-flex items-center group justify-center"
                  onClick={handleStartProcessing} // Inicia o estúdio no cartão direito
                  disabled={!showStepZeroContent} // Desabilita se já estiver no estúdio
                >
                  Transforme já a sua foto!
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-lg px-6 py-3 text-ghibli-earth border-ghibli-moss/50 hover:bg-ghibli-moss/10 hover:text-ghibli-moss inline-flex items-center group justify-center"
                  onClick={handleOpenExamples}
                >
                  <Images className="mr-2 h-5 w-5" />
                  Veja exemplos!
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Lado Direito: Cartão Interativo (Carrossel ou Estúdio) */}
          <div ref={interactiveCardRef} className="w-full md:w-7/12 md:pl-8"> {/* Adicionado pl-8 para espaçamento em desktop */}
            <div className="ghibli-card p-0 h-auto min-h-[22rem] md:min-h-[28rem] flex flex-col items-center justify-center animate-fade-in overflow-hidden">
              {renderStudioContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Estilos Principal (usado no Passo 2 do Estúdio) */}
      <StyleSelectorModal
        isOpen={isStyleModalOpen}
        onOpenChange={setIsStyleModalOpen}
        onStyleSelect={handleStyleSelect}
        selectedStyleId={selectedStyle?.id || null}
        styles={availableStyles}
        isLoading={stylesLoading}
        error={stylesError}
      />

      {/* Modal de Exemplos Detalhados */}
      <StyleExamplesModal
        isOpen={isExamplesOpen}
        onOpenChange={setIsExamplesOpen}
        onStartTransformationClick={() => {
          setIsExamplesOpen(false);
          handleStartProcessing(); // Inicia o estúdio
        }}
      />
    </section>
  );
};

export default GhibliHero;
