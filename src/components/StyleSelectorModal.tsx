
import React from 'react';
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

export interface Style {
  id: number;
  name: string;
  description?: string;
  imageUrl: string;
}

interface StyleSelectorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStyleSelect: (style: Style) => void;
  selectedStyleId: number | null;
}

const PLACEHOLDER_STYLES: Style[] = [
  {
    id: 1,
    name: "Estilo Aquarela",
    description: "Transformação em aquarela suave",
    imageUrl: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 2,
    name: "Pintura a Óleo",
    description: "Texturas ricas como óleo sobre tela",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 3,
    name: "Anime Ghibli",
    description: "Estilo inspirado nos filmes de Studio Ghibli",
    imageUrl: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 4,
    name: "Neo-Futurista",
    description: "Visual futurista com linhas neon",
    imageUrl: "https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 5,
    name: "Estilo Retrô",
    description: "Visual vintage dos anos 80",
    imageUrl: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 6,
    name: "Edição Limitada",
    description: "Estilo exclusivo para utilizadores premium",
    imageUrl: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=300&q=80"
  }
];

const StyleSelectorModal: React.FC<StyleSelectorModalProps> = ({
  isOpen,
  onOpenChange,
  onStyleSelect,
  selectedStyleId
}) => {
  const handleStyleClick = (style: Style) => {
    onStyleSelect(style);
    onOpenChange(false); // Close the modal after selection
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-2xl">Escolha o Seu Estilo Artístico</DialogTitle>
          <DialogClose className="absolute right-4 top-4" />
        </DialogHeader>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PLACEHOLDER_STYLES.map((style) => (
              <div 
                key={style.id}
                className={cn(
                  "relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                  selectedStyleId === style.id ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border"
                )}
                onClick={() => handleStyleClick(style)}
              >
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={style.imageUrl} 
                    alt={style.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  
                  {selectedStyleId === style.id && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <div className="rounded-full bg-primary p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-white/90 backdrop-blur-sm">
                  <h3 className="font-medium text-sm">{style.name}</h3>
                  {style.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{style.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StyleSelectorModal;
