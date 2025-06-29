import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProductArtStatusProps {
  selectedImageUrl: string;
  onOpenGallery: () => void;
  className?: string;
}

export const ProductArtStatus: React.FC<ProductArtStatusProps> = ({
  selectedImageUrl,
  onOpenGallery,
  className = ''
}) => {
  if (!selectedImageUrl) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
      className={className}
    >
      <Card className="bg-white/90 backdrop-blur-sm border-ghibli-sand/40">
        <CardContent className="p-4">
          <h2 className="text-lg font-bold text-ghibli-moss mb-3">📊 Status Arte</h2>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <img 
              src={selectedImageUrl} 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-green-300" 
              alt="Arte selecionada" 
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-800 text-sm">✅ Arte Aplicada</p>
              <p className="text-xs text-green-600 truncate">Transformação AI pronta</p>
            </div>
            <Button
              size="sm"
              onClick={onOpenGallery}
              variant="outline"
              className="text-xs px-3 py-1 border-green-300 text-green-700 hover:bg-green-100 shrink-0"
            >
              Trocar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductArtStatus; 