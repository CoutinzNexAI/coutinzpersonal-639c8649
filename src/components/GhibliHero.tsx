import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Importa framer-motion
import { Button } from "@/components/ui/button";
// Removido ArrowRight dos imports
import { Wand, Download, RefreshCw, LoaderCircle, Image as ImageIcon, Check } from "lucide-react";
import { useImageProcessing } from '@/hooks/useImageProcessing'; // Hook principal

// Importa componentes de UI usados nos passos
import ImageUpload from './ImageUpload';
import StyleSelectorModal, { Style } from './StyleSelectorModal'; // Importa Modal e tipo Style
// Importa componentes de estado (usados no passo 3)
import ProcessingState from './studio/ProcessingState';
import PaymentState from './studio/PaymentState';
import ErrorState from './studio/ErrorState';
import CompletedState from './studio/CompletedState';
import { cn } from '@/lib/utils'; // Importa cn

// --- IMPORTA O NOVO COMPONENTE DO CARROSSEL ---
// Ajusta o caminho se o colocaste noutra pasta (ex: gallery)
import { Step0Carousel } from './gallery/Step0Carousel'; // Atualizado caminho conforme último código fornecido

// --- Componente de Preview (mantido igual) ---
const Step3Preview: React.FC<{ imageUrl: string | undefined; styleName: string | undefined }> = ({ imageUrl, styleName }) => {
    if (!imageUrl || !styleName) return null;
    return (
      <div className="mb-4 p-3 border rounded-lg bg-white/50 backdrop-blur-sm flex items-center gap-3 w-full max-w-sm mx-auto">
        <img
          src={imageUrl}
          alt="Pré-visualização"
          className="w-12 h-12 object-cover rounded-md flex-shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="text-sm overflow-hidden">
          <p className="text-muted-foreground text-xs">A transformar:</p>
          <p className="font-medium truncate" title={styleName}>Estilo: {styleName}</p>
        </div>
      </div>
    );
};

// --- Componente GhibliHero Principal ---
const GhibliHero = () => {
  // --- Hook Principal (mantido igual) ---
  const {
    uploadedImage, isStyleModalOpen, selectedStyle, processingState,
    transformedImage, activeStep, isLoading, errorMessage, currentJobId,
    setIsStyleModalOpen, handleFileChange, openStyleSelector, handleStyleSelect,
    handlePaymentClick: initiatePayment, handleNewImage, handleDownload,
    availableStyles, stylesLoading, stylesError
  } = useImageProcessing();

  // --- Estado para controlar Passo 0 ---
  const [showStepZero, setShowStepZero] = useState(true);

  // --- Refs para os elementos ---
  const startButtonRef = useRef<HTMLButtonElement>(null); // Ref para o botão "Transforme já"
  const interactiveCardRef = useRef<HTMLDivElement>(null); // Ref para o cartão interativo
  const [svgPathD, setSvgPathD] = useState<string>(""); // Estado para o path SVG

  // --- Função para calcular o caminho SVG ---
  const calculatePath = useCallback(() => {
    // Agora usa startButtonRef
    if (startButtonRef.current && interactiveCardRef.current) {
      const buttonRect = startButtonRef.current.getBoundingClientRect();
      const cardRect = interactiveCardRef.current.getBoundingClientRect();
      const containerRect = startButtonRef.current.closest('.container')?.getBoundingClientRect();

      if (!containerRect) return;

      // Ponto inicial: Meio direito do botão "Transforme já"
      const startX = buttonRect.right - containerRect.left;
      const startY = buttonRect.top + buttonRect.height / 2 - containerRect.top;

      // Ponto final: Meio da borda esquerda do cartão interativo (com offset)
      const endX = cardRect.left - containerRect.left + 10;
      const endY = cardRect.top + cardRect.height / 2 - containerRect.top;

      // Pontos de controlo para Curvas de Bézier Cúbicas (C) para criar "nós"
      // Ajustar estes valores requer experimentação visual!
      const curveFactor = 0.4; // Quão pronunciados são os nós (0 a 1)
      const midPointX = startX + (endX - startX) * 0.7;
      const midPointY = startY + (endY - startY) * 0.4;

      // Controles para a primeira curva (saindo do botão)
      const cp1X = startX + (midPointX - startX) * 1;
      const cp1Y = startY - (startY - midPointY) * curveFactor * -2; // Nó para cima

      const cp2X = midPointX - (midPointX - startX) * curveFactor;
      const cp2Y = midPointY + (midPointY - startY) * curveFactor * 0.8; // Nó para baixo

      // Controles para a segunda curva (chegando ao cartão)
      const cp3X = midPointX + (endX - midPointX) * curveFactor;
      const cp3Y = midPointY - (endY - midPointY) * curveFactor * 0; // Nó para cima

      const cp4X = endX - (endX - midPointX) * 0.2;
      const cp4Y = endY + (endY - midPointY) * curveFactor * 0; // Curva final para baixo

      // Define o atributo 'd' para o path SVG: M = MoveTo, C = Cubic Bézier curve
      // M startX startY C cp1X cp1Y, cp2X cp2Y, midPointX midPointY C cp3X cp3Y, cp4X cp4Y, endX endY
      // Simplificado para uma única curva C para testar, ajustar depois
      // setSvgPathD(`M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`);

      // Tentativa com 2 curvas C (mais complexo)
       setSvgPathD(
         `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${midPointX} ${midPointY} C ${cp3X} ${cp3Y}, ${cp4X} ${cp4Y}, ${endX} ${endY}`
       );

    }
  }, []); // Sem dependências diretas, usa refs

  // --- Efeito para calcular o path SVG ---
  useEffect(() => {
    // Calcula o path sempre que showStepZero muda (para calcular quando passa a false)
    if (!showStepZero) {
        setTimeout(calculatePath, 50); // Delay para garantir que o botão está no DOM
    }

    const handleResize = () => {
        if (!showStepZero) {
            setTimeout(calculatePath, 50);
        }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculatePath, showStepZero]); // Recalcula quando showStepZero muda

  // --- Efeito para Job em Progresso (mantido igual) ---
  useEffect(() => {
     if (currentJobId && !['idle', 'uploading_image', 'creating_job'].includes(processingState)) {
       if (['processing', 'polling_status', 'completed', 'error'].includes(processingState) && !selectedStyle) {
           console.log('[GhibliHero Effect] Job ID found, but waiting for selectedStyle to load.');
       } else {
           console.log('[GhibliHero Effect] Job ID found, continuing process.');
       }
     }
  }, [currentJobId, processingState, selectedStyle]);

  // --- Função para iniciar o processo (sair do Passo 0) ---
  const handleStartProcessing = () => {
    setShowStepZero(false);
    // O useEffect acima tratará de chamar calculatePath
  };


  // --- Função para renderizar conteúdo dinâmico (mantida igual) ---
  const renderStudioContent = () => {
    switch (activeStep) {
      // ----- PASSO 1: UPLOAD -----
      case 1:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <h3 className="text-xl font-ghibli text-ghibli-wood mb-2 text-center">Passo 1: Upload</h3>
            <p className="text-ghibli-earth text-center text-sm mb-4">Carregue a sua fotografia para começar</p>
            <div className="w-full max-w-xs aspect-square">
              <ImageUpload onFileChange={handleFileChange} />
            </div>
          </div>
        );

      // ----- PASSO 2: SELEÇÃO DE ESTILO -----
      case 2:
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
                        <img
                          src={style.example_image_url}
                          alt={style.name}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100/EEE/31343C?text=Erro')}
                        />
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
          </div>
        );

      // ----- PASSO 3: PAGAMENTO / PROCESSAMENTO / RESULTADO -----
      case 3:
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
                  progressValue={0} // Progresso ainda não implementado
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
                <Button className="w-full ghibli-button mt-2" onClick={handleNewImage} disabled={isLoading}>
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
                  onReset={handleNewImage}
                />
              </div>
            </div>
          );
        } else {
          return ( <div className="text-center p-4 flex flex-col items-center justify-center h-full"> <LoaderCircle className="h-12 w-12 text-ghibli-moss animate-spin mb-4" /> <p>Aguardando...</p> </div> );
        }

      // ----- PASSO INVÁLIDO (Fallback) -----
      default:
        return (
          <div className="text-center p-4">
            <p className="text-destructive">Erro: Passo inválido ({activeStep}).</p>
            <Button onClick={handleNewImage} variant="outline" size="sm" className="mt-4">Recomeçar</Button>
          </div>
        );
    }
  };

  // ---- Renderização Principal do GhibliHero ----
  return (
    <section className="relative pt-20 pb-16 md:py-24 overflow-hidden">
      {/* Elementos Decorativos Flutuantes (mantidos iguais) */}
        <div className="leaf-decoration top-20 left-10 text-3xl">🍃</div>
        <div className="leaf-decoration bottom-28 right-16 text-2xl">🍂</div>
        <div className="star-decoration top-40 right-28 text-xl">✨</div>
        <div className="star-decoration bottom-16 left-20 text-2xl">✨</div>

      <div className="container relative mx-auto px-4">

        {/* SVG para a linha e seta - AJUSTADO: Só mostra se NÃO estiver no passo 0 */}
        {!showStepZero && (
            <svg
              // A condição activeStep === 1 foi removida
              className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block"
              style={{ zIndex: 0 }}
              preserveAspectRatio="none"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10" markerHeight="7"
                  refX="0" refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" className="fill-current text-ghibli-earth/50" />
                </marker>
              </defs>
              <path
                d={svgPathD} // Path agora calculado a partir do botão e com nós
                fill="none"
                stroke="currentColor"
                className="text-ghibli-earth/50"
                strokeWidth="2"
                strokeDasharray="5 5"
                markerEnd="url(#arrowhead)"
              />
            </svg>
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-center">
          {/* Lado Esquerdo: Texto Introdutório */}
          {/* Removida a ref textBlockRef que não é mais necessária */}
          <div className="w-full md:w-5/12 mb-10 md:mb-0 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-ghibli font-bold text-ghibli-wood leading-tight mb-6">
              Dê Magia a Fotos Comuns {/* Título Atualizado */}
            </h1>
            {/* Subtítulo Atualizado com <br /> */}
            <p className="text-lg text-ghibli-earth mb-8 max-w-md leading-relaxed">
              🪄 Transforme fotografias comuns em arte verdadeiramente mágica.<br />
              👍 O processo é simples: envie a foto, escolha o estilo e está feito!<br />
              🖼️ Crie imagens fantásticas, prontas para partilhar onde quiser!
            </p>
            {/* Botão "Transforme já" - Adicionada ref e removida seta */}
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2.0, repeat: Infinity, ease: "easeInOut" }}
              className="hidden md:inline-block"
            >
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  ref={startButtonRef} // Adiciona a ref aqui
                  variant="ghost"
                  className="text-lg px-4 py-2 text-ghibli-earth hover:text-ghibli-moss inline-flex items-center group"
                  onClick={handleStartProcessing}
                >
                  Transforme já a sua foto! {/* Texto atualizado */}
                  {/* Ícone ArrowRight removido */}
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Lado Direito: Cartão Interativo */}
          <div ref={interactiveCardRef} className="w-full md:w-7/12 md:pl-16">
            <div className="ghibli-card p-0 h-auto min-h-[22rem] md:min-h-[28rem] flex flex-col items-center justify-center animate-fade-in overflow-hidden">
              {/* Renderização Condicional */}
              {showStepZero ? (
                <Step0Carousel onStartClick={handleStartProcessing} />
              ) : (
                renderStudioContent()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Estilos (mantido igual) */}
      <StyleSelectorModal
        isOpen={isStyleModalOpen}
        onOpenChange={setIsStyleModalOpen}
        onStyleSelect={handleStyleSelect}
        selectedStyleId={selectedStyle?.id || null}
        styles={availableStyles}
        isLoading={stylesLoading}
        error={stylesError}
      />
    </section>
  );
};

export default GhibliHero