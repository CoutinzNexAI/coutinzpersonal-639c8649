import { createContext } from 'react';

// Interface for the context value
export interface TransformationsModalContextType {
  isOpen: boolean;
  openTransformationsModal: () => void;
  closeTransformationsModal: () => void;
}

// Default State
export const defaultModalValue: TransformationsModalContextType = {
  isOpen: false,
  openTransformationsModal: () => { console.warn("TransformationsModalProvider not yet initialized"); },
  closeTransformationsModal: () => { console.warn("TransformationsModalProvider not yet initialized"); },
};

// Context
export const TransformationsModalContext = createContext<TransformationsModalContextType>(defaultModalValue); 