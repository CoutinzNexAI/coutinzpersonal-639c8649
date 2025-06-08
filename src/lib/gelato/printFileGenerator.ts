import { GelatoProduct } from './gelatoProducts';

export interface PrintFileOptions {
  imageUrl: string;
  product: GelatoProduct;
  outputFormat: 'pdf' | 'png' | 'jpeg';
  userId: string;
}

export interface PrintFileResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  error?: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
}

/**
 * Gera um ficheiro de impressão pronto para enviar à Gelato
 * Este será implementado numa API route para processar no servidor
 */
export const generatePrintFile = async (options: PrintFileOptions): Promise<PrintFileResult> => {
  const { imageUrl, product, outputFormat, userId } = options;

  try {
    // Esta função será implementada numa API route (/api/gelato/generate-print-file)
    // porque precisa de processamento no servidor
    
    const response = await fetch('/api/gelato/generate-print-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        productUid: product.productUid, // Envia o productUid da Gelato diretamente
        outputFormat,
        userId
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao gerar ficheiro: ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Erro na geração do ficheiro de impressão:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Calcula as dimensões finais do ficheiro de impressão
 * baseado nas dimensões reais da Gelato em mm
 */
export const calculatePrintDimensions = (product: GelatoProduct): { 
  widthPx: number; 
  heightPx: number; 
  widthMm: number; 
  heightMm: number 
} => {
  const { gelatoPrintDimensionsMm, printFileBleed, printFileResolution } = product;

  // Dimensões de impressão Gelato em MM
  const printWidthMm = gelatoPrintDimensionsMm.width;
  const printHeightMm = gelatoPrintDimensionsMm.height;

  // Adicionar bleed em MM
  const finalWidthMm = printWidthMm + (printFileBleed * 2);
  const finalHeightMm = printHeightMm + (printFileBleed * 2);

  // Converter para pixels com base na resolução desejada (DPI)
  // (mm * dpi) / 25.4 (mm por polegada) = pixels
  const widthPx = Math.round((finalWidthMm / 25.4) * printFileResolution);
  const heightPx = Math.round((finalHeightMm / 25.4) * printFileResolution);

  return {
    widthPx,
    heightPx,
    widthMm: finalWidthMm,
    heightMm: finalHeightMm
  };
};

/**
 * Valida se uma imagem é adequada para impressão
 */
export const validateImageForPrint = (
  imageWidth: number, 
  imageHeight: number, 
  product: GelatoProduct
): { valid: boolean; warnings: string[]; minDimensions: { width: number; height: number } } => {
  const warnings: string[] = [];
  const printDimensions = calculatePrintDimensions(product);
  
  // Verificar resolução mínima
  if (imageWidth < printDimensions.widthPx) {
    warnings.push(`Largura da imagem (${imageWidth}px) é menor que o recomendado (${printDimensions.widthPx}px)`);
  }
  
  if (imageHeight < printDimensions.heightPx) {
    warnings.push(`Altura da imagem (${imageHeight}px) é menor que o recomendado (${printDimensions.heightPx}px)`);
  }
  
  // Verificar ratio de aspeto
  const imageRatio = imageWidth / imageHeight;
  const printRatio = printDimensions.widthPx / printDimensions.heightPx;
  const ratioDifference = Math.abs(imageRatio - printRatio);
  
  if (ratioDifference > 0.1) {
    warnings.push('Proporções da imagem podem resultar em corte ou esticamento');
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
    minDimensions: { 
      width: printDimensions.widthPx, 
      height: printDimensions.heightPx 
    }
  };
};

/**
 * Gera um nome único para o ficheiro de impressão
 */
export const generatePrintFileName = (
  userId: string, 
  productId: string, 
  format: string
): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  return `print_${userId}_${productId}_${timestamp}_${randomId}.${format}`;
};

/**
 * Constantes para geração de PDFs
 */
export const PDF_CONSTANTS = {
  // Perfil de cor recomendado pela Gelato
  COLOR_PROFILE: 'ISO Coated v2 300% (ECI)',
  
  // Configurações PDF/X-4
  PDF_X4_SETTINGS: {
    version: '1.4',
    subset: true,
    colorModel: 'CMYK',
    intent: 'Perceptual'
  },
  
  // Formatos suportados
  SUPPORTED_FORMATS: ['pdf', 'png', 'jpeg'] as const,
  
  // Qualidade por defeito
  DEFAULT_QUALITY: 95
} as const; 