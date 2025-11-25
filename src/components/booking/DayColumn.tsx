import React from 'react';
import { Slot } from './Slot';
import { Skeleton } from '@/components/ui/skeleton';

interface TimeSlot {
  start: string;
  end: string;
  free: boolean;
}

interface DayColumnProps {
  date: string;
  dayName: string;
  slots: TimeSlot[];
  loading: boolean;
  selectedSlot: { start: string; end: string } | null;
  onSlotClick: (slot: TimeSlot) => void;
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
};

export const DayColumn: React.FC<DayColumnProps> = ({
  date,
  dayName,
  slots,
  loading,
  selectedSlot,
  onSlotClick,
}) => {
  return (
    <div className="flex-shrink-0 w-full sm:w-48 glass-panel p-4 space-y-3">
      <div className="text-center pb-3 border-b border-white/10">
        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
          {dayName}
        </h3>
        <p className="text-xs text-gray-400 mt-1">{formatDate(date)}</p>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-transparent">
        {loading ? (
          <>
            {[...Array(20)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-gray-800/50" />
            ))}
          </>
        ) : slots.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-4">
            Sem slots disponíveis
          </p>
        ) : (
          slots.map((slot) => (
            <Slot
              key={slot.start}
              time={formatTime(slot.start)}
              isFree={slot.free}
              isSelected={
                selectedSlot?.start === slot.start && selectedSlot?.end === slot.end
              }
              onClick={() => slot.free && onSlotClick(slot)}
            />
          ))
        )}
      </div>
    </div>
  );
};


