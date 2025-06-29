import React from 'react';
import { Button } from '@/components/ui/button';

interface PositionControlsProps {
  currentPosition: 'left' | 'center' | 'right';
  onPositionChange: (position: 'left' | 'center' | 'right') => void;
  isGeneratingMockup: boolean;
  variant?: 'mobile' | 'desktop';
}

export const PositionControls: React.FC<PositionControlsProps> = ({
  currentPosition,
  onPositionChange,
  isGeneratingMockup,
  variant = 'mobile'
}) => {
  const isMobile = variant === 'mobile';
  const buttonSize = isMobile ? 'h-8 w-8' : 'h-12 w-12';
  const iconSize = isMobile ? 'w-3 h-3' : 'w-5 h-5';

  const positions: Array<{ key: 'left' | 'center' | 'right'; title: string; icon: string }> = [
    { key: 'left', title: 'Esquerda', icon: 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z' },
    { key: 'center', title: 'Centro', icon: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0' },
    { key: 'right', title: 'Direita', icon: 'M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z' }
  ];

  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg border border-ghibli-sand/30">
      {positions.map(({ key, title, icon }) => (
        <Button 
          key={key}
          onClick={() => onPositionChange(key)} 
          variant="ghost"
          size="sm"
          className={`${buttonSize} rounded-full transition-all duration-200 ${
            currentPosition === key 
              ? 'bg-ghibli-moss text-white shadow-md scale-110' 
              : `text-ghibli-earth hover:bg-ghibli-moss/10 ${!isMobile ? 'hover:scale-105' : ''}`
          }`}
          disabled={isGeneratingMockup}
          title={title}
        >
          {key === 'center' ? (
            <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"/>
            </svg>
          ) : (
            <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
              <path d={icon}/>
            </svg>
          )}
        </Button>
      ))}
    </div>
  );
}; 