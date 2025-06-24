import React, { createContext, useContext, useState, useCallback } from 'react';

interface OrdersModalContextType {
  isOpen: boolean;
  openOrdersModal: () => void;
  closeOrdersModal: () => void;
}

const OrdersModalContext = createContext<OrdersModalContextType | undefined>(undefined);

export const useOrdersModal = (): OrdersModalContextType => {
  const context = useContext(OrdersModalContext);
  if (context === undefined) {
    throw new Error('useOrdersModal must be used within an OrdersModalProvider');
  }
  return context;
};

interface OrdersModalProviderProps {
  children: React.ReactNode;
}

export const OrdersModalProvider: React.FC<OrdersModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Use useCallback for stable function references
  const openOrdersModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeOrdersModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Value provided by the context
  const value = {
    isOpen,
    openOrdersModal,
    closeOrdersModal,
  };

  return (
    <OrdersModalContext.Provider value={value}>
      {children}
    </OrdersModalContext.Provider>
  );
}; 