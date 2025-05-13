import { createContext } from 'react';

export interface AccountSettingsModalContextType {
  isAccountModalOpen: boolean;
  openAccountSettingsModal: () => void;
  closeAccountSettingsModal: () => void;
}

// Create the context with a default value
export const AccountSettingsModalContext = createContext<AccountSettingsModalContextType | undefined>(undefined); 