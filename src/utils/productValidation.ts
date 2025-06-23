import { toast } from '@/components/ui/sonner';

export interface ValidatePurchaseOptions {
  selectedImageUrl: string;
  selectedPrintifyVariantId: number | null;
  userInfo?: { id: string } | null;
  productName: string;
  requiresVariantSelection?: boolean;
}

export const validatePurchase = (options: ValidatePurchaseOptions): boolean => {
  const { 
    selectedImageUrl, 
    selectedPrintifyVariantId, 
    userInfo, 
    productName,
    requiresVariantSelection = true 
  } = options;

  // Validar se há arte selecionada
  if (!selectedImageUrl) {
    toast.error(`Escolha uma arte primeiro para personalizar o seu ${productName.toLowerCase()}!`);
    return false;
  }

  // Validar se há variante selecionada (quando necessário)
  if (requiresVariantSelection && !selectedPrintifyVariantId) {
    toast.error('Escolha um tamanho antes de adicionar ao carrinho!');
    return false;
  }

  // Validar se o utilizador está autenticado
  if (!userInfo?.id) {
    toast.error('Faça login para adicionar produtos ao carrinho!');
    return false;
  }

  return true;
};

export default validatePurchase; 