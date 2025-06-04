import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Shield } from 'lucide-react';
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
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);

  const handleTermsChange = (checked: boolean | 'indeterminate') => {
    setHasReadTerms(checked === true);
  };

  const handlePrivacyChange = (checked: boolean | 'indeterminate') => {
    setHasReadPrivacy(checked === true);
  };

  const canAccept = hasReadTerms && hasReadPrivacy;

  const handleAccept = () => {
    trackEvent('terms_acceptance_modal_accepted', {
      user_email: userEmail,
      read_terms: hasReadTerms,
      read_privacy: hasReadPrivacy,
      timestamp: new Date().toISOString()
    });
    onAccept();
  };

  const handleReject = () => {
    trackEvent('terms_acceptance_modal_rejected', {
      user_email: userEmail,
      read_terms: hasReadTerms,
      read_privacy: hasReadPrivacy,
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            style={{ backdropFilter: 'blur(2px)' }}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-ghibli-paper rounded-2xl shadow-2xl border-2 border-ghibli-sand w-full max-w-lg mx-auto overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-ghibli-sky via-ghibli-forest to-ghibli-wood p-8 text-white relative">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="flex items-center gap-4 mb-3"
                >
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                    <Shield className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-ghibli font-bold">Bem-vindo ao PicTuz! ✨</h2>
                    <p className="text-white/90 text-sm font-medium">A magia da transformação de imagens</p>
                  </div>
                </motion.div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Para começar a criar arte incrível, precisamos que aceite os nossos termos legais.
                </p>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6 bg-gradient-to-b from-ghibli-paper to-ghibli-cream">
                
                <div className="text-center mb-6">
                  <p className="text-ghibli-wood font-medium text-lg mb-2">
                    🎨 Pronto para transformar as suas fotos?
                  </p>
                  <p className="text-ghibli-earth text-sm">
                    Aceite os nossos documentos legais para continuar
                  </p>
                </div>

                {/* Terms Checkbox */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/60 border border-ghibli-sand/50 hover:bg-white/80 transition-all duration-200"
                >
                  <Checkbox
                    id="terms"
                    checked={hasReadTerms}
                    onCheckedChange={handleTermsChange}
                    className="mt-1 border-ghibli-wood data-[state=checked]:bg-ghibli-forest"
                  />
                  <div className="flex-1">
                    <label htmlFor="terms" className="text-sm font-medium text-ghibli-wood cursor-pointer leading-relaxed">
                      Li e aceito os{' '}
                      <Link 
                        href="/termos-servicos" 
                        target="_blank"
                        onClick={() => trackLinkClick('terms')}
                        className="text-ghibli-sky hover:text-ghibli-forest font-semibold underline decoration-2 underline-offset-2 hover:decoration-ghibli-forest transition-colors"
                      >
                        Termos e Condições de Serviço
                      </Link>
                    </label>
                  </div>
                </motion.div>

                {/* Privacy Checkbox */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/60 border border-ghibli-sand/50 hover:bg-white/80 transition-all duration-200"
                >
                  <Checkbox
                    id="privacy"
                    checked={hasReadPrivacy}
                    onCheckedChange={handlePrivacyChange}
                    className="mt-1 border-ghibli-wood data-[state=checked]:bg-ghibli-forest"
                  />
                  <div className="flex-1">
                    <label htmlFor="privacy" className="text-sm font-medium text-ghibli-wood cursor-pointer leading-relaxed">
                      Li e aceito a{' '}
                      <Link 
                        href="/politica-privacidade" 
                        target="_blank"
                        onClick={() => trackLinkClick('privacy')}
                        className="text-ghibli-sky hover:text-ghibli-forest font-semibold underline decoration-2 underline-offset-2 hover:decoration-ghibli-forest transition-colors"
                      >
                        Política de Privacidade
                      </Link>
                    </label>
                  </div>
                </motion.div>

                {/* Info Note */}
                <div className="bg-ghibli-forest/10 border border-ghibli-forest/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-ghibli-forest mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-ghibli-wood">
                      <span className="font-medium">Nota:</span> Os documentos incluem informações sobre como utilizamos cookies e melhoramos a plataforma através de analytics.
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 pt-0 pb-8 flex gap-4 bg-ghibli-cream">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 text-ghibli-wood border-ghibli-sand hover:bg-ghibli-sand/30 font-medium"
                >
                  Não aceito
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={!canAccept || loading}
                  className="flex-1 bg-gradient-to-r from-ghibli-sky to-ghibli-forest hover:from-ghibli-sky/90 hover:to-ghibli-forest/90 text-white font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      A guardar...
                    </div>
                  ) : (
                    '✨ Aceitar & Começar'
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