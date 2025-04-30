
import React from 'react';

interface StyleThumbnailsProps {
  uploadedImage: boolean;
  onStyleSelectorClick: () => void;
}

const StyleThumbnails: React.FC<StyleThumbnailsProps> = ({
  uploadedImage,
  onStyleSelectorClick,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i} 
          className={`aspect-square ghibli-card p-1 ${uploadedImage ? 'hover:border-primary cursor-pointer transition-all hover:scale-105' : 'opacity-50'}`}
          onClick={() => uploadedImage && onStyleSelectorClick()}
        >
          <img 
            src={`https://images.unsplash.com/photo-${1500375592092 + i * 10000}-40eb2168fd21?auto=format&fit=crop&w=300&q=80`} 
            alt={`Estilo ${i}`}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      ))}
    </div>
  );
};

export default StyleThumbnails;
