import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Interface for the context value
export interface TransformationsModalContextType {
  isOpen: boolean;
  openTransformationsModal: () => void;
  closeTransformationsModal: () => void;
}

// Default State - Define a default that matches the type, but functions can be simple stubs
export const defaultModalValue: TransformationsModalContextType = {
  isOpen: false,
  openTransformationsModal: () => { console.warn("TransformationsModalProvider not yet initialized"); },
  closeTransformationsModal: () => { console.warn("TransformationsModalProvider not yet initialized"); },
};

// Context
// Use the defined type for the context
export const TransformationsModalContext = createContext<TransformationsModalContextType>(defaultModalValue);

// --- ADICIONADO: Provider Component ---
interface TransformationsModalProviderProps {
  children: ReactNode;
}

export const TransformationsModalProvider: React.FC<TransformationsModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Use useCallback for stable function references
  const openTransformationsModal = useCallback(() => {
    console.log("[TransformationsModalContext] Opening modal.");
    setIsOpen(true);
  }, []);

  const closeTransformationsModal = useCallback(() => {
    console.log("[TransformationsModalContext] Closing modal.");
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
// --- FIM DA ADIÇÃO ---


// Hook (remains the same)
export const useTransformationsModal = (): TransformationsModalContextType => { // Explicit return type
  const context = useContext(TransformationsModalContext);

  // Ensure context is not undefined (means hook is used outside provider)
  if (context === undefined) {
    // Changed console.error to throw error directly as intended
    throw new Error('useTransformationsModal must be used within a TransformationsModalProvider');
  }
  return context;
};