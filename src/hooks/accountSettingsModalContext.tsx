import React, { useState, ReactNode, useCallback } from 'react';
import { AccountSettingsModalContext } from './accountSettingsModalTypes';

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
