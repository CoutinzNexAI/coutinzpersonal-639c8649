import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Shield, AlertCircle } from 'lucide-react';
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
  const [agreedToAnalytics, setAgreedToAnalytics] = useState(false);

  const handleTermsChange = (checked: boolean | 'indeterminate') => {
    setHasReadTerms(checked === true);
  };

  const handlePrivacyChange = (checked: boolean | 'indeterminate') => {
    setHasReadPrivacy(checked === true);
  };

  const handleAnalyticsChange = (checked: boolean | 'indeterminate') => {
    setAgreedToAnalytics(checked === true);
  };

  const canAccept = hasReadTerms && hasReadPrivacy && agreedToAnalytics;

  const handleAccept = () => {
    trackEvent('terms_acceptance_modal_accepted', {
      user_email: userEmail,
      read_terms: hasReadTerms,
      read_privacy: hasReadPrivacy,
      agreed_analytics: agreedToAnalytics,
      timestamp: new Date().toISOString()
    });
    onAccept();
  };

  const handleReject = () => {
    trackEvent('terms_acceptance_modal_rejected', {
      user_email: userEmail,
      read_terms: hasReadTerms,
      read_privacy: hasReadPrivacy,
      agreed_analytics: agreedToAnalytics,
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            style={{ backdropFilter: 'blur(4px)' }}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-auto overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-ghibli-sky to-ghibli-forest p-6 text-white relative">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-6 w-6" />
                  <h2 className="text-xl font-bold">Bem-vindo ao PicTuz!</h2>
                </div>
                <p className="text-white/90 text-sm">
                  Para continuar, precisamos do seu consentimento para os nossos termos e analytics.
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                
                {/* Terms Checkbox */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={hasReadTerms}
                    onCheckedChange={handleTermsChange}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="terms" className="text-sm font-medium text-gray-900 cursor-pointer">
                      Li e aceito os{' '}
                      <Link 
                        href="/termos-servicos" 
                        target="_blank"
                        onClick={() => trackLinkClick('terms')}
                        className="text-ghibli-sky hover:underline font-semibold"
                      >
                        Termos e Condições de Serviço
                      </Link>
                    </label>
                  </div>
                </div>

                {/* Privacy Checkbox */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="privacy"
                    checked={hasReadPrivacy}
                    onCheckedChange={handlePrivacyChange}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="privacy" className="text-sm font-medium text-gray-900 cursor-pointer">
                      Li e aceito a{' '}
                      <Link 
                        href="/politica-privacidade" 
                        target="_blank"
                        onClick={() => trackLinkClick('privacy')}
                        className="text-ghibli-sky hover:underline font-semibold"
                      >
                        Política de Privacidade
                      </Link>
                    </label>
                  </div>
                </div>

                {/* Analytics Consent */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="analytics"
                      checked={agreedToAnalytics}
                      onCheckedChange={handleAnalyticsChange}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="analytics" className="text-sm font-medium text-gray-900 cursor-pointer flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-amber-900">
                            Consentimento para Analytics & Session Recordings
                          </div>
                          <div className="text-xs text-amber-800 mt-1">
                            Autorizo a gravação das minhas sessões (movimentos do rato, cliques) e recolha de dados comportamentais para otimização da plataforma. 
                            <span className="font-medium"> Dados sensíveis são automaticamente censurados.</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800">
                      <span className="font-medium">Transparência total:</span> Pode desativar analytics a qualquer momento nas configurações ou contactando-nos. 
                      Só gravamos para melhorar a sua experiência!
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Recusar & Sair
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={!canAccept || loading}
                  className="flex-1 bg-gradient-to-r from-ghibli-sky to-ghibli-forest hover:from-ghibli-sky/90 hover:to-ghibli-forest/90 text-white disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </div>
                  ) : (
                    'Aceitar & Continuar'
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