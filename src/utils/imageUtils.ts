/**
 * Função para redimensionar uma imagem mantendo proporções
 */
export function resizeImageMaintainAspect(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let newWidth = maxWidth;
  let newHeight = maxHeight;
  
  if (aspectRatio > 1) {
    // Imagem é mais larga que alta
    newHeight = maxWidth / aspectRatio;
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }
  } else {
    // Imagem é mais alta que larga ou quadrada
    newWidth = maxHeight * aspectRatio;
    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = maxWidth / aspectRatio;
    }
  }
  
  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight)
  };
} 