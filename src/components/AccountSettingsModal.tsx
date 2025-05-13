import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccountSettingsModal } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Loader2, UserCircle, Mail, Calendar } from 'lucide-react';

// Não precisamos mais da interface UserDetails

const AccountSettingsModal: React.FC = () => {
  // Obtém estado do modal e dados básicos do user
  const { isAccountModalOpen, closeAccountSettingsModal } = useAccountSettingsModal();
  const { userInfo } = useAuth(); // Obtém id, email, full_name (mas não created_at)

  // Estados específicos para buscar created_at
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [isLoadingDate, setIsLoadingDate] = useState<boolean>(false);
  const [errorDate, setErrorDate] = useState<string | null>(null);

  // useEffect para buscar apenas created_at quando o modal abre
  useEffect(() => {
    const fetchCreatedAt = async () => {
      // Não faz nada se modal fechado ou sem user ID
      if (!isAccountModalOpen || !userInfo?.id) {
        setCreatedAt(null); // Limpa a data se modal fechado ou sem user
        return;
      }

      console.log('[AccountSettingsModal] Fetching created_at for user:', userInfo.id);
      setIsLoadingDate(true); // Inicia loading específico da data
      setErrorDate(null);     // Limpa erro específico da data
      setCreatedAt(null);     // Limpa data anterior

      try {
        // Busca APENAS created_at da tabela 'users'
        const { data, error: dbError } = await supabase
          .from('users') // Confirma o nome da tua tabela de utilizadores
          .select('created_at')
          .eq('id', userInfo.id)
          .single(); // Espera um único resultado

        if (dbError) {
          console.error('[AccountSettingsModal] Supabase error fetching created_at:', dbError);
          throw new Error('Não foi possível carregar a data de criação.'); // Lança erro para o catch
        } else if (data && data.created_at) {
          console.log('[AccountSettingsModal] Fetched created_at:', data.created_at);
          setCreatedAt(data.created_at); // Define a data no estado
        } else {
          console.warn('[AccountSettingsModal] No created_at data found for user.');
          setErrorDate('Data de criação não encontrada.'); // Define erro específico
        }

      } catch (err) {
        console.error('[AccountSettingsModal] Error fetching created_at:', err);
        // Define o erro específico da data
        setErrorDate(err instanceof Error ? err.message : 'Falha ao carregar data.');
      } finally {
        setIsLoadingDate(false); // Termina loading específico da data
      }
    };

    fetchCreatedAt();
    // Dependências: re-executa se o modal abrir/fechar ou se o utilizador mudar
  }, [isAccountModalOpen, userInfo]);

  // Função para formatar data
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('pt-PT', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (_e) {
      console.error("Erro ao formatar data:", dateString, _e);
      return 'Data inválida';
    }
  };

  // ---- Renderização ----
  return (
    <Dialog open={isAccountModalOpen} onOpenChange={closeAccountSettingsModal}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Minha Conta</DialogTitle>
          <DialogDescription>Informações da sua conta.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Verifica se userInfo (dados básicos) existe */}
          {userInfo ? (
            <div className="space-y-3">
              {/* Nome */}
              <div className="flex items-center gap-3">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Nome:</span> {userInfo.full_name || 'Não definido'}
                </div>
              </div>
              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Email:</span> {userInfo.email || 'Não definido'}
                </div>
              </div>
              {/* Data de Criação (com loading/erro específicos) */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Membro desde:</span>
                  {/* Mostra feedback específico para created_at */}
                  {isLoadingDate ? ( // Verifica o loading específico da data
                      <Loader2 className="h-4 w-4 animate-spin text-primary inline-block ml-1" />
                  ) : errorDate ? ( // Verifica o erro específico da data
                      <span className="italic text-destructive ml-1"> ({errorDate})</span>
                  ) : ( // Mostra a data formatada (do estado createdAt)
                      ` ${formatDate(createdAt)}`
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Mensagem se userInfo for null
            <p className="text-muted-foreground text-center">Não foi possível carregar os dados do utilizador.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeAccountSettingsModal}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSettingsModal;