# Sistema de Marcações - Google Calendar Integration

## 📋 Visão Geral

Sistema completo de marcações integrado com Google Calendar para o website diogocoutinho.com.

### ✨ Funcionalidades

- ✅ Mostra disponibilidade em tempo real via Google Calendar API
- ✅ Interface moderna e minimalista
- ✅ Grelha de dias úteis (Segunda-Sexta, 09:00-19:00)
- ✅ Slots de 30 minutos
- ✅ Modal de confirmação com nome e email
- ✅ Navegação entre semanas
- ✅ Responsive design (desktop + mobile)
- ✅ Animações suaves
- ✅ Loading states

## 🚀 Como Funciona

### Frontend (`/marcacoes`)

1. **Página de Marcações** (`src/pages/Marcacoes.tsx`)
   - Hero section com título e subtítulo
   - Componente CalendarGrid principal

2. **CalendarGrid** (`src/components/booking/CalendarGrid.tsx`)
   - Gera próximos 5 dias úteis
   - Busca disponibilidade de cada dia via `/api/availability`
   - Gere navegação entre semanas
   - Controla modal de confirmação

3. **DayColumn** (`src/components/booking/DayColumn.tsx`)
   - Mostra cada dia da semana
   - Lista todos os slots (09:00-19:00)
   - Loading skeletons

4. **Slot** (`src/components/booking/Slot.tsx`)
   - Componente individual de cada horário
   - Verde = disponível
   - Cinzento = ocupado

5. **BookingModal** (`src/components/booking/BookingModal.tsx`)
   - Confirmação de marcação
   - Inputs para nome e email
   - Envia POST para `/api/book`

### Backend (API Routes)

#### 1. `/api/auth/google/callback`
OAuth2 callback para autenticação Google.

**Flow:**
```
1. User autoriza app no Google
2. Google redireciona para /api/auth/google/callback?code=XXX
3. Backend troca code por access_token
4. Guarda tokens em cookies (HttpOnly)
5. Redireciona para /marcacoes?auth=success
```

#### 2. `/api/availability?date=YYYY-MM-DD`
Retorna disponibilidade para uma data específica.

**Request:**
```
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
    },
    {
      "start": "2025-11-26T09:30:00",
      "end": "2025-11-26T10:00:00",
      "free": false
    }
  ]
}
```

**Lógica:**
1. Gera slots de 30min entre 09:00-19:00
2. Chama Google Calendar freeBusy API
3. Marca slots ocupados como `free: false`
4. Retorna array completo

#### 3. `/api/book`
Cria evento no Google Calendar.

**Request:**
```json
POST /api/book
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
  "eventId": "abc123",
  "htmlLink": "https://calendar.google.com/event?eid=..."
}
```

## 🔧 Setup

### 1. Google Cloud Console

1. Vai a [console.cloud.google.com](https://console.cloud.google.com)
2. Cria/seleciona projeto
3. Ativa Google Calendar API
4. Cria credenciais OAuth 2.0:
   - **Client ID:** `224760312428-1hukt2gnj04iq1p3unrfgr1capuvjmcq.apps.googleusercontent.com`
   - **Client Secret:** (guarda para o próximo passo)
5. Configura OAuth consent screen
6. Adiciona Authorized redirect URIs:
   - `https://diogocoutinho.com/api/auth/google/callback`
   - `http://localhost:8080/api/auth/google/callback`

### 2. Variáveis de Ambiente

Cria `.env.local`:

```env
GOOGLE_CLIENT_SECRET=your_secret_here
GOOGLE_CALENDAR_ID=primary
```

### 3. Deploy Vercel

1. Vai às settings do projeto no Vercel
2. Adiciona Environment Variables:
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALENDAR_ID` (opcional)
3. Redeploy

### 4. Primeira Autenticação

Para o sistema funcionar, precisa de autenticar uma vez:

1. Acede a:
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=224760312428-1hukt2gnj04iq1p3unrfgr1capuvjmcq.apps.googleusercontent.com&redirect_uri=https://diogocoutinho.com/api/auth/google/callback&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly%20https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent
```

2. Autoriza a aplicação
3. Será redirecionado para `/marcacoes`
4. Tokens guardados (válidos por 1 hora, refresh token por 30 dias)

**Nota:** Em produção, considera usar uma base de dados para guardar tokens de forma persistente.

## 📁 Estrutura de Ficheiros

```
coutinzpersonal-639c8649/
├── api/
│   ├── auth/
│   │   └── google/
│   │       └── callback.ts        # OAuth callback
│   ├── availability.ts             # GET slots disponíveis
│   └── book.ts                     # POST criar marcação
├── src/
│   ├── components/
│   │   └── booking/
│   │       ├── CalendarGrid.tsx   # Container principal
│   │       ├── DayColumn.tsx      # Coluna de um dia
│   │       ├── Slot.tsx           # Slot individual
│   │       └── BookingModal.tsx   # Modal confirmação
│   ├── pages/
│   │   └── Marcacoes.tsx          # Página /marcacoes
│   └── App.tsx                     # Routing
├── ENV_SETUP.md                    # Guia de setup
├── BOOKING_SYSTEM.md              # Este ficheiro
└── vercel.json                     # Config Vercel
```

## 🎨 Design

### Cores

- **Background:** Gradient dark (cosmic-black)
- **Slots livres:** Verde (emerald) + Cyan
- **Slots ocupados:** Cinzento
- **Acentos:** Cyan/Emerald gradient
- **Glass panels:** Backdrop blur + borders

### Tipografia

- **Títulos:** Orbitron (futuristic)
- **Body:** Inter
- **Headings:** Space Grotesk

### Animações

- Fade in na entrada
- Hover scale nos slots
- Loading skeletons
- Modal transitions

## 🔒 Segurança

- ✅ Client Secret NUNCA no frontend
- ✅ Tokens em cookies HttpOnly
- ✅ HTTPS obrigatório em produção
- ✅ Validação de inputs
- ⚠️ Considerar rate limiting
- ⚠️ Considerar DB para tokens persistentes

## 📱 Responsivo

- Desktop: Grelha horizontal scrollable
- Mobile: Stacked columns
- Touch-friendly buttons (min 44x44px)
- Reduced animations em mobile

## 🧪 Testing

### Local Development

```bash
npm run dev
```

Visita `http://localhost:8080/marcacoes`

### Production Testing

```bash
npm run build
npm run preview
```

## 🐛 Troubleshooting

### "Not authenticated"
- Precisas de autenticar primeiro via URL OAuth
- Tokens expiraram (1h access token)
- Client Secret incorreto no .env

### Slots não aparecem
- Verifica Google Calendar API está ativa
- Verifica CALENDAR_ID correto
- Verifica tokens válidos
- Verifica console para erros

### Booking falha
- Verifica permissões (needs calendar.events scope)
- Verifica formato de data/hora
- Verifica se slot ainda está livre

## 📈 Melhorias Futuras

- [ ] Database para tokens persistentes
- [ ] Email confirmations automáticas
- [ ] SMS notifications
- [ ] Multiple calendars support
- [ ] Admin dashboard
- [ ] Analytics
- [ ] Rate limiting
- [ ] Webhook para sync real-time
- [ ] Cancelamento de marcações
- [ ] Remarcações

## 🤝 Suporte

Para questões ou bugs, contacta o desenvolvedor.


