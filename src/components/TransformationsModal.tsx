import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, AlertTriangle, ImageOff, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useTransformationsModal } from '@/hooks/transformationsModalContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils'; // Import cn utility

// Estrutura dos dados da transformação
interface FetchedTransformation {
  id: string;
  output_url: string | null;
  style_requested: string;
  completed_at: string | null;
  styles?: { name: string } | null;
}

// Interface para o estado de cada item da grelha (para controlar erro de imagem)
interface GridItemState extends FetchedTransformation {
    imageError: boolean;
}

// Constantes para paginação
const ITEMS_PER_PAGE = 6;

const TransformationsModal: React.FC = () => {
  const { isOpen, closeTransformationsModal } = useTransformationsModal();
  const { userInfo, isLoading: isAuthLoading } = useAuth();

  // Estado para os dados e estados da UI
  const [gridItems, setGridItems] = useState<GridItemState[]>([]); // Usa a nova interface
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingPage, setIsFetchingPage] = useState<boolean>(false); // Estado específico para loading da paginação
  const [error, setError] = useState<string | null>(null);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Função para buscar transformações
  const fetchTransformations = useCallback(async (page: number, isPageChange: boolean = false) => {
    if (isAuthLoading || !userInfo) return;

    console.log(`[TransformationsModal] Fetching page: ${page}`);
    setError(null);
    if (isPageChange) {
        setIsFetchingPage(true); // Ativa loading específico da página
    } else {
        setIsLoading(true); // Ativa loading inicial
        setGridItems([]); // Limpa itens no carregamento inicial
    }


    try {
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error: dbError, count } = await supabase
        .from('transformations')
        .select(`
          id, output_url, completed_at, style_requested,
          styles ( name )
        `, { count: 'exact' })
        .eq('user_id', userInfo.id)
        .eq('status', 'completed')
        .not('output_url', 'is', null)
        .order('completed_at', { ascending: false })
        .range(from, to);

      if (dbError) throw dbError;

      console.log('[TransformationsModal] Fetched data:', data, 'Total count:', count);

      // Mapeia os dados para incluir o estado de erro da imagem
      const itemsWithState = (data || []).map(item => ({
          ...(item as unknown as FetchedTransformation), // Garante o tipo base
          imageError: false // Inicializa sem erro
      }));
      setGridItems(itemsWithState);
      setTotalCount(count || 0);

    } catch (err: unknown) {
      console.error('[TransformationsModal] Error fetching:', err);
      const errorMsg = err instanceof Error ? err.message : 'Falha ao carregar transformações.';
      setError(errorMsg);
      setGridItems([]);
      setTotalCount(0);
      toast.error("Erro", { description: `Não foi possível carregar: ${errorMsg}` });
    } finally {
      setIsLoading(false); // Desativa loading inicial
      setIsFetchingPage(false); // Desativa loading da página
    }
  }, [userInfo, isAuthLoading]);

  // Efeito para buscar dados
  useEffect(() => {
    if (isOpen && userInfo) {
      fetchTransformations(currentPage, false); // Fetch inicial
    } else {
      setGridItems([]);
      setTotalCount(0);
      setCurrentPage(0);
      setError(null);
    }
  }, [isOpen, userInfo]); // Depende só de isOpen e userInfo para resetar/buscar inicialmente

   // Efeito separado para buscar ao mudar de página
   useEffect(() => {
    if (isOpen && userInfo) {
      // Não busca na montagem inicial aqui, só na mudança de página
      fetchTransformations(currentPage, true);
    }
  }, [currentPage]); // Depende só de currentPage

  // Função para abrir imagem
  const handleViewClick = useCallback((url: string | null) => {
    if (!url) {
      toast.error("Erro", { description: "URL da imagem indisponível." });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // Funções de paginação
  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(0, prev - 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));

  // Função para lidar com erro de carregamento de imagem específica
  const handleImageError = (itemId: string) => {
      setGridItems(prevItems =>
          prevItems.map(item =>
              item.id === itemId ? { ...item, imageError: true } : item
          )
      );
  };

  // Função para formatar datas
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Data desconhecida';
    try {
      return new Date(dateString).toLocaleDateString('pt-PT', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch (e) { return 'Data inválida'; }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeTransformationsModal}>
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1000px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>As Minhas Transformações</DialogTitle>
          <DialogDescription>
            Histórico das suas imagens transformadas. Página {currentPage + 1} de {totalPages}.
          </DialogDescription>
        </DialogHeader>

        {/* Área de Conteúdo Principal (Scrollable) */}
        {/* Adiciona opacidade durante o loading da paginação */}
        <div className={cn(
            "flex-grow overflow-y-auto pr-2 scrollbar-thin relative",
            isFetchingPage ? "opacity-50 pointer-events-none" : "" // Feedback visual para loading da página
        )}>
           {/* Loader sobreposto durante o loading da página */}
           {isFetchingPage && (
                <div className="absolute inset-0 flex justify-center items-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

          {/* Estados Visuais: Loading Inicial, Erro, Vazio */}
          {isLoading ? ( // Mostra loader só no carregamento inicial
            <div className="flex justify-center items-center h-40"> <Loader2 className="h-8 w-8 animate-spin text-primary" /> </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-40 text-destructive"> <AlertTriangle className="h-8 w-8 mb-2" /> <p>Erro ao carregar: {error}</p> </div>
          ) : gridItems.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-40 text-muted-foreground"> <ImageOff className="h-8 w-8 mb-2" /> <p>Ainda não tem transformações concluídas.</p> </div>
          ) : (
            // Grelha com as Transformações
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {gridItems.map((item) => (
                <div key={item.id} className="bg-muted rounded-lg overflow-hidden group relative shadow-md">
                  <div className="relative aspect-square">
                    {/* Mostra erro específico da imagem ou a imagem */}
                    {item.imageError ? (
                       <div className="absolute inset-0 w-full h-full bg-destructive/10 flex flex-col items-center justify-center text-center text-xs text-destructive p-2">
                           <AlertTriangle className="h-6 w-6 mx-auto mb-1"/> Erro ao<br/>carregar<br/>imagem
                       </div>
                    ) : item.output_url ? (
                      <img src={item.output_url} alt={`Transformação estilo ${item.styles?.name || item.style_requested}`}
                           className="object-cover w-full h-full" loading="lazy"
                           onError={() => handleImageError(item.id)} // Chama handler de erro
                      />
                    ) : (
                       // Placeholder se URL for nula (não deveria acontecer devido à query)
                       <div className="w-full h-full bg-gray-200 flex items-center justify-center"><ImageIcon className="h-10 w-10 text-gray-400" /></div>
                    )}

                    {/* Overlay (não mostra se a imagem deu erro) */}
                    {!item.imageError && item.output_url && (
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                            <div className="text-white mb-2">
                                <p className="font-semibold text-sm truncate">{item.styles?.name || item.style_requested}</p>
                                <p className="text-xs opacity-80">{formatDate(item.completed_at)}</p>
                            </div>
                            <Button size="sm" variant="secondary" className="w-full text-xs"
                                onClick={() => handleViewClick(item.output_url)}
                                disabled={!item.output_url}>
                                <Eye className="mr-1 h-3 w-3" /> Ver Imagem
                            </Button>
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controlos de Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-4 mt-auto border-t">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 0 || isLoading || isFetchingPage}> <ChevronLeft className="h-4 w-4 mr-1" /> Anterior </Button>
            <span className="text-sm text-muted-foreground"> Página {currentPage + 1} de {totalPages} </span>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages - 1 || isLoading || isFetchingPage}> Próximo <ChevronRight className="h-4 w-4 ml-1" /> </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransformationsModal;
