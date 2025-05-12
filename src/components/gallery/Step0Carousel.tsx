// src/components/hero/Step0Carousel.tsx (ou onde o criaste)
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image'; // Usar o componente Image do Next.js
import { Button } from '@/components/ui/button'; // Importa o botão Shadcn
import { cn } from '@/lib/utils'; // Utilitário para classes condicionais
import { Sparkles, Wand2 } from 'lucide-react'; // Ícones para efeito visual

// Define a estrutura dos dados para cada exemplo no carrossel
interface CarouselExample {
  id: number;
  beforeSrc: string; // Caminho relativo à pasta /public para a imagem "antes"
  afterSrc: string;  // Caminho relativo à pasta /public para a imagem "depois"
  alt: string;       // Texto alternativo descritivo
}

// --- DADOS DOS EXEMPLOS (Mantidos do Utilizador) ---
const examples: CarouselExample[] = [
    {
      id: 1,
      beforeSrc: '/avonetonormal.jpg',
      afterSrc: '/avonetoazulejo.png',
      alt: 'Experimente o nosso estilo Azulejo Portugues!',
    },
    {
      id: 2,
      beforeSrc: '/casamentonormal.jpg',
      afterSrc: '/casalghibli.png',
      alt: 'Exemplo 2: Paisagem transformada em estilo Ghibli',
    },
    {
      id: 3,
      beforeSrc: '/profjamnormal.jpg',
      afterSrc: '/profsimpson.png',
      alt: 'Exemplo 3: Animal transformado em estilo Ghibli',
    },
];

// Intervalo de tempo (em milissegundos) para a mudança automática de slides
const SLIDE_INTERVAL = 5000; // 5 segundos

// Propriedades que o componente Step0Carousel recebe
interface Step0CarouselProps {
  onStartClick: () => void; // Função a ser chamada quando o botão principal é clicado
}

// --- COMPONENTE PRINCIPAL ---
export const Step0Carousel: React.FC<Step0CarouselProps> = ({ onStartClick }) => {
  // Estado para controlar o índice do slide atualmente visível
  const [currentIndex, setCurrentIndex] = useState(0);
  // Estado para controlar a direção da animação de slide
  const [direction, setDirection] = useState(0); // 0: initial, 1: next, -1: prev

  // Função para avançar para o próximo slide
  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % examples.length);
  };

  // Função para ir para um slide específico (usada pelos pontos)
  const goToIndex = (index: number) => {
    // Determina a direção com base no índice atual vs o clicado
    setDirection(index > currentIndex ? 1 : (index < currentIndex ? -1 : 0));
    setCurrentIndex(index);
  };


  // Efeito para avançar automaticamente os slides
  useEffect(() => {
    if (examples.length <= 1) return; // Não inicia se só houver 1 exemplo
    const intervalId = setInterval(goToNext, SLIDE_INTERVAL); // Usa goToNext para definir direção
    return () => clearInterval(intervalId); // Limpeza
  }, []); // Executa apenas na montagem

  // Obtém os dados do exemplo atual
  const currentExample = examples[currentIndex];

  // Placeholder para erro de imagem
  const placeholderSrc = 'https://placehold.co/300x300/EEE/31343C?text=Imagem+Indisponivel';

  // Função para lidar com erros ao carregar imagens
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    event.currentTarget.src = placeholderSrc;
    event.currentTarget.classList.add('image-error-placeholder'); // Adiciona classe para possível estilo
  };

  // --- Variantes de Animação (Slide + Fade) ---
  const slideVariants = {
    hidden: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%', // Começa fora da tela (direita ou esquerda)
      opacity: 0,
    }),
    visible: {
      x: '0%', // Move para a posição central
      opacity: 1,
      transition: { type: 'spring', stiffness: 80, damping: 20 }, // Transição suave tipo mola
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%', // Sai para o lado oposto
      opacity: 0,
      transition: { duration: 0.3 }, // Saída mais rápida e simples
    }),
  };


  return (
    // Container principal do carrossel
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto p-4">

      {/* --- TÍTULO CHAMATIVO ACIMA DO CARROSSEL --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex items-center gap-2 mb-2 text-center" // Adiciona margem inferior
      >
        <Wand2 className="w-6 h-6 text-ghibli-sky" strokeWidth={1.5} /> {/* Ícone */}
        <h4 className="text-lg font-ghibli font-semibold text-ghibli-wood tracking-wide">
          Veja a Magia Acontecer! {/* Texto do título */}
        </h4>
        <Sparkles className="w-7 h-7 text-amber-400" strokeWidth={1.5}/> {/* Outro ícone (opcional) */}
      </motion.div>

      {/* Container do slide com estilo melhorado e overflow hidden */}
      <div className={cn(
          "relative w-full h-56 sm:h-64 overflow-hidden rounded-lg",
          "bg-ghibli-cream border border-ghibli-stone/20", // Fundo e borda temáticos
          "shadow-lg shadow-ghibli-wood/20", // Sombra mais pronunciada
          "ring-1 ring-ghibli-sky/30 ring-offset-2 ring-offset-ghibli-cream" // Efeito de brilho/borda sutil
          )}>
        {/* AnimatePresence gere a animação de entrada/saída dos slides */}
        <AnimatePresence initial={false} custom={direction}>
          {/* motion.div representa cada slide individual */}
          <motion.div
            key={currentIndex} // Chave dinâmica é ESSENCIAL para AnimatePresence detetar a mudança
            custom={direction} // Passa a direção para as variantes de animação
            variants={slideVariants} // Aplica as variantes de slide+fade
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 flex items-center justify-center gap-2 p-1" // Layout do slide
          >
            {/* Imagem "Antes" */}
            <div className="w-1/2 h-full relative group"> {/* group para hover no label */}
              <Image
                src={currentExample.beforeSrc}
                alt={`Antes - ${currentExample.alt}`}
                layout="fill" // Preenche o container
                objectFit="contain" // Mostra imagem inteira
                className="rounded-md"
                priority={currentIndex === 0} // Prioriza o carregamento da primeira imagem
                onError={handleImageError} // Tratamento de erro
                unoptimized={currentExample.beforeSrc.startsWith('https://placehold.co')} // Não otimiza placeholders
              />
              {/* Label "Antes" (visível no hover em desktop) */}
              <span className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded transition-opacity duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                Antes
              </span>
            </div>

            {/* Imagem "Depois" */}
            <div className="w-1/2 h-full relative group"> {/* group para hover no label */}
              <Image
                src={currentExample.afterSrc}
                alt={`Depois - ${currentExample.alt}`}
                layout="fill"
                objectFit="contain"
                className="rounded-md"
                priority={currentIndex === 0} // Prioriza o carregamento da primeira imagem
                onError={handleImageError} // Tratamento de erro
                unoptimized={currentExample.afterSrc.startsWith('https://placehold.co')} // Não otimiza placeholders
              />
              {/* Label "Depois" (visível no hover em desktop) */}
              <span className="absolute bottom-1 right-1 bg-ghibli-sky bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded transition-opacity duration-300 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                Depois
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicadores de Navegação (Pontos) */}
      {/* Só mostra se houver mais de um exemplo */}
      {examples.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {examples.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)} // Permite clicar para navegar
              // Estilo dos pontos, com destaque para o ativo
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-ghibli-moss', // Estilo base e de foco
                currentIndex === index
                  ? 'bg-ghibli-moss scale-110' // Ponto ativo maior e com cor
                  : 'bg-ghibli-stone/40 hover:bg-ghibli-stone/60' // Ponto inativo e hover
              )}
              aria-label={`Ver exemplo ${index + 1}`} // Acessibilidade
            />
          ))}
        </div>
      )}

      {/* Botão Principal com Animação de Pulso */}
      <motion.div
         // Animação de pulso suave para chamar a atenção
         animate={{ scale: [1, 1.03, 1] }}
         transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
         className="w-full max-w-xs mt-4" // Container para a animação
      >
        <Button
          onClick={onStartClick} // Chama a função para avançar
          size="lg"
          className="w-full ghibli-button" // Aplica o estilo temático do botão
        >
          Experimente com a Sua Foto!
        </Button>
      </motion.div>

      {/* Adicionar junto aos controles de upload, por exemplo: */}
      <div className="mt-2 text-xs text-ghibli-earth/80 flex items-center">
        <span className="text-ghibli-sky mr-1">💡</span>
        <span>Dica: Fotos com boa luz funcionam melhor</span>
      </div>
    </div>
  );
};
