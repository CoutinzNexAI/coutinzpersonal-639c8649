import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PhotoIcon, 
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { GiftIcon } from '@heroicons/react/24/solid';

// =====================================================
// SUBMIT TO COMMUNITY MODAL
// Modal para submeter transformações à comunidade
// Design épico com formulário bonito
// =====================================================

interface PrivateTransformation {
  id: string;
  input_url: string;
  output_url: string;
  status: string;
  community_status: string;
  created_at: string;
  style_requested: string;
  public_title?: string;
  public_description?: string;
  incentive_granted_for_publication: boolean;
  style_name?: string;
}

interface SubmitToCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string, bonusGranted: boolean) => void;
}

const SubmitToCommunityModal: React.FC<SubmitToCommunityModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  // ESTADO
  const [step, setStep] = useState<'select' | 'details' | 'submitting' | 'success'>('select');
  const [transformations, setTransformations] = useState<PrivateTransformation[]>([]);
  const [selectedTransformation, setSelectedTransformation] = useState<PrivateTransformation | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [submitResult, setSubmitResult] = useState<{ message: string; bonusGranted: boolean } | null>(null);

  // ANIMATIONS
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 50,
      transition: { duration: 0.2 }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  // FETCH PRIVATE TRANSFORMATIONS
  const fetchPrivateTransformations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/community/get-my-private-transformations?limit=20');
      const data = await response.json();

      if (data.success) {
        setTransformations(data.transformations);
      } else {
        console.error('Failed to fetch transformations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching transformations:', error);
    } finally {
      setLoading(false);
    }
  };

  // SUBMIT TO COMMUNITY
  const handleSubmit = async () => {
    if (!selectedTransformation) return;

    // Validação
    const newErrors: { title?: string; description?: string } = {};
    
    if (formData.title.trim().length < 1) {
      newErrors.title = 'Título é obrigatório';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Título deve ter no máximo 100 caracteres';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Descrição deve ter no máximo 500 caracteres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setStep('submitting');
      setErrors({});

      const response = await fetch('/api/community/submit-for-publication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transformationId: selectedTransformation.id,
          public_title: formData.title.trim(),
          public_description: formData.description.trim() || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitResult({
          message: data.message,
          bonusGranted: data.bonusGranted
        });
        setStep('success');
        
        // Chamar callback de sucesso após 2 segundos
        setTimeout(() => {
          onSuccess?.(data.message, data.bonusGranted);
          handleClose();
        }, 2000);
      } else {
        throw new Error(data.error || 'Erro ao submeter');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setStep('details');
      setErrors({ title: error instanceof Error ? error.message : 'Erro inesperado' });
    }
  };

  // RESET & CLOSE
  const handleClose = () => {
    setStep('select');
    setSelectedTransformation(null);
    setFormData({ title: '', description: '' });
    setErrors({});
    setSubmitResult(null);
    onClose();
  };

  // EFFECTS
  useEffect(() => {
    if (isOpen && step === 'select') {
      fetchPrivateTransformations();
    }
  }, [isOpen, step]);

  // FORMAT TIME
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Submeter à Comunidade
                  </h2>
                  <p className="text-purple-200 text-sm">
                    Partilha a tua arte com a comunidade PicTuz
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-purple-200 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <AnimatePresence mode="wait">
                {/* STEP 1: SELECT TRANSFORMATION */}
                {step === 'select' && (
                  <motion.div
                    key="select"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Escolhe uma Transformação
                      </h3>
                      <p className="text-purple-200 text-sm">
                        Seleciona uma das tuas transformações privadas para submeter à comunidade
                      </p>
                    </div>

                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="bg-white/5 rounded-xl aspect-square animate-pulse" />
                        ))}
                      </div>
                    ) : transformations.length === 0 ? (
                      <div className="text-center py-12">
                        <PhotoIcon className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Sem Transformações Disponíveis
                        </h4>
                        <p className="text-purple-200 text-sm">
                          Cria primeiro algumas transformações para poderes partilhá-las!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {transformations.map((transformation) => (
                          <motion.div
                            key={transformation.id}
                            className={`group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                              selectedTransformation?.id === transformation.id
                                ? 'border-purple-400 ring-4 ring-purple-400/20'
                                : 'border-white/10 hover:border-purple-400/50'
                            }`}
                            onClick={() => setSelectedTransformation(transformation)}
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Image */}
                            <div className="relative aspect-square">
                              <img
                                src={transformation.output_url}
                                alt="Transformação"
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              
                              {/* Selection Indicator */}
                              {selectedTransformation?.id === transformation.id && (
                                <motion.div
                                  className="absolute top-2 right-2 p-2 bg-purple-500 rounded-full"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500 }}
                                >
                                  <CheckCircleIcon className="w-5 h-5 text-white" />
                                </motion.div>
                              )}

                              {/* Info */}
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <div className="flex items-center justify-between text-white text-xs">
                                  <span className="bg-black/50 px-2 py-1 rounded">
                                    {transformation.style_name}
                                  </span>
                                  <span className="bg-black/50 px-2 py-1 rounded">
                                    {formatTimeAgo(transformation.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Next Button */}
                    {selectedTransformation && (
                      <motion.div 
                        className="flex justify-end mt-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <motion.button
                          onClick={() => setStep('details')}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-purple-500/25 transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Continuar
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* STEP 2: ADD DETAILS */}
                {step === 'details' && selectedTransformation && (
                  <motion.div
                    key="details"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Preview */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Preview da Transformação
                        </h3>
                        <div className="relative rounded-xl overflow-hidden border border-white/20">
                          <img
                            src={selectedTransformation.output_url}
                            alt="Preview"
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
                              <div className="text-white text-sm">
                                <span className="font-medium">{selectedTransformation.style_name}</span>
                                <span className="text-purple-200 ml-2">
                                  • {formatTimeAgo(selectedTransformation.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Form */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Detalhes da Publicação
                        </h3>

                        {/* Incentive Notice */}
                        {!selectedTransformation.incentive_granted_for_publication && (
                          <motion.div
                            className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-4 mb-6"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="flex items-center space-x-3">
                              <GiftIcon className="w-6 h-6 text-green-400" />
                              <div>
                                <h4 className="font-semibold text-green-200">Bónus Disponível!</h4>
                                <p className="text-green-300 text-sm">
                                  Ganha +1 PicCoin por submeter esta transformação à comunidade
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Title Field */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-purple-200 mb-2">
                            Título *
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Dá um título épico à tua criação..."
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            maxLength={100}
                          />
                          <div className="flex justify-between mt-1">
                            {errors.title && (
                              <span className="text-red-400 text-xs">{errors.title}</span>
                            )}
                            <span className="text-purple-300 text-xs ml-auto">
                              {formData.title.length}/100
                            </span>
                          </div>
                        </div>

                        {/* Description Field */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-purple-200 mb-2">
                            Descrição (opcional)
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Conta-nos mais sobre a tua criação..."
                            rows={4}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                            maxLength={500}
                          />
                          <div className="flex justify-between mt-1">
                            {errors.description && (
                              <span className="text-red-400 text-xs">{errors.description}</span>
                            )}
                            <span className="text-purple-300 text-xs ml-auto">
                              {formData.description.length}/500
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <motion.button
                            onClick={() => setStep('select')}
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-purple-200 hover:text-white hover:bg-white/20 transition-all font-medium"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Voltar
                          </motion.button>
                          <motion.button
                            onClick={handleSubmit}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-purple-500/25 transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Submeter à Comunidade
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: SUBMITTING */}
                {step === 'submitting' && (
                  <motion.div
                    key="submitting"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="text-center py-12"
                  >
                    <motion.div
                      className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-6"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      A Submeter...
                    </h3>
                    <p className="text-purple-200">
                      A tua transformação está a ser submetida para aprovação
                    </p>
                  </motion.div>
                )}

                {/* STEP 4: SUCCESS */}
                {step === 'success' && submitResult && (
                  <motion.div
                    key="success"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="text-center py-12"
                  >
                    <motion.div
                      className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                    >
                      <CheckCircleIcon className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <motion.h3 
                      className="text-2xl font-bold text-white mb-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      {submitResult.bonusGranted ? '🎉 Submetido com Sucesso!' : '✅ Submetido!'}
                    </motion.h3>
                    
                    <motion.p 
                      className="text-purple-200 mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      {submitResult.message}
                    </motion.p>

                    {submitResult.bonusGranted && (
                      <motion.div
                        className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-4 max-w-md mx-auto"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.8, type: "spring" }}
                      >
                        <div className="flex items-center justify-center space-x-2 text-yellow-200">
                          <GiftIcon className="w-5 h-5" />
                          <span className="font-semibold">+1 PicCoin Ganho!</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubmitToCommunityModal; 