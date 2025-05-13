import { useContext } from 'react';
import { TransformationsModalContext, TransformationsModalContextType } from './transformationsModalTypes';

export const useTransformationsModal = (): TransformationsModalContextType => {
  const context = useContext(TransformationsModalContext);

  if (context === undefined) {
    throw new Error('useTransformationsModal must be used within a TransformationsModalProvider');
  }
  return context;
}; 