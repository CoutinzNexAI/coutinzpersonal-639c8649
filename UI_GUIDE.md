# 🎨 UI/UX Guide - Sistema de Marcações

## 📱 Visual Overview

### Desktop View (1920x1080)

```
┌────────────────────────────────────────────────────────────────┐
│  Navbar                                         [Marcações]     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        ✨ Disponível                           │
│                                                                 │
│              ╔═══════════════════════════════╗                 │
│              ║   Vamos conversar?            ║                 │
│              ╚═══════════════════════════════╝                 │
│                                                                 │
│           Diogo Coutinho — AI & Automações                     │
│                                                                 │
│       Segunda a Sexta, das 09:00 às 19:00                      │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [← Semana anterior]    Esta semana    [Próxima semana →]     │
│                                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │Segunda│  │Terça │  │Quarta│  │Quinta│  │Sexta │          │
│  │26 nov│  │27 nov│  │28 nov│  │29 nov│  │30 nov│          │
│  ├──────┤  ├──────┤  ├──────┤  ├──────┤  ├──────┤          │
│  │      │  │      │  │      │  │      │  │      │          │
│  │ 09:00│  │ 09:00│  │ 09:00│  │ 09:00│  │ 09:00│  ← Free  │
│  │      │  │      │  │      │  │      │  │      │    (green)│
│  ├──────┤  ├──────┤  ├──────┤  ├──────┤  ├──────┤          │
│  │      │  │      │  │      │  │      │  │      │          │
│  │ 09:30│  │ 09:30│  │ 09:30│  │ 09:30│  │ 09:30│  ← Busy  │
│  │      │  │      │  │      │  │      │  │      │    (grey) │
│  ├──────┤  ├──────┤  ├──────┤  ├──────┤  ├──────┤          │
│  │ 10:00│  │ 10:00│  │ 10:00│  │ 10:00│  │ 10:00│          │
│  │  ...│  │  ...│  │  ...│  │  ...│  │  ...│          │
│  │ 19:00│  │ 19:00│  │ 19:00│  │ 19:00│  │ 19:00│          │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Mobile View (375x812)

```
┌─────────────────────┐
│ ≡  Navbar           │
├─────────────────────┤
│                     │
│  ✨ Disponível      │
│                     │
│   Vamos conversar?  │
│                     │
│  Diogo Coutinho     │
│  AI & Automações    │
│                     │
│  Seg-Sex, 09-19h    │
│                     │
├─────────────────────┤
│                     │
│  [←]  Esta  [→]    │
│      semana         │
│                     │
│  ┌───────────────┐  │
│  │ Segunda-feira │  │
│  │   26 nov      │  │
│  ├───────────────┤  │
│  │  09:00  ✓     │  │
│  │  09:30        │  │
│  │  10:00  ✓     │  │
│  │  10:30        │  │
│  │  11:00  ✓     │  │
│  │  ...          │  │
│  │  19:00        │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │ Terça-feira   │  │
│  │   27 nov      │  │
│  ├───────────────┤  │
│  │  09:00  ✓     │  │
│  │  ...          │  │
│  └───────────────┘  │
│                     │
│    (scroll down)    │
│                     │
└─────────────────────┘
```

---

## 🎨 Color Palette

### Slots

```
Free Slot (Available)
┌──────────────────┐
│                  │  Background: gradient emerald/cyan
│     09:00        │  Border: emerald-500/40
│                  │  Text: emerald-300
│                  │  Hover: brighter + scale(1.05)
└──────────────────┘

Busy Slot (Occupied)
┌──────────────────┐
│                  │  Background: gray-800/30
│     09:30        │  Border: gray-700/50
│                  │  Text: gray-500
│                  │  Cursor: not-allowed
└──────────────────┘

Selected Slot
┌══════════════════┐
║                  ║  Ring: emerald-400
║     10:00        ║  Ring offset: 2px
║                  ║  Scale: 1.05
└══════════════════┘
```

### Glass Panels

```css
background: gradient from-white/10 to-white/5
backdrop-filter: blur(xl)
border: 1px solid white/20
border-radius: 1rem
box-shadow:
  - 0 15px 35px rgba(0,0,0,0.4)
  - inset 0 1px 0 rgba(255,255,255,0.2)
  - 0 0 30px rgba(139,92,246,0.1)
```

---

## 📐 Layout Specifications

### Day Column

```
Width: 192px (48 * 4)
Padding: 16px
Gap between slots: 8px
Max height: 500px (with scroll)
Border radius: 12px
```

### Slot Button

```
Height: 40px (10 * 4)
Padding: 10px 16px
Font size: 14px
Font weight: 500
Border radius: 8px
Transition: all 300ms
```

### Modal

```
Max width: 500px
Padding: 24px
Border radius: 16px
Background: gradient from-slate-900 to-slate-800
Border: 1px solid cyan-500/30
```

---

## 🎭 States & Interactions

### Slot States

```typescript
// Default Free Slot
className="bg-emerald-500/20 border-emerald-500/40 text-emerald-300"

// Hover Free Slot
className="hover:bg-emerald-500/30 hover:border-emerald-400/60 hover:scale-105"

// Selected Free Slot
className="ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-105"

// Busy Slot
className="bg-gray-800/30 border-gray-700/50 text-gray-500 opacity-50 cursor-not-allowed"
```

### Loading State

```tsx
// Skeleton loader
<Skeleton className="h-10 w-full bg-gray-800/50" />

// Repeated 20 times per day column
```

### Modal States

```tsx
// Closed
<Dialog open={false} />

// Opening (animation)
transform: scale(0.95) → scale(1)
opacity: 0 → 1
duration: 200ms

// Open
<Dialog open={true}>
  <DialogContent />
</Dialog>

// Submitting
<Button disabled>
  <Loader2 className="animate-spin" />
  A confirmar...
</Button>
```

---

## 🎬 Animations

### Page Load

```css
@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

duration: 1.2s
easing: ease-out
```

### Slot Hover

```css
transition: all 300ms ease-in-out
transform: scale(1.05)
filter: brightness(1.1)
```

### Modal

```css
/* Backdrop */
opacity: 0 → 0.8
duration: 200ms

/* Content */
transform: scale(0.95) → scale(1)
opacity: 0 → 1
duration: 200ms
easing: ease-out
```

### Toast Notification

```css
/* Slide in from right */
transform: translateX(100%) → translateX(0)
duration: 300ms
easing: ease-out

/* Auto-dismiss after 5s */
opacity: 1 → 0
duration: 200ms
delay: 4800ms
```

---

## 🖱️ User Interactions

### Desktop

```
Hover on free slot
  └─ Brighten + scale(1.05) + cursor pointer

Click free slot
  └─ Add ring + open modal

Hover on busy slot
  └─ No change + cursor not-allowed

Click navigation
  └─ Load new week + loading skeletons

Scroll day column
  └─ Smooth scroll with custom scrollbar
```

### Mobile

```
Tap free slot
  └─ Highlight + open modal (no hover state)

Tap busy slot
  └─ No action

Swipe day columns
  └─ Horizontal scroll

Pinch to zoom
  └─ Disabled (native zoom off)
```

---

## 📊 Component Anatomy

### CalendarGrid Component

```tsx
<div className="space-y-6">
  {/* Auth Alert (conditional) */}
  {authError && (
    <Alert className="glass-panel border-yellow-500/50">
      <AlertCircle />
      <AlertTitle>Autenticação Necessária</AlertTitle>
      <Button onClick={redirectToAuth}>
        Autenticar com Google
      </Button>
    </Alert>
  )}

  {/* Week Navigation */}
  <div className="flex justify-between">
    <Button onClick={previousWeek}>
      <ChevronLeft /> Semana anterior
    </Button>
    <span>{weekLabel}</span>
    <Button onClick={nextWeek}>
      Próxima semana <ChevronRight />
    </Button>
  </div>

  {/* Days Grid */}
  <div className="flex gap-4 overflow-x-auto">
    {days.map(day => (
      <DayColumn
        date={day.date}
        dayName={day.dayName}
        slots={day.slots}
        loading={day.loading}
      />
    ))}
  </div>

  {/* Booking Modal */}
  <BookingModal
    isOpen={isModalOpen}
    slot={selectedSlot}
    onConfirm={handleBook}
  />
</div>
```

### DayColumn Component

```tsx
<div className="w-48 glass-panel p-4">
  {/* Header */}
  <div className="text-center pb-3 border-b">
    <h3 className="text-lg cosmic-gradient-text">
      {dayName}
    </h3>
    <p className="text-xs text-gray-400">
      {formatDate(date)}
    </p>
  </div>

  {/* Slots */}
  <div className="space-y-2 max-h-[500px] overflow-y-auto">
    {loading ? (
      // Skeletons
      [...Array(20)].map((_, i) => (
        <Skeleton key={i} className="h-10" />
      ))
    ) : (
      // Actual slots
      slots.map(slot => (
        <Slot
          key={slot.start}
          time={formatTime(slot.start)}
          isFree={slot.free}
          onClick={() => handleClick(slot)}
        />
      ))
    )}
  </div>
</div>
```

### BookingModal Component

```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-[500px] glass-panel">
    <DialogHeader>
      <DialogTitle className="cosmic-gradient-text">
        Confirmar Marcação
      </DialogTitle>
      <DialogDescription>
        Agende a sua conversa
      </DialogDescription>
    </DialogHeader>

    {/* Slot Info */}
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        <span>{formatDateTime(slot.start)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span>{timeRange}</span>
      </div>
    </div>

    {/* Form */}
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">
          <User /> Nome *
        </Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="O seu nome"
        />
      </div>

      <div>
        <Label htmlFor="email">
          <Mail /> Email (opcional)
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seu.email@exemplo.com"
        />
      </div>
    </div>

    {/* Footer */}
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button onClick={handleConfirm} disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin mr-2" />
            A confirmar...
          </>
        ) : (
          'Confirmar Marcação'
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🎯 Key UI Decisions

### Why Glass Morphism?
- Modern, clean aesthetic
- Maintains hierarchy
- Works well with dark backgrounds
- Professional feel

### Why Cyan + Emerald?
- High contrast on dark bg
- Energetic but professional
- Differentiates from competitors
- Aligns with AI/tech brand

### Why 30-min Slots?
- Standard meeting duration
- Enough for meaningful conversation
- Not too granular (overwhelming)
- Industry standard

### Why Week Navigation?
- Users typically book 1-2 weeks ahead
- Prevents infinite scroll
- Performance (only load 5 days)
- Clear boundaries

### Why Optional Email?
- Lower friction for booking
- Some users privacy-conscious
- Name is enough for calendar entry
- Can still send confirmation if provided

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
@media (max-width: 640px) {
  - Stack day columns
  - Full width slots
  - Reduce padding
  - Larger touch targets
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  - 2-3 columns side by side
  - Horizontal scroll
}

/* Desktop */
@media (min-width: 1025px) {
  - 5 columns (all days visible)
  - Hover states active
  - Larger spacing
}
```

---

## ✨ Micro-interactions

### Loading
```
User clicks week navigation
  └─ Immediate skeleton load
  └─ Fade in real data
  └─ Smooth transition (300ms)
```

### Booking Success
```
User confirms booking
  └─ Button shows loading spinner
  └─ Modal closes (200ms fade)
  └─ Toast slides in from right
  └─ Week reloads automatically
  └─ Booked slot now grey
```

### Error
```
API fails
  └─ Toast with error message
  └─ Red accent color
  └─ Retry button
  └─ Modal stays open
```

---

## 🎨 Accessibility

### Colors
- WCAG AA compliant
- Sufficient contrast ratios
- Color not sole indicator (text labels)

### Keyboard Navigation
- Tab through all interactive elements
- Enter to select slot
- Esc to close modal
- Arrow keys in date picker

### Screen Readers
- Semantic HTML
- ARIA labels on buttons
- Role attributes
- Alt text on icons

### Focus States
- Visible focus ring
- High contrast
- 2px outline

---

## 💡 Tips for Customization

### Change Colors
```css
/* In tailwind.config.ts */
colors: {
  primary: '#your-color',
  secondary: '#your-color',
}
```

### Change Slot Duration
```typescript
// In CalendarGrid.tsx
const intervalMinutes = 60; // Change from 30 to 60
```

### Change Business Hours
```typescript
// In availability.ts
const startHour = 8;  // Start at 08:00
const endHour = 20;   // End at 20:00
```

### Change Timezone
```typescript
// In book.ts
timeZone: 'America/New_York'
```

---

Pronto! Agora tens um guia visual completo do sistema de marcações. 🎨


