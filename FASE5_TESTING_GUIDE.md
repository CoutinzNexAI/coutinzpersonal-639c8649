# 🚀 FASE 5 - Guia de Testes e Implementação - ATUALIZADO

## 📋 CHECKLIST PRÉ-TESTE

### 1. Configurar Variáveis de Ambiente

Adiciona ao teu `.env.local`:

```bash
# Gelato API
GELATO_API_KEY=your_gelato_api_key_here
GELATO_API_BASE_URL=https://api.gelato.com/v4
GELATO_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase (já existentes)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (já existentes)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 2. Executar SQLs no Supabase

Vai ao SQL Editor do Supabase e executa o SQL fornecido anteriormente para:
- Adicionar coluna `role` à tabela `users`
- Adicionar coluna `tracking_url` à tabela `gelato_orders`
- Criar função `get_user_role()`
- Configurar todas as políticas RLS

**IMPORTANTE**: Atualiza o teu email para admin:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'teu-email@exemplo.com';
```

### 3. Configurar Webhook na Gelato

1. Vai ao Gelato API Portal
2. Configura o webhook URL: `https://teu-dominio.vercel.app/api/gelato/webhooks`
3. Copia o webhook secret para `GELATO_WEBHOOK_SECRET`

---

## 🧪 PLANO DE TESTES - ATUALIZADO

### TESTE 1: Verificação de Webhooks ✅ **CONCLUÍDO**

**Objetivo**: Validar que os webhooks estão seguros e funcionais

✅ **RESULTADO**: Webhooks funcionam corretamente com validação de assinatura

### TESTE 2: Verificação de Roles de Admin ✅ **CONCLUÍDO**

**Objetivo**: Confirmar que apenas admins acedem às funcionalidades

✅ **RESULTADO**: Sistema de roles funciona corretamente

### TESTE 3: Nova Funcionalidade - Galeria de Transformações 🎨

**Objetivo**: Testar a nova funcionalidade de seleção de transformações AI

1. **API de Histórico**:
   ```
   1. Faz login no PicTuz
   2. Verifica endpoint: GET /api/transformations/history
   3. Confirma que retorna apenas transformações concluídas
   4. Testa paginação (page=1, page=2, etc.)
   ```

2. **Modal da Galeria**:
   ```
   1. Vai a qualquer página de produto (/shop/canvas-20x20)
   2. Clica "Escolher Arte AI" 
   3. Verifica se modal abre com galeria paginada
   4. Testa navegação entre páginas
   5. Clica numa transformação para selecionar
   ```

3. **Aplicação ao Produto**:
   ```
   1. Seleciona uma transformação no modal
   2. Verifica se imagem é aplicada no ProductCanvas
   3. Confirma feedback visual "Arte AI aplicada"
   4. Testa botão "Escolher Arte Diferente"
   ```

### TESTE 4: Compra Completa End-to-End com Nova Funcionalidade 🛒

**Objetivo**: Testar todo o fluxo de compra com a galeria de transformações

#### Pré-requisitos para o Teste:
1. Utilizador deve ter pelo menos 3-5 transformações concluídas
2. Estar logado no PicTuz  
3. Ter PicCoins suficientes ou possibilidade de comprar

#### Passos Detalhados do Teste:

**🎯 PARTE A: Verificação da Galeria Standalone**
```
1. Abrir o browser e ir para localhost:3000/shop
2. Escolher qualquer produto (ex: /shop/canvas-20x20)
3. Verificar se aparece botão "Escolher Arte AI"
4. Clicar no botão e verificar se modal abre
5. Confirmar que as transformações aparecem em grid
6. Testar navegação entre páginas (se houver múltiplas)
7. Fechar modal sem selecionar e verificar se continua vazio
```

**🎯 PARTE B: Seleção e Aplicação de Arte**
```
1. Abrir modal novamente
2. Clicar numa transformação específica
3. Verificar se modal fecha automaticamente
4. Confirmar que aparece feedback "Arte AI aplicada com sucesso"
5. Verificar se a imagem aparece no ProductCanvas
6. Testar botão "Escolher Arte Diferente"
7. Selecionar nova arte e confirmar troca
```

**🎯 PARTE C: Fluxo Simplificado de Compra**
```
1. Com arte selecionada, clicar "Adicionar ao Carrinho"
2. Verificar se botão está ativo (não disabled)
3. Confirmar toast de sucesso
4. Ir para /checkout
5. NOVO: Verificar se nome e email aparecem automaticamente do perfil
6. NOVO: Preencher apenas: endereço, cidade, código postal, país
7. NOVO: Verificar método de envio fixo (Expresso 4-5 dias)
8. Usar cartão de teste Stripe: 4242 4242 4242 4242
9. Completar compra e aguardar redirecionamento
```

**🎯 PARTE D: Verificações Pós-Compra**
```
1. Verificar redirecionamento para /checkout/success
2. Confirmar que página de sucesso mostra dados do pedido
3. Verificar referência do pedido gerada
4. Ir para /orders e confirmar que pedido aparece
5. (Admin) Ir para /admin/orders e verificar novo pedido
6. Verificar no Supabase se gelato_orders foi criada com dados corretos
```

#### Critérios de Sucesso:
- ✅ Modal abre e carrega transformações
- ✅ Seleção de arte funciona e atualiza preview
- ✅ Checkout simplificado (só endereço necessário)
- ✅ Pagamento Stripe redireciona corretamente
- ✅ Página de sucesso mostra confirmação
- ✅ Produto final contém a arte selecionada
- ✅ Dados corretos salvos na base de dados

#### Problemas Corrigidos:
- ❌ **CORRIGIDO**: Erro "preparar edição" no botão finalizar compra
- ❌ **CORRIGIDO**: Bug de cálculo de envio de 2 em 2 segundos
- ❌ **CORRIGIDO**: Campo telefone removido
- ❌ **CORRIGIDO**: Nome e email agora vêm do Supabase automaticamente
- ❌ **CORRIGIDO**: Só um método de envio (Expresso)

#### Se Algo Falhar:
1. Verificar console do browser para erros JavaScript
2. Verificar Network tab para problemas de API Stripe
3. Confirmar variáveis de ambiente STRIPE_SECRET_KEY
4. Verificar se utilizador tem full_name e email no Supabase
5. Testar com utilizador diferente

### TESTE 5: Monitorização de Webhooks 📡

**Objetivo**: Verificar se webhooks são recebidos e processados

1. **Verificar Tabela gelato_webhooks**:
   ```sql
   SELECT * FROM gelato_webhooks 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

2. **Simular Avanço de Status**:
   ```
   1. No Dashboard da Gelato, simula mudança de status
   2. Ou espera pelos webhooks automáticos
   3. Verifica se gelato_orders.gelato_status é atualizado
   ```

### TESTE 6: Dashboard de Admin 📊

**Objetivo**: Validar funcionalidades administrativas

1. **Dashboard Principal**:
   ```
   1. Acede a /admin
   2. Verifica estatísticas atualizadas
   3. Confirma dados dos novos pedidos
   ```

2. **Gestão de Pedidos**:
   ```
   1. Acede a /admin/orders
   2. Verifica pedidos criados com nova funcionalidade
   3. Testa filtros de pesquisa
   4. Clica "Ver Detalhes" nos novos pedidos
   ```

### TESTE 7: Edge Cases da Nova Funcionalidade 💪

1. **Utilizador Sem Transformações**:
   ```
   1. Login com conta nova (sem transformações)
   2. Vai a página de produto
   3. Clica "Escolher Arte AI"
   4. Verifica estado vazio no modal
   ```

2. **Paginação com Muitas Transformações**:
   ```
   1. Login com conta com 20+ transformações
   2. Testa navegação entre múltiplas páginas
   3. Verifica performance do loading
   ```

3. **Seleção e Troca Múltipla**:
   ```
   1. Seleciona uma transformação
   2. Abre modal novamente
   3. Seleciona transformação diferente
   4. Verifica se preview atualiza corretamente
   ```

---

## 🔍 STATUS DOS TESTES

| Teste | Status | Resultado |
|-------|--------|-----------|
| 1. Webhooks | ✅ CONCLUÍDO | Funcionais |
| 2. Admin Roles | ✅ CONCLUÍDO | Funcionais |
| 3. Galeria Transformações | ✅ CONCLUÍDO | Funcionais - Corrigido para usar Supabase diretamente |
| 4. Compra End-to-End | ✅ ATUALIZADO | Checkout corrigido e simplificado - Pronto para teste |
| 5. Monitorização Webhooks | ⏳ PENDENTE | - |
| 6. Dashboard Admin | ⏳ PENDENTE | - |
| 7. Edge Cases | ⏳ PENDENTE | - |

---

## 🚨 TROUBLESHOOTING - ATUALIZADO

### Problema: Modal da Galeria Não Abre
**Solução**: 
1. Verifica se utilizador está autenticado
2. Confirma que utilizador tem transformações no Supabase
3. Verifica console para erros JavaScript

### Problema: Checkout Dá Erro "preparar edição"
**✅ CORRIGIDO**: Checkout agora usa Stripe diretamente, sem preparação de ficheiros complexa

### Problema: Métodos de Envio "A calcular" infinitamente
**✅ CORRIGIDO**: Agora usa método fixo (Expresso 4-5 dias) sem cálculos dinâmicos

### Problema: Campos Desnecessários no Checkout  
**✅ CORRIGIDO**: Formulário simplificado - só endereço, nome/email vêm do perfil

### Problema: Webhook Retorna 403
**Solução**: Verifica `GELATO_WEBHOOK_SECRET` no Vercel e Gelato Portal

### Problema: Admin Dashboard Não Carrega
**Solução**: 
1. Confirma que executaste o SQL para adicionar coluna `role`
2. Verifica se teu email tem `role = 'admin'`

---

## ✅ CHECKLIST FINAL ANTES DE PRODUÇÃO

- [x] Webhooks seguros e funcionais
- [x] Sistema de admin roles ativo
- [x] Nova galeria de transformações testada e funcional
- [x] Checkout simplificado e corrigido
- [x] Integração Stripe funcionando
- [ ] Fluxo completo de compra com nova funcionalidade testado
- [ ] Dashboard admin mostra novos pedidos
- [ ] Edge cases da galeria testados
- [ ] Performance da paginação validada

**🎉 Progresso: 4/8 componentes concluídos. A seguir: Teste completo do Teste 4!**

## 📝 NOTAS DE CORREÇÃO - CHECKOUT

**Problemas corrigidos**:
1. **Erro "preparar edição"**: Substituída lógica complexa por checkout Stripe direto
2. **Bug shipping de 2 em 2 segundos**: Removido cálculo dinâmico, método fixo
3. **Campos desnecessários**: Formulário simplificado, dados do Supabase
4. **Telefone removido**: Já não é solicitado

**Novas APIs criadas**:
- `/api/stripe/create-checkout-session`: Cria sessão de pagamento
- `/api/stripe/process-order`: Processa pedido após pagamento
- `/checkout/success`: Página de confirmação

**Resultado**: ✅ Checkout agora é mais rápido, simples e confiável 