# 🏗️ Arquitetura do Sistema de Marcações

## 📊 Diagrama de Fluxo

### 1. Autenticação OAuth (One-time)

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Click "Autenticar"
       ▼
┌─────────────────────────────────────────────────┐
│  https://accounts.google.com/o/oauth2/v2/auth   │
│  + client_id                                    │
│  + redirect_uri                                 │
│  + scope (calendar.readonly, calendar.events)   │
└──────────────────┬──────────────────────────────┘
                   │ 2. User autoriza
                   ▼
┌─────────────────────────────────────────────────┐
│  /api/auth/google/callback?code=XXX             │
│                                                  │
│  1. Exchange code for tokens                    │
│  2. Store in HttpOnly cookies                   │
│  3. Redirect to /marcacoes?auth=success         │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
               ┌───────┐
               │ Ready │
               └───────┘
```

### 2. Carregar Disponibilidade

```
┌──────────────────┐
│   /marcacoes     │
│  CalendarGrid    │
└────────┬─────────┘
         │
         │ For each day (5 weekdays)
         ▼
┌────────────────────────────────────────────┐
│  GET /api/availability?date=2025-11-26     │
│                                            │
│  1. Get access_token from cookie          │
│  2. Generate time slots (09:00-19:00)     │
│  3. Call Google Calendar freeBusy API     │
│  4. Mark busy slots as free: false        │
│  5. Return all slots with status          │
└────────────────┬───────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  JSON Response │
         │  {             │
         │    date: "...", │
         │    slots: [     │
         │      {...},     │
         │    ]            │
         │  }              │
         └────────┬────────┘
                  │
                  ▼
         ┌────────────────┐
         │   DayColumn     │
         │   renders       │
         │   green/grey    │
         │   slots         │
         └────────────────┘
```

### 3. Criar Marcação

```
┌──────────────┐
│ User clicks  │
│  free slot   │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ BookingModal    │
│ opens           │
│                 │
│ Input: name     │
│ Input: email    │
└──────┬──────────┘
       │ User confirms
       ▼
┌────────────────────────────────────────┐
│  POST /api/book                        │
│  {                                     │
│    start: "2025-11-26T09:00:00",      │
│    end: "2025-11-26T09:30:00",        │
│    name: "João",                       │
│    email: "joao@example.com"           │
│  }                                     │
│                                        │
│  1. Get access_token from cookie      │
│  2. Create event in Google Calendar   │
│  3. Add attendee if email provided    │
│  4. Set reminders                     │
│  5. Return event details              │
└────────────────┬───────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Toast Success │
         │ "Marcação     │
         │  confirmada!" │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ Reload week   │
         │ (slot now     │
         │  busy)        │
         └───────────────┘
```

## 🗂️ Estrutura de Dados

### TimeSlot Interface

```typescript
interface TimeSlot {
  start: string;      // ISO 8601: "2025-11-26T09:00:00"
  end: string;        // ISO 8601: "2025-11-26T09:30:00"
  free: boolean;      // true = available, false = busy
}
```

### DayData Interface

```typescript
interface DayData {
  date: string;       // YYYY-MM-DD: "2025-11-26"
  dayName: string;    // "segunda-feira"
  slots: TimeSlot[];  // Array of 20 slots (09:00-19:00)
  loading: boolean;   // Loading state
}
```

### Google Calendar Event

```typescript
{
  summary: "Marcação: João Silva",
  description: "Email: joao@example.com",
  start: {
    dateTime: "2025-11-26T09:00:00",
    timeZone: "Europe/Lisbon"
  },
  end: {
    dateTime: "2025-11-26T09:30:00",
    timeZone: "Europe/Lisbon"
  },
  attendees: [
    { email: "joao@example.com" }
  ],
  reminders: {
    useDefault: false,
    overrides: [
      { method: "email", minutes: 1440 },  // 24h before
      { method: "popup", minutes: 30 }     // 30min before
    ]
  }
}
```

## 🔄 Estado da Aplicação

### CalendarGrid State

```typescript
const [weekOffset, setWeekOffset] = useState<number>(0);
// 0 = current week
// 1 = next week
// 2 = week after, etc.

const [days, setDays] = useState<DayData[]>([]);
// Array of 5 weekdays with slots

const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
// Currently selected slot for booking

const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
// Modal visibility

const [authError, setAuthError] = useState<string | null>(null);
// Auth URL if not authenticated
```

### BookingModal State

```typescript
const [name, setName] = useState<string>('');
// User's name (required)

const [email, setEmail] = useState<string>('');
// User's email (optional)

const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
// Loading state during booking
```

## 🔌 API Endpoints

### Authentication

```
POST https://oauth2.googleapis.com/token
Headers:
  Content-Type: application/x-www-form-urlencoded
Body:
  code: string
  client_id: string
  client_secret: string
  redirect_uri: string
  grant_type: "authorization_code"
Response:
  {
    access_token: string,
    refresh_token: string,
    expires_in: 3600,
    token_type: "Bearer"
  }
```

### FreeBusy (Google Calendar)

```
POST https://www.googleapis.com/calendar/v3/freeBusy
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
  {
    timeMin: "2025-11-26T09:00:00Z",
    timeMax: "2025-11-26T19:00:00Z",
    items: [{ id: "primary" }]
  }
Response:
  {
    calendars: {
      primary: {
        busy: [
          {
            start: "2025-11-26T09:30:00Z",
            end: "2025-11-26T10:00:00Z"
          }
        ]
      }
    }
  }
```

### Create Event (Google Calendar)

```
POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
  {
    summary: string,
    description: string,
    start: { dateTime: string, timeZone: string },
    end: { dateTime: string, timeZone: string },
    attendees: [{ email: string }],
    reminders: { ... }
  }
Response:
  {
    id: string,
    htmlLink: string,
    created: string,
    ...
  }
```

## 🎨 Componente Hierarchy

```
App
└── BrowserRouter
    └── Routes
        └── Route: /marcacoes
            └── Marcacoes (Page)
                ├── Navbar
                │   └── Link: "Marcações"
                │
                ├── Hero Section
                │   ├── Title: "Vamos conversar?"
                │   └── Subtitle: "Diogo Coutinho — AI & Automações"
                │
                ├── CalendarGrid
                │   ├── Auth Alert (if not authenticated)
                │   │   └── Button: "Autenticar com Google"
                │   │
                │   ├── Week Navigation
                │   │   ├── Button: "← Semana anterior"
                │   │   ├── Label: Week indicator
                │   │   └── Button: "Próxima semana →"
                │   │
                │   ├── DayColumn (x5)
                │   │   ├── Header
                │   │   │   ├── dayName: "segunda-feira"
                │   │   │   └── date: "26 nov"
                │   │   │
                │   │   └── Slots List
                │   │       └── Slot (x20)
                │   │           ├── time: "09:00"
                │   │           ├── isFree: boolean
                │   │           └── onClick: open modal
                │   │
                │   └── BookingModal
                │       ├── Dialog Header
                │       │   └── Title: "Confirmar Marcação"
                │       │
                │       ├── Selected Slot Info
                │       │   ├── Date
                │       │   └── Time range
                │       │
                │       ├── Form
                │       │   ├── Input: Name (required)
                │       │   └── Input: Email (optional)
                │       │
                │       └── Footer
                │           ├── Button: "Cancelar"
                │           └── Button: "Confirmar Marcação"
                │
                └── Footer
```

## 🔐 Security Flow

### Cookie Storage

```
Set-Cookie: google_access_token=xxx;
  Path=/;
  HttpOnly;      ← Can't be accessed by JavaScript
  Secure;        ← Only HTTPS
  SameSite=Lax;  ← CSRF protection
  Max-Age=3600   ← Expires in 1 hour

Set-Cookie: google_refresh_token=xxx;
  Path=/;
  HttpOnly;
  Secure;
  SameSite=Lax;
  Max-Age=2592000  ← Expires in 30 days
```

### Request Flow

```
Browser                API Route              Google
   │                      │                      │
   │─────Request──────────▶                      │
   │  Cookie: access_token │                      │
   │                      │                      │
   │                      │────Request───────────▶
   │                      │  Bearer: access_token │
   │                      │                      │
   │                      │◀───Response──────────│
   │                      │                      │
   │◀────Response─────────│                      │
   │  JSON data           │                      │
```

## ⚡ Performance Optimizations

### 1. Lazy Loading
```typescript
// Future improvement
const BookingModal = lazy(() => import('./BookingModal'));
```

### 2. Parallel Fetches
```typescript
// Current: Sequential
for (const date of dates) {
  await fetch(`/api/availability?date=${date}`);
}

// Future: Parallel
await Promise.all(
  dates.map(date => fetch(`/api/availability?date=${date}`))
);
```

### 3. Caching
```typescript
// Future: React Query
const { data } = useQuery(
  ['availability', date],
  () => fetchAvailability(date),
  { staleTime: 5 * 60 * 1000 } // 5 minutes
);
```

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  - Stack day columns vertically
  - Reduce padding
  - Smaller fonts
  - Touch-friendly buttons (44x44px min)
}

/* Desktop */
@media (min-width: 769px) {
  - Horizontal scroll for days
  - Hover effects
  - Larger spacing
}
```

## 🧪 Testing Strategy

### Unit Tests (Future)
```typescript
describe('CalendarGrid', () => {
  test('generates 5 weekdays', () => {
    const dates = getNextWeekdays(5);
    expect(dates).toHaveLength(5);
  });

  test('filters out weekends', () => {
    const dates = getNextWeekdays(5);
    dates.forEach(date => {
      const day = new Date(date).getDay();
      expect([0, 6]).not.toContain(day);
    });
  });
});
```

### Integration Tests (Future)
```typescript
describe('Booking Flow', () => {
  test('user can book a free slot', async () => {
    render(<CalendarGrid />);
    
    // Wait for slots to load
    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });
    
    // Click free slot
    const slot = screen.getByText('09:00');
    fireEvent.click(slot);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'João Silva' }
    });
    
    // Submit
    fireEvent.click(screen.getByText('Confirmar Marcação'));
    
    // Check success
    await waitFor(() => {
      expect(screen.getByText(/confirmada/i)).toBeInTheDocument();
    });
  });
});
```

## 🚀 Deployment Pipeline

```
Local Dev                  Vercel Build            Production
────────────────────────────────────────────────────────────
npm run dev       ──▶      npm run build    ──▶   Deploy
                           
                           1. Build frontend
                           2. Compile API routes
                           3. Set env vars
                           4. Deploy to edge
                           
http://localhost:8080      Build artifacts         https://diogocoutinho.com
```

## 🔄 Data Flow Summary

```
1. User visits /marcacoes
   ↓
2. CalendarGrid mounts
   ↓
3. Generate 5 weekdays
   ↓
4. For each day: GET /api/availability
   ↓
5. API checks access_token in cookie
   ↓
6. Call Google Calendar freeBusy
   ↓
7. Return slots with free/busy status
   ↓
8. Render DayColumn components
   ↓
9. User clicks free slot
   ↓
10. Modal opens
   ↓
11. User fills name + email
   ↓
12. POST /api/book
   ↓
13. Create event in Google Calendar
   ↓
14. Show success toast
   ↓
15. Reload availability (slot now busy)
```

---

Esta arquitetura garante:
- ✅ Separação clara frontend/backend
- ✅ Segurança (tokens server-side)
- ✅ Performance (loading states)
- ✅ Escalabilidade (serverless functions)
- ✅ Manutenibilidade (componentes isolados)


