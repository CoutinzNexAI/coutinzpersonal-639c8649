import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GalleryItem } from './ImageCompareModal';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';

interface GalleryCardProps {
  item: GalleryItem;
  onClick: () => void;
}

const GalleryCard: React.FC<GalleryCardProps> = ({ item, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card 
        className="overflow-hidden cursor-pointer group"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-4 border-b border-ghibli-sand/30 flex justify-between items-center">
          <div>
            <h3 className="font-ghibli text-lg text-ghibli-wood">{item.title}</h3>
            <p className="text-sm text-ghibli-earth">{item.style}</p>
          </div>
          <motion.div
            animate={{ rotate: isHovered ? 180 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="h-5 w-5 text-ghibli-moss opacity-70 group-hover:opacity-100" />
          </motion.div>
        </div>
        
        <div className="relative aspect-square">
          {/* Imagem Original */}
          <motion.div 
            className="absolute inset-0"
            animate={{ 
              opacity: isHovered ? 0 : 1 
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative w-full h-full">
              <Image 
                src={item.before.startsWith('http') ? item.before : `/${item.before}`} 
                alt="Imagem original" 
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </motion.div>
          
          {/* Imagem Transformada */}
          <motion.div 
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isHovered ? 1 : 0
            }}
            transition={{ duration: 0.5 }}
          >
            <div className="group overflow-hidden rounded-lg relative w-full h-full">
              <Image 
                src={item.after.startsWith('http') ? item.after : `/${item.after}`}
                alt="Imagem transformada"
                fill
                style={{ objectFit: "cover" }}
                className="transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            
            {/* Overlay quando hover */}
            {isHovered && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                <motion.p 
                  className="text-white font-medium text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Clique para explorar
                </motion.p>
              </div>
            )}
          </motion.div>
          
          {/* Borda luminosa quando hover */}
          {isHovered && (
            <motion.div 
              className="absolute inset-0 border-2 border-ghibli-moss pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.7, 0] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5 
              }}
            />
          )}
        </div>
        
        {/* Indicador de "Clique para comparar" */}
        <div className="py-2 px-4 bg-ghibli-paper/50 text-center">
          <motion.p 
            className="text-sm text-ghibli-wood"
            animate={{ 
              opacity: isHovered ? 1 : 0.7
            }}
          >
            {isHovered ? "Clique para comparar" : "Passe o mouse para visualizar"}
          </motion.p>
        </div>
      </Card>
    </motion.div>
  );
};

export default GalleryCard; 