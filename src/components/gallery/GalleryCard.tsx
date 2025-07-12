import React, { useState, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { GalleryItem } from './ImageCompareModal'; // Certifique-se que este caminho está correto
import { Card } from '@/components/ui/card'; // Certifique-se que este caminho está correto
import { Sparkles } from 'lucide-react';
import { getImageSrc } from '@/lib/utils'; // ✅ NOVO: Import da função utilitária
import Image from 'next/image';

interface GalleryCardProps {
  item: GalleryItem;
  onClick: () => void;
  // Adicionar priority? como prop opcional se necessário para LCP
  priority?: boolean; 
}

const GalleryCard: React.FC<GalleryCardProps> = ({ item, onClick, priority = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const beforeSrc = getImageSrc(item.before, '/placeholder-image.png');
  const afterSrc = getImageSrc(item.after, '/placeholder-image.png');

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Previne o scroll da página ao usar a barra de espaço
      onClick();
    }
  };

  const cardTitle = item.title || "Obra de Arte"; // Fallback para o título
  const cardStyle = item.style || "Estilo Artístico"; // Fallback para o estilo

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="h-full" // Garante que o motion.div ocupa a altura do seu container
    >
      <Card
        className="overflow-hidden cursor-pointer group flex flex-col h-full" // Adicionado flex flex-col h-full
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button" // Melhoria de Acessibilidade
        tabIndex={0}   // Melhoria de Acessibilidade
        onKeyDown={handleCardKeyDown} // Melhoria de Acessibilidade
        aria-label={`Ver detalhes de ${cardTitle} no estilo ${cardStyle}`} // Melhoria de Acessibilidade
      >
        {/* Secção do Cabeçalho do Card (Título e Estilo) */}
        <div className="p-4 border-b border-ghibli-sand/30 flex justify-between items-center">
          <div>
            <h3 className="font-ghibli text-lg text-ghibli-wood">{cardTitle}</h3>
            <p className="text-sm text-ghibli-earth">{cardStyle}</p>
          </div>
          <motion.div
            animate={{ rotate: isHovered ? [0, 180, 180] : 0 }} // Adicionado um keyframe para manter a rotação
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <Sparkles className="h-5 w-5 text-ghibli-moss opacity-70 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </div>

        {/* Secção da Imagem (com efeito de transição no hover) */}
        <div className="relative aspect-square w-full"> {/* Garante proporção e largura total */}
          {/* Imagem Original */}
          <motion.div
            className="absolute inset-0"
            animate={{
              opacity: isHovered ? 0 : 1,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }} // Ajuste na transição
          >
            <div className="relative w-full h-full">
              <Image
                src={beforeSrc}
                alt={`Imagem original de ${cardTitle}`} // Melhoria de Acessibilidade
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Exemplo de sizes, ajuste conforme o seu layout
                priority={priority} // Prop para LCP
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/EEE/333?text=Original+Indisponível'; }} // Fallback de imagem
              />
            </div>
          </motion.div>

          {/* Imagem Transformada */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeIn" }} // Ajuste na transição
          >
            <div className="group overflow-hidden relative w-full h-full"> {/* Removido rounded-lg para consistência com o Card */}
              <Image
                src={afterSrc}
                alt={`Imagem de ${cardTitle} transformada no estilo ${cardStyle}`} // Melhoria de Acessibilidade
                fill
                style={{ objectFit: "cover" }}
                className="transition-transform duration-500 ease-out group-hover:scale-105" // Ajuste no scale e easing
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Exemplo de sizes
                priority={priority} // Prop para LCP
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/CCC/222?text=Transformada+Indisponível'; }} // Fallback de imagem
              />
            </div>

            {/* Overlay com texto quando hover */}
            {isHovered && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end items-center p-4 text-center">
                <motion.p
                  className="text-white font-medium text-sm" // Ajuste no tamanho do texto
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.3 }} // Ajuste no delay e duração
                >
                  Ver detalhes
                </motion.p>
              </div>
            )}
          </motion.div>

          {/* Borda luminosa no hover */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 border-2 border-ghibli-moss pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.8, 0], // Ajuste na opacidade máxima
              }}
              transition={{
                repeat: Infinity,
                duration: 1.8, // Ajuste na duração
                ease: "easeInOut",
              }}
              style={{ borderRadius: 'inherit' }} // Para herdar o borderRadius do Card pai
            />
          )}
        </div>

        {/* Rodapé do Card (Indicador de ação) */}
        <div className="py-3 px-4 bg-ghibli-paper/60 text-center mt-auto"> {/* mt-auto para empurrar para baixo se o card for mais alto */}
          <motion.p
            className="text-sm text-ghibli-wood"
            animate={{
              opacity: isHovered ? 1 : 0.8, // Ajuste na opacidade
            }}
            transition={{ duration: 0.3 }}
          >
            {isHovered ? "Clique para ver detalhes" : "Carregue para ver detalhes"}
          </motion.p>
        </div>
      </Card>
    </motion.div>
  );
};

export default GalleryCard;