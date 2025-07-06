// src/components/UserMenu.tsx
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Images, Settings, Loader2, Package2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTransformationsModal, useAccountSettingsModal, useOrdersModal } from '@/hooks'; // Importação agrupada
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner"; // Para notificações

const UserMenu: React.FC = () => {
  const { userInfo, isLoading: isAuthLoading, signInWithGoogle, signOut } = useAuth();
  const { openTransformationsModal } = useTransformationsModal();
  const { openAccountSettingsModal } = useAccountSettingsModal();
  const { openOrdersModal } = useOrdersModal();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estado Não Autenticado: Botão de Login
  if (!userInfo) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={signInWithGoogle}
          disabled={isAuthLoading}
          className="flex gap-2 items-center bg-ghibli-moss hover:bg-ghibli-moss/90 text-ghibli-cream px-4 sm:px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ghibli-sky focus-visible:ring-offset-2 focus-visible:ring-offset-ghibli-cream"
          aria-label="Fazer login"
        >
          {isAuthLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="hidden sm:inline text-sm">Aguarde...</span>
            </>
          ) : (
            <>
              <User className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">Entrar</span>
            </>
          )}
        </Button>
      </motion.div>
    );
  }

  // Estado Autenticado: Menu Dropdown
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      // O toast será mostrado no AuthProvider
      // O redirecionamento também será automático
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Oops! Algo correu mal ao terminar a sessão.");
      setIsLoggingOut(false); // Reset apenas em caso de erro
    }
    // Não fazer setIsLoggingOut(false) aqui porque a página vai recarregar
  };

  const handleMenuItemClick = (action: 'account' | 'transformations' | 'orders' | 'logout') => {
    setIsMenuOpen(false); // Fecha o menu em qualquer clique de item
    switch (action) {
      case 'account':
        openAccountSettingsModal();
        break;
      case 'transformations':
        openTransformationsModal();
        break;
      case 'orders':
        openOrdersModal();
        break;
      case 'logout':
        handleLogout();
        break;
    }
  };

  const getInitials = (name?: string | null, email?: string | null): string => {
    if (name) {
      const names = name.trim().split(' ').filter(Boolean);
      if (names.length > 1) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      } else if (names.length === 1 && names[0].length > 1) {
        return names[0].substring(0, 2).toUpperCase();
      } else if (names.length === 1 && names[0].length === 1) {
        return names[0][0].toUpperCase();
      }
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const initials = getInitials(userInfo.full_name, userInfo.email);

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-11 w-11 rounded-full p-0 overflow-hidden 
                     border-2 border-ghibli-stone/20 hover:border-ghibli-moss/70 
                     bg-ghibli-cream/30 hover:bg-ghibli-cream/60
                     transition-all duration-300 
                     focus-visible:ring-2 focus-visible:ring-ghibli-moss focus-visible:ring-offset-2 focus-visible:ring-offset-ghibli-cream" 
          aria-label="Abrir menu do usuário"
        >
          <motion.div 
            className="flex items-center justify-center w-full h-full"
            whileHover={{ scale: 1.08, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <Avatar className="h-9 w-9 border border-ghibli-stone/30">
              <AvatarImage
                src={userInfo.avatar_url || undefined}
                alt={userInfo.full_name || 'Avatar do usuário'}
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <AvatarFallback className="bg-ghibli-moss/10 text-ghibli-wood font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </Button>
      </DropdownMenuTrigger>
      
      <AnimatePresence>
        {isMenuOpen && (
          <DropdownMenuContent 
            className="w-64 p-2 bg-ghibli-cream/95 backdrop-blur-lg border border-ghibli-stone/30 shadow-xl rounded-xl overflow-hidden mt-1" 
            align="end" 
            forceMount
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <DropdownMenuLabel className="font-normal px-2.5 py-3 border-b border-ghibli-stone/20">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 border border-ghibli-stone/20">
                    <AvatarImage src={userInfo.avatar_url || undefined} alt={userInfo.full_name || 'Avatar'} />
                    <AvatarFallback className="bg-ghibli-moss/20 text-ghibli-wood text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <p className="text-sm font-medium text-ghibli-wood leading-tight truncate" title={userInfo.full_name || 'Usuário'}>
                      {userInfo.full_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-ghibli-earth/80 truncate" title={userInfo.email}>
                      {userInfo.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              <div className="py-1.5">
                <DropdownMenuItem 
                  onClick={() => handleMenuItemClick('account')}
                  className="flex items-center gap-2 px-2.5 py-2 text-sm cursor-pointer rounded-md text-ghibli-wood hover:bg-ghibli-moss/10 focus:bg-ghibli-moss/10 transition-colors"
                >
                  <Settings className="h-4 w-4 text-ghibli-moss" />
                  <span>Minha Conta</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => handleMenuItemClick('transformations')}
                  className="flex items-center gap-2 px-2.5 py-2 text-sm cursor-pointer rounded-md text-ghibli-wood hover:bg-ghibli-moss/10 focus:bg-ghibli-moss/10 transition-colors"
                >
                  <Images className="h-4 w-4 text-ghibli-moss" />
                  <span>Fotos Transformadas</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => handleMenuItemClick('orders')}
                  className="flex items-center gap-2 px-2.5 py-2 text-sm cursor-pointer rounded-md text-ghibli-wood hover:bg-ghibli-moss/10 focus:bg-ghibli-moss/10 transition-colors"
                >
                  <Package2 className="h-4 w-4 text-ghibli-moss" />
                  <span>As Minhas Encomendas</span>
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator className="my-1 bg-ghibli-stone/20" />
              
              <div className="p-1.5">
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2.5 py-2 text-sm text-red-500 rounded-md hover:bg-red-100 hover:text-red-600 focus:bg-red-100 transition-colors"
                  onClick={() => handleMenuItemClick('logout')}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Saindo...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair da Conta</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
};

export default UserMenu;
