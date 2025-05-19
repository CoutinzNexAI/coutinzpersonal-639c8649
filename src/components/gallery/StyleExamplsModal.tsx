// src/components/gallery/StyleExamplesModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Wand } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { STYLE_EXAMPLES_DATA } from '@/lib/data/exampleData'; // Importa os dados e a interface

interface StyleExamplesModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStartTransformationClick?: () => void; // Callback para o botão "Comece agora"
}

export const StyleExamplesModal: React.FC<StyleExamplesModalProps> = ({
  isOpen,
  onOpenChange,
  onStartTransformationClick,
}) => {
  const [selectedExampleStyleId, setSelectedExampleStyleId] = useState<string>(STYLE_EXAMPLES_DATA[0]?.id || '');

  // Encontra o objeto do estilo selecionado
  const currentSelectedStyleData = STYLE_EXAMPLES_DATA.find(s => s.id === selectedExampleStyleId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[85vw] xl:max-w-[75vw] p-0 max-h-[85vh] overflow-hidden flex flex-col bg-white rounded-xl shadow-2xl">
        <DialogHeader className="p-6 border-b sticky top-0 bg-white z-10">
          <DialogTitle className="text-3xl font-ghibli text-ghibli-wood">
            ✨ Galeria de Transformações Mágicas
          </DialogTitle>
          <p className="text-ghibli-earth mt-2">
            Explore as possibilidades e descubra qual estilo combina com a sua foto
          </p>
          <DialogClose className="absolute right-4 top-4" />
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden"> {/* flex-1 adicionado */}
          {/* Seletor de Estilos (Sidebar) */}
          <div className="md:w-1/5 border-r overflow-y-auto p-4 bg-ghibli-cream/20">
            <div className="space-y-3">
              <h3 className="font-semibold text-ghibli-wood mb-3 pl-4">Estilos Disponíveis</h3>
              {STYLE_EXAMPLES_DATA.map((style) => (
                <button
                  key={style.id}
                  className={cn(
                    "w-full text-left px-5 py-4 rounded-xl transition-all",
                    selectedExampleStyleId === style.id
                      ? "bg-ghibli-moss text-white font-medium shadow-md"
                      : "hover:bg-ghibli-cream/80 text-ghibli-earth"
                  )}
                  onClick={() => setSelectedExampleStyleId(style.id)}
                >
                  <span className="text-lg">{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Área de Exemplos */}
          <div className="md:w-4/5 flex-1 overflow-y-auto p-6"> {/* flex-1 adicionado */}
            {currentSelectedStyleData && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSelectedStyleData.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <h3 className="font-ghibli text-ghibli-wood text-2xl mb-2">
                      {currentSelectedStyleData.name}
                    </h3>
                    <p className="text-ghibli-earth text-lg mb-6">
                      {currentSelectedStyleData.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {currentSelectedStyleData.examples.map((example, index) => (
                      <div key={index} className="mb-4">
                        <div className="rounded-xl overflow-hidden">
                          <div className="flex flex-col sm:flex-row gap-3">
                            {/* Imagem Original */}
                            <div className="flex-1 relative group overflow-hidden">
                              <div className="absolute top-2 left-2 z-10 bg-black/30 text-white text-xs px-2 py-1 rounded-full opacity-70">Original</div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="w-full h-full rounded-lg overflow-hidden shadow-md"
                              >
                                <div className="relative w-full aspect-square">
                                  <Image
                                    src={example.before}
                                    alt={`Imagem original para ${currentSelectedStyleData.name} - Exemplo ${index + 1}`}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    className="transition-all duration-300"
                                    // Adicionar um placeholder se desejar
                                    // placeholder="blur" 
                                    // blurDataURL="/path/to/low-res-placeholder.jpg"
                                  />
                                </div>
                              </motion.div>
                            </div>

                            {/* Seta de transformação para telas maiores */}
                            <div className="hidden sm:flex items-center justify-center">
                              <div className="text-ghibli-moss/70">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                              </div>
                            </div>

                            {/* Imagem Transformada */}
                            <div className="flex-1 relative group overflow-hidden">
                              <div className="absolute top-2 right-2 z-10 bg-black/30 text-white text-xs px-2 py-1 rounded-full opacity-70">Transformada</div>
                              <motion.div
                                whileHover={{
                                  scale: 1.05,
                                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                                }}
                                className="w-full h-full rounded-lg overflow-hidden shadow-lg relative"
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                                <div className="relative w-full aspect-square">
                                  <Image
                                    src={example.after}
                                    alt={`Imagem transformada para ${currentSelectedStyleData.name} - Exemplo ${index + 1}`}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    className="transition-all duration-300"
                                  />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                  <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }} // Alterado para 'animate' para estar visível no hover do pai
                                    transition={{ delay: 0.1 }}
                                    className="text-white text-xs text-center"
                                  >
                                  </motion.div>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {onStartTransformationClick && (
                    <div className="mt-8 p-6 bg-ghibli-cream/20 rounded-xl border border-ghibli-cream/40">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <h3 className="font-ghibli text-ghibli-wood text-xl">
                            Experimente este estilo agora
                          </h3>
                          <p className="text-ghibli-earth">
                            Transforme suas próprias fotos com um clique
                          </p>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            className="ghibli-button"
                            onClick={() => {
                              onOpenChange(false); // Fecha o modal atual
                              onStartTransformationClick(); // Chama o callback para iniciar a transformação
                            }}
                          >
                            <Wand className="mr-2 h-5 w-5" />
                            Comece agora
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
