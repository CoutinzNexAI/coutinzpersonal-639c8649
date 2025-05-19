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
// Importa Loader2 para o estado de carregamento
import { User, LogOut, Images, Settings, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; // Caminho correto após limpeza
import { useTransformationsModal } from '@/hooks';
import { useAccountSettingsModal } from '@/hooks';
import { motion, AnimatePresence } from "framer-motion";

// Exporta o componente React (pode ser export default se preferir)
export const UserMenu: React.FC = () => {
  // Obtém estado e funções dos hooks
  const { userInfo, isLoading: isAuthLoading, signInWithGoogle, signOut } = useAuth();
  const { openTransformationsModal } = useTransformationsModal();
  const { openAccountSettingsModal } = useAccountSettingsModal();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Estado para menu aberto/fechado (para animações)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ---- Estado Não Autenticado: Botão de Login ----
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
          className="flex gap-2 items-center bg-gradient-to-r from-ghibli-wood to-ghibli-wood/90 text-ghibli-paper hover:bg-ghibli-wood/80 hover:shadow-md px-5 py-2 rounded-lg transition-all duration-300"
          aria-label="Fazer login"
        >
          {isAuthLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="hidden sm:inline">Aguarde...</span>
            </>
          ) : (
            <>
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Entrar</span>
            </>
          )}
        </Button>
      </motion.div>
    );
  }

  // ---- Estado Autenticado: Menu Dropdown ----

  // Função para logout com feedback
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Função para lidar com cliques nos itens do menu
  const handleMenuItemClick = (action: 'account' | 'transformations' | 'logout') => {
    console.log(`[UserMenu] Action: ${action}`);
    switch (action) {
      case 'account':
        openAccountSettingsModal();
        setIsMenuOpen(false);
        break;
      case 'transformations':
        openTransformationsModal();
        setIsMenuOpen(false);
        break;
      case 'logout':
        handleLogout();
        setIsMenuOpen(false);
        break;
    }
  };

  // Função auxiliar para gerar iniciais para o AvatarFallback
  const getInitials = (name?: string | null, email?: string | null): string => {
      if (name) {
          const names = name.split(' ').filter(Boolean); // Divide o nome e remove partes vazias
          if (names.length > 1) {
              // Usa a primeira letra do primeiro e último nome
              return (names[0][0] + names[names.length - 1][0]).toUpperCase();
          } else if (names.length === 1 && names[0].length > 1) {
              // Usa as duas primeiras letras se só houver um nome/palavra
              return names[0].substring(0, 2).toUpperCase();
          } else if (names.length === 1) {
              // Usa a primeira letra se o nome for só uma letra
              return names[0][0].toUpperCase();
          }
      }
      if (email) {
          // Usa a primeira letra do email como fallback
          return email[0].toUpperCase();
      }
      // Fallback final genérico
      return "U";
  };

  // Calcula as iniciais
  const initials = getInitials(userInfo.full_name, userInfo.email);

  // Renderiza o menu dropdown melhorado
  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-11 w-11 rounded-full p-0 overflow-hidden border-2 border-transparent hover:border-ghibli-moss/20 transition-all duration-300 focus-visible:ring-ghibli-moss/30" 
          aria-label="Abrir menu do usuário"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Avatar className="h-10 w-10 bg-ghibli-cream">
              <AvatarImage
                src={userInfo.avatar_url || undefined}
                alt={userInfo.full_name || 'Avatar do usuário'}
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <AvatarFallback className="bg-ghibli-moss/20 text-ghibli-wood font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isMenuOpen && (
              <motion.div 
                className="absolute inset-0 bg-black/5 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </motion.div>
        </Button>
      </DropdownMenuTrigger>
      
      <AnimatePresence>
        {isMenuOpen && (
          <DropdownMenuContent 
            className="w-60 p-1.5 bg-white/95 backdrop-blur-sm border border-ghibli-stone/20 shadow-xl rounded-xl overflow-hidden" 
            align="end" 
            forceMount
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Cabeçalho com nome e email */}
              <DropdownMenuLabel className="font-normal p-3 border-b border-ghibli-stone/10">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-ghibli-stone/10">
                    <AvatarImage
                      src={userInfo.avatar_url || undefined}
                      alt={userInfo.full_name || 'Avatar do usuário'}
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-ghibli-wood leading-tight truncate" title={userInfo.full_name || 'Usuário'}>
                      {userInfo.full_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-ghibli-earth/70 truncate" title={userInfo.email}>
                      {userInfo.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              
              {/* Itens de ação do menu */}
              <div className="py-1">
                <DropdownMenuItem 
                  onClick={() => handleMenuItemClick('account')}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-ghibli-cream/30 focus:bg-ghibli-cream/30 transition-colors"
                >
                  <Settings className="h-4.5 w-4.5 text-ghibli-moss" />
                  <span>Minha Conta</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => handleMenuItemClick('transformations')}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-ghibli-cream/30 focus:bg-ghibli-cream/30 transition-colors"
                >
                  <Images className="h-4.5 w-4.5 text-ghibli-moss" />
                  <span>Fotos Transformadas</span>
                </DropdownMenuItem>
              </div>
              
              <DropdownMenuSeparator className="my-1 bg-ghibli-stone/10" />
              
              <div className="p-1.5">
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 focus:bg-red-50 transition-colors"
                  onClick={() => handleMenuItemClick('logout')}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="mr-2.5 h-4.5 w-4.5 animate-spin" />
                      <span>Saindo...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2.5 h-4.5 w-4.5" />
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

// Exporta o componente (se não for default, usar 'import { UserMenu }')
export default UserMenu; // Descomentar se preferir export default
