# 🔧 Correção: ECONNREFUSED 127.0.0.1:3000

## 🎯 **PROBLEMA IDENTIFICADO**
Após resolver o erro **404 Not Found** com a correção dos URLs `/catalog/`, surgiu um novo erro:

```
TypeError: fetch failed
ECONNREFUSED 127.0.0.1:3000
```

**Causa:** A Vercel Function estava a tentar fazer uma requisição HTTP para si própria (`localhost:3000` ou URL público) para chamar a API interna `generate-print-file.ts`, o que não funciona no ambiente serverless.

## ✅ **SOLUÇÃO IMPLEMENTADA**

### **Abordagem: Chamada Direta ao Handler**
Em vez de fazer uma requisição HTTP externa, chamamos o handler `generate-print-file.ts` **diretamente** como uma função.

### **Alterações no `src/pages/api/printify/mockups/generate.ts`:**

#### **1. Nova Importação**
```typescript
import generatePrintFileHandler from '@/pages/api/printify/generate-print-file';
```

#### **2. Nova Interface**
```typescript
interface GeneratePrintFileResponseInternal {
  success: boolean;
  printifyImageId?: string;
  printFileUrl?: string;
  printFileId?: string;
  error?: string;
}
```

#### **3. Substituição da Chamada HTTP**

**❌ ANTES (ECONNREFUSED):**
```typescript
const generateFileResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/printify/generate-print-file`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: userImageUrl,
    productId: productId,
    userId: userId,
    imageAdjustments: product.supportsManualAdjustment ? imageAdjustments : undefined,
    printifyPlaceholder: printifyPlaceholder
  })
});

const generateFileData = await generateFileResponse.json();
```

**✅ DEPOIS (Chamada Direta):**
```typescript
// Criar objetos req e res simulados
const mockGeneratePrintFileReq: NextApiRequest = {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: {
    imageUrl: userImageUrl,
    productId: productId,
    userId: userId,
    imageAdjustments: product.supportsManualAdjustment ? imageAdjustments : undefined,
    printifyPlaceholder: printifyPlaceholder
  }
} as NextApiRequest;

// Criar objeto res simulado para capturar resposta
let generateFileData: GeneratePrintFileResponseInternal | undefined;
const mockGeneratePrintFileRes = {
  status: (statusCode: number) => mockGeneratePrintFileRes,
  json: (data: GeneratePrintFileResponseInternal) => {
    generateFileData = data;
    return mockGeneratePrintFileRes;
  },
  setHeader: () => mockGeneratePrintFileRes,
  end: () => mockGeneratePrintFileRes,
} as unknown as NextApiResponse;

// Chamar o handler diretamente
await generatePrintFileHandler(mockGeneratePrintFileReq, mockGeneratePrintFileRes);
```

## 🎯 **VANTAGENS DA SOLUÇÃO**

### **✅ Performance**
- **Sem overhead de rede:** Eliminação da latência HTTP
- **Execução mais rápida:** Chamada direta de função
- **Menos recursos:** Sem criação de nova conexão

### **✅ Confiabilidade**
- **Sem problemas de conectividade:** Não depende de rede
- **Funciona em qualquer ambiente:** Local, Vercel, Docker, etc.
- **Sem timeouts de rede:** Execução síncrona

### **✅ Simplicidade**
- **Menos pontos de falha:** Eliminação da camada HTTP
- **Debugging mais fácil:** Stack trace direto
- **Logs mais claros:** Sem ruído de requisições HTTP

## 🚀 **IMPACTO ESPERADO**

Esta correção deve resolver completamente o erro **ECONNREFUSED** e permitir que:

1. ✅ **Upload de imagens** para Printify Media Library funcione
2. ✅ **Geração de print files** seja executada corretamente  
3. ✅ **Criação de produtos temporários** para mockups proceda
4. ✅ **Geração de previews** seja completada com sucesso

## 📊 **STATUS ATUAL**

- ✅ **Compilação:** Bem-sucedida sem erros
- ✅ **URLs da API:** Corrigidos com `/catalog/` e `/v1/`
- ✅ **Chamadas internas:** Convertidas para chamadas diretas
- ✅ **Tipos TypeScript:** Resolvidos com `as unknown as NextApiResponse`

## 🎉 **PRÓXIMO PASSO**

**Testar a API completa** para verificar se:
1. O erro ECONNREFUSED foi resolvido
2. A integração Printify funciona end-to-end
3. Os mockups são gerados com sucesso

**A API Printify deve agora funcionar completamente! 🚀** 