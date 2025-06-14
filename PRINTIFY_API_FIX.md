# 🔧 Correção Crítica: URLs da API Printify

## 🎯 **PROBLEMA IDENTIFICADO**
O erro **404 Not Found** estava a ocorrer porque os URLs da API Printify estavam **incorretos**. A documentação da Printify indica que:

- **Endpoints de catálogo** precisam de `/catalog/` antes de `/blueprints`
- **Endpoints de loja** precisam de `/v1/` antes de `/shops`
- **Endpoints de upload** precisam de `/v1/` antes de `/uploads`

## ✅ **CORREÇÕES APLICADAS**

### **1. Endpoint de Variantes do Blueprint** 
**Ficheiro:** `src/pages/api/printify/mockups/generate.ts`

```typescript
// ❌ ANTES (404 Not Found)
const printifyVariantsResponse = await printifyFetch(
  `/blueprints/${product.printifyBlueprintId}/print_providers/${product.printifyPrintProviderId}/variants.json`
);

// ✅ DEPOIS (Correto)
const printifyVariantsResponse = await printifyFetch(
  `/catalog/blueprints/${product.printifyBlueprintId}/print_providers/${product.printifyPrintProviderId}/variants.json`
);
```

### **2. Endpoints de Produtos da Loja**
**Ficheiro:** `src/pages/api/printify/mockups/generate.ts`

```typescript
// ❌ ANTES
await printifyFetch(`/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {

// ✅ DEPOIS
await printifyFetch(`/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
```

```typescript
// ❌ ANTES
await printifyFetch(`/shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdPrintifyProductId}.json`);

// ✅ DEPOIS
await printifyFetch(`/v1/shops/${process.env.PRINTIFY_SHOP_ID}/products/${createdPrintifyProductId}.json`);
```

### **3. Endpoint de Upload de Imagens**
**Ficheiro:** `src/pages/api/printify/generate-print-file.ts`

```typescript
// ❌ ANTES
await printifyFetch('/uploads/images.json', {

// ✅ DEPOIS
await printifyFetch('/v1/uploads/images.json', {
```

## 📋 **ENDPOINTS VERIFICADOS COMO CORRETOS**

Estes endpoints já estavam corretos e **não precisaram de alteração**:

- ✅ `/v1/shops/${shopId}/orders.json` (criar/listar pedidos)
- ✅ `/v1/shops/${shopId}/orders/shipping.json` (calcular envio)
- ✅ `/v1/shops/${shopId}/orders/${orderId}.json` (obter pedido)
- ✅ `/v1/shops/${shopId}/orders/${orderId}/cancel.json` (cancelar pedido)

## 🎯 **PADRÃO DOS URLs PRINTIFY**

### **Catálogo (Blueprints, Variantes, etc.)**
```
/catalog/blueprints/{blueprint_id}/...
```

### **Operações de Loja**
```
/v1/shops/{shop_id}/...
```

### **Uploads e Media**
```
/v1/uploads/...
```

## 🚀 **PRÓXIMOS PASSOS**

1. **✅ Compilação:** Bem-sucedida sem erros
2. **⚠️ Teste da API:** Verificar se o erro 404 foi resolvido
3. **⚠️ Escopos do Token:** Confirmar que `catalog.read` está ativo
4. **⚠️ Teste End-to-End:** Testar geração de mockups completa

## 🎉 **IMPACTO ESPERADO**

Esta correção deve resolver o **erro 404 Not Found** que estava a impedir:
- ✅ Obtenção de detalhes de variantes do blueprint
- ✅ Upload de imagens para a Printify Media Library  
- ✅ Criação de produtos temporários para mockups
- ✅ Geração de previews de produtos

**A API Printify deve agora funcionar corretamente! 🚀** 