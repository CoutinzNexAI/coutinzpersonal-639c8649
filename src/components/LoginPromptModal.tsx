// src/components/LoginPromptModal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, Sparkles, History, Save, Loader2, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginPromptModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLogin: () => Promise<void>;
  isLoggingIn?: boolean;
}

const containerVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 50
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 400,
      mass: 0.8,
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    x: -30,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  }
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

  // Handler para clique dentro do modal - qualquer clique dispara o login
  const handleModalClick = () => {
    if (!isLoggingIn) {
      onLogin();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-white/95 backdrop-blur-sm text-ghibli-charcoal rounded-2xl shadow-2xl overflow-hidden border border-ghibli-slate/20 cursor-pointer"
        onClick={handleModalClick}
      >
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="p-6"
        >
          <DialogHeader className="text-center mb-6">
            <motion.div variants={itemVariants}>
              <DialogTitle className="text-3xl md:text-4xl font-ghibli flex items-center justify-center text-ghibli-wood">
          <motion.div
            animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    repeatType: "reverse" 
            }}
                  className="mr-2"
                >
                  ✨
                </motion.div>
                Entre no PicTuz
              </DialogTitle>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <DialogDescription className="text-ghibli-slate text-xl md:text-2xl font-medium mt-2">
                Transformações gratuitas todos os dias! 🎁
            </DialogDescription>
          </motion.div>
        </DialogHeader>

          <motion.div className="space-y-3 mb-6">
            {[
              { icon: Save, text: "💾 Armazena as tuas transformações na tua conta", color: "text-green-600" },
              { icon: History, text: "🔒 Nunca mais percas o teu trabalho criativo", color: "text-blue-600" }
            ].map((item, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="flex items-center p-3 rounded-lg bg-ghibli-paper/30 hover:bg-ghibli-paper/50 transition-colors duration-200"
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className={`h-6 w-6 md:h-7 md:w-7 mr-3 ${item.color} flex-shrink-0`} />
                <span className="text-base md:text-lg font-medium text-ghibli-charcoal">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants}>
          <Button
            onClick={onLogin}
            disabled={isLoggingIn}
              className="w-full bg-ghibli-moss hover:bg-ghibli-moss/90 text-white font-semibold py-4 md:py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-lg md:text-xl"
            size="lg"
          >
            {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 md:h-7 md:w-7 animate-spin" />
                  A entrar...
                </>
            ) : (
                <>
                  <LogIn className="mr-2 h-6 w-6 md:h-7 md:w-7" />
                  Entrar com Google
                </>
            )}
          </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginPromptModal;
