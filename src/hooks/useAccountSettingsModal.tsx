import { useContext } from 'react';
import { AccountSettingsModalContext, AccountSettingsModalContextType } from './accountSettingsModalTypes';

export const useAccountSettingsModal = (): AccountSettingsModalContextType => {
  const context = useContext(AccountSettingsModalContext);
  if (context === undefined) {
    throw new Error('useAccountSettingsModal must be used within an AccountSettingsModalProvider');
  }
  return context;
}; 