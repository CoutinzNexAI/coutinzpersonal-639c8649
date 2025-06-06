import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { trackEvent } from '@/lib/posthog';
import Link from 'next/link';

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
  userEmail?: string;
  loading?: boolean;
}

export const TermsAcceptanceModal: React.FC<TermsAcceptanceModalProps> = ({
  isOpen,
  onAccept,
  onReject,
  userEmail,
  loading = false
}) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const handleTermsChange = (checked: boolean | 'indeterminate') => {
    setHasAcceptedTerms(checked === true);
  };

  const canAccept = hasAcceptedTerms;

  const handleAccept = () => {
    trackEvent('terms_acceptance_modal_accepted', {
      user_email: userEmail,
      accepted_terms: hasAcceptedTerms,
      timestamp: new Date().toISOString()
    });
    onAccept();
  };

  const handleReject = () => {
    trackEvent('terms_acceptance_modal_rejected', {
      user_email: userEmail,
      accepted_terms: hasAcceptedTerms,
      timestamp: new Date().toISOString()
    });
    onReject();
  };

  const trackLinkClick = (type: string) => {
    trackEvent('terms_modal_link_clicked', {
      link_type: type,
      user_email: userEmail
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-ghibli-cream rounded-lg shadow-lg border border-ghibli-sand/30 w-full max-w-md mx-auto">
              
              {/* Header */}
              <div className="p-6 pb-4 border-b border-ghibli-sand/20">
                <h2 className="text-lg font-semibold text-ghibli-wood mb-1">Aceitar Termos</h2>
                <p className="text-sm text-ghibli-earth">
                  Para continuar, aceite os nossos termos e política de privacidade.
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Terms Checkbox */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center mt-0.5">
                    <Checkbox
                      id="terms"
                      checked={hasAcceptedTerms}
                      onCheckedChange={handleTermsChange}
                      className="h-4 w-4 border-ghibli-stone"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="terms" className="text-sm text-ghibli-earth cursor-pointer leading-relaxed">
                      Aceito os{' '}
                      <Link 
                        href="/termos-servicos" 
                        target="_blank"
                        onClick={() => trackLinkClick('terms')}
                        className="text-ghibli-sky hover:text-ghibli-moss underline"
                      >
                        Termos de Serviço
                      </Link>
                      {' '}e a{' '}
                      <Link 
                        href="/politica-privacidade" 
                        target="_blank"
                        onClick={() => trackLinkClick('privacy')}
                        className="text-ghibli-sky hover:text-ghibli-moss underline"
                      >
                        Política de Privacidade
                      </Link>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={loading}
                  className="text-sm text-ghibli-earth border-ghibli-sand hover:bg-ghibli-sand/30"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={!canAccept || loading}
                  className="text-sm bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:bg-gray-400 px-6 border-2 border-black"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      A processar...
                    </div>
                  ) : (
                    'Aceitar'
                  )}
                </Button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 