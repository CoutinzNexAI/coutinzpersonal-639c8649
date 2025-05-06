import { useState, useEffect } from 'react';

interface ProcessingSimulationProps {
  onComplete: (success: boolean) => void;
}

export const useProcessingSimulation = ({ onComplete }: ProcessingSimulationProps) => {
  const [progressValue, setProgressValue] = useState(0);

  const startProcessing = () => {
    // Reset progress
    setProgressValue(0);
    
    // Simulate processing with progress updates
    const interval = setInterval(() => {
      setProgressValue(prev => {
        const newValue = prev + 5;
        
        if (newValue >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Complete the process after full progress
            // 10% chance of error for demonstration
            const shouldError = Math.random() < 0.1;
            onComplete(!shouldError);
          }, 500);
          return 100;
        }
        
        return newValue;
      });
    }, 300);
    
    // Return cleanup function
    return () => clearInterval(interval);
  };

  return { progressValue, setProgressValue, startProcessing };
};
