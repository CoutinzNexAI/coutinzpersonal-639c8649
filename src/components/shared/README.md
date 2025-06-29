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

## 🔧 Hooks Genéricos Disponíveis

### Lógica de Negócio
- **`useProductPricing`** - Hook para cálculo de preços e descontos automáticos
- **`useProductValidation`** - Hook para validação de compra com mensagens de erro
- **`useProductCoordinates`** - Hook para cálculo de coordenadas Printify (posicionamento)

## 🚀 Como Usar

### Exemplo de Página de Produto (baseado na caneca):

```tsx
import { ProductHeader } from '@/components/shared/ProductHeader';
import { ProductPositionControls } from '@/components/shared/ProductPositionControls';
import { ProductQuantityPricing } from '@/components/shared/ProductQuantityPricing';
import { ProductAddToCartButton } from '@/components/shared/ProductAddToCartButton';
import { ProductLoadingState } from '@/components/shared/ProductLoadingState';
import { 
  useProductPricing, 
  useProductValidation, 
  useProductCoordinates 
} from '@/hooks';
// ... outros imports

const MyProductPage = ({ product }) => {
  // Estados necessários
  const [quantity, setQuantity] = useState(1);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState(null);
  const [imagePosition, setImagePosition] = useState('center');
  const [userImageDimensions, setUserImageDimensions] = useState(null);
  // ... outros estados
  
  // 🔥 NOVOS HOOKS GENÉRICOS
  const { 
    discount, 
    discountedPrice, 
    totalPrice, 
    savings 
  } = useProductPricing({
    basePrice: getBasePrice(),
    quantity,
    discountTiers: [
      { min: 2, discount: 10, label: 'canecas', emoji: '💡' },
      { min: 3, discount: 15, label: 'canecas', emoji: '🔥' }
    ]
  });
  
  const { validateAndShowError } = useProductValidation();
  
  const { calculatePrintifyCoords } = useProductCoordinates();
  
  // Handlers simplificados
  const handleAddToCart = async () => {
    const isValid = validateAndShowError({
      selectedImageUrl,
      selectedImageId,
      userInfo,
      selectedPrintifyVariantId,
      printifyProductId,
      printifyImageId,
      productName: 'caneca'
    });
    
    if (!isValid) return;
    
    // Calcular coordenadas se necessário
    let finalCoordinates;
    if (userImageDimensions && selectedPrintifyVariantId) {
      finalCoordinates = calculatePrintifyCoords({
        position: imagePosition,
        variantId: selectedPrintifyVariantId,
        imageDimensions: userImageDimensions,
        product,
        positionType: 'vertical' // ou 'horizontal' para capas
      });
    }
    
    // Adicionar ao carrinho...
  };

  // Loading state
  if (!product) {
    return <ProductLoadingState message="A carregar produto..." />;
  }
  
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <ProductHeader product={product} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Canvas do produto */}
          <ProductCanvas {...canvasProps} />
          
          {/* Painel de controlo */}
          <div className="space-y-6">
            <ProductPositionControls
              selectedImageUrl={selectedImageUrl}
              userImageDimensions={userImageDimensions}
              product={product}
              imagePosition={imagePosition}
              isGeneratingMockup={isGeneratingMockup}
              onOpenGallery={handleOpenGallery}
              onAdjustPosition={handleAdjustPosition}
              positionType="vertical" // ou "horizontal" para capas
            />
            
            <ProductArtStatus 
              selectedImageUrl={selectedImageUrl}
              onOpenGallery={handleOpenGallery}
            />
            
            <ProductDescription items={customDescriptionItems} />
            
            <ProductVariantSelector
              product={product}
              selectedVariantId={selectedVariantId}
              onVariantChange={handleVariantChange}
              label="Tamanho da Caneca"
              emoji="☕"
            />
            
            <ProductAddToCartButton
              canPurchase={canPurchase}
              isProcessingMockup={isProcessingMockup}
              loading={loading}
              userInfo={userInfo}
              selectedImageUrl={selectedImageUrl}
              selectedPrintifyVariantId={selectedPrintifyVariantId}
              onAddToCart={handleAddToCart}
              size="desktop"
            />
            
            <ProductGuarantees />
          </div>
        </div>
      </div>
      
      {/* Mobile */}
      <div className="block lg:hidden">
        <ProductCanvas {...mobileCanvasProps} />
        
        <ProductMobileControls
          selectedImageUrl={selectedImageUrl}
          userImageDimensions={userImageDimensions}
          product={product}
          imagePosition={imagePosition}
          isGeneratingMockup={isGeneratingMockup}
          userInfo={userInfo}
          onOpenGallery={handleOpenGallery}
          onAdjustPosition={handleAdjustPosition}
          positionType="vertical"
        />
        
        <ProductQuantityPricing
          basePrice={basePrice}
          quantity={quantity}
          onQuantityChange={setQuantity}
        />
        
        <ProductMobileInfo
          selectedImageUrl={selectedImageUrl}
          product={product}
          selectedVariantId={selectedVariantId}
          onOpenGallery={handleOpenGallery}
          onVariantChange={handleVariantChange}
          variantLabel="Tamanho do Produto"
          variantEmoji="📏"
        />
        
        <ProductAddToCartButton
          {...buttonProps}
          size="mobile"
        />
      </div>
    </>
  );
};
```

## 🔧 Como Usar os Hooks Genéricos

### useProductPricing
```tsx
const { discount, discountedPrice, totalPrice, savings } = useProductPricing({
  basePrice: 25.00,
  quantity: 3,
  discountTiers: [
    { min: 2, discount: 10, label: 'posters', emoji: '🖼️' },
    { min: 3, discount: 15, label: 'posters', emoji: '🔥' }
  ]
});
// Resultado: discount=15, discountedPrice=21.25, totalPrice=63.75, savings=11.25
```

### useProductValidation
```tsx
const { validateAndShowError, validatePurchase } = useProductValidation();

// Método 1: Com toast automático
const isValid = validateAndShowError({
  selectedImageUrl,
  selectedImageId,
  userInfo,
  selectedPrintifyVariantId,
  printifyProductId,
  printifyImageId,
  productName: 'poster',
  customValidationMessage: 'Escolha uma arte para o poster!' // opcional
});

// Método 2: Só validação (sem toast)
const errorMessage = validatePurchase({ /* mesmo objeto */ });
if (errorMessage) {
  // Handle error manually
}
```

### useProductCoordinates
```tsx
const { calculatePrintifyCoords } = useProductCoordinates();

const coordinates = calculatePrintifyCoords({
  position: 'top', // 'top'|'center'|'bottom'|'left'|'right'
  variantId: 62327,
  imageDimensions: { width: 1016, height: 1016 },
  product: productObject,
  positionType: 'vertical', // 'vertical' para canecas, 'horizontal' para capas
  shiftAmount: 0.35 // opcional, default 0.35
});
// Retorna: { x: 0.5, y: 0.3, scale: 1.2, rotation: 0 }
```

### ProductLoadingState
```tsx
if (!product) {
  return <ProductLoadingState message="A carregar canvas..." />;
}
```

## ⚙️ Configurações Importantes

### ProductPositionControls
- `positionType="vertical"` para canecas (top/center/bottom)
- `positionType="horizontal"` para capas de telemóvel (left/center/right)

### ProductQuantityPricing
- Personalizar `discountTiers` para diferentes produtos:
```tsx
discountTiers={[
  { min: 2, discount: 10, label: 'canecas', emoji: '💡' },
  { min: 3, discount: 15, label: 'canecas', emoji: '🔥' }
]}
```

### ProductDescription
- Personalizar itens para cada produto:
```tsx
items={[
  { text: 'Canvas de <span class="font-bold">alta qualidade</span>', color: 'moss' },
  { text: 'Impressão profissional resistente', color: 'moss' },
  { text: 'Perfeito para decoração', color: 'wood', emoji: '🎨' }
]}
```

## 🎯 Benefícios

### Componentes
1. **Código mais limpo** - Componentes pequenos e focados
2. **Reutilização fácil** - Copy-paste para novos produtos
3. **Manutenção simples** - Mudanças em um lugar afetam todos os produtos
4. **Performance melhor** - Componentes otimizados
5. **Desenvolvimento rápido** - Menos código repetitivo

### Hooks Genéricos
1. **Eliminação de duplicação** - Lógica de preços/validação/coordenadas em um só lugar
2. **Consistência automática** - Todos os produtos usam a mesma lógica
3. **Fácil customização** - Props configuráveis para cada produto
4. **Manutenção reduzida** - Bug fix em um hook = fix em todos os produtos
5. **Testabilidade** - Hooks podem ser testados independentemente

## 📝 Próximos Passos

### Imediatos
1. **Aplicar hooks genéricos** - Substituir lógica duplicada nos outros produtos:
   - ✅ `useProductPricing` - Eliminar `calculateDiscount` duplicado
   - ✅ `useProductValidation` - Eliminar `validatePurchase` duplicado  
   - ✅ `useProductCoordinates` - Eliminar `calculatePrintifyCoords` duplicado
   - ✅ `ProductLoadingState` - Eliminar JSX de loading duplicado

2. **Refatorar produtos existentes**:
   - 🔄 Canvas (`/shop/canvas/[productId].tsx`)
   - 🔄 Posters (`/shop/poster/[productId].tsx`)
   - 🔄 Capas (`/shop/tecnologia/[productId].tsx`)
   - 🔄 Sacos (`/shop/bag/[productId].tsx`)
   - 🔄 Escritório (`/shop/escritorio/[productId].tsx`)

### Futuros
3. **Criar mais hooks se necessário**:
   - `useProductMockups` - Para geração de mockups
   - `useProductCart` - Para lógica de carrinho
   - `useProductVariants` - Para gestão de variantes

4. **Otimizações**:
   - Lazy loading de componentes pesados
   - Memoização de cálculos complexos
   - Cache de validações

## 🚀 Template Rápido para Novos Produtos

```tsx
// 1. Import dos hooks e componentes
import { 
  useProductPricing, 
  useProductValidation, 
  useProductCoordinates 
} from '@/hooks';
import { ProductLoadingState } from '@/components/shared/ProductLoadingState';

// 2. Estados padrão
const [quantity, setQuantity] = useState(1);
const [selectedImageUrl, setSelectedImageUrl] = useState('');
// ... outros estados

// 3. Hooks genéricos  
const pricing = useProductPricing({ basePrice, quantity, discountTiers });
const { validateAndShowError } = useProductValidation();
const { calculatePrintifyCoords } = useProductCoordinates();

// 4. Loading state
if (!product) return <ProductLoadingState />;

// 5. Usar componentes genéricos no JSX
<ProductHeader product={product} />
<ProductPositionControls {...controlProps} />
<ProductAddToCartButton {...buttonProps} />
``` 