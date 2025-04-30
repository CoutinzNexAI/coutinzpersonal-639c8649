
import React from 'react';

interface StyleThumbnailsProps {
  uploadedImage: boolean;
  onStyleSelectorClick: () => void;
}

const StyleThumbnails: React.FC<StyleThumbnailsProps> = ({ uploadedImage, onStyleSelectorClick }) => {
  return (
    <div 
      className="ghibli-card w-full aspect-square flex items-center justify-center cursor-pointer"
      onClick={uploadedImage ? onStyleSelectorClick : undefined}
    >
      <div className="grid grid-cols-2 gap-2 p-4">
        {[1, 2, 3, 4].map((item) => (
          <div 
            key={item}
            className="aspect-square rounded-lg bg-muted/50 overflow-hidden flex items-center justify-center"
          >
            {!uploadedImage ? (
              <div className="text-sm text-muted-foreground">Estilo {item}</div>
            ) : (
              <div className="h-full w-full bg-muted animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StyleThumbnails;
