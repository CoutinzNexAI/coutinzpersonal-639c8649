# Quick Start - Sistema de Marcações

## 🚀 Deploy em 5 Minutos

### 1. Configurar Google Cloud (2 min)

1. Acede a [console.cloud.google.com](https://console.cloud.google.com)
2. Cria/seleciona um projeto
3. Ativa **Google Calendar API**
4. Vai a **Credentials** → **Create OAuth 2.0 Client ID**
5. Adiciona Redirect URI: `https://diogocoutinho.com/api/auth/google/callback`
6. Copia o **Client Secret**

### 2. Deploy Vercel (1 min)

```bash
# Já instalado
npm install

# Build
npm run build
```

No Vercel Dashboard:
1. Vai a **Settings** → **Environment Variables**
2. Adiciona:
   ```
   GOOGLE_CLIENT_SECRET=cole_aqui_o_secret
   GOOGLE_CALENDAR_ID=primary
   ```
3. **Redeploy**

### 3. Primeira Autenticação (1 min)

Acede (substitui o client_id se necessário):
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=224760312428-1hukt2gnj04iq1p3unrfgr1capuvjmcq.apps.googleusercontent.com&redirect_uri=https://diogocoutinho.com/api/auth/google/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly%20https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent
```

Ou clica no botão que será mostrado na página `/marcacoes` se não estiveres autenticado.

### 4. Testa (1 min)

Acede a: `https://diogocoutinho.com/marcacoes`

Deverás ver:
- ✅ 5 dias úteis
- ✅ Slots das 09:00-19:00
- ✅ Slots livres em verde
- ✅ Slots ocupados em cinzento

Clica num slot livre → preenche nome → confirma!

## 📝 Checklist

- [ ] Google Calendar API ativada
- [ ] OAuth Client criado
- [ ] Redirect URI configurado
- [ ] `GOOGLE_CLIENT_SECRET` no Vercel
- [ ] Deploy feito
- [ ] Primeira autenticação completa
- [ ] Página `/marcacoes` acessível
- [ ] Consegues ver slots
- [ ] Consegues criar marcação

## ⚠️ Problemas Comuns

### "Not authenticated"
Acede ao URL de autenticação acima.

### "Failed to check availability"
Verifica se o `GOOGLE_CLIENT_SECRET` está correto no Vercel.

### Slots não aparecem
Verifica se a Google Calendar API está ativada no projeto.

### "Failed to create booking"
Verifica se tens permissão `calendar.events` no scope.

## 🎯 O Que Foi Criado

### Frontend
- ✅ `/marcacoes` - Página principal
- ✅ `CalendarGrid` - Grelha de dias
- ✅ `DayColumn` - Coluna por dia
- ✅ `Slot` - Horário individual
- ✅ `BookingModal` - Modal de confirmação
- ✅ Link no Navbar

### Backend (API)
- ✅ `/api/auth/google/callback` - OAuth callback
- ✅ `/api/availability?date=YYYY-MM-DD` - GET slots
- ✅ `/api/book` - POST criar evento

### Styling
- ✅ Design minimalista
- ✅ Gradient cyan/emerald
- ✅ Glass panels
- ✅ Animações suaves
- ✅ Responsive

## 🔥 Features

- [x] Real-time availability
- [x] 30-minute slots
- [x] Weekday filtering (Mon-Fri)
- [x] Business hours (09:00-19:00)
- [x] Week navigation
- [x] Mobile responsive
- [x] Loading states
- [x] Toast notifications
- [x] Email collection (optional)

## 📚 Documentação Completa

Vê `BOOKING_SYSTEM.md` para detalhes técnicos completos.


