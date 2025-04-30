
import React from 'react';
import { cn } from '@/lib/utils';

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  isActive: boolean;
  isEnabled: boolean;
  children: React.ReactNode;
}

const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  title,
  description,
  isActive,
  isEnabled,
  children,
}) => {
  return (
    <div className={cn(
      "step-card",
      isActive ? 'ring-2 ring-primary ring-opacity-50' : '',
      isEnabled ? 'opacity-100' : 'opacity-60'
    )}>
      <div className="mb-6 rounded-full bg-primary/10 p-4">
        <div className="h-8 w-8 text-primary flex items-center justify-center font-bold">{stepNumber}</div>
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground text-center mb-6">
        {description}
      </p>
      {children}
    </div>
  );
};

export default StepCard;
