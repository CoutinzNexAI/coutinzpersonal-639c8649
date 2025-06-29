# 📋 MANUAL DE OPERAÇÕES - SISTEMA GenericProductPage

## 🎯 VISÃO GERAL

Este diretório contém as configurações de produtos para o sistema **GenericProductPage**, um template universal que elimina a necessidade de criar páginas individuais para cada produto. Cada ficheiro `.config.ts` define o comportamento específico de um produto.

---

## 🚀 COMO ADICIONAR UM NOVO PRODUTO

### **PASSO 1: Criar o Ficheiro de Configuração**

1. **Crie um novo ficheiro** em `src/config/products/` com o nome `nomeDoSeuProduto.config.ts`
2. **Importe as dependências necessárias**:
   ```typescript
   import { Shield, Sparkles, Truck, Award } from 'lucide-react';
   import { PrintifyProductMapping } from '@/lib/printify/printifyProducts';
   import { ImageAdjustments } from '@/types/product'; // Apenas se usar coordenadas
   ```

3. **Defina a configuração base**:
   ```typescript
   export const seuProdutoConfig = {
     productCategory: 'categoria_do_produto',
     
     getBasePrice: (product: PrintifyProductMapping, _selectedPrintifyVariantId: number | null): number => {
       return product?.basePrice || 25.00; // Preço padrão
     },
     
     discountTiers: [
       { min: 3, discount: 15, label: 'produtos', emoji: '🎯' },
       { min: 2, discount: 10, label: 'produtos', emoji: '💡' }
     ],
     
     descriptionItems: (_product: PrintifyProductMapping) => [
       { text: 'Primeira característica', color: 'moss' as const },
       { text: 'Segunda característica', color: 'wood' as const }
     ],
     
     guaranteeItems: () => [
       { icon: Shield, title: 'Garantia de Qualidade' },
       { icon: Sparkles, title: 'Arte Única' },
       { icon: Truck, title: 'Envio Seguro' },
       { icon: Award, title: 'Satisfação 100%' }
     ],
     
     validatePurchase: (selectedImageUrl: string, selectedImageId: string | null, userInfo: unknown, selectedPrintifyVariantId: number | null, _printifyProductId: string, _printifyImageId: string): string | null => {
       if (!userInfo) return 'Faça login para continuar';
       if (!selectedImageUrl) return 'Escolha uma arte primeiro';
       if (!selectedPrintifyVariantId) return 'Selecione uma variante';
       return null;
     },
     
     variantSelectorConfig: {
       label: 'Tipo do Produto',
       emoji: '🛍️'
     },
     
     VariantSelectorComponent: 'ProductVariantSelector'
   };
   ```

### **PASSO 2: Configurar Controlos de Posição (Opcional)**

**🔹 SE o produto PERMITE personalização de posição** (como canecas, posters, cadernos):
```typescript
// Adicione estas propriedades à configuração:
coordinateConfig: {
  positionType: 'vertical', // ou 'horizontal' ou 'manual'
  positions: ['top', 'center', 'bottom'] as const // ou ['left', 'center', 'right']
},

calculatePrintifyCoords: (
  position: string,
  variantId: number,
  imageDimensions: { width: number; height: number },
  product: PrintifyProductMapping
): ImageAdjustments => {
  // Lógica de cálculo de coordenadas
  // Copie de poster.config.ts ou mug.config.ts como base
}
```

**🔹 SE o produto NÃO permite personalização de posição** (como sacos, mousepads):
```typescript
// NÃO adicione coordinateConfig nem calculatePrintifyCoords
// O GenericProductPage automaticamente esconderá os controlos
```

### **PASSO 3: Integrar na Página Correspondente**

1. **Abra a página do produto** (ex: `src/pages/shop/categoria/[productId].tsx`)
2. **Importe a nova configuração**:
   ```typescript
   import { seuProdutoConfig } from '@/config/products/seuProduto.config';
   ```

3. **Adicione lógica condicional no `getStaticProps`**:
   ```typescript
   export const getStaticProps: GetStaticProps = async ({ params }) => {
     const productId = params?.productId as string;
     const product = getPrintifyProduct(productId);

     if (!product || product.category !== 'sua_categoria') {
       return { notFound: true };
     }

     // LÓGICA DINÂMICA DE CONFIGURAÇÃO
     let config;
     if (product.id === 'id_do_seu_produto') {
       config = seuProdutoConfig;
     } else if (product.id === 'outro_produto') {
       config = outroProdutoConfig;
     } else {
       config = seuProdutoConfig; // Fallback
     }

     return { props: { product } };
   };
   ```

4. **Use o GenericProductPage**:
   ```typescript
   const SuaDetailPage: React.FC<SuaPageProps> = ({ product }) => {
     return <GenericProductPage product={product} config={seuProdutoConfig} />;
   };
   ```

### **PASSO 4: Verificação Final**

1. **Execute o build**:
   ```bash
   npm run build
   ```

2. **Confirme que não há erros** de TypeScript ou ESLint
3. **Teste a página** para garantir que tudo funciona corretamente

---

## 📚 EXEMPLOS DE CONFIGURAÇÕES

### **🎯 Produto SEM Controlos de Posição** (Saco)
```typescript
// ✅ OMITE coordinateConfig e calculatePrintifyCoords
export const bagConfig = {
  productCategory: 'bags',
  getBasePrice: (product, _selectedVariantId) => product.basePrice || 18,
  // ... resto da configuração
  // 🚫 NÃO tem coordinateConfig
  // 🚫 NÃO tem calculatePrintifyCoords
};
```

### **🎯 Produto COM Controlos Verticais** (Caneca)
```typescript
// ✅ INCLUI coordinateConfig e calculatePrintifyCoords
export const mugConfig = {
  productCategory: 'mugs',
  coordinateConfig: {
    positionType: 'vertical',
    positions: ['top', 'center', 'bottom'] as const
  },
  calculatePrintifyCoords: (position, variantId, imageDimensions, product) => {
    // Lógica de posicionamento vertical
  }
  // ... resto da configuração
};
```

### **🎯 Produto COM Controlos Horizontais** (Caderno)
```typescript
// ✅ INCLUI coordinateConfig para posicionamento horizontal
export const notebookConfig = {
  productCategory: 'escritorio',
  coordinateConfig: {
    positionType: 'horizontal',
    positions: ['left', 'center', 'right'] as const
  },
  calculatePrintifyCoords: (position, variantId, imageDimensions, product) => {
    // Lógica de posicionamento horizontal
  }
  // ... resto da configuração
};
```

---

## 🔧 COMPONENTES ESPECIALIZADOS

### **Seletor de Variantes Personalizado**

Se o produto precisar de um seletor especial (como capas de telemóvel):

1. **Crie o componente** em `src/components/shared/product-customization/`
2. **Configure na config**:
   ```typescript
   VariantSelectorComponent: 'NomeDoSeuSelectorComponent'
   ```
3. **Adicione no GenericProductPage** a lógica condicional para renderizar o componente

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [ ] Ficheiro `.config.ts` criado com todas as propriedades obrigatórias
- [ ] Imports corretos (Lucide icons, tipos TypeScript)
- [ ] Configuração de coordenadas adequada (com ou sem controlos)
- [ ] Integração na página correspondente
- [ ] Lógica dinâmica no `getStaticProps`
- [ ] Build executado sem erros
- [ ] Teste manual da funcionalidade

---

## 🏆 VANTAGENS DO SISTEMA

- **🔥 Reutilização**: Um template para todos os produtos
- **⚡ Rapidez**: Novos produtos em minutos, não horas
- **🛡️ Consistência**: UX uniforme em toda a aplicação
- **🧹 Manutenção**: Correções centralizadas beneficiam todos os produtos
- **📱 Responsivo**: Mobile e desktop automáticos
- **🎯 Escalável**: Suporta produtos com ou sem personalização

---

**🎖️ Comandante, o sistema está pronto para expansão ilimitada!** 