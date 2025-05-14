import React, { useState } from 'react';
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

export interface Style {
  id: string;
  name: string;
  description?: string;
  example_image_url: string | null;
  is_limited_edition: boolean;
  is_active: boolean;
  prompt_template?: string;
  order?: number;
}

interface StyleSelectorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStyleSelect: (style: Style) => void;
  selectedStyleId: string | null;
  styles: Style[];
  isLoading: boolean;
  error: string | null;
}

// Placeholder image caso a imagem do estilo não esteja disponível
const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?auto=format&fit=crop&w=300&q=80";

const StyleSelectorModal: React.FC<StyleSelectorModalProps> = ({
  isOpen,
  onOpenChange,
  onStyleSelect,
  selectedStyleId,
  styles,
  isLoading,
  error
}) => {
  const handleStyleClick = (style: Style) => {
    onStyleSelect(style);
    onOpenChange(false); // Close the modal after selection
  };
  
  // Track image loading errors
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  const handleImageError = (styleId: string) => {
    setImageErrors(prev => ({ ...prev, [styleId]: true }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-2xl">Escolha o Seu Estilo Artístico</DialogTitle>
          <DialogClose className="absolute right-4 top-4" />
        </DialogHeader>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="ml-2 text-lg">Carregando estilos...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              <p className="font-medium">Erro ao carregar estilos</p>
              <p className="text-sm">{error}</p>
              <p className="text-sm mt-2">Por favor, tente novamente mais tarde.</p>
            </div>
          ) : styles.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-lg text-muted-foreground">Nenhum estilo disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {styles.map((style) => (
                <div 
                  key={style.id}
                  className={cn(
                    "relative overflow-hidden rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                    selectedStyleId === style.id ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border",
                    style.is_limited_edition ? "border-amber-400" : ""
                  )}
                  onClick={() => handleStyleClick(style)}
                >
                  <div className="aspect-square overflow-hidden relative">
                    <Image 
                      src={imageErrors[style.id] ? PLACEHOLDER_IMAGE : (style.example_image_url || PLACEHOLDER_IMAGE)}
                      alt={style.name}
                      fill
                      style={{ objectFit: "cover" }}
                      className="transition-transform hover:scale-105"
                      onError={() => handleImageError(style.id)}
                    />
                    
                    {selectedStyleId === style.id && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="rounded-full bg-primary p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {style.is_limited_edition && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                        Premium
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StyleSelectorModal;
