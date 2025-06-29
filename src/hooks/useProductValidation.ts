import { toast } from 'sonner';

export interface ProductValidationOptions {
  selectedImageUrl: string;
  selectedImageId: string | null;
  userInfo: { id: string } | null;
  selectedPrintifyVariantId: number | null;
  printifyProductId: string;
  printifyImageId: string;
  productName: string;
  customValidationMessage?: string;
}

/**
 * Hook genérico para validação de compra
 * Usado em todos os produtos (canecas, posters, canvas, etc.)
 */
export const useProductValidation = () => {
  
  const validatePurchase = ({
    selectedImageUrl,
    selectedImageId,
    userInfo,
    selectedPrintifyVariantId,
    printifyProductId,
    printifyImageId,
    productName,
    customValidationMessage
  }: ProductValidationOptions): string | null => {
    
    if (!selectedImageUrl) {
      return customValidationMessage || `Escolha uma arte primeiro para personalizar o seu ${productName.toLowerCase()}!`;
    }
    
    if (!selectedImageId) {
      return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    }
    
    if (!userInfo) {
      return 'Faça login para adicionar ao carrinho';
    }
    
    if (selectedPrintifyVariantId === null) {
      return `Por favor, selecione o tamanho do ${productName.toLowerCase()}.`;
    }
    
    if (!printifyProductId || !printifyImageId) {
      return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    }
    
    return null;
  };

  const validateAndShowError = (options: ProductValidationOptions): boolean => {
    const error = validatePurchase(options);
    if (error) {
      toast.error(error);
      return false;
    }
    return true;
  };

  return {
    validatePurchase,
    validateAndShowError
  };
}; 