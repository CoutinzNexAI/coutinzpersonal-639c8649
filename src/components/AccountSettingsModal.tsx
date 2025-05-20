// src/components/AccountSettingsModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose, // Adicionado DialogClose para o botão no header
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccountSettingsModal } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { Loader2, UserCircle, Mail, Calendar, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

const AccountSettingsModal: React.FC = () => {
  const { isAccountModalOpen, closeAccountSettingsModal } = useAccountSettingsModal();
  const { userInfo } = useAuth();

  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [isLoadingDate, setIsLoadingDate] = useState<boolean>(false);
  const [errorDate, setErrorDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreatedAt = async () => {
      if (!isAccountModalOpen || !userInfo?.id) {
        setCreatedAt(null);
        return;
      }

      // console.log('[AccountSettingsModal] Fetching created_at for user:', userInfo.id);
      setIsLoadingDate(true);
      setErrorDate(null);
      setCreatedAt(null);

      try {
        const { data, error: dbError } = await supabase
          .from('users') 
          .select('created_at')
          .eq('id', userInfo.id)
          .single();

        if (dbError) {
          // console.error('[AccountSettingsModal] Supabase error fetching created_at:', dbError);
          throw new Error('Não foi possível carregar a data de criação.');
        } else if (data && data.created_at) {
          // console.log('[AccountSettingsModal] Fetched created_at:', data.created_at);
          setCreatedAt(data.created_at);
        } else {
          // console.warn('[AccountSettingsModal] No created_at data found for user.');
          setErrorDate('Data de criação não encontrada.');
        }
      } catch (err) {
        // console.error('[AccountSettingsModal] Error fetching created_at:', err);
        setErrorDate(err instanceof Error ? err.message : 'Falha ao carregar data.');
      } finally {
        setIsLoadingDate(false);
      }
    };

    if (isAccountModalOpen) { // Fetch only when modal is intended to be open
        fetchCreatedAt();
    }
  // Adicionado styles (ou qualquer outra dep que possa mudar filteredStyles)
  }, [isAccountModalOpen, userInfo]); // userInfo como dependência é importante aqui

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Indisponível';
    try {
      return new Date(dateString).toLocaleDateString('pt-PT', {
        year: 'numeric', month: 'long', day: 'numeric',
        // hour: '2-digit', minute: '2-digit' // Removido hora para simplicidade, pode adicionar de volta
      });
    } catch {
      // console.error("Erro ao formatar data:", dateString);
      return 'Data inválida';
    }
  };

  const InfoRow: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 bg-ghibli-cream/50 rounded-lg border border-ghibli-stone/20">
      <Icon className="h-5 w-5 text-ghibli-moss mt-0.5 shrink-0" />
      <div className="text-sm">
        <span className="font-medium text-ghibli-wood">{label}:</span>
        <span className="text-ghibli-earth ml-1">{value}</span>
      </div>
    </div>
  );

  return (
    <Dialog open={isAccountModalOpen} onOpenChange={closeAccountSettingsModal}>
      <AnimatePresence>
        {isAccountModalOpen && (
          <DialogContent 
            className="sm:max-w-md p-0 rounded-xl bg-ghibli-cream shadow-2xl border-2 border-ghibli-stone/30 overflow-hidden"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <DialogHeader className="px-6 pt-6 pb-4 text-left border-b border-ghibli-stone/20 relative">
                <div className="flex items-center">
                  <Sparkles className="h-6 w-6 text-amber-500 mr-2.5" />
                  <DialogTitle className="text-2xl font-ghibli text-ghibli-wood">Minha Conta Mágica</DialogTitle>
                </div>
                <DialogDescription className="text-ghibli-earth/90 mt-1 text-sm">
                  Aqui estão os detalhes encantados da sua jornada.
                </DialogDescription>
                <DialogClose className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-ghibli-stone/20 transition-colors data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  <X className="h-5 w-5 text-ghibli-wood/80" />
                  <span className="sr-only">Fechar</span>
                </DialogClose>
              </DialogHeader>

              <div className="p-6">
                {userInfo ? (
                  <div className="space-y-4">
                    <InfoRow 
                      icon={UserCircle} 
                      label="Nome de Herói" 
                      value={userInfo.full_name || 'Ainda por revelar'} 
                    />
                    <InfoRow 
                      icon={Mail} 
                      label="Pergaminho Eletrónico" 
                      value={userInfo.email || 'Secreto'} 
                    />
                    <InfoRow 
                      icon={Calendar} 
                      label="Início da Aventura" 
                      value={
                        isLoadingDate ? (
                          <Loader2 className="h-4 w-4 animate-spin text-ghibli-moss inline-block" />
                        ) : errorDate ? (
                          <span className="italic text-red-600/80">({errorDate})</span>
                        ) : (
                          formatDate(createdAt)
                        )
                      } 
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-ghibli-moss mx-auto mb-3" />
                    <p className="text-ghibli-earth">A carregar os seus segredos...</p>
                  </div>
                )}
              </div>

              <DialogFooter className="px-6 pb-6 pt-4 bg-ghibli-cream/50 border-t border-ghibli-stone/20">
                <Button 
                  variant="outline" 
                  onClick={closeAccountSettingsModal}
                  className="bg-ghibli-stone/10 border-ghibli-stone/30 text-ghibli-wood hover:bg-ghibli-stone/20 hover:border-ghibli-stone/40 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                >
                  Fechar Portal
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default AccountSettingsModal;
