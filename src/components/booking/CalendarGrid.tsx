import React, { useState, useEffect } from 'react';
import { DayColumn } from './DayColumn';
import { BookingModal } from './BookingModal';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TimeSlot {
  start: string;
  end: string;
  free: boolean;
}

interface DayData {
  date: string;
  dayName: string;
  slots: TimeSlot[];
  loading: boolean;
}

// Get next N weekdays
const getNextWeekdays = (count: number, startOffset: number = 0): string[] => {
  const dates: string[] = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + startOffset);
  
  while (dates.length < count) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', { weekday: 'long' });
};

export const CalendarGrid: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [days, setDays] = useState<DayData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadWeek = async (offset: number) => {
    const dates = getNextWeekdays(5, offset * 5);
    
    const initialDays: DayData[] = dates.map(date => ({
      date,
      dayName: getDayName(date),
      slots: [],
      loading: true,
    }));
    
    setDays(initialDays);

    // Fetch availability for each day
    for (let i = 0; i < dates.length; i++) {
      try {
        const response = await fetch(`/api/availability?date=${dates[i]}`);
        const data = await response.json();

        // Check for auth error
        if (response.status === 401 && data.authUrl) {
          setAuthError(data.authUrl);
          setDays(prev => prev.map(day => ({ ...day, loading: false, slots: [] })));
          return;
        }

        setDays(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            slots: data.slots || [],
            loading: false,
          };
          return updated;
        });
      } catch (error) {
        console.error(`Failed to load availability for ${dates[i]}:`, error);
        setDays(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            slots: [],
            loading: false,
          };
          return updated;
        });
      }
    }
  };

  useEffect(() => {
    loadWeek(weekOffset);
  }, [weekOffset]);

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleConfirmBooking = async (name: string, email: string) => {
    if (!selectedSlot) return;

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: selectedSlot.start,
          end: selectedSlot.end,
          name,
          email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      toast({
        title: 'Marcação confirmada! ✅',
        description: 'Receberá uma confirmação por email em breve.',
        duration: 5000,
      });

      setIsModalOpen(false);
      setSelectedSlot(null);
      
      // Reload the current week
      loadWeek(weekOffset);
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Erro ao confirmar marcação',
        description: 'Por favor, tente novamente.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Auth Error Alert */}
      {authError && (
        <Alert className="glass-panel border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-300">Autenticação Necessária</AlertTitle>
          <AlertDescription className="text-yellow-200/80 space-y-3">
            <p>Para visualizar a disponibilidade, precisa de autenticar com o Google Calendar.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = authError}
              className="border-yellow-500/50 hover:bg-yellow-500/20 text-yellow-300"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Autenticar com Google
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
          disabled={weekOffset === 0}
          className="border-cyan-500/30 hover:bg-cyan-500/10"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Semana anterior
        </Button>

        <span className="text-sm text-gray-400">
          {weekOffset === 0 ? 'Esta semana' : `+${weekOffset} semana${weekOffset > 1 ? 's' : ''}`}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="border-cyan-500/30 hover:bg-cyan-500/10"
        >
          Próxima semana
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent">
        {days.map((day) => (
          <DayColumn
            key={day.date}
            date={day.date}
            dayName={day.dayName}
            slots={day.slots}
            loading={day.loading}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
          />
        ))}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlot(null);
        }}
        slot={selectedSlot}
        onConfirm={handleConfirmBooking}
      />
    </div>
  );
};

