
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
import { User, LogOut, Images, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTransformationsModal } from '@/hooks/useTransformationsModal';

export const UserMenu: React.FC = () => {
  const { userInfo, isLoading, signInWithGoogle, signOut } = useAuth();
  const { toast } = useToast();
  const { openTransformationsModal } = useTransformationsModal();

  if (!userInfo) {
    return (
      <Button 
        variant="outline" 
        onClick={signInWithGoogle} 
        disabled={isLoading}
        className="flex gap-2 items-center"
      >
        <User className="h-5 w-5" />
        <span className="hidden md:inline">Login com Google</span>
        {isLoading && (
          <span className="animate-spin">⌛</span>
        )}
      </Button>
    );
  }

  const handleMenuItemClick = (action: string) => {
    if (action === 'account') {
      toast({
        title: "Funcionalidade em breve",
        description: "A configuração da conta estará disponível em breve.",
      });
    } else if (action === 'transformations') {
      openTransformationsModal();
    } else if (action === 'logout') {
      signOut();
    }
  };

  const initials = userInfo.full_name
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={userInfo.avatar_url} alt={userInfo.full_name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userInfo.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">{userInfo.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
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

export default UserMenu;
