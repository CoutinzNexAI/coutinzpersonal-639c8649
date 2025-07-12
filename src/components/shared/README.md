# Componentes Compartilhados de Produto



Esta pasta contém componentes reutilizáveis criados para simplificar o desenvolvimento de páginas de produtos. Todos os componentes foram extraídos da página de canecas e são otimizados para eficiência e reutilização.

## 🧩 Componentes Disponíveis

### Layout e Navegação
- **`ProductHeader`** - Cabeçalho com breadcrumb para navegação
- **`ProductCardDecorations`** - Decorações visuais para cartões de produto (já existia)

### Controlos de Personalização
- **`ProductPositionControls`** - Controlos para ajustar posição da arte (vertical/horizontal)
- **`ProductMobileControls`** - Versão móvel compacta dos controlos de posição

### Informações do Produto
- **`ProductArtStatus`** - Mostra status da arte selecionada com botão para trocar
- **`ProductDescription`** - Lista de características do produto em tópicos
- **`ProductGuarantees`** - Grid de garantias/features (cerâmica premium, impressão HD, etc.)
- **`ProductVariantSelector`** - Seletor de variantes/tamanhos (dropdown ou info simples)

### Compra e Preços
- **`ProductQuantityPricing`** - Seletor de quantidade com cálculo de preços e descontos
- **`ProductAddToCartButton`** - Botão de adicionar ao carrinho com todos os estados
- **`ProductMobileInfo`** - Agrupa status da arte + seletor de variantes para mobile

### Estados e Carregamento
- **`ProductLoadingState`** - Componente genérico para estado de carregamento

### Modais e Overlays
- **`TransformationGalleryModal`** - Modal para seleção de artes (já existia)

### Seletores de Variantes Específicos
- **`product-customization/PhoneCaseVariantSelector`** - Seletor específico para capas de telemóvel
- **`product-customization/FramedCanvasVariantSelector`** - Seletor específico para canvas com moldura  
- **`product-customization/PosterVariantSelector`** - Seletor específico para posters
- **`product-customization/NotebookVariantSelector`** - Seletor específico para cadernos
- **`product-customization/ToteBagVariantSelector`** - Seletor específico para sacos

## 🚀 Como Usar

### Exemplo de Página de Produto (baseado na caneca):

```tsx
import { ProductHeader } from '@/components/shared/ProductHeader';
import { ProductPositionControls } from '@/components/shared/ProductPositionControls';
import { ProductQuantityPricing } from '@/components/shared/ProductQuantityPricing';
import { ProductAddToCartButton } from '@/components/shared/ProductAddToCartButton';
import { ProductLoadingState } from '@/components/shared/ProductLoadingState';
import { ProductArtStatus } from '@/components/shared/ProductArtStatus';
import { ProductDescription } from '@/components/shared/ProductDescription';
import { ProductGuarantees } from '@/components/shared/ProductGuarantees';
import { ProductVariantSelector } from '@/components/shared/ProductVariantSelector';
import { ProductMobileInfo } from '@/components/shared/ProductMobileInfo';
import { TransformationGalleryModal } from '@/components/shared/TransformationGalleryModal';
// ... outros imports

const MyProductPage = ({ product }) => {
  // Estados necessários
  const [quantity, setQuantity] = useState(1);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState(null);
  const [imagePosition, setImagePosition] = useState('center');
  const [userImageDimensions, setUserImageDimensions] = useState(null);
  const [isProcessingMockup, setIsProcessingMockup] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  // ... outros estados
  
  // Lógica de preços (implementar conforme necessário)
  const basePrice = 15.99; // Preço base do produto
  const discountTiers = [
    { min: 2, discount: 10, label: 'produtos', emoji: '💡' },
    { min: 3, discount: 15, label: 'produtos', emoji: '🔥' }
  ];
  
  // Handlers
  const handleAddToCart = async () => {
    // Validar se pode comprar
    if (!selectedImageUrl || !selectedImageId || !userInfo || !selectedPrintifyVariantId) {
      toast.error('Por favor, complete todos os campos obrigatórios');
      return;
    }
    
    // Lógica de adicionar ao carrinho...
    console.log('Adicionando ao carrinho:', {
      quantity,
      selectedImageUrl,
      selectedImageId,
      selectedPrintifyVariantId
    });
  };

  const handleOpenGallery = () => {
    setIsGalleryOpen(true);
  };

  const handleSelectImage = (imageUrl: string, imageId: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    setIsGalleryOpen(false);
  };

  // Loading state
  if (!product) {
    return <ProductLoadingState message="A carregar produto..." />;
  }
  
  // Validação de compra
  const canPurchase = Boolean(
    selectedImageUrl && 
    selectedImageId && 
    userInfo && 
    selectedPrintifyVariantId
  );
  
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <ProductHeader product={product} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Canvas do produto */}
          <ProductCanvas 
            selectedProduct={product}
            userImageUrl={selectedImageUrl}
            userId={userInfo?.id}
            selectedPrintifyVariantId={selectedPrintifyVariantId}
            onPreviewReady={handlePreviewReady}
            // ... outras props
          />
          
          {/* Painel de controlo */}
          <div className="space-y-6">
            <ProductPositionControls
              selectedImageUrl={selectedImageUrl}
              userImageDimensions={userImageDimensions}
              product={product}
              imagePosition={imagePosition}
              isGeneratingMockup={isProcessingMockup}
              onOpenGallery={handleOpenGallery}
              onAdjustPosition={handleAdjustPosition}
              positionType="vertical" // ou "horizontal" para capas
            />
            
            <ProductArtStatus 
              selectedImageUrl={selectedImageUrl}
              onOpenGallery={handleOpenGallery}
            />
            
            <ProductDescription 
              items={[
                "Impressão HD de alta qualidade",
                "Cerâmica premium resistente",
                "Cores vibrantes e duradouras"
              ]} 
            />
            
            <ProductVariantSelector
              product={product}
              selectedVariantId={selectedPrintifyVariantId}
              onVariantChange={setSelectedPrintifyVariantId}
              label="Tamanho da Caneca"
              emoji="☕"
            />
            
            <ProductQuantityPricing
              basePrice={basePrice}
              quantity={quantity}
              onQuantityChange={setQuantity}
              discountTiers={discountTiers}
              canPurchase={canPurchase}
              onAddToCart={handleAddToCart}
              loading={isProcessingMockup}
              userInfo={userInfo}
              selectedImageUrl={selectedImageUrl}
            />
            
            <ProductAddToCartButton
              canPurchase={canPurchase}
              isProcessingMockup={isProcessingMockup}
              loading={isProcessingMockup}
              userInfo={userInfo}
              selectedImageUrl={selectedImageUrl}
              selectedPrintifyVariantId={selectedPrintifyVariantId}
              onAddToCart={handleAddToCart}
              onOpenGallery={handleOpenGallery}
              size="desktop"
            />
            
            <ProductGuarantees />
          </div>
        </div>
      </div>
      
      {/* Mobile */}
      <div className="block lg:hidden">
        <ProductCanvas 
          selectedProduct={product}
          userImageUrl={selectedImageUrl}
          userId={userInfo?.id}
          selectedPrintifyVariantId={selectedPrintifyVariantId}
          onPreviewReady={handlePreviewReady}
          // ... outras props mobile
        />
        
        <ProductMobileControls
          selectedImageUrl={selectedImageUrl}
          userImageDimensions={userImageDimensions}
          product={product}
          imagePosition={imagePosition}
          isGeneratingMockup={isProcessingMockup}
          userInfo={userInfo}
          onOpenGallery={handleOpenGallery}
          onAdjustPosition={handleAdjustPosition}
          positionType="vertical"
        />
        
        <ProductMobileInfo
          selectedImageUrl={selectedImageUrl}
          product={product}
          selectedVariantId={selectedPrintifyVariantId}
          onVariantChange={setSelectedPrintifyVariantId}
          onOpenGallery={handleOpenGallery}
        />
        
        <ProductQuantityPricing
          basePrice={basePrice}
          quantity={quantity}
          onQuantityChange={setQuantity}
          discountTiers={discountTiers}
          canPurchase={canPurchase}
          onAddToCart={handleAddToCart}
          loading={isProcessingMockup}
          userInfo={userInfo}
          selectedImageUrl={selectedImageUrl}
        />
        
        <ProductAddToCartButton
          canPurchase={canPurchase}
          isProcessingMockup={isProcessingMockup}
          loading={isProcessingMockup}
          userInfo={userInfo}
          selectedImageUrl={selectedImageUrl}
          selectedPrintifyVariantId={selectedPrintifyVariantId}
          onAddToCart={handleAddToCart}
          onOpenGallery={handleOpenGallery}
          size="mobile"
        />
      </div>
      
      {/* Modal de Galeria */}
      <TransformationGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectImage={handleSelectImage}
      />
    </>
  );
};
```

## 🔧 Props Principais dos Componentes

### ProductAddToCartButton
```tsx
interface ProductAddToCartButtonProps {
  canPurchase: boolean;
  isProcessingMockup: boolean;
  loading: boolean;
  userInfo: { id: string } | null;
  selectedImageUrl: string;
  selectedPrintifyVariantId: number | null;
  onAddToCart: () => void;
  onOpenGallery?: () => void;
  className?: string;
  size?: 'mobile' | 'desktop';
}
```

### ProductQuantityPricing
```tsx
interface ProductQuantityPricingProps {
  basePrice: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  discountTiers?: Array<{ min: number; discount: number; label: string; emoji: string }>;
  canPurchase?: boolean;
  onAddToCart?: () => void;
  loading?: boolean;
  userInfo?: { id: string; email: string } | null;
  selectedImageUrl?: string;
}
```

### TransformationGalleryModal
```tsx
interface TransformationGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, imageId: string) => void;
}
```

## 📝 Notas Importantes

1. **Estados Necessários**: Cada página de produto precisa gerir quantidade, imagem selecionada, variante selecionada e estados de carregamento.

2. **Validação**: A validação de compra deve verificar se todos os campos obrigatórios estão preenchidos antes de permitir adicionar ao carrinho.

3. **Responsividade**: Todos os componentes têm versões desktop e mobile otimizadas.

4. **Hooks Externos**: Os componentes dependem de hooks como `useAuth`, `useCart`, e `toast` que devem ser implementados na aplicação.

5. **Customização**: Cada produto pode ter suas próprias variações dos componentes através das props disponíveis.

## 🎯 Exemplo de Integração Rápida

Para produtos simples, pode usar apenas os componentes essenciais:

```tsx
// Versão minimalista
<ProductCanvas {...canvasProps} />
<ProductAddToCartButton {...buttonProps} />
<TransformationGalleryModal {...galleryProps} />
```

Para produtos complexos, use a suite completa de componentes para máxima funcionalidade e UX. 