import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface AccountSettingsModalContextType {
  isAccountModalOpen: boolean;
  openAccountSettingsModal: () => void;
  closeAccountSettingsModal: () => void;
}

// Create the context with a default value (can be undefined initially)
const AccountSettingsModalContext = createContext<AccountSettingsModalContextType | undefined>(undefined);

// Create a provider component
interface AccountSettingsModalProviderProps {
  children: ReactNode;
}

export const AccountSettingsModalProvider: React.FC<AccountSettingsModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openAccountSettingsModal = useCallback(() => setIsOpen(true), []);
  const closeAccountSettingsModal = useCallback(() => setIsOpen(false), []);

  const value = {
    isAccountModalOpen: isOpen,
    openAccountSettingsModal,
    closeAccountSettingsModal,
  };

  return (
    <AccountSettingsModalContext.Provider value={value}>
      {children}
    </AccountSettingsModalContext.Provider>
  );
};

// Create a custom hook to use the context
export const useAccountSettingsModal = (): AccountSettingsModalContextType => {
  const context = useContext(AccountSettingsModalContext);
  if (context === undefined) {
    throw new Error('useAccountSettingsModal must be used within an AccountSettingsModalProvider');
  }
  return context;
};
