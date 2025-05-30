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
  openTransformationsModal: () => { },
  closeTransformationsModal: () => { },
};

// Context
export const TransformationsModalContext = createContext<TransformationsModalContextType>(defaultModalValue); 