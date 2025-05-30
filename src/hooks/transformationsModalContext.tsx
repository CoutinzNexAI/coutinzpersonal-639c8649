import React, { useState, ReactNode, useCallback } from 'react';
import { TransformationsModalContext } from './transformationsModalTypes';

// Provider Component
interface TransformationsModalProviderProps {
  children: ReactNode;
}

export const TransformationsModalProvider: React.FC<TransformationsModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Use useCallback for stable function references
  const openTransformationsModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeTransformationsModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Value provided by the context
  const value = {
    isOpen,
    openTransformationsModal,
    closeTransformationsModal,
  };

  return (
    <TransformationsModalContext.Provider value={value}>
      {children}
    </TransformationsModalContext.Provider>
  );
};