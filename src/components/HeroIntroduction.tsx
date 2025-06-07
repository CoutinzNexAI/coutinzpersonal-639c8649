// src/components/HeroIntroduction.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Images } from "lucide-react"; // Ícone para o botão "Veja exemplos"
import { Step0Carousel } from './gallery/Step0Carousel'; // Carrossel para o Passo 0

interface HeroIntroductionProps {
  // Callback para quando o utilizador clica em "Transforme já a sua foto!"
  onStartProcessing: () => void;
  // Callback para quando o utilizador clica em "Veja exemplos!"
  onOpenExamples: () => void;
  // Ref para o cartão interativo (onde o estúdio será renderizado),
  // necessário para o cálculo do final da linha SVG.
  interactiveCardRef: React.RefObject<HTMLDivElement>;
}

export const HeroIntroduction: React.FC<HeroIntroductionProps> = ({
  onStartProcessing,
  onOpenExamples,
  interactiveCardRef,
}) => {
  // --- Refs para os elementos da animação SVG ---
  const startButtonRef = useRef<HTMLButtonElement>(null); // Ref para o botão "Transforme já"
  // interactiveCardRef é recebido como prop

  // --- Estado para o path SVG ---
  const [svgPathD, setSvgPathD] = useState<string>("");

  // --- Função para calcular o caminho SVG ---
  const calculatePath = useCallback(() => {
    if (startButtonRef.current && interactiveCardRef.current) {
      const buttonRect = startButtonRef.current.getBoundingClientRect();
      const cardRect = interactiveCardRef.current.getBoundingClientRect();
      // Garante que o container mais próximo com a classe '.container' é encontrado
      // Se não houver .container, pode usar document.body ou outro elemento de referência
      const containerElement = startButtonRef.current.closest('.container') || document.body;
      const containerRect = containerElement.getBoundingClientRect();

      // Ponto inicial: Meio direito do botão "Transforme já"
      const startX = buttonRect.right - containerRect.left;
      const startY = buttonRect.top + buttonRect.height / 2 - containerRect.top;

      // Ponto final: Meio da borda esquerda do cartão interativo (com offset)
      const endX = cardRect.left - containerRect.left + 10; // Offset para não sobrepor a borda
      const endY = cardRect.top + cardRect.height / 2 - containerRect.top;

      // Pontos de controlo para Curvas de Bézier Cúbicas (C) para criar "nós"
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

      setSvgPathD(
        `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${midPointX} ${midPointY} C ${cp3X} ${cp3Y}, ${cp4X} ${cp4Y}, ${endX} ${endY}`
      );
    }
  }, [interactiveCardRef]); // Adiciona interactiveCardRef às dependências do useCallback

  // --- Efeito para calcular o path SVG ao montar e redimensionar ---
  // Este useEffect agora só corre neste componente, não depende de showStepZero do GhibliHero
  useEffect(() => {
    setTimeout(calculatePath, 50); // Calcula na montagem inicial (com delay)

    const handleResize = () => {
      setTimeout(calculatePath, 50);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculatePath]); // Recalcula quando a função calculatePath muda (devido a interactiveCardRef)

  return (
    <div className="container relative mx-auto px-4">
      {/* SVG para a linha e seta */}
      {/* A visibilidade do SVG (hidden md:block) e zIndex são controlados aqui ou no GhibliHero */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none hidden md:block"
        style={{ zIndex: 0 }} // Garante que está por baixo do conteúdo interativo
        preserveAspectRatio="none"
      >
        <defs>
          <marker
            id="arrowheadHeroIntro" // ID único para este marker
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" className="fill-current text-ghibli-earth/50" />
          </marker>
        </defs>
        <path
          d={svgPathD}
          fill="none"
          stroke="currentColor"
          className="text-ghibli-earth/50"
          strokeWidth="2"
          strokeDasharray="5 5"
          markerEnd="url(#arrowheadHeroIntro)" // Usa o ID único
        />
      </svg>

      <div className="relative z-10 flex flex-col md:flex-row items-center">
        {/* Lado Esquerdo: Texto Introdutório */}
        <div className="w-full md:w-5/12 mb-10 md:mb-0 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-ghibli font-bold text-ghibli-wood leading-tight mb-6">
            <span className="block md:inline">Transforme as suas</span>
            <span className="hidden md:inline"> </span>
            <span className="block md:inline">Fotos em Obras</span>
            <span className="hidden md:inline"> </span>
            <span className="block md:inline">de Arte!</span>
          </h1>
          <p className="text-lg text-ghibli-earth mb-8 max-w-md leading-relaxed hidden md:block">
            🪄 Transforme fotografias comuns em arte verdadeiramente mágica.<br />
            👍 O processo é simples: envie a foto, escolha o estilo e está feito!<br />
            🖼️ Crie imagens fantásticas, prontas para partilhar onde quiser!
          </p>
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2.0, repeat: Infinity, ease: "easeInOut" }}
            className="hidden md:inline-block w-full" // Mostra apenas em desktop
          >
            <div className="flex flex-col space-y-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  ref={startButtonRef} // Ref para o cálculo do início da linha SVG
                  variant="ghost"
                  className="text-lg px-4 py-2 text-ghibli-earth hover:text-ghibli-moss inline-flex items-center group"
                  onClick={onStartProcessing} // Chama a prop passada pelo GhibliHero
                >
                  Transforme já a sua foto!
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="text-lg px-4 py-2 text-ghibli-earth border-ghibli-moss/50 hover:bg-ghibli-moss/10 hover:text-ghibli-moss inline-flex items-center group"
                  onClick={onOpenExamples} // Chama a prop passada pelo GhibliHero
                >
                  <Images className="mr-2 h-5 w-5" />
                  Veja exemplos!
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Lado Direito: Cartão Interativo com o Carrossel do Passo 0 */}
        {/* A ref interactiveCardRef é do GhibliHero e aponta para o container onde o estúdio será renderizado.
            Aqui, o Step0Carousel é o conteúdo inicial DESSE LADO DIREITO. */}
        <div className="w-full md:w-7/12 md:pl-16">
          <div 
            // A ref interactiveCardRef NÃO deve estar neste div interno,
            // mas sim no div que o GhibliHero usa para o lado direito (onde o estúdio aparece).
            // Este div é apenas o container do carrossel.
            className="ghibli-card p-0 h-auto min-h-[22rem] md:min-h-[28rem] flex flex-col items-center justify-center animate-fade-in overflow-hidden"
          >
            <Step0Carousel onStartClick={onStartProcessing} />
          </div>
        </div>
      </div>
    </div>
  );
};
