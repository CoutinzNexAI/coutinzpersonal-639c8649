
import React, { createContext, useContext, useState } from 'react';

interface TransformationsModalContextType {
  isOpen: boolean;
  openTransformationsModal: () => void;
  closeTransformationsModal: () => void;
}

const TransformationsModalContext = createContext<TransformationsModalContextType | undefined>(undefined);

export const TransformationsModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openTransformationsModal = () => setIsOpen(true);
  const closeTransformationsModal = () => setIsOpen(false);

  return (
    <TransformationsModalContext.Provider value={{ isOpen, openTransformationsModal, closeTransformationsModal }}>
      {children}
    </TransformationsModalContext.Provider>
  );
};

export const useTransformationsModal = () => {
  const context = useContext(TransformationsModalContext);
  if (context === undefined) {
    throw new Error('useTransformationsModal must be used within a TransformationsModalProvider');
  }
  return context;
};
