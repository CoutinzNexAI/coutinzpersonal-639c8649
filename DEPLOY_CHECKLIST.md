# 🚀 Deploy Checklist - Sistema de Marcações

## ✅ Pré-Deploy

### Google Cloud Console
- [ ] Projeto criado em [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Google Calendar API ativada
- [ ] OAuth 2.0 Client criado
- [ ] OAuth Consent Screen configurado
- [ ] Authorized Redirect URIs adicionados:
  - [ ] `https://diogocoutinho.com/api/auth/google/callback`
  - [ ] `http://localhost:8080/api/auth/google/callback` (dev)
- [ ] Scopes configurados:
  - [ ] `https://www.googleapis.com/auth/calendar.readonly`
  - [ ] `https://www.googleapis.com/auth/calendar.events`
- [ ] Client ID copiado: `224760312428-1hukt2gnj04iq1p3unrfgr1capuvjmcq.apps.googleusercontent.com`
- [ ] Client Secret copiado (guardado em segurança)

### Local Setup
- [ ] Dependências instaladas: `npm install`
- [ ] Build funciona: `npm run build`
- [ ] Sem erros de linting: `npm run lint`
- [ ] Código testado localmente: `npm run dev`
- [ ] `.env.local` criado com `GOOGLE_CLIENT_SECRET`

## 🔧 Vercel Configuration

### Environment Variables
No Vercel Dashboard → Settings → Environment Variables:

- [ ] `GOOGLE_CLIENT_SECRET` adicionado
  - **Value:** (cole o Client Secret do Google Cloud)
  - **Environment:** Production, Preview, Development
  
- [ ] `GOOGLE_CALENDAR_ID` adicionado (opcional)
  - **Value:** `primary` (ou ID específico do calendário)
  - **Environment:** Production, Preview, Development

### Build Settings
Verificar em Settings → General:

- [ ] **Build Command:** `npm run build`
- [ ] **Output Directory:** `dist`
- [ ] **Install Command:** `npm install`
- [ ] **Framework Preset:** Vite

### Domain Settings
- [ ] Domain configurado: `diogocoutinho.com`
- [ ] SSL/HTTPS ativo
- [ ] Redirects configurados (se necessário)

## 📦 Deploy

### 1. Push para Git
```bash
git add .
git commit -m "feat: add Google Calendar booking system"
git push origin main
```

### 2. Vercel Auto-Deploy
- [ ] Deploy triggered automaticamente
- [ ] Build passou sem erros
- [ ] Deployment preview disponível
- [ ] API routes deployed corretamente

### 3. Verificar Deploy
- [ ] Aceder a `https://diogocoutinho.com`
- [ ] Homepage carrega normalmente
- [ ] Link "Marcações" visível no navbar
- [ ] Aceder a `https://diogocoutinho.com/marcacoes`
- [ ] Página de marcações carrega

## 🔐 First-Time Auth

### Autenticar Aplicação
- [ ] Construir URL de autenticação:
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=224760312428-1hukt2gnj04iq1p3unrfgr1capuvjmcq.apps.googleusercontent.com&redirect_uri=https://diogocoutinho.com/api/auth/google/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly%20https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent
```

- [ ] Aceder ao URL no browser
- [ ] Fazer login com a conta Google correta
- [ ] Autorizar a aplicação
- [ ] Verificar redirect para `/marcacoes?auth=success`
- [ ] Verificar cookies guardados (DevTools → Application → Cookies)
  - [ ] `google_access_token` presente
  - [ ] `google_refresh_token` presente

## 🧪 Testes Pós-Deploy

### Frontend Tests
- [ ] Hero section aparece corretamente
  - [ ] Título: "Vamos conversar?"
  - [ ] Subtítulo: "Diogo Coutinho — AI & Automações"
  - [ ] Descrição dos horários
- [ ] CalendarGrid carrega
- [ ] 5 dias úteis aparecem
- [ ] Slots das 09:00-19:00 visíveis
- [ ] Loading skeletons aparecem durante carregamento
- [ ] Slots livres aparecem em verde
- [ ] Slots ocupados aparecem em cinzento
- [ ] Hover effects funcionam nos slots livres
- [ ] Navegação entre semanas funciona
  - [ ] Botão "← Semana anterior"
  - [ ] Botão "Próxima semana →"
  - [ ] Indicator de semana atualiza

### Booking Flow Test
- [ ] Clicar num slot livre
- [ ] Modal abre
- [ ] Informações do slot corretas (data/hora)
- [ ] Input de nome funciona
- [ ] Input de email funciona
- [ ] Botão "Cancelar" fecha modal
- [ ] Botão "Confirmar" com nome vazio mostra erro
- [ ] Preencher nome
- [ ] Clicar "Confirmar Marcação"
- [ ] Loading state aparece
- [ ] Toast de sucesso aparece
- [ ] Modal fecha
- [ ] Página recarrega
- [ ] Slot agora aparece como ocupado (cinzento)

### Google Calendar Verification
- [ ] Abrir Google Calendar
- [ ] Verificar evento criado
- [ ] Título correto: "Marcação: [Nome]"
- [ ] Horário correto
- [ ] Duração: 30 minutos
- [ ] Timezone: Europe/Lisbon
- [ ] Descrição contém email (se fornecido)
- [ ] Reminders configurados:
  - [ ] Email 24h antes
  - [ ] Popup 30min antes

### API Endpoints Test

#### Test /api/availability
```bash
curl -X GET "https://diogocoutinho.com/api/availability?date=2025-11-26" \
  -H "Cookie: google_access_token=YOUR_TOKEN"
```

- [ ] Response 200 OK
- [ ] JSON válido
- [ ] Formato correto:
```json
{
  "date": "2025-11-26",
  "slots": [
    {
      "start": "2025-11-26T09:00:00",
      "end": "2025-11-26T09:30:00",
      "free": true
    }
  ]
}
```

#### Test /api/book
```bash
curl -X POST "https://diogocoutinho.com/api/book" \
  -H "Content-Type: application/json" \
  -H "Cookie: google_access_token=YOUR_TOKEN" \
  -d '{
    "start": "2025-11-26T09:00:00",
    "end": "2025-11-26T09:30:00",
    "name": "Test User",
    "email": "test@example.com"
  }'
```

- [ ] Response 200 OK
- [ ] JSON válido
- [ ] Contém `eventId` e `htmlLink`

### Mobile Tests
- [ ] Abrir em mobile device/emulator
- [ ] Layout responsive
- [ ] Columns stack corretamente
- [ ] Touch targets fáceis de clicar
- [ ] Modal responsivo
- [ ] Inputs funcionam em mobile
- [ ] Scroll funciona suavemente
- [ ] Navbar mobile funciona

### Browser Compatibility
- [ ] Chrome/Edge (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Chrome (mobile)
- [ ] Safari iOS (mobile)

### Performance Tests
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] No console errors
- [ ] No console warnings (importantes)

## 🐛 Error Scenarios

### Test Auth Error
- [ ] Limpar cookies
- [ ] Reload `/marcacoes`
- [ ] Alert de autenticação aparece
- [ ] Botão "Autenticar com Google" funciona
- [ ] Redirect flow funciona

### Test Invalid Date
```bash
curl "https://diogocoutinho.com/api/availability?date=invalid"
```
- [ ] Response 400 Bad Request
- [ ] Error message apropriada

### Test Weekend
```bash
curl "https://diogocoutinho.com/api/availability?date=2025-11-29"
# Saturday
```
- [ ] Response 200 OK
- [ ] `slots` array vazio

### Test Expired Token
- [ ] Esperar 1h+ (access token expira)
- [ ] Tentar carregar slots
- [ ] Verificar que refresh token é usado
- [ ] Ou mostrar erro de autenticação

## 📊 Monitoring

### Setup (Recomendado)
- [ ] Sentry para error tracking
- [ ] Vercel Analytics ativado
- [ ] Google Calendar API quota monitoring
- [ ] Uptime monitoring (UptimeRobot/Pingdom)

### Check Logs
- [ ] Vercel → Deployments → [Latest] → Functions
- [ ] Sem erros 500
- [ ] Sem rate limit warnings
- [ ] Response times < 1s

## 📝 Documentation

### Internal Docs
- [ ] `QUICK_START.md` atualizado
- [ ] `BOOKING_SYSTEM.md` completo
- [ ] `ARCHITECTURE.md` correto
- [ ] `ENV_SETUP.md` válido
- [ ] `IMPLEMENTATION_SUMMARY.md` reflete estado atual

### User-Facing
- [ ] (Opcional) Criar página de ajuda
- [ ] (Opcional) FAQ sobre marcações
- [ ] (Opcional) Política de cancelamento

## 🎯 Post-Launch

### Primeiras 24h
- [ ] Monitorizar erros
- [ ] Verificar que eventos são criados corretamente
- [ ] Responder a feedback de utilizadores
- [ ] Verificar API quotas Google

### Primeira Semana
- [ ] Analisar analytics
- [ ] Identificar padrões de uso
- [ ] Ajustar horários se necessário
- [ ] Considerar melhorias baseadas em feedback

### Manutenção Regular
- [ ] Refresh tokens antes de expirarem (30 dias)
- [ ] Verificar Google Calendar API quotas
- [ ] Atualizar dependencies
- [ ] Backup de configurações

## 🚨 Rollback Plan

Se algo correr mal:

### Quick Rollback
1. [ ] Vercel → Deployments
2. [ ] Selecionar deployment anterior working
3. [ ] Clicar "Promote to Production"
4. [ ] Verificar rollback successful

### Fix Forward
1. [ ] Identificar issue
2. [ ] Fix localmente
3. [ ] Test locally
4. [ ] Push fix
5. [ ] Verify deploy

## ✅ Launch Approval

Antes de considerar "Done":

- [ ] Todos os testes passam
- [ ] Zero console errors críticos
- [ ] Performance aceitável
- [ ] Mobile funciona perfeitamente
- [ ] Auth flow suave
- [ ] Booking flow completo funciona
- [ ] Eventos criados corretamente no Calendar
- [ ] Documentation completa
- [ ] Team briefed (se aplicável)
- [ ] Backup plan definido

## 🎊 Post-Launch Checklist

- [ ] Anunciar feature (newsletter/social media)
- [ ] Atualizar homepage com link se relevante
- [ ] Adicionar ao footer se aplicável
- [ ] Considerar Google Analytics event tracking
- [ ] Preparar métricas de sucesso
- [ ] Agendar review em 1 semana

---

## 📞 Support Contacts

**Google Cloud Issues:**
- Console: https://console.cloud.google.com
- Support: https://support.google.com

**Vercel Issues:**
- Dashboard: https://vercel.com/dashboard
- Support: https://vercel.com/support

**Calendar API Docs:**
- https://developers.google.com/calendar/api/v3/reference

---

**Data do Deploy:** _____________

**Deployed by:** _____________

**Production URL:** https://diogocoutinho.com/marcacoes

**Status:** ⬜ Ready / ⬜ In Progress / ⬜ Complete

---

**Notas adicionais:**

_____________________________________
_____________________________________
_____________________________________


