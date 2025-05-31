import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

interface RatingButtonsProps {
  transformationId: string;
  initialRating?: number; // -1, 0, 1
  className?: string;
}

export const RatingButtons: React.FC<RatingButtonsProps> = ({ 
  transformationId, 
  initialRating = 0,
  className 
}) => {
  const [currentRating, setCurrentRating] = useState(initialRating);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (rating: number) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/rate-transformation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transformationId, 
          rating: currentRating === rating ? 0 : rating // Se clicar no mesmo, remove o rating
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newRating = currentRating === rating ? 0 : rating;
        setCurrentRating(newRating);
        
        if (newRating === 1) {
          toast.success("👍 Gostei registado!");
        } else if (newRating === -1) {
          toast.success("👎 Feedback registado!");
        } else {
          toast.info("Rating removido");
        }
      } else {
        toast.error("Erro ao registar feedback");
      }
    } catch (error) {
      console.error('Error rating transformation:', error);
      toast.error("Erro ao registar feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      <Button
        variant={currentRating === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => handleRate(1)}
        disabled={isSubmitting}
        className={cn(
          "flex items-center gap-1.5 transition-all",
          currentRating === 1 && "bg-green-500 hover:bg-green-600 text-white"
        )}
      >
        <ThumbsUp className="h-4 w-4" />
        <span className="text-xs">Gostei</span>
      </Button>
      
      <Button
        variant={currentRating === -1 ? "destructive" : "outline"}
        size="sm"
        onClick={() => handleRate(-1)}
        disabled={isSubmitting}
        className="flex items-center gap-1.5 transition-all"
      >
        <ThumbsDown className="h-4 w-4" />
        <span className="text-xs">Não gostei</span>
      </Button>
    </div>
  );
}; 