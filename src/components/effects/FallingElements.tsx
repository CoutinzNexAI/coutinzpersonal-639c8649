// src/components/effects/FallingElements.tsx
import React, { useState, useEffect } from 'react';

// Lista de emojis/elementos que podem cair. Personaliza a gosto!
const ELEMENTS = ['🍃', '🍂', '🌸', '✨', '⭐'];
// Número de elementos a gerar. Ajusta para performance vs densidade.
const NUMBER_OF_ELEMENTS = 15; // Aumentei ligeiramente

// Interface para definir a estrutura de dados de cada elemento
interface FallingElementData {
  id: number;
  style: React.CSSProperties;
  content: string; // O emoji/texto a mostrar
}

// O componente funcional FallingElements
const FallingElements: React.FC = () => {
  // Estado para guardar os dados dos elementos gerados
  const [elements, setElements] = useState<FallingElementData[]>([]);

  // useEffect corre apenas uma vez quando o componente monta
  useEffect(() => {
    const generatedElements: FallingElementData[] = [];
    // Loop para criar o número definido de elementos
    for (let i = 0; i < NUMBER_OF_ELEMENTS; i++) {
      // Calcula valores aleatórios para a animação de cada elemento
      const duration = Math.random() * 10 + 8;      // Duração entre 8s e 18s (mais lento)
      const delay = Math.random() * 12;           // Atraso entre 0s e 12s (mais espaçado)
      const leftPos = Math.random() * 100;        // Posição horizontal inicial (0% a 100%)
      const startX = (Math.random() - 0.5) * 8;   // Desvio X inicial (-4vw a 4vw)
      const endX = (Math.random() - 0.5) * 12;    // Desvio X final (-6vw a 6vw)
      const startRotate = (Math.random() - 0.5) * 50; // Rotação inicial (-25deg a 25deg)
      const endRotate = (Math.random() - 0.5) * 300; // Rotação final (-150deg a 150deg)
      const elementSize = Math.random() * 0.7 + 0.7; // Tamanho desktop (0.7rem a 1.4rem)
      const elementSizeMobile = Math.random() * 0.4 + 0.5; // Tamanho mobile (0.5rem a 0.9rem)
      const maxOpacity = Math.random() * 0.25 + 0.35; // Opacidade máx (0.35 a 0.6) - mais subtil

      // Adiciona o novo elemento ao array
      generatedElements.push({
        id: i,
        // Seleciona um emoji aleatório da lista ELEMENTS
        content: ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)],
        // Define as variáveis CSS como estilos inline para este elemento específico
        style: {
          '--duration': `${duration}s`,
          '--delay': `${delay}s`,
          '--left-pos': `${leftPos}vw`,
          '--start-x': `${startX}vw`,
          '--end-x': `${endX}vw`,
          '--start-rotate': `${startRotate}deg`,
          '--end-rotate': `${endRotate}deg`,
          '--element-size': `${elementSize}rem`,
          '--element-size-mobile': `${elementSizeMobile}rem`,
          '--max-opacity': `${maxOpacity}`,
        } as React.CSSProperties, // Cast para o tipo correto
      });
    }
    // Atualiza o estado com os elementos gerados
    setElements(generatedElements);
  }, []); // O array vazio [] garante que este efeito corre apenas uma vez

  // Renderiza os elementos
  return (
    // Usa um React Fragment (<>) para não adicionar um div extra ao DOM
    <>
      {/* Mapeia o array de elementos e renderiza um div para cada um */}
      {elements.map((el) => (
        <div
          key={el.id} // Chave única para cada elemento
          className="falling-element" // Aplica a classe CSS base definida no index.css
          style={el.style} // Aplica os estilos inline com as variáveis CSS aleatórias
        >
          {el.content} {/* Renderiza o emoji */}
        </div>
      ))}
    </>
  );
};

// Exporta o componente para poder ser importado noutros ficheiros
export default FallingElements;
