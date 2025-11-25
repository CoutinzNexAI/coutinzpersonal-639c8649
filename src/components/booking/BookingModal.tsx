import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, User, Mail, Loader2 } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: { start: string; end: string } | null;
  onConfirm: (name: string, email: string) => Promise<void>;
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
};

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  slot,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!name.trim()) {
      alert('Por favor, insira o seu nome');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(name, email);
      setName('');
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!slot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
            Confirmar Marcação
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Agende a sua conversa com Diogo Coutinho
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date and Time Info */}
          <div className="glass-panel p-4 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{formatDateTime(slot.start)}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                {formatTime(slot.start)} - {formatTime(slot.end)}
              </span>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome *
            </Label>
            <Input
              id="name"
              placeholder="O seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-800/50 border-gray-700 focus:border-cyan-500 text-white"
              required
            />
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email (opcional)
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800/50 border-gray-700 focus:border-cyan-500 text-white"
            />
          </div>

          <p className="text-xs text-gray-500">
            Receberá uma confirmação por email se fornecer o seu endereço.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-gray-700 hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A confirmar...
              </>
            ) : (
              'Confirmar Marcação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


