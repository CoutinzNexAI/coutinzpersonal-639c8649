import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, AlertTriangle, ImageOff, ChevronLeft, ChevronRight } from "lucide-react"; // Adicionado Info
import { useTransformationsModal } from '@/hooks'; // Assume que este hook existe e funciona
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils'; 
import Image from 'next/image';

// Estrutura dos dados da transformação (atualizada)
interface FetchedTransformation {
  id: string;
  output_url: string | null;
  status: string; // Adicionado status
  style_requested: string; // Mantido para fallback se styles.name não vier
  created_at: string; // Adicionado created_at
  completed_at: string | null;
  error_message: string | null; // Adicionado para mostrar em falhas, se quisermos
  styles?: { name: string } | null; // Relação com a tabela styles
}

// Interface para o estado de cada item da grelha
interface GridItemState extends FetchedTransformation {
    imageError: boolean; // Para controlar erro de carregamento da imagem específica
}

// Constantes para paginação
const ITEMS_PER_PAGE = 6;

// Lista de status que queremos buscar (todos exceto talvez os muito iniciais)
// Ajusta conforme os teus ENUMs e o que consideras relevante mostrar
const RELEVANT_STATUSES = [
    'awaiting_processing', 
    'paid', // Se for um estado antes de processar
    'processing_queued',
    'processing', 
    'completed', 
    'error', 
    // Adiciona todos os teus status 'failed_...' aqui
    'failed_upload', 'failed_payment', 'failed_checkout_redirect', 
    'failed_prompt', 'failed_api', 'failed_system', 'failed_db_update', 
    'failed_download', 'failed_input_path', 'failed_trigger',
    'failed_timeout_server', // O novo status de timeout do servidor
    // Adiciona outros que façam sentido
];


const TransformationsModal: React.FC = () => {
  const { isOpen, closeTransformationsModal } = useTransformationsModal();
  const { userInfo, isLoading: isAuthLoading } = useAuth();

  const [gridItems, setGridItems] = useState<GridItemState[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingPage, setIsFetchingPage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const fetchTransformations = useCallback(async (page: number, isPageChange: boolean = false) => {
    if (isAuthLoading || !userInfo) {
        console.log("[TransformationsModal] Auth loading or no user info, skipping fetch.");
        return;
    }

    setError(null);
    if (isPageChange) {
      setIsFetchingPage(true);
    } else {
      setIsLoading(true);
      // Limpa items apenas no carregamento inicial da primeira página para evitar piscar
      // ao mudar de página se a lógica de append/replace for diferente.
      // Se cada página substitui a anterior, limpar sempre é ok.
      if (page === 0) {
        setGridItems([]); 
      }
    }

    try {
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      console.log(`[TransformationsModal] Fetching transformations for user ${userInfo.id}, page ${page}, range ${from}-${to}, statuses: ${RELEVANT_STATUSES.join(', ')}`);

      const { data, error: dbError, count } = await supabase
        .from('transformations')
        .select(`
          id, output_url, status, created_at, completed_at, style_requested, error_message,
          styles ( name )
        `, { count: 'exact' })
        .eq('user_id', userInfo.id)
        .in('status', RELEVANT_STATUSES) // Busca apenas os status relevantes
        .order('created_at', { ascending: false }) // Ordena pelos mais recentes primeiro
        .range(from, to);

      if (dbError) throw dbError;
      
      console.log(`[TransformationsModal] Fetched data:`, data, `Count:`, count);

      const itemsWithState = (data || []).map(item => ({
          ...(item as unknown as FetchedTransformation), 
          imageError: false 
      }));
      setGridItems(itemsWithState);
      setTotalCount(count || 0);

    } catch (err: unknown) {
      console.error('[TransformationsModal] Error fetching transformations:', err);
      const errorMsg = err instanceof Error ? err.message : 'Falha ao carregar o histórico de transformações.';
      setError(errorMsg);
      setGridItems([]); // Limpa em caso de erro
      setTotalCount(0);
      toast.error("Erro no Histórico", { description: errorMsg });
    } finally {
      setIsLoading(false);
      setIsFetchingPage(false);
    }
  }, [userInfo, isAuthLoading]); // currentPage não precisa estar aqui, pois é o gatilho do outro useEffect

  // Efeito para buscar dados quando o modal abre ou o utilizador muda
  useEffect(() => {
    if (isOpen && userInfo && !isAuthLoading) {
      console.log("[TransformationsModal] Modal open and user ready. Fetching initial transformations (page 0).");
      setCurrentPage(0); // Reseta para a primeira página ao abrir ou mudar de user
      fetchTransformations(0, false); 
    } else if (!isOpen) {
      // Limpa os dados e reseta a página se o modal estiver fechado
      console.log("[TransformationsModal] Modal closed. Clearing data.");
      setGridItems([]);
      setTotalCount(0);
      setCurrentPage(0); 
      setError(null);
      // Não chamar fetchTransformations aqui
    }
  }, [isOpen, userInfo, isAuthLoading, fetchTransformations]); // fetchTransformations está aqui como dep

 useEffect(() => {
    // Este useEffect é para quando o utilizador clica nos botões de paginação.
    // Não deve buscar na montagem inicial se isOpen for false ou user não estiver pronto.
    if (isOpen && userInfo && !isAuthLoading) {
        // Apenas faz fetch se não for o fetch inicial já coberto pelo outro useEffect
        // Este fetch é acionado pela MUDANÇA de currentPage.
        // O fetchTransformations em si não deve estar na dependência se currentPage for o único gatilho que queremos para *este* efeito.
        // No entanto, para segurança, mantemos.
        console.log(`[TransformationsModal] currentPage changed to ${currentPage}. Fetching page.`);
        fetchTransformations(currentPage, true); // true indica que é uma mudança de página
    }
}, [currentPage]); // Dependência principal aqui é currentPage


  const handleViewClick = useCallback((url: string | null) => {
    if (!url) {
      toast.error("Erro", { description: "URL da imagem indisponível." });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handlePreviousPage = () => {
    if (currentPage > 0 && !isFetchingPage) { // Adicionado !isFetchingPage
        setCurrentPage((prev) => prev - 1);
    }
  }
  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && !isFetchingPage) { // Adicionado !isFetchingPage
        setCurrentPage((prev) => prev + 1);
    }
  }

  const handleImageError = (itemId: string) => {
      setGridItems(prevItems =>
          prevItems.map(item =>
              item.id === itemId ? { ...item, imageError: true } : item
          )
      );
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Data desconhecida';
    try {
      return new Date(dateString).toLocaleDateString('pt-PT', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'Data inválida'; }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeTransformationsModal}>
      <DialogContent className="sm:max-w-[800px] md:max-w-[900px] lg:max-w-[1000px] max-h-[90vh] flex flex-col bg-ghibli-cream">
        <DialogHeader className="p-6 border-b border-ghibli-stone/30">
          <DialogTitle className="text-2xl font-ghibli text-ghibli-wood">As Minhas Transformações</DialogTitle>
          {totalCount > 0 && (
            <DialogDescription className="text-ghibli-earth">
              Página {currentPage + 1} de {totalPages}. Total de {totalCount} transformações.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className={cn(
            "flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-ghibli-moss/50 scrollbar-track-transparent relative",
            isFetchingPage ? "opacity-50 pointer-events-none" : ""
        )}>
            {isFetchingPage && (
                <div className="absolute inset-0 flex justify-center items-center z-10 bg-ghibli-cream/50">
                    <Loader2 className="h-8 w-8 animate-spin text-ghibli-moss" />
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center h-60"> <Loader2 className="h-10 w-10 animate-spin text-ghibli-moss" /> </div>
            ) : error ? (
                <div className="flex flex-col justify-center items-center h-60 text-red-700 bg-red-50 p-4 rounded-lg"> 
                    <AlertTriangle className="h-10 w-10 mb-3" /> 
                    <p className="font-semibold">Erro ao carregar transformações</p>
                    <p className="text-sm">{error}</p> 
                </div>
            ) : gridItems.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-60 text-ghibli-earth"> 
                    <ImageOff className="h-12 w-12 mb-3" /> 
                    <p className="font-semibold">Ainda não tem transformações.</p>
                    <p className="text-sm">Crie a sua primeira obra de arte!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridItems.map((item) => (
                    <div 
                        key={item.id} 
                        className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden group relative shadow-lg border border-ghibli-stone/20 transition-all hover:shadow-2xl"
                    >
                      <div className="relative aspect-square bg-ghibli-stone/10 flex items-center justify-center">
                        {item.status === 'completed' && item.output_url && !item.imageError ? (
                          <Image
                            src={item.output_url}
                            alt={`Transformação estilo ${item.styles?.name || item.style_requested}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            style={{ objectFit: "cover" }}
                            className="transition-transform duration-300 group-hover:scale-105"
                            onError={() => handleImageError(item.id)}
                            priority={gridItems.indexOf(item) < 3} // Prioriza as primeiras imagens
                          />
                        ) : item.imageError && item.status === 'completed' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center text-xs text-red-600 p-2">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-1"/> Erro ao<br/>carregar<br/>imagem
                            </div>
                        ) : ( // Para todos os outros status (processing, failed, error, etc.)
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-3">
                                <Loader2 className="h-10 w-10 text-ghibli-moss animate-spin mb-3" />
                                <p className="text-sm font-medium text-ghibli-wood truncate" title={item.styles?.name || item.style_requested}>
                                    Estilo: {item.styles?.name || item.style_requested}
                                </p>
                                <p className="text-xs text-ghibli-earth mt-1">
                                    Criado em: {formatDate(item.created_at)}
                                </p>
                                <p className="text-xs text-ghibli-moss mt-2 font-semibold">
                                    {item.status === 'processing' || item.status === 'awaiting_processing' || item.status === 'processing_queued' || item.status === 'paid'
                                        ? 'A processar...'
                                        : 'Em análise / Falhou'} 
                                </p>
                                {/* {item.status.startsWith('failed_') && item.error_message && (
                                    <p className="text-xs text-red-500 mt-1 truncate" title={item.error_message}>
                                        Detalhe: {item.error_message}
                                    </p>
                                )} */}
                            </div>
                        )}

                        {/* Overlay para itens COMPLETOS */}
                        {item.status === 'completed' && item.output_url && !item.imageError && (
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <div className="text-white mb-2">
                                    <p className="font-semibold text-base truncate" title={item.styles?.name || item.style_requested}>{item.styles?.name || item.style_requested}</p>
                                    <p className="text-xs opacity-80">Concluído: {formatDate(item.completed_at)}</p>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="w-full text-xs bg-white/90 text-ghibli-charcoal hover:bg-white"
                                    onClick={() => handleViewClick(item.output_url)}
                                >
                                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver Imagem
                                </Button>
                            </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 p-4 mt-auto border-t border-ghibli-stone/30 flex-shrink-0">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePreviousPage} 
                disabled={currentPage === 0 || isLoading || isFetchingPage}
                className="bg-ghibli-paper hover:bg-ghibli-paper/80 border-ghibli-moss text-ghibli-wood"
            > 
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior 
            </Button>
            <span className="text-sm text-ghibli-earth"> Página {currentPage + 1} de {totalPages} </span>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextPage} 
                disabled={currentPage >= totalPages - 1 || isLoading || isFetchingPage}
                className="bg-ghibli-paper hover:bg-ghibli-paper/80 border-ghibli-moss text-ghibli-wood"
            > 
                Próximo <ChevronRight className="h-4 w-4 ml-1" /> 
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransformationsModal;

