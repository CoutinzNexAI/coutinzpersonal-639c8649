import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  XMarkIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import PicCoinAnimation from './PicCoinAnimation';

// =====================================================
// SUBMIT TO COMMUNITY MODAL
// Modal para submeter transformações privadas à comunidade
// =====================================================

interface PrivateTransformation {
  id: string;
  input_url: string;
  output_url: string;
  style_name?: string;
  created_at: string;
  public_title?: string;
  public_description?: string;
}

interface SubmitToCommunityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
}

const SubmitToCommunityModal: React.FC<SubmitToCommunityModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess
}) => {
  // ESTADO
  const [selectedTransformation, setSelectedTransformation] = useState<PrivateTransformation | null>(null);
  const [privateTransformations, setPrivateTransformations] = useState<PrivateTransformation[]>([]);
  const [publicTitle, setPublicTitle] = useState('');
  const [publicDescription, setPublicDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'select' | 'details' | 'success'>('select');
  const [showPicCoinAnimation, setShowPicCoinAnimation] = useState(false);
  const [picCoinMessage, setPicCoinMessage] = useState('');

  // FETCH PRIVATE TRANSFORMATIONS
  const fetchPrivateTransformations = async () => {
    try {
      setLoading(true);
      console.log('🔍 DEBUG - Fetching private transformations...');
      
      const response = await fetch('/api/community/get-my-private-transformations?page=1&limit=20');
      console.log('🔍 DEBUG - Response status:', response.status);
      console.log('🔍 DEBUG - Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🔍 DEBUG - Response data:', data);
      console.log('🔍 DEBUG - data.success:', data.success);
      console.log('🔍 DEBUG - data.transformations:', data.transformations);
      console.log('🔍 DEBUG - data.transformations.length:', data.transformations?.length);

      if (data.success) {
        console.log('🔍 DEBUG - Setting transformations:', data.transformations);
        setPrivateTransformations(data.transformations || []);
      } else {
        console.error('🔍 DEBUG - API returned error:', data.error);
      }
    } catch (error) {
      console.error('🔍 DEBUG - Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // SUBMIT FOR PUBLICATION
  const handleSubmit = async () => {
    if (!selectedTransformation) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/community/submit-for-publication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transformationId: selectedTransformation.id,
          public_title: publicTitle.trim() || undefined,
          public_description: publicDescription.trim() || undefined,
        })
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        
        // Show PicCoin animation if earned
        if (data.earned_piccoin) {
          setPicCoinMessage(data.message || 'Primeira publicação da semana! Ganhaste 2 PicCoins! 🪙🪙');
          setShowPicCoinAnimation(true);
        }
        
        onSuccess(data.message || 'Submetido com sucesso!');
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Error submitting transformation:', error);
      alert('Erro ao submeter transformação');
    } finally {
      setSubmitting(false);
    }
  };

  // RESET MODAL
  const resetModal = () => {
    setSelectedTransformation(null);
    setPublicTitle('');
    setPublicDescription('');
    setStep('select');
  };

  // EFFECTS
  useEffect(() => {
    if (isOpen && step === 'select') {
      fetchPrivateTransformations();
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  // FORMATAÇÃO
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal - Mobile Optimized */}
          <motion.div
            className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Close Button - Mobile Optimized */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-6 sm:right-6 z-10 p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg touch-manipulation"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-ghibli-wood" />
            </button>

            {/* STEP: SELECT TRANSFORMATION */}
            {step === 'select' && (
              <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-600/20 border border-amber-400/30 mb-3 sm:mb-4">
                    <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mr-2" />
                    <span className="text-ghibli-wood text-xs sm:text-sm font-medium">Publicar na Comunidade</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-ghibli font-bold text-ghibli-wood mb-2">
                    🎨 Partilha a Tua Arte
                  </h2>
                  <p className="text-ghibli-earth text-sm sm:text-base">
                    Escolhe uma das tuas transformações para submeter à comunidade
                  </p>
                </div>

                {/* Transformations Grid - Mobile Optimized */}
                <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-square bg-ghibli-sand/20 rounded-xl sm:rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : privateTransformations.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <PhotoIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-ghibli-sand" />
                      <p className="text-ghibli-earth text-base sm:text-lg mb-2">Nenhuma transformação privada encontrada</p>
                      <p className="text-ghibli-earth text-sm">Cria primeiro algumas transformações para as poderes partilhar!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {privateTransformations.map((transformation) => (
                        <motion.button
                          key={transformation.id}
                          onClick={() => {
                            setSelectedTransformation(transformation);
                            setPublicTitle(transformation.public_title || '');
                            setPublicDescription(transformation.public_description || '');
                            setStep('details');
                          }}
                          className={`relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all group touch-manipulation ${
                            selectedTransformation?.id === transformation.id
                              ? 'border-amber-400 shadow-lg'
                              : 'border-ghibli-sand/30 hover:border-amber-400/50'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Image
                            src={transformation.output_url}
                            alt="Transformação"
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="text-white text-left">
                              <p className="font-medium text-xs sm:text-sm truncate">{transformation.style_name}</p>
                              <p className="text-xs opacity-75">{formatTimeAgo(transformation.created_at)}</p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP: DETAILS */}
            {step === 'details' && selectedTransformation && (
              <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-ghibli font-bold text-ghibli-wood mb-2">
                    ✨ Adiciona Detalhes
                  </h2>
                  <p className="text-ghibli-earth text-sm sm:text-base">
                    Personaliza como a tua arte aparecerá na comunidade
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Preview */}
                  <div>
                    <h3 className="font-semibold text-ghibli-wood mb-3 sm:mb-4 text-sm sm:text-base">Pré-visualização</h3>
                    <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden border border-ghibli-sand/30">
                      <Image
                        src={selectedTransformation.output_url}
                        alt="Pré-visualização"
                        width={400}
                        height={400}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Form - Mobile Optimized */}
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-ghibli-wood mb-2">
                        Título Público (opcional)
                      </label>
                      <input
                        type="text"
                        value={publicTitle}
                        onChange={(e) => setPublicTitle(e.target.value)}
                        placeholder="Ex: A minha primeira arte Ghibli!"
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-ghibli-sand/20 border border-ghibli-sand/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm sm:text-base"
                        maxLength={100}
                      />
                      <p className="text-xs text-ghibli-earth mt-1">{publicTitle.length}/100 caracteres</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ghibli-wood mb-2">
                        Descrição (opcional)
                      </label>
                      <textarea
                        value={publicDescription}
                        onChange={(e) => setPublicDescription(e.target.value)}
                        placeholder="Conta a história por trás desta transformação..."
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-ghibli-sand/20 border border-ghibli-sand/30 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm sm:text-base"
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-xs text-ghibli-earth mt-1">{publicDescription.length}/500 caracteres</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
                      <h4 className="font-medium text-amber-800 mb-2 text-sm sm:text-base">🎉 Submissão com Recompensa</h4>
                      <p className="text-amber-700 text-xs sm:text-sm">
                        Ao submeter para aprovação, podes ganhar <strong>1 PicCoin</strong> como recompensa semanal!
                      </p>
                    </div>

                    {/* Actions - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                      <button
                        onClick={() => setStep('select')}
                        className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 border border-ghibli-sand/30 text-ghibli-wood rounded-xl hover:bg-ghibli-sand/20 transition-all text-sm sm:text-base touch-manipulation"
                        disabled={submitting}
                      >
                        Voltar
                      </button>
                      <motion.button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 ghibli-button inline-flex items-center justify-center px-4 py-2.5 sm:px-6 sm:py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
                        whileHover={{ scale: submitting ? 1 : 1.02 }}
                        whileTap={{ scale: submitting ? 1 : 0.98 }}
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            A submeter...
                          </>
                        ) : (
                          <>
                            <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Submeter para Aprovação
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: SUCCESS */}
            {step === 'success' && (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 300 }}
                  className="mb-6"
                >
                  <CheckCircleIcon className="w-20 h-20 mx-auto text-green-500 mb-4" />
                </motion.div>

                <h2 className="text-3xl font-ghibli font-bold text-ghibli-wood mb-4">
                  🎉 Submetido com Sucesso!
                </h2>
                <p className="text-ghibli-earth text-lg mb-6">
                  A tua transformação foi enviada para moderação.<br />
                  Receberás uma notificação quando for aprovada!
                </p>

                <motion.button
                  onClick={handleClose}
                  className="ghibli-button px-8 py-3 font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continuar a Explorar
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* PicCoin Animation */}
          <PicCoinAnimation
            isVisible={showPicCoinAnimation}
            onComplete={() => setShowPicCoinAnimation(false)}
            message={picCoinMessage}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubmitToCommunityModal; 