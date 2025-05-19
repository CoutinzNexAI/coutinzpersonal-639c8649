// src/components/StyleSelectorModal.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Loader2, Search, X, Grid, List, Info, ArrowUpCircle, Sparkles, ChevronDown, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet"; 
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const PLACEHOLDER_IMAGE = "https://placehold.co/400x300/E9E0D2/A08C7D?text=Estilo+Exemplo"; 

const cardVariants = { // For the list/grid of selectable styles
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.3,
      ease: "easeOut"
    }
  })
};

const StyleSelectorModal: React.FC<StyleSelectorModalProps> = ({
  isOpen,
  onOpenChange,
  onStyleSelect,
  selectedStyleId,
  styles,
  isLoading,
  error
}) => {
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobileStyleSheetOpen, setIsMobileStyleSheetOpen] = useState(false);
  const [currentDisplaySyleId, setCurrentDisplayStyleId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialStyleId = selectedStyleId && filteredStyles.find(s => s.id === selectedStyleId)
                             ? selectedStyleId
                             : (filteredStyles.length > 0 ? filteredStyles[0].id : null);
      setCurrentDisplayStyleId(initialStyleId);
    }
  }, [isOpen, selectedStyleId, styles]); // Ensure styles is a dependency if filteredStyles depends on it for initial load

  const handleImageError = (styleId: string) => {
    setImageErrors(prev => ({ ...prev, [styleId]: true }));
  };
  
  const handleDirectStyleSelect = (style: Style) => {
    onStyleSelect(style);
    onOpenChange(false); 
  };

  const handleMobileStyleSelect = (style: Style) => {
    setCurrentDisplayStyleId(style.id); 
    setIsMobileStyleSheetOpen(false); 
  };

  const filteredStyles = useMemo(() => {
    return styles
      .filter(style => style.is_active !== false) 
      .filter(style => {
        const matchesSearch = style.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (style.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPremium = showPremiumOnly ? style.is_limited_edition : true;
        return matchesSearch && matchesPremium;
      })
      .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  }, [styles, searchQuery, showPremiumOnly]);

  useEffect(() => {
    if (isOpen) { // Only adjust if the modal is open
      if (currentDisplaySyleId && !filteredStyles.find(s => s.id === currentDisplaySyleId)) {
        setCurrentDisplayStyleId(filteredStyles.length > 0 ? filteredStyles[0].id : null);
      } else if (!currentDisplaySyleId && filteredStyles.length > 0) {
        setCurrentDisplayStyleId(filteredStyles[0].id);
      }
    }
  }, [filteredStyles, currentDisplaySyleId, isOpen]);


  const currentSelectedStyleData = useMemo(() => {
    return filteredStyles.find(s => s.id === currentDisplaySyleId);
  }, [filteredStyles, currentDisplaySyleId]);

  const scrollToTop = () => {
    contentAreaRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const currentRef = contentAreaRef.current;
    const handleScroll = () => {
      if (currentRef) {
        setShowScrollTop(currentRef.scrollTop > 200);
      }
    };
    if (isOpen) { // Only add listener if modal is open
      currentRef?.addEventListener('scroll', handleScroll);
    }
    return () => currentRef?.removeEventListener('scroll', handleScroll);
  }, [isOpen, currentDisplaySyleId]); 

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setShowPremiumOnly(false);
    }
  }, [isOpen]);

  const MobileStyleSelectorSheet: React.FC = () => (
    <Sheet open={isMobileStyleSheetOpen} onOpenChange={setIsMobileStyleSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full mb-4 md:hidden flex justify-between items-center text-lg p-6 bg-white/80 border-ghibli-stone/50">
          <span>{currentSelectedStyleData?.name || "Selecionar Estilo"}</span>
          <ChevronDown className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[75vh] flex flex-col bg-ghibli-cream p-0">
        <SheetHeader className="p-4 border-b border-ghibli-stone/20">
          <SheetTitle className="text-ghibli-wood font-ghibli">Escolha um Estilo</SheetTitle>
          <SheetDescription className="text-ghibli-earth text-sm">
            Navegue e selecione o estilo para a sua transformação.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredStyles.map(style => (
            <Button
              key={style.id}
              variant={currentDisplaySyleId === style.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start p-3 h-auto text-left text-base",
                currentDisplaySyleId === style.id 
                  ? "bg-ghibli-moss text-white" 
                  : "text-ghibli-wood hover:bg-ghibli-cream/70"
              )}
              onClick={() => handleMobileStyleSelect(style)}
            >
              <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 mr-3 border border-ghibli-stone/10">
                <Image
                  src={imageErrors[style.id] ? PLACEHOLDER_IMAGE : (style.example_image_url || PLACEHOLDER_IMAGE)}
                  alt={style.name} fill style={{objectFit: "cover"}} 
                  onError={() => handleImageError(style.id)}
                />
              </div>
              <span>{style.name}</span>
              {style.is_limited_edition && <Sparkles className="w-4 h-4 ml-auto text-amber-500" />}
            </Button>
          ))}
        </div>
        <SheetFooter className="p-4 border-t border-ghibli-stone/20">
          <SheetClose asChild>
            <Button 
              className="w-full ghibli-button" 
              onClick={() => {
                if (currentSelectedStyleData) {
                  handleDirectStyleSelect(currentSelectedStyleData);
                }
              }}
              disabled={!currentSelectedStyleData} // Desabilita se nenhum estilo estiver para ser confirmado
            >
              {currentSelectedStyleData ? `Confirmar: ${currentSelectedStyleData.name}` : "Nenhum Estilo Selecionado"}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl p-0 rounded-xl max-h-[90vh] flex flex-col overflow-hidden bg-ghibli-cream shadow-2xl border-ghibli-stone/30">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b border-ghibli-stone/20 sticky top-0 bg-ghibli-cream/80 backdrop-blur-md z-20">
          <div className="flex items-center justify-between mb-3">
            <DialogTitle className="text-2xl font-ghibli text-ghibli-wood">Escolha o Seu Estilo Mágico</DialogTitle>
            <DialogClose className="rounded-full p-1.5 hover:bg-ghibli-stone/20 transition-colors">
              <X className="h-5 w-5 text-ghibli-wood/80" />
            </DialogClose>
          </div>
          
          {!isLoading && !error && styles.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-grow w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-ghibli-earth/70" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8 h-10 bg-white/70 border-ghibli-stone/40 focus-visible:ring-ghibli-moss focus-visible:border-ghibli-moss rounded-lg text-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ghibli-earth/70 hover:text-ghibli-wood"
                    aria-label="Limpar busca"
                  > <X className="w-4 h-4" /> </button>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant={showPremiumOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                  className={cn( "h-10 text-sm transition-all duration-300", showPremiumOnly ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-600 hover:opacity-90 shadow-md" : "bg-white/70 border-ghibli-stone/40 text-ghibli-wood hover:bg-ghibli-cream/70 hover:border-ghibli-moss" )}
                >
                  <Sparkles className={cn("w-4 h-4 mr-2", showPremiumOnly ? "text-white" : "text-amber-500")} />
                  {showPremiumOnly ? "Mostrar Todos" : "Só Premium"}
                </Button>
                <div className="hidden md:flex items-center border border-ghibli-stone/40 rounded-lg overflow-hidden h-10 bg-white/70">
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => setViewMode('grid')} className={cn( "h-full px-2.5 flex items-center justify-center transition-colors", viewMode === 'grid' ? "bg-ghibli-moss/80 text-white" : "text-ghibli-earth hover:bg-ghibli-cream/70" )} aria-label="Visualização em grelha"> <Grid className="w-4 h-4" /> </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-ghibli-wood text-white border-none text-xs"><p>Grelha</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => setViewMode('list')} className={cn( "h-full px-2.5 flex items-center justify-center transition-colors", viewMode === 'list' ? "bg-ghibli-moss/80 text-white" : "text-ghibli-earth hover:bg-ghibli-cream/70" )} aria-label="Visualização em lista"> <List className="w-4 h-4" /> </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-ghibli-wood text-white border-none text-xs"><p>Lista</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>
        
        <div className="px-4 pt-3 md:hidden"> <MobileStyleSelectorSheet /> </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:block md:w-1/4 lg:w-1/5 border-r border-ghibli-stone/20 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-ghibli-stone/30 scrollbar-track-transparent">
            <h3 className="font-semibold text-ghibli-wood mb-3 pl-2 text-sm">Estilos Disponíveis</h3>
            <div className="space-y-1.5">
              {filteredStyles.map((style) => (
                <Button
                  key={style.id}
                  variant={currentDisplaySyleId === style.id ? "default" : "ghost"}
                  className={cn( "w-full justify-start p-2.5 h-auto text-left", currentDisplaySyleId === style.id ? "bg-ghibli-moss text-white font-medium" : "text-ghibli-wood hover:bg-ghibli-cream/70" )}
                  onClick={() => setCurrentDisplayStyleId(style.id)}
                >
                  <div className="relative w-8 h-8 rounded-sm overflow-hidden shrink-0 mr-2 border border-ghibli-stone/10">
                     <Image src={imageErrors[style.id] ? PLACEHOLDER_IMAGE : (style.example_image_url || PLACEHOLDER_IMAGE)} alt={style.name} fill style={{objectFit:"cover"}} onError={() => handleImageError(style.id)} />
                  </div>
                  <span className="text-sm line-clamp-1">{style.name}</span>
                  {style.is_limited_edition && <Sparkles className="w-3 h-3 ml-auto text-amber-400 shrink-0" />}
                </Button>
              ))}
            </div>
          </div>

          <div ref={contentAreaRef} className="flex-1 px-3 py-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-ghibli-moss/40 scrollbar-track-ghibli-cream/30 relative">
            {isLoading ? ( /* ... Loading state ... */ <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-ghibli-moss"> <Loader2 className="h-12 w-12 animate-spin mb-4" /> <span className="text-lg font-medium">Carregando estilos mágicos...</span> </div>
            ) : error ? ( /* ... Error state ... */ <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center"> <p className="font-semibold text-lg mb-2">Oops! Algo deu errado.</p> <p className="text-sm mb-4">{error || "Não foi possível carregar os estilos."}</p> <Button variant="destructive" onClick={() => onOpenChange(false)}>Tentar Novamente Mais Tarde</Button> </div>
            ) : !currentSelectedStyleData ? ( 
                <div className="text-center p-8 min-h-[300px] flex flex-col justify-center items-center">
                    <Search className="w-16 h-16 text-ghibli-stone/30 mb-4" />
                    <p className="text-xl font-medium text-ghibli-wood mb-2">
                        {filteredStyles.length === 0 && searchQuery ? `Nenhum estilo para "${searchQuery}"` : "Selecione um Estilo"}
                    </p>
                    <p className="text-ghibli-earth/80 mb-4 text-sm">
                        {filteredStyles.length === 0 && searchQuery ? "Tente uma busca diferente ou limpe os filtros." : "Escolha um estilo na lista para ver mais detalhes e exemplos."}
                    </p>
                    {searchQuery && filteredStyles.length === 0 && ( <Button variant="outline" className="bg-white/70 border-ghibli-stone/40 text-ghibli-wood hover:bg-ghibli-cream/70 hover:border-ghibli-moss" onClick={() => setSearchQuery("")}> Limpar Busca </Button> )}
                </div>
            ) : ( 
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSelectedStyleData.id} 
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="mb-5">
                    <h2 className="text-2xl sm:text-3xl font-ghibli text-ghibli-wood mb-1.5">{currentSelectedStyleData.name}</h2>
                    <p className="text-sm sm:text-base text-ghibli-earth/90">{currentSelectedStyleData.description || "Descubra a magia deste estilo!"}</p>
                    {currentSelectedStyleData.is_limited_edition && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-xs font-semibold text-white shadow">
                        <Sparkles className="w-3.5 h-3.5" /> Edição Premium
                      </div>
                    )}
                  </div>
                  
                  {/* Área para mostrar o example_image_url do estilo selecionado */}
                  <div className="mb-6 rounded-lg overflow-hidden shadow-lg border border-ghibli-stone/10 relative aspect-video bg-ghibli-stone/5">
                    {currentSelectedStyleData.example_image_url ? (
                      <Image
                        src={imageErrors[`details-${currentSelectedStyleData.id}`] ? PLACEHOLDER_IMAGE : currentSelectedStyleData.example_image_url}
                        alt={`Exemplo do estilo ${currentSelectedStyleData.name}`}
                        fill
                        style={{ objectFit: "cover" }}
                        className="transition-opacity duration-300"
                        onError={() => handleImageError(`details-${currentSelectedStyleData.id}`)}
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-ghibli-stone">
                        <ImageOff className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-sm">Sem imagem de exemplo</p>
                      </div>
                    )}
                  </div>

                  {/* Botão de Seleção Principal */}
                  <div className={cn("md:mt-6", currentSelectedStyleData.example_image_url ? "mt-6" : "mt-2")}>
                    <Button 
                        className="w-full max-w-md mx-auto ghibli-button text-base p-3"
                        onClick={() => handleDirectStyleSelect(currentSelectedStyleData)}
                        disabled={selectedStyleId === currentSelectedStyleData.id} // Desabilita se já for o estilo selecionado globalmente
                    >
                        {selectedStyleId === currentSelectedStyleData.id ? "Estilo Já Selecionado" : `Usar Estilo: ${currentSelectedStyleData.name}`}
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          
            <AnimatePresence>
              {showScrollTop && ( /* ... Botão Scroll to Top ... */ <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }} onClick={scrollToTop} className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-ghibli-moss/90 text-white rounded-full p-2.5 shadow-xl z-30 hover:bg-ghibli-moss transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Voltar ao topo"> <ArrowUpCircle className="h-5 w-5" /> </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StyleSelectorModal;
