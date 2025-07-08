import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  XMarkIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'details' | 'success'>('select');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
        })
      });

      const data = await response.json();

      if (data.success) {
        setStep('success');
        onSuccess(data.message || 'Publicado na comunidade com sucesso!');
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
    setStep('select');
    setIsKeyboardVisible(false);
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

  // Enhanced keyboard handling for mobile
  useEffect(() => {
    const handleResize = () => {
      // Detect keyboard on mobile by checking if viewport height significantly decreased
      const vh = window.visualViewport?.height || window.innerHeight;
      const isKeyboard = vh < window.screen.height * 0.75;
      setIsKeyboardVisible(isKeyboard);
    };

    const handleFocus = () => {
      setTimeout(() => {
        const vh = window.visualViewport?.height || window.innerHeight;
        const isKeyboard = vh < window.screen.height * 0.75;
        setIsKeyboardVisible(isKeyboard);
      }, 300);
    };
    
    const handleBlur = () => {
      setTimeout(() => {
        setIsKeyboardVisible(false);
      }, 300);
    };

    // Visual Viewport API support
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    const titleInput = titleInputRef.current;
    
    if (titleInput) {
      titleInput.addEventListener('focus', handleFocus);
      titleInput.addEventListener('blur', handleBlur);
      
      return () => {
        titleInput.removeEventListener('focus', handleFocus);
        titleInput.removeEventListener('blur', handleBlur);
        
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleResize);
        } else {
          window.removeEventListener('resize', handleResize);
        }
      };
    }
  }, [step]);

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

  // Mobile detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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

          {/* Modal - Enhanced mobile keyboard handling */}
          <motion.div
            className={`relative w-full max-w-4xl bg-white shadow-2xl overflow-hidden transition-all duration-300 ${
              isKeyboardVisible 
                ? 'fixed inset-0 rounded-none z-[60]' 
                : 'max-h-[95vh] sm:max-h-[90vh] rounded-2xl sm:rounded-3xl'
            }`}
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
                            // Go to preview step on mobile, details on desktop
                            setStep(isMobile ? 'preview' : 'details');
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

            {/* STEP: PREVIEW (Mobile Only) */}
            {step === 'preview' && selectedTransformation && (
              <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-600/20 border border-amber-400/30 mb-3">
                    <SparklesIcon className="w-4 h-4 text-amber-600 mr-2" />
                    <span className="text-ghibli-wood text-xs font-medium">Pré-visualização</span>
                  </div>
                  <h2 className="text-xl font-ghibli font-bold text-ghibli-wood mb-2">
                    🎨 A Tua Arte
                  </h2>
                  <p className="text-ghibli-earth text-sm">
                    Confirma se é esta a arte que queres partilhar
                  </p>
                </div>

                {/* Large Preview */}
                <div className="flex justify-center mb-6">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden border border-ghibli-sand/30 shadow-lg"
                  >
                    <Image
                      src={selectedTransformation.output_url}
                      alt="Arte selecionada"
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>

                {/* Style Info */}
                <div className="text-center mb-8">
                  <p className="text-ghibli-wood font-medium text-base">
                    {selectedTransformation.style_name}
                  </p>
                  <p className="text-ghibli-earth text-sm">
                    Criado {formatTimeAgo(selectedTransformation.created_at)}
                  </p>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                  <h4 className="font-medium text-green-800 mb-2 text-sm">🎉 Publicação Direta na Comunidade</h4>
                  <p className="text-green-700 text-xs">
                    A tua arte será <strong>publicada imediatamente</strong> na comunidade para todos verem!
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('select')}
                    className="flex-1 px-4 py-3 border border-ghibli-sand/30 text-ghibli-wood rounded-xl hover:bg-ghibli-sand/20 transition-all text-sm touch-manipulation inline-flex items-center justify-center"
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Voltar
                  </button>
                  <button
                    onClick={() => setStep('details')}
                    className="flex-1 ghibli-button px-4 py-3 font-semibold text-sm touch-manipulation inline-flex items-center justify-center"
                  >
                    Continuar
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP: DETAILS */}
            {step === 'details' && selectedTransformation && (
              <div className={`${isKeyboardVisible ? 'h-screen' : 'max-h-[95vh] sm:max-h-[90vh]'} overflow-y-auto p-4 sm:p-6 lg:p-8`}>
                {/* Header - Simplified when keyboard visible */}
                <div className={`text-center ${isKeyboardVisible ? 'mb-4' : 'mb-6 sm:mb-8'}`}>
                  <h2 className="text-xl sm:text-2xl font-ghibli font-bold text-ghibli-wood mb-2">
                    ✨ Adiciona Detalhes
                  </h2>
                  {!isKeyboardVisible && (
                    <p className="text-ghibli-earth text-sm sm:text-base">
                      Personaliza como a tua arte aparecerá na comunidade
                    </p>
                  )}
                </div>

                <div className={`grid gap-6 sm:gap-8 ${isKeyboardVisible || isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
                  {/* Preview - Hide on mobile when keyboard visible or in mobile details step */}
                  {!isKeyboardVisible && !isMobile && (
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
                  )}

                  {/* Form - Mobile optimized */}
                  <div className={`space-y-4 sm:space-y-6 ${isKeyboardVisible ? 'pt-4' : ''}`}>
                    {/* Small preview when keyboard visible on mobile */}
                    {isKeyboardVisible && (
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-ghibli-sand/30">
                          <Image
                            src={selectedTransformation.output_url}
                            alt="Preview"
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-ghibli-wood mb-2">
                        Título Público (opcional)
                      </label>
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={publicTitle}
                        onChange={(e) => {
                          if (e.target.value.length <= 75) {
                            setPublicTitle(e.target.value);
                          }
                        }}
                        placeholder="Ex: A minha primeira arte Ghibli!"
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-ghibli-sand/20 border border-ghibli-sand/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm sm:text-base"
                        maxLength={75}
                      />
                      <p className="text-xs text-ghibli-earth mt-1">{publicTitle.length}/75 caracteres</p>
                    </div>

                    {!isKeyboardVisible && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-4">
                        <h4 className="font-medium text-green-800 mb-2 text-sm sm:text-base">🎉 Publicação Direta na Comunidade</h4>
                        <p className="text-green-700 text-xs sm:text-sm">
                          A tua arte será <strong>publicada imediatamente</strong> na comunidade para todos verem!
                        </p>
                      </div>
                    )}

                    {/* Actions - Simplified when keyboard visible */}
                    <div className={`flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 ${isKeyboardVisible ? 'pt-4' : 'pt-4'}`}>
                      <button
                        onClick={() => setStep(isMobile ? 'preview' : 'select')}
                        className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 border border-ghibli-sand/30 text-ghibli-wood rounded-xl hover:bg-ghibli-sand/20 transition-all text-sm sm:text-base touch-manipulation inline-flex items-center justify-center"
                        disabled={submitting}
                      >
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
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
                            A publicar...
                          </>
                        ) : (
                          <>
                            <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Publicar na Comunidade
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
              <div className="p-6 sm:p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 300 }}
                  className="mb-6"
                >
                  <div className="relative">
                    <CheckCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-green-500 mb-4" />
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring", damping: 15, stiffness: 300 }}
                      className="absolute -top-2 -right-2 text-2xl"
                    >
                      🎉
                    </motion.div>
                  </div>
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl sm:text-3xl font-ghibli font-bold text-ghibli-wood mb-4"
                >
                  🎨 Publicado na Comunidade!
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-ghibli-earth text-base sm:text-lg mb-6"
                >
                  A tua arte está agora disponível para toda a comunidade ver!<br />
                  <span className="text-green-600 font-medium">✨ Partilha e inspira outros criadores!</span>
                </motion.p>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={handleClose}
                  className="ghibli-button px-6 py-3 sm:px-8 sm:py-3 font-semibold text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explorar Comunidade
                </motion.button>
              </div>
            )}
          </motion.div>


        </div>
      )}
    </AnimatePresence>
  );
};

export default SubmitToCommunityModal; 