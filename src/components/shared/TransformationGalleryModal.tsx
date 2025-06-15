import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

interface Transformation {
  id: string;
  input_url: string;
  output_url: string;
  style: string;
  created_at: string;
  is_public: boolean;
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

  // Fetch user transformations
  const fetchTransformations = async () => {
    if (!userInfo?.id || !session?.access_token) return;

    setLoading(true);
    try {
      const response = await fetch('/api/community/get-my-private-transformations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransformations(data.transformations || []);
      } else {
        console.error('Failed to fetch transformations');
      }
    } catch (error) {
      console.error('Error fetching transformations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transformations when modal opens
  useEffect(() => {
    if (isOpen && userInfo) {
      fetchTransformations();
    }
  }, [isOpen, userInfo]);

  // Filter transformations based on search term
  const filteredTransformations = transformations.filter(transformation =>
    transformation.style.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectImage = (transformation: Transformation) => {
    setSelectedImageId(transformation.id);
    onSelectImage(transformation.output_url, transformation.id);
    onClose();
  };

  const handleClose = () => {
    setSelectedImageId(null);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            As Suas Artes Transformadas
          </DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Pesquisar por estilo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">A carregar as suas transformações...</p>
            </div>
          ) : filteredTransformations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhuma transformação encontrada' : 'Ainda não tem transformações'}
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                {searchTerm 
                  ? 'Tente pesquisar por outro termo ou limpe o filtro.'
                  : 'Crie a sua primeira transformação AI para personalizar produtos.'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleClose}
                  className="mt-4"
                  variant="outline"
                >
                  Criar Transformação
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTransformations.map((transformation) => (
                <div
                  key={transformation.id}
                  className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImageId === transformation.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  onClick={() => handleSelectImage(transformation)}
                >
                  {/* Image */}
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    <img
                      src={transformation.output_url}
                      alt={`Transformação ${transformation.style}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white rounded-full p-2 shadow-lg">
                          <ImageIcon className="w-5 h-5 text-gray-700" />
                        </div>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {selectedImageId === transformation.id && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-blue-500 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 bg-white">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transformation.style}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(transformation.created_at).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            {filteredTransformations.length} transformaç{filteredTransformations.length === 1 ? 'ão' : 'ões'} encontrada{filteredTransformations.length === 1 ? '' : 's'}
          </p>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            {selectedImageId && (
              <Button 
                onClick={() => {
                  const selected = transformations.find(t => t.id === selectedImageId);
                  if (selected) {
                    handleSelectImage(selected);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Selecionar Imagem
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 