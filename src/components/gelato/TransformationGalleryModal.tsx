import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/sonner';

interface Transformation {
  id: string;
  output_url: string;
  style_requested: string;
  created_at: string;
}

interface TransformationGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, imageId: string) => void;
}

export default function TransformationGalleryModal({ 
  isOpen, 
  onClose, 
  onSelectImage 
}: TransformationGalleryModalProps) {
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const { userInfo } = useAuth();

  const ITEMS_PER_PAGE = 6;

  const fetchTransformations = useCallback(async (page: number) => {
    if (!userInfo?.id) {
      console.log('TransformationGalleryModal: No user ID available');
      return;
    }

    setLoading(true);
    try {
      console.log('TransformationGalleryModal: Fetching transformations for page:', page);
      
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Usar Supabase diretamente como no TransformationsModal existente
      const { data, error: dbError, count } = await supabase
        .from('transformations')
        .select(`
          id, output_url, style_requested, created_at
        `, { count: 'exact' })
        .eq('user_id', userInfo.id)
        .eq('status', 'completed')
        .not('output_url', 'is', null)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (dbError) {
        console.error('TransformationGalleryModal: Database error:', dbError);
        throw dbError;
      }

      console.log('TransformationGalleryModal: Fetched data:', data);
      console.log('TransformationGalleryModal: Total count:', count);

      setTransformations(data || []);
      const totalCount = count || 0;
      const calculatedTotalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
      setTotalPages(calculatedTotalPages);
      setHasNextPage(page < calculatedTotalPages);
      setHasPreviousPage(page > 1);
      setCurrentPage(page);

    } catch (error) {
      console.error('TransformationGalleryModal: Error fetching transformations:', error);
      setTransformations([]);
      setTotalPages(0);
      setHasNextPage(false);
      setHasPreviousPage(false);
      toast.error('Erro ao carregar transformações', {
        description: 'Tente novamente ou contacte o suporte.'
      });
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id, ITEMS_PER_PAGE]);

  useEffect(() => {
    if (isOpen && userInfo?.id) {
      console.log('TransformationGalleryModal: Modal opened, fetching page 1');
      setCurrentPage(1);
      fetchTransformations(1);
    } else if (!isOpen) {
      // Limpar dados quando modal fecha
      setTransformations([]);
      setCurrentPage(1);
      setTotalPages(0);
      setHasNextPage(false);
      setHasPreviousPage(false);
    }
  }, [isOpen, userInfo?.id, fetchTransformations]);

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      const newPage = currentPage - 1;
      fetchTransformations(newPage);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      const newPage = currentPage + 1;
      fetchTransformations(newPage);
    }
  };

  const handleSelectImage = (transformation: Transformation) => {
    console.log('TransformationGalleryModal: Transformation selected:', transformation);
    onSelectImage(transformation.output_url, transformation.id);
    onClose();
  };

  const formatStyleName = (style: string) => {
    return style.charAt(0).toUpperCase() + style.slice(1).replace('_', ' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-teal-700">
            Escolha a sua Arte AI
          </DialogTitle>
          <p className="text-gray-600 text-center">
            Selecione uma das suas transformações para aplicar ao produto
          </p>
        </DialogHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <span className="ml-2 text-gray-600">A carregar as suas artes...</span>
            </div>
          ) : transformations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ImageIcon className="h-16 w-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma transformação encontrada</h3>
              <p className="text-center">
                Ainda não tem transformações concluídas. 
                <br />
                Crie a sua primeira arte AI no{' '}
                <Link href="/" className="text-teal-600 hover:underline">
                  PicTuz
                </Link>
                !
              </p>
            </div>
          ) : (
            <>
              {/* Gallery Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {transformations.map((transformation) => (
                  <div
                    key={transformation.id}
                    className="relative group cursor-pointer transform transition-all duration-200 hover:scale-105"
                    onClick={() => handleSelectImage(transformation)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-teal-500 transition-colors">
                      <Image
                        src={transformation.output_url}
                        alt={`Transformação ${formatStyleName(transformation.style_requested)}`}
                        className="w-full h-full object-cover"
                        width={300}
                        height={300}
                        loading="lazy"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                        <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-center">
                          <p className="font-semibold text-sm">
                            {formatStyleName(transformation.style_requested)}
                          </p>
                          <p className="text-xs mt-1">Clique para selecionar</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={!hasPreviousPage || loading}
                    className="flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!hasNextPage || loading}
                    className="flex items-center"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 