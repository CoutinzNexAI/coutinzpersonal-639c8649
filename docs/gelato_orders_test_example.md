# Exemplo Completo de Registo gelato_orders

## Schema da Tabela (Após Correções)

### Campos Obrigatórios ✅
- `user_id` (UUID) - FK para users.id
- `transformation_id` (UUID) - FK para transformations.id 
- `product_id` (TEXT) - ID do produto PicTuz
- `product_name` (TEXT) - Nome do produto
- `product_category` (TEXT) - Categoria do produto
- `user_image_url` (TEXT) - URL da imagem do utilizador
- `price` (NUMERIC) - Preço por item
- `shipping_info` (JSONB) - Endereço de envio obrigatório

### Campos Opcionais
- `currency` (TEXT) - Default: 'EUR'
- `quantity` (INTEGER) - Default: 1
- Todos os outros campos são nullable

## ✅ **Correção do userImageId**

### **Problema Identificado:**
Cart items estavam sem o campo `userImageId`, causando falha na inserção na DB porque `transformation_id` é obrigatório.

### **Solução Implementada:**

1. **Frontend (`[productId].tsx`)**:
   - ✅ Estado para `selectedImageId`
   - ✅ API `/api/transformations/latest` já retorna `id` + `outputUrl`
   - ✅ `TransformationGalleryModal` agora passa `(imageUrl, imageId)`
   - ✅ `handleAddToCart` inclui `userImageId` no cart item

2. **Backend (`process-order.ts`)**:
   - ✅ Função fallback `extractTransformationIdFromUrl()` 
   - ✅ Prioridade: `firstItem.userImageId || extractFromUrl(firstItem.userImageUrl)`

### **Extração de ID do URL (Fallback)**:
```typescript
function extractTransformationIdFromUrl(outputUrl: string): string | null {
  // Padrão: /public/{user_id}/{transformation_id}/result_*.png
  const urlPattern = /\/public\/[^/]+\/([^/]+)\/result_/;
  const match = outputUrl.match(urlPattern);
  return match ? match[1] : null;
}
```

**Exemplo URL**: 
`https://...supabase.co/storage/v1/object/public/results/public/bbcdea4a-cde4-4109-bf1c-b8901ece9eb2/6e1dec78-aae4-4949-afcc-6b5037af7b13/result_1749464626711.png`

**ID Extraído**: `6e1dec78-aae4-4949-afcc-6b5037af7b13`

## Exemplo de Registo Completo

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "987e6543-e21b-98c7-b654-321098765432",
  "transformation_id": "456e7890-e12b-34c5-d678-901234567890", 
  "gelato_order_id": null,
  "product_id": "canvas_20x20",
  "product_name": "Canvas 20x20cm",
  "product_category": "canvas",
  "user_image_url": "https://storage.pictuz.com/transformations/user123/ghibli_final.jpg",
  "price": 24.99,
  "currency": "EUR",
  "quantity": 1,
  "customizations": {
    "size": "20x20cm",
    "variant": "wood-frame",
    "finish": "matte"
  },
  "shipping_info": {
    "companyName": null,
    "firstName": "João",
    "lastName": "Silva",
    "addressLine1": "Rua da República, 123",
    "addressLine2": "2º Andar",
    "city": "Lisboa",
    "postCode": "1000-200",
    "state": null,
    "country": "PT",
    "email": "joao.silva@email.com",
    "phone": "+351912345678"
  },
  "payment_info": {
    "stripe_session_id": "cs_1234567890abcdef",
    "stripe_payment_intent_id": "pi_1234567890abcdef",
    "customer_details": {...},
    "amount_total": 2999,
    "currency": "eur"
  },
  "gelato_status": null,
  "status": "payment_processed_db_saved",
  "tracking_number": null,
  "tracking_url": null,
  "customer_email": "joao.silva@email.com",
  "customer_name": "João Silva", 
  "customer_phone": "+351912345678",
  "items": [
    {
      "id": "cart_item_1",
      "productId": "canvas_20x20",
      "productUid": "canvas_200x200-mm-8x8-inch_canvas_wood-fsc-slim_4-0_ver",
      "productName": "Canvas 20x20cm",
      "productCategory": "canvas",
      "userImageUrl": "https://storage.pictuz.com/transformations/user123/ghibli_final.jpg",
      "userImageId": "456e7890-e12b-34c5-d678-901234567890",
      "price": 24.99,
      "quantity": 1,
      "customizations": {
        "size": "20x20cm"
      },
      "addedAt": "2025-06-09T22:30:00.000Z"
    }
  ],
  "order_reference": "ORD-1733772123-456",
  "total_amount": 29.99,
  "subtotal_amount": 24.99,
  "shipping_amount": 4.99,
  "tax_amount": 0.01,
  "created_at": "2025-06-09T22:30:00.000Z",
  "updated_at": "2025-06-09T22:30:00.000Z"
}
```

## Fluxo de Estados

1. **Inicial**: `status: "payment_processed_db_saved"`, `gelato_status: null`
2. **Enviado para Gelato**: `status: "processing"`, `gelato_status: "submitted"`
3. **Em produção**: `status: "printing"`, `gelato_status: "in_production"`
4. **Enviado**: `status: "shipped"`, `gelato_status: "shipped"`, `tracking_number: "ABC123"`
5. **Entregue**: `status: "delivered"`, `gelato_status: "delivered"`

## Validações Críticas ✅

- `transformation_id` deve existir na tabela `transformations`
- `user_id` deve existir na tabela `users` 
- `shipping_info` deve ser JSONB válido com endereço completo
- `items` deve ter pelo menos 1 item no array
- `total_amount >= subtotal_amount + shipping_amount + tax_amount` 