# 🚀 FASE 5 - Guia de Testes e Implementação

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

## 🧪 PLANO DE TESTES

### TESTE 1: Verificação de Webhooks ✅

**Objetivo**: Validar que os webhooks estão seguros e funcionais

1. **Teste de Segurança**:
   ```bash
   # Tenta enviar webhook sem assinatura
   curl -X POST https://teu-dominio.vercel.app/api/gelato/webhooks \
     -H "Content-Type: application/json" \
     -d '{"event_type": "test", "gelato_order_id": "123"}'
   
   # Deve retornar 403 - Assinatura ausente
   ```

2. **Teste com Assinatura Inválida**:
   ```bash
   # Envia webhook com assinatura falsa
   curl -X POST https://teu-dominio.vercel.app/api/gelato/webhooks \
     -H "Content-Type: application/json" \
     -H "X-Gelato-Signature: sha256=assinatura_falsa" \
     -d '{"event_type": "test", "gelato_order_id": "123"}'
   
   # Deve retornar 403 - Assinatura inválida
   ```

3. **Verificar Logs**:
   - Vai ao Vercel Dashboard → Functions → Logs
   - Deve ver logs de tentativas rejeitadas

### TESTE 2: Verificação de Roles de Admin 🔐

**Objetivo**: Confirmar que apenas admins acedem às funcionalidades

1. **Login com Utilizador Normal**:
   ```
   1. Faz login com conta normal
   2. Tenta aceder a /admin/orders
   3. Deve ser redirecionado ou ver erro 403
   ```

2. **Login como Admin**:
   ```
   1. Faz login com tua conta (que marcaste como admin)
   2. Acede a /admin/orders
   3. Deve ver o dashboard de admin
   ```

3. **Teste API Routes**:
   ```bash
   # Com token de user normal
   curl -H "Authorization: Bearer TOKEN_USER_NORMAL" \
     https://teu-dominio.vercel.app/api/admin/gelato-orders
   
   # Deve retornar 403
   
   # Com token de admin
   curl -H "Authorization: Bearer TOKEN_ADMIN" \
     https://teu-dominio.vercel.app/api/admin/gelato-orders
   
   # Deve retornar dados
   ```

### TESTE 3: Compra Completa End-to-End 🛒

**Objetivo**: Testar todo o fluxo de compra com webhooks

1. **Transformação de Imagem**:
   ```
   1. Vai ao PicTuz
   2. Transforma uma imagem com IA
   3. Vai à loja (/shop)
   4. Seleciona um produto (ex: t-shirt)
   5. Aplica a imagem transformada
   ```

2. **Processo de Checkout**:
   ```
   1. Adiciona ao carrinho
   2. Vai ao checkout (/checkout)
   3. Usa dados REAIS de envio (tua morada)
   4. Usa cartão de TESTE do Stripe:
      - Número: 4242 4242 4242 4242
      - CVV: 123
      - Data: qualquer futura
   ```

3. **Verificações Pós-Compra**:
   ```
   - Verifica se aparece na página /orders do utilizador
   - Verifica no dashboard admin (/admin/orders)
   - Confirma no Dashboard da Gelato
   - Verifica as tabelas no Supabase:
     * gelato_orders deve ter o novo pedido
     * print_files deve ter o PDF gerado
   ```

### TESTE 4: Monitorização de Webhooks 📡

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

3. **Verificar Logs do Vercel**:
   ```
   - Vai a Vercel → Functions → /api/gelato/webhooks
   - Deve ver logs de webhooks recebidos e processados
   ```

### TESTE 5: Dashboard de Admin 📊

**Objetivo**: Validar funcionalidades administrativas

1. **Dashboard Principal**:
   ```
   1. Acede a /admin
   2. Verifica estatísticas:
      - Número total de pedidos
      - Receita total
      - Status dos webhooks
   ```

2. **Gestão de Pedidos**:
   ```
   1. Acede a /admin/orders
   2. Testa filtros de pesquisa:
      - Por email do cliente
      - Por nome do produto
      - Por status
   3. Clica "Ver Detalhes" num pedido
   ```

3. **Cancelamento de Pedidos**:
   ```
   1. Vai aos detalhes de um pedido pendente
   2. Clica "Cancelar Pedido"
   3. Confirma o cancelamento
   4. Verifica se status é atualizado
   5. Confirma no Dashboard da Gelato
   ```

### TESTE 6: Testes de Stress e Edge Cases 💪

1. **Webhook com Payload Inválido**:
   ```bash
   # Envia JSON inválido (com assinatura correta)
   curl -X POST https://teu-dominio.vercel.app/api/gelato/webhooks \
     -H "Content-Type: application/json" \
     -H "X-Gelato-Signature: ASSINATURA_CORRETA" \
     -d 'json_inválido{'
   ```

2. **Tentativa de Cancelar Pedido Já Enviado**:
   ```
   1. Seleciona pedido com status "shipped"
   2. Tenta cancelar
   3. Deve mostrar erro apropriado
   ```

3. **Webhook Duplicado**:
   ```
   1. Simula recebimento do mesmo webhook 2x
   2. Verifica se não há duplicação de processamento
   ```

---

## 🔍 MONITORIZAÇÃO EM PRODUÇÃO

### Logs a Monitorizar

1. **Vercel Function Logs**:
   ```
   /api/gelato/webhooks - Webhooks recebidos
   /api/admin/* - Atividade administrativa
   ```

2. **Supabase Logs**:
   ```
   - Tabela gelato_webhooks (webhooks recebidos)
   - Tabela gelato_orders (pedidos criados/atualizados)
   ```

3. **PostHog Events**:
   ```
   - checkout_completed
   - order_created
   - admin_action_*
   ```

### Alertas Recomendados

1. **Webhooks Não Processados > 10**
2. **Tentativas de Acesso Admin Negadas > 5/hora**
3. **Erros 500 em /api/gelato/webhooks**
4. **Pedidos com status "pending" > 24h**

---

## 🚨 TROUBLESHOOTING

### Problema: Webhook Retorna 403
**Solução**: Verifica `GELATO_WEBHOOK_SECRET` no Vercel e Gelato Portal

### Problema: Admin Dashboard Não Carrega
**Solução**: 
1. Confirma que executaste o SQL para adicionar coluna `role`
2. Verifica se teu email tem `role = 'admin'`

### Problema: Pedidos Não Aparecem no Admin
**Solução**: Verifica políticas RLS do Supabase

### Problema: Cancelamento Falha
**Solução**: 
1. Verifica `GELATO_API_KEY`
2. Confirma que pedido ainda pode ser cancelado
3. Verifica logs do Vercel

---

## ✅ CHECKLIST FINAL ANTES DE PRODUÇÃO

- [ ] Todas as variáveis de ambiente configuradas no Vercel
- [ ] Webhook URL da Gelato aponta para produção
- [ ] Teu email marcado como admin no Supabase
- [ ] Políticas RLS ativadas e testadas
- [ ] Teste de compra completo realizado
- [ ] Dashboard admin acessível e funcional
- [ ] Webhooks sendo recebidos e processados
- [ ] Logs de monitorização configurados

**🎉 Se tudo estiver ✅, o PicTuz está pronto para vender produtos físicos com segurança e robustez!** 