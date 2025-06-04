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
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          >
            <div className="bg-ghibli-paper rounded-xl sm:rounded-2xl shadow-2xl border-2 border-ghibli-sand w-full max-w-sm sm:max-w-lg mx-auto overflow-hidden max-h-[95vh] flex flex-col">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-ghibli-sky via-ghibli-forest to-ghibli-wood p-4 sm:p-6 text-white">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="flex items-center gap-3 mb-2"
                >
                  <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-ghibli font-bold">Bem-vindo ao PicTuz! ✨</h2>
                    <p className="text-white/90 text-xs sm:text-sm font-medium">Transformação de imagens</p>
                  </div>
                </motion.div>
                <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                  Aceite os termos para começar.
                </p>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-gradient-to-b from-ghibli-paper to-ghibli-cream">
                  
                  <div className="text-center mb-4">
                    <p className="text-ghibli-wood font-medium text-base sm:text-lg mb-1">
                      🎨 Pronto para transformar fotos?
                    </p>
                    <p className="text-ghibli-earth text-xs sm:text-sm">
                      Aceite os documentos para continuar
                    </p>
                  </div>

                  {/* Terms Checkbox */}
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="flex items-start gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/60 border border-ghibli-sand/50 hover:bg-white/80 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center mt-0.5">
                      <Checkbox
                        id="terms"
                        checked={hasReadTerms}
                        onCheckedChange={handleTermsChange}
                        className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-ghibli-wood rounded data-[state=checked]:bg-ghibli-forest data-[state=checked]:border-ghibli-forest"
                        style={{
                          backgroundColor: hasReadTerms ? '#10b981' : 'transparent',
                          borderColor: hasReadTerms ? '#10b981' : '#8B4513'
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="terms" className="text-xs sm:text-sm font-medium text-ghibli-wood cursor-pointer leading-relaxed">
                        Li e aceito os{' '}
                        <Link 
                          href="/termos-servicos" 
                          target="_blank"
                          onClick={() => trackLinkClick('terms')}
                          className="text-ghibli-sky hover:text-ghibli-forest font-semibold underline decoration-1 underline-offset-1 hover:decoration-ghibli-forest transition-colors"
                        >
                          Termos de Serviço
                        </Link>
                      </label>
                    </div>
                  </motion.div>

                  {/* Privacy Checkbox */}
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="flex items-start gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/60 border border-ghibli-sand/50 hover:bg-white/80 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center mt-0.5">
                      <Checkbox
                        id="privacy"
                        checked={hasReadPrivacy}
                        onCheckedChange={handlePrivacyChange}
                        className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-ghibli-wood rounded data-[state=checked]:bg-ghibli-forest data-[state=checked]:border-ghibli-forest"
                        style={{
                          backgroundColor: hasReadPrivacy ? '#10b981' : 'transparent',
                          borderColor: hasReadPrivacy ? '#10b981' : '#8B4513'
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="privacy" className="text-xs sm:text-sm font-medium text-ghibli-wood cursor-pointer leading-relaxed">
                        Li e aceito a{' '}
                        <Link 
                          href="/politica-privacidade" 
                          target="_blank"
                          onClick={() => trackLinkClick('privacy')}
                          className="text-ghibli-sky hover:text-ghibli-forest font-semibold underline decoration-1 underline-offset-1 hover:decoration-ghibli-forest transition-colors"
                        >
                          Política de Privacidade
                        </Link>
                      </label>
                    </div>
                  </motion.div>

                  {/* Info Note */}
                  <div className="bg-ghibli-forest/10 border border-ghibli-forest/20 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-ghibli-forest mt-0.5 flex-shrink-0" />
                      <div className="text-xs sm:text-sm text-ghibli-wood">
                        <span className="font-medium">Nota:</span> Inclui informações sobre cookies e analytics.
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 pt-0 pb-4 sm:pb-6 flex gap-3 sm:gap-4 bg-ghibli-cream">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 text-xs sm:text-sm text-ghibli-wood border-ghibli-sand hover:bg-ghibli-sand/30 font-medium h-9 sm:h-10"
                >
                  Não aceito
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={!canAccept || loading}
                  className="flex-1 text-xs sm:text-sm bg-gradient-to-r from-ghibli-sky to-ghibli-forest hover:from-ghibli-sky/90 hover:to-ghibli-forest/90 text-white font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 h-9 sm:h-10"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      A guardar...
                    </div>
                  ) : (
                    '✨ Aceitar'
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