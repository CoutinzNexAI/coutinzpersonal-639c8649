import React from 'react';
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
import { useTransformationsModal } from '@/hooks/transformationsModalContext';
import { useAccountSettingsModal } from '@/hooks/accountSettingsModalContext';

// Exporta o componente React (pode ser export default se preferir)
export const UserMenu: React.FC = () => {
  // Obtém estado e funções dos hooks
  const { userInfo, isLoading: isAuthLoading, signInWithGoogle, signOut } = useAuth();
  const { openTransformationsModal } = useTransformationsModal();
  const { openAccountSettingsModal } = useAccountSettingsModal();

  // ---- Estado Não Autenticado: Botão de Login ----
  if (!userInfo) {
    return (
      <Button
        variant="outline"
        onClick={signInWithGoogle}
        disabled={isAuthLoading} // Desativa enquanto carrega
        className="flex gap-2 items-center"
        aria-label="Login com Google" // Adiciona aria-label
      >
        {/* Mostra ícone de loading ou ícone de utilizador */}
        {isAuthLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <User className="h-5 w-5" />
        )}
        {/* Texto do botão (opcionalmente escondido em ecrãs pequenos) */}
        <span className="hidden sm:inline">Login com Google</span>
      </Button>
    );
  }

  // ---- Estado Autenticado: Menu Dropdown ----

  // Função para lidar com cliques nos itens do menu
  const handleMenuItemClick = (action: 'account' | 'transformations' | 'logout') => {
    console.log(`[UserMenu] Action: ${action}`); // Log para debugging
    switch (action) {
      case 'account':
        openAccountSettingsModal();
        break;
      case 'transformations':
        openTransformationsModal();
        break;
      case 'logout':
        signOut();
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

  // Renderiza o menu dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Botão que ativa o menu, estilizado como um círculo para o avatar */}
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0" aria-label="Abrir menu do utilizador">
          <Avatar className="h-9 w-9"> {/* Avatar ligeiramente menor */}
            <AvatarImage
              src={userInfo.avatar_url || undefined} // Passa undefined se não houver URL
              alt={userInfo.full_name || 'Avatar do usuário'}
              referrerPolicy="no-referrer" // Evita enviar informação de referência
            />
            {/* Fallback com as iniciais calculadas */}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      {/* Conteúdo do menu dropdown */}
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* Cabeçalho do menu com nome e email */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none truncate" title={userInfo.full_name || 'Usuário'}>
              {userInfo.full_name || 'Usuário'}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate" title={userInfo.email}>
              {userInfo.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Itens de ação do menu */}
        <DropdownMenuItem onClick={() => handleMenuItemClick('account')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Minha Conta</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMenuItemClick('transformations')}>
          <Images className="mr-2 h-4 w-4" />
          <span>Fotos Transformadas</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleMenuItemClick('logout')}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Exporta o componente (se não for default, usar 'import { UserMenu }')
export default UserMenu; // Descomentar se preferir export default
