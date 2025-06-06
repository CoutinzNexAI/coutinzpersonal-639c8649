import React from 'react';
import Image, { ImageProps } from 'next/image';

interface SEOImageProps extends Omit<ImageProps, 'alt' | 'style'> {
  alt?: string;
  seoDescription?: string;
  artStyle?: string; // For style recognition (e.g., "simpson", "ghibli", "lego")
  isTransformation?: boolean;
  generateAltFromPath?: boolean;
}

const SEOImage: React.FC<SEOImageProps> = ({
  src,
  alt,
  seoDescription,
  artStyle,
  isTransformation = false,
  generateAltFromPath = true,
  ...props
}) => {
  // Generate alt text if not provided
  const generateAltText = (): string => {
    if (alt) return alt;
    
    // If it's a transformation image
    if (isTransformation && artStyle) {
      return `Foto transformada com AI no estilo ${artStyle} - Arte digital criada com inteligência artificial`;
    }
    
    // Try to extract meaningful info from path
    if (generateAltFromPath && typeof src === 'string') {
      const filename = src.split('/').pop()?.split('.')[0] || '';
      
      // Common style patterns
      if (filename.includes('simpson')) {
        return 'Transformação de foto no estilo Simpson - Arte AI';
      }
      if (filename.includes('ghibli')) {
        return 'Foto no estilo Studio Ghibli - Arte AI';
      }
      if (filename.includes('lego')) {
        return 'Imagem transformada em estilo LEGO - Arte AI';
      }
      if (filename.includes('azulejo')) {
        return 'Foto no estilo azulejo português - Arte AI';
      }
      if (filename.includes('cartoon')) {
        return 'Transformação cartoon - Arte AI';
      }
      if (filename.includes('imperador')) {
        return 'Estilo imperador português - Arte AI';
      }
      if (filename.includes('minecraft')) {
        return 'Transformação Minecraft - Arte AI';
      }
      
      // Generic transformation
      if (src.includes('/foto/') || src.includes('normal')) {
        return 'Foto original antes da transformação AI';
      }
      
      // Default for transformed images
      return `Arte AI criada com Pictuz - ${filename.replace(/[_-]/g, ' ')}`;
    }
    
    return seoDescription || 'Imagem gerada com inteligência artificial no Pictuz';
  };

  const finalAltText = generateAltText();

  return (
    <Image
      src={src}
      alt={finalAltText}
      loading="lazy"
      {...props}
      // Add structured data if it's a transformation
      {...(isTransformation && {
        'data-type': 'ai-transformation',
        'data-style': artStyle,
      })}
    />
  );
};

export default SEOImage; 