# 📅 Sistema de Marcações - Google Calendar Integration

> **Sistema completo de agendamento online integrado com Google Calendar para diogocoutinho.com**

![Status](https://img.shields.io/badge/status-ready-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## 🎯 Overview

Sistema profissional de marcações que permite aos visitantes do website agendar conversas com Diogo Coutinho de forma automática, verificando disponibilidade em tempo real através do Google Calendar.

### ✨ Features

- ✅ **Real-time Availability** - Sincronização instantânea com Google Calendar
- ✅ **Smart Scheduling** - Apenas dias úteis (Seg-Sex), 09:00-19:00
- ✅ **30-min Slots** - Intervals otimizados para reuniões
- ✅ **Professional UI** - Design moderno e minimalista
- ✅ **Responsive** - Funciona perfeitamente em desktop e mobile
- ✅ **Email Collection** - Opcional, para confirmações
- ✅ **Auto Reminders** - Email 24h antes, popup 30min antes
- ✅ **Week Navigation** - Navega entre semanas futuras
- ✅ **Loading States** - UX polida com skeletons e animations
- ✅ **Error Handling** - Mensagens claras e recuperação elegante

---

## 🚀 Quick Start

### 1️⃣ Setup Google Cloud (2 min)

```bash
1. Acede a console.cloud.google.com
2. Cria projeto
3. Ativa "Google Calendar API"
4. Cria "OAuth 2.0 Client ID"
5. Adiciona redirect URI: https://diogocoutinho.com/api/auth/google/callback
6. Copia Client Secret
```

### 2️⃣ Configure Vercel (1 min)

No Vercel Dashboard → Settings → Environment Variables:

```env
GOOGLE_CLIENT_SECRET=your_secret_here
GOOGLE_CALENDAR_ID=primary
```

### 3️⃣ Deploy (1 min)

```bash
npm install
npm run build
# Auto-deploy via Vercel
```

### 4️⃣ Authenticate (1 min)

Acede ao URL de autenticação (gerado automaticamente no primeiro acesso) ou visita:

```
https://diogocoutinho.com/marcacoes
```

Se não autenticado, um botão aparecerá para iniciar o flow OAuth.

### 5️⃣ Done! 🎉

Visita `https://diogocoutinho.com/marcacoes` e testa!

---

## 📚 Documentation

### 📖 Guias Principais

| Documento | Descrição |
|-----------|-----------|
| **[QUICK_START.md](QUICK_START.md)** | Setup em 5 minutos |
| **[BOOKING_SYSTEM.md](BOOKING_SYSTEM.md)** | Documentação técnica completa |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Arquitetura e data flow |
| **[DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)** | Checklist de deploy passo-a-passo |
| **[ENV_SETUP.md](ENV_SETUP.md)** | Environment variables guide |
| **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** | Resumo da implementação |

### 🎓 Por Onde Começar?

- **Iniciante?** → Começa com `QUICK_START.md`
- **Developer?** → Lê `BOOKING_SYSTEM.md` + `ARCHITECTURE.md`
- **Deploying?** → Segue `DEPLOY_CHECKLIST.md`
- **Troubleshooting?** → Vê secção abaixo

---

## 🏗️ Arquitetura

### Frontend

```
/marcacoes
├── Hero Section (título, subtítulo)
└── CalendarGrid
    ├── Week Navigation
    ├── DayColumn × 5 (Mon-Fri)
    │   └── Slot × 20 (09:00-19:00, 30min intervals)
    └── BookingModal
        ├── Date/Time Info
        ├── Name Input (required)
        ├── Email Input (optional)
        └── Confirm Button
```

### Backend

```
/api
├── /auth/google/callback  → OAuth2 handler
├── /availability          → GET slots disponíveis
└── /book                  → POST criar marcação
```

### Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Shadcn/ui, Tailwind CSS, Radix UI
- **Backend:** Vercel Serverless Functions
- **API:** Google Calendar API v3
- **Auth:** OAuth 2.0
- **State:** React Hooks
- **Routing:** React Router v6

---

## 🎨 Design System

### Colors

```css
/* Primary */
--cyan: #06b6d4
--emerald: #10b981

/* States */
--free-slot: emerald → cyan gradient
--busy-slot: gray-800/30
--selected: emerald ring

/* Background */
--cosmic-black: gradient dark
```

### Typography

- **Hero:** Orbitron (futuristic)
- **Headings:** Space Grotesk
- **Body:** Inter

### Components

Todos os componentes UI vêm do Shadcn/ui:
- Dialog (modal)
- Button
- Input
- Alert
- Skeleton
- Toast

---

## 📁 Project Structure

```
coutinzpersonal-639c8649/
├── api/
│   ├── auth/google/callback.ts    # OAuth handler
│   ├── availability.ts             # GET /api/availability
│   └── book.ts                     # POST /api/book
│
├── src/
│   ├── components/
│   │   └── booking/
│   │       ├── CalendarGrid.tsx   # Main container
│   │       ├── DayColumn.tsx      # Single day view
│   │       ├── Slot.tsx           # Time slot button
│   │       └── BookingModal.tsx   # Confirmation modal
│   │
│   ├── pages/
│   │   └── Marcacoes.tsx          # /marcacoes page
│   │
│   ├── utils/
│   │   └── auth.ts                # Auth helpers
│   │
│   └── App.tsx                     # Router config
│
├── docs/
│   ├── QUICK_START.md
│   ├── BOOKING_SYSTEM.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOY_CHECKLIST.md
│   ├── ENV_SETUP.md
│   └── IMPLEMENTATION_SUMMARY.md
│
├── package.json
├── vercel.json                     # API routes config
└── README_BOOKING.md              # Este ficheiro
```

---

## 🔐 Security

### ✅ Implementado

- Client Secret apenas no backend (never exposed)
- Tokens em cookies HttpOnly (JavaScript can't access)
- HTTPS obrigatório (Vercel)
- Input validation
- Environment variables para secrets
- CORS configurado corretamente

### ⚠️ Recomendações Futuras

- Database para tokens persistentes (Supabase/PostgreSQL)
- Rate limiting (Upstash Redis)
- CSRF tokens
- Token refresh automático
- Audit logging

---

## 🧪 Testing

### Manual Testing

```bash
# 1. Start dev server
npm run dev

# 2. Visit
http://localhost:8080/marcacoes

# 3. Test flow
- View 5 weekdays
- See 20 slots per day (09:00-19:00)
- Click free slot (green)
- Fill name
- Optional: add email
- Confirm booking
- Check toast success
- Verify slot now busy (grey)
- Check Google Calendar for event
```

### API Testing

```bash
# Test availability
curl "https://diogocoutinho.com/api/availability?date=2025-11-26" \
  -H "Cookie: google_access_token=xxx"

# Test booking
curl -X POST "https://diogocoutinho.com/api/book" \
  -H "Content-Type: application/json" \
  -H "Cookie: google_access_token=xxx" \
  -d '{"start":"2025-11-26T09:00:00","end":"2025-11-26T09:30:00","name":"Test","email":"test@example.com"}'
```

---

## 🐛 Troubleshooting

### ❌ "Not authenticated"

**Causa:** Tokens não existem ou expiraram.

**Solução:** Acede ao URL de autenticação ou clica no botão no alert.

### ❌ Slots não aparecem

**Possíveis causas:**
1. Google Calendar API não ativada
2. `GOOGLE_CLIENT_SECRET` incorreto
3. Tokens expiraram
4. CALENDAR_ID errado

**Solução:**
- Verifica console do browser para erros
- Verifica Vercel logs
- Reautentica se necessário

### ❌ Booking falha

**Possíveis causas:**
1. Scope `calendar.events` não incluído na auth
2. Slot já foi reservado (race condition)
3. Access token expirou

**Solução:**
- Reautentica com prompt=consent
- Verifica Google Calendar diretamente
- Check API logs no Vercel

### ❌ CORS Error

**Causa:** Redirect URI não configurado no Google Cloud.

**Solução:** Adiciona `https://diogocoutinho.com/api/auth/google/callback` nos Authorized Redirect URIs.

---

## 📊 API Reference

### GET /api/availability

Retorna slots disponíveis para uma data.

**Request:**
```http
GET /api/availability?date=2025-11-26
```

**Response:**
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

**Status Codes:**
- `200` - Success
- `400` - Invalid date format
- `401` - Not authenticated
- `500` - Server error

---

### POST /api/book

Cria uma marcação no Google Calendar.

**Request:**
```http
POST /api/book
Content-Type: application/json

{
  "start": "2025-11-26T09:00:00",
  "end": "2025-11-26T09:30:00",
  "name": "João Silva",
  "email": "joao@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "abc123xyz",
  "htmlLink": "https://calendar.google.com/event?eid=..."
}
```

**Status Codes:**
- `200` - Booking created
- `400` - Missing required fields
- `401` - Not authenticated
- `500` - Failed to create event

---

## 🚀 Deployment

### Vercel (Recomendado)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Add env vars
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_CALENDAR_ID

# 4. Deploy
vercel --prod
```

### Environment Variables

```env
GOOGLE_CLIENT_SECRET=your_secret_from_google_cloud
GOOGLE_CALENDAR_ID=primary
```

### Build Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

## 📈 Roadmap

### Phase 1 (Current) ✅
- [x] Basic booking system
- [x] Google Calendar integration
- [x] Responsive UI
- [x] Email collection
- [x] Week navigation

### Phase 2 (Future)
- [ ] Email confirmations (SendGrid/Resend)
- [ ] SMS notifications (Twilio)
- [ ] Cancelamento de marcações
- [ ] Remarcações
- [ ] Multiple time zones
- [ ] Duration selector (30min/1h/2h)

### Phase 3 (Future)
- [ ] Admin dashboard
- [ ] Analytics & reporting
- [ ] Team scheduling
- [ ] Multiple calendars
- [ ] Payment integration
- [ ] Video call links (Zoom/Meet)

---

## 🤝 Contributing

Este é um projeto privado, mas sugestões são bem-vindas!

### Reportar Bugs

Cria um issue com:
1. Descrição do problema
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots (se aplicável)
5. Browser/device info

### Sugerir Features

Abre um issue com:
1. Use case
2. Proposta de solução
3. Mockups (se aplicável)

---

## 📄 License

MIT License - Diogo Coutinho © 2025

---

## 🙏 Credits

### Technologies
- React Team
- Vercel
- Google Calendar API
- Shadcn/ui
- Tailwind CSS

### Inspiration
- Cal.com
- Calendly
- Google Calendar Appointment Slots

---

## 📞 Support

**Website:** [diogocoutinho.com](https://diogocoutinho.com)

**Booking Page:** [diogocoutinho.com/marcacoes](https://diogocoutinho.com/marcacoes)

**Email:** (adiciona o teu email aqui)

---

## 🎯 Quick Links

- [🚀 Quick Start](QUICK_START.md)
- [📖 Full Documentation](BOOKING_SYSTEM.md)
- [🏗️ Architecture](ARCHITECTURE.md)
- [✅ Deploy Checklist](DEPLOY_CHECKLIST.md)
- [🔧 Environment Setup](ENV_SETUP.md)
- [📝 Implementation Summary](IMPLEMENTATION_SUMMARY.md)

---

<div align="center">

**Feito com ❤️ por Diogo Coutinho**

⭐ Se gostaste deste projeto, considera dar uma estrela!

[Website](https://diogocoutinho.com) • [Marcações](https://diogocoutinho.com/marcacoes)

</div>


