import React from 'react';
import { cn } from '@/lib/utils';

interface SlotProps {
  time: string;
  isFree: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const Slot: React.FC<SlotProps> = ({ time, isFree, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={!isFree}
      className={cn(
        'px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
        'border backdrop-blur-sm',
        isFree
          ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border-emerald-500/40 text-emerald-300 hover:from-emerald-500/30 hover:to-cyan-500/20 hover:border-emerald-400/60 hover:scale-105 cursor-pointer'
          : 'bg-gray-800/30 border-gray-700/50 text-gray-500 cursor-not-allowed opacity-50',
        isSelected && 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-105'
      )}
    >
      {time}
    </button>
  );
};


