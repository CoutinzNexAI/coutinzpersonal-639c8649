import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/ui/sonner';

interface Transformation {
  id: string;
  input_file_path: string;
  output_url: string;
  style_requested: string;
  created_at: string;
  community_status: string;
  status: string;
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
  const { userInfo, session } = useAuth();
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Fetch user transformations using direct Supabase query
  const fetchTransformations = async () => {
    if (!userInfo?.id) {
      console.log('❌ No user ID available');
      return;
    }

    setLoading(true);
    try {
      // Carregar transformações do utilizador

      // Direct Supabase query
      const { data, error } = await supabase
        .from('transformations')
        .select(`
          id,
          input_file_path,
          output_url,
          style_requested,
          created_at,
          community_status,
          status
        `)
        .eq('user_id', userInfo.id)
        .eq('status', 'completed')
        .eq('community_status', 'private')
        .not('output_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Supabase error:', error);
        toast.error('Erro ao carregar transformações', {
          description: error.message
        });
        return;
      }

      console.log('✅ Transformations loaded:', data?.length || 0);
      setTransformations(data || []);

      // Fallback: try API if direct query fails or returns empty
      if (!data || data.length === 0) {
        console.log('🔄 Trying API fallback...');
        await fetchTransformationsViaAPI();
      }

    } catch (error) {
      console.error('❌ Error fetching transformations:', error);
      toast.error('Erro ao carregar transformações');
      // Try API fallback
      await fetchTransformationsViaAPI();
    } finally {
      setLoading(false);
    }
  };

  // Fallback API method
  const fetchTransformationsViaAPI = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/community/get-my-private-transformations?page=1&limit=50', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API transformations loaded:', data.transformations?.length || 0);
        
        // Convert API format to our format
        const convertedTransformations = (data.transformations || []).map((t: {
          id: string;
          input_url?: string;
          output_url: string;
          style_name?: string;
          created_at: string;
        }) => ({
          id: t.id,
          input_file_path: t.input_url || '', 
          output_url: t.output_url,
          style_requested: t.style_name || 'Desconhecido',
          created_at: t.created_at,
          community_status: 'private',
          status: 'completed'
        }));
        
        setTransformations(convertedTransformations);
      } else {
        console.error('❌ API fetch failed:', response.status);
      }
    } catch (error) {
      console.error('❌ API error:', error);
    }
  };

  // Fetch transformations when modal opens
  useEffect(() => {
    if (isOpen && userInfo) {
      console.log('🚀 Modal opened, fetching transformations...');
      setCurrentPage(1); // Reset to first page
      fetchTransformations();
    }
  }, [isOpen, userInfo?.id]);

  // Filter transformations based on search term
  const filteredTransformations = transformations.filter(transformation =>
    transformation.style_requested.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransformations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransformations = filteredTransformations.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSelectImage = (transformation: Transformation) => {
    console.log('✅ Image selected:', transformation.id);
    setSelectedImageId(transformation.id);
    onSelectImage(transformation.output_url, transformation.id);
    onClose();
  };

  const handleClose = () => {
    setSelectedImageId(null);
    setSearchTerm('');
    setCurrentPage(1);
    onClose();
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-ghibli-cream border-ghibli-stone flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-semibold text-ghibli-earth">
            As Suas Artes Transformadas
          </DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative mb-4 shrink-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ghibli-earth/60 w-4 h-4" />
          <Input
            placeholder="Pesquisar por estilo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-ghibli-stone/30 focus:border-ghibli-moss"
          />
        </div>

        {/* Content with scroll */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-ghibli-moss animate-spin mb-4" />
              <p className="text-ghibli-earth/70">A carregar as suas transformações...</p>
            </div>
          ) : filteredTransformations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="w-12 h-12 text-ghibli-earth/40 mb-4" />
              <h3 className="text-lg font-medium text-ghibli-earth mb-2">
                {searchTerm ? 'Nenhuma transformação encontrada' : 'Ainda não tem transformações'}
              </h3>
              <p className="text-ghibli-earth/70 text-center max-w-md">
                {searchTerm 
                  ? 'Tente pesquisar por outro termo ou limpe o filtro.'
                  : 'Crie a sua primeira transformação AI para personalizar produtos.'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => {
                    handleClose();
                    window.location.href = '/transformacoes';
                  }}
                  className="mt-4 bg-ghibli-moss hover:bg-ghibli-moss/90 text-white"
                >
                  Ir para Transformações
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1">
              {currentTransformations.map((transformation) => (
                <div
                  key={transformation.id}
                  className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImageId === transformation.id
                      ? 'border-ghibli-moss ring-2 ring-ghibli-moss/30'
                      : 'border-ghibli-stone/30 hover:border-ghibli-moss/50 hover:shadow-md'
                  }`}
                  onClick={() => handleSelectImage(transformation)}
                >
                  {/* Image */}
                  <div className="aspect-square relative overflow-hidden bg-ghibli-stone/10">
                    <img
                      src={transformation.output_url}
                      alt={`Transformação ${transformation.style_requested}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white rounded-full p-2 shadow-lg">
                          <ImageIcon className="w-5 h-5 text-ghibli-earth" />
                        </div>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {selectedImageId === transformation.id && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-ghibli-moss rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-white/80">
                    <p className="text-sm font-medium text-ghibli-earth truncate">
                      {transformation.style_requested}
                    </p>
                    <p className="text-xs text-ghibli-earth/60 mt-1">
                      {new Date(transformation.created_at).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with pagination */}
            {totalPages > 1 && (
          <div className="shrink-0 flex items-center justify-center pt-4 border-t border-ghibli-stone/30">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-sm text-ghibli-earth px-2">
                  {currentPage} / {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 