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

### Modais e Overlays
- **`TransformationGalleryModal`** - Modal para seleção de artes (já existia)

## 🚀 Como Usar

### Exemplo de Página de Produto (baseado na caneca):

```tsx
import { ProductHeader } from '@/components/shared/ProductHeader';
import { ProductPositionControls } from '@/components/shared/ProductPositionControls';
import { ProductQuantityPricing } from '@/components/shared/ProductQuantityPricing';
import { ProductAddToCartButton } from '@/components/shared/ProductAddToCartButton';
// ... outros imports

const MyProductPage = ({ product }) => {
  // ... estados necessários
  
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

1. **Código mais limpo** - Componentes pequenos e focados
2. **Reutilização fácil** - Copy-paste para novos produtos
3. **Manutenção simples** - Mudanças em um lugar afetam todos os produtos
4. **Performance melhor** - Componentes otimizados
5. **Desenvolvimento rápido** - Menos código repetitivo

## 📝 Próximos Passos

1. Aplicar estes componentes às outras páginas (canvas, posters, capas, etc.)
2. Criar variações específicas quando necessário
3. Otimizar ainda mais baseado no feedback de uso
4. Considerar criar um hook customizado para lógica comum dos produtos 