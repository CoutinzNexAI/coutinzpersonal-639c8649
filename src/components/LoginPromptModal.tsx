// src/components/LoginPromptModal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  // DialogClose, // O X é geralmente incluído por defeito no DialogContent do Shadcn/UI
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Sparkles, History, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginPromptModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLogin: () => Promise<void>; // Ex: para signInWithGoogle
  isLoggingIn?: boolean; // Para mostrar estado de loading no botão de login
}

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1 + 0.2, // Adicionado um pequeno delay base
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  isOpen,
  onOpenChange,
  onLogin,
  isLoggingIn,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-ghibli-paper text-ghibli-charcoal rounded-xl shadow-2xl overflow-hidden border-2 border-ghibli-slate/30">
        
        <DialogHeader className="text-center pt-8 sm:pt-10 px-6">
          <DialogTitle className="text-2xl sm:text-3xl font-ghibli flex items-center justify-center mb-3 text-ghibli-wood">
            <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 mr-2 text-amber-500" />
            Entre no PicTuz
          </DialogTitle>
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.6, delay: 0.3 }
            }}
            className="relative"
          >
            <DialogDescription className="text-ghibli-slate text-base sm:text-lg px-2 sm:px-4 font-medium">
              Liga-te à tua conta para não perderes nenhuma foto que criaste!
            </DialogDescription>
            <motion.div 
              className="h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent w-3/4 mx-auto mt-2"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ 
                scaleX: 1, 
                opacity: 1,
                transition: { duration: 0.8, delay: 0.6 }
              }}
            />
          </motion.div>
        </DialogHeader>

        <div className="py-6 sm:py-8 px-6 sm:px-8">
          <motion.ul className="space-y-3 sm:space-y-4 text-ghibli-charcoal text-sm sm:text-base">
            {[
              // Sugestões para os itens da lista:
              { icon: Save, text: "Guarde automaticamente todas as suas criações na sua galeria pessoal.", color: "text-ghibli-moss" },
              { icon: History, text: "Consulte o seu histórico de transformações a qualquer momento e em qualquer dispositivo.", color: "text-ghibli-sky" },
              { icon: Sparkles, text: "🎁 Oferta de boas-vindas: 2 PicCoins grátis ao fazer o seu primeiro login!", color: "text-amber-500" }
              
            ].map((item, index) => (
              <motion.li 
                key={index}
                className="flex items-start"
                custom={index}
                initial="hidden"
                animate="visible"
                variants={listItemVariants}
              >
                <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 mr-3 mt-0.5 ${item.color} flex-shrink-0`} />
                <span>{item.text}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3 pt-4 pb-8 px-6 sm:px-8 bg-ghibli-paper/30 border-t border-ghibli-slate/20">
          <Button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full ghibli-button bg-ghibli-moss hover:bg-ghibli-moss/90 text-ghibli-cream shadow-md hover:shadow-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ghibli-sunflower focus-visible:ring-offset-2 focus-visible:ring-offset-ghibli-paper"
            size="lg"
            aria-label="Entrar com Google para guardar as suas criações"
          >
            {isLoggingIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-5 w-5" />
            )}
            {isLoggingIn ? 'A autenticar...' : 'Entrar com Google'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPromptModal;
