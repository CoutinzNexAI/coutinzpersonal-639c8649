
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTransformationsModal } from '@/hooks/useTransformationsModal';

// Mock data for transformations
const mockTransformations = [
  {
    id: '1',
    original: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7',
    transformed: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
    style: 'Ghibli',
    date: '2025-04-28',
  },
  {
    id: '2',
    original: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    transformed: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
    style: 'Futurista',
    date: '2025-04-27',
  },
  {
    id: '3',
    original: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
    transformed: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7',
    style: 'Anime',
    date: '2025-04-26',
  },
];

const TransformationsModal: React.FC = () => {
  const { isOpen, closeTransformationsModal } = useTransformationsModal();

  return (
    <Dialog open={isOpen} onOpenChange={closeTransformationsModal}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>As Minhas Transformações</DialogTitle>
          <DialogDescription>
            Histórico das suas imagens transformadas.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {mockTransformations.map((item) => (
            <div key={item.id} className="bg-muted rounded-lg overflow-hidden">
              <div className="relative aspect-square">
                <img 
                  src={item.transformed} 
                  alt={`Transformação ${item.style}`}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                  <div className="text-white">
                    <p className="font-medium">{item.style}</p>
                    <p className="text-xs opacity-80">{item.date}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransformationsModal;
