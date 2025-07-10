// Transformations Modal
export { TransformationsModalProvider } from './transformationsModalContext';
export { useTransformationsModal } from './useTransformationsModal';
export type { TransformationsModalContextType } from './transformationsModalTypes';

// Account Settings Modal
export { AccountSettingsModalProvider } from './accountSettingsModalContext';
export { useAccountSettingsModal } from './useAccountSettingsModal';
export type { AccountSettingsModalContextType } from './accountSettingsModalTypes';

// Orders Modal
export { OrdersModalProvider, useOrdersModal } from './ordersModalContext';

// Novos hooks genéricos para produtos  
export * from './useProductPricing';
export * from './useProductValidation';
export * from './useProductCoordinates'; 

// Smart Redirect Hook
export { useSmartRedirect } from './useSmartRedirect'; 

// Novo hook para detectar cliques fora
export { useOutsideClick } from './useOutsideClick'; 