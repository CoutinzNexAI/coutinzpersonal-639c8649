import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { PlusIcon } from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCommunity, CommunityTransformation } from '@/hooks/useCommunity';
import CommunityTransformationCard from '@/components/community/CommunityTransformationCard';
import SubmitToCommunityModal from '@/components/community/SubmitToCommunityModal';
import { PaginationControls } from '@/components/community/PaginationControls';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import { trackEvent } from '@/lib/posthog';

// =====================================================
// PICTUZ COMMUNITY - GALERIA SIMPLES
// Versão simplificada apenas para ver e dar like
// =====================================================

type CommunityPageProps = Record<string, never>;

const CommunityPage: React.FC<CommunityPageProps> = () => {
  // HOOKS
  const { userInfo, signInWithGoogle } = useAuth();
  const {
    transformations,
    loadingTransformations,
    pagination,
    toggleLike,
    fetchTransformations,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    isLiked,
    isTogglingLike
  } = useCommunity();

  // ESTADO LOCAL SIMPLIFICADO
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  
  // ANIMATIONS
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  // 🔥 TRACKING: Community page visit
  useEffect(() => {
    trackEvent('community_page_visit', {
      user_id: userInfo?.id || null,
      is_authenticated: !!userInfo,
      referrer: document.referrer || 'direct',
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }, [userInfo]);

  // HANDLERS SIMPLIFICADOS
  const handleLike = async (transformationId: string) => {
    if (!userInfo) {
      toast.info("Login Necessário", {
        description: "Para dar like nas transformações, precisa de fazer login com a sua conta Google.",
        duration: 4000
      });
      
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error('Error during login:', error);
        toast.error("Erro no Login", {
          description: "Não foi possível fazer login. Tente novamente."
        });
      }
      return;
    }

    try {
      await toggleLike(transformationId);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // FUNÇÕES WRAPPER PARA PAGINAÇÃO
  const defaultFilters = { sort: 'recent' as const, timeframe: 'all' as const, search: '' };
  
  const handleGoToPage = (page: number) => {
    goToPage(page, defaultFilters);
  };

  const handleGoToFirstPage = () => {
    goToFirstPage(defaultFilters);
  };

  const handleGoToLastPage = () => {
    goToLastPage(defaultFilters);
  };

  const handleGoToNextPage = () => {
    goToNextPage(defaultFilters);
  };

  const handleGoToPreviousPage = () => {
    goToPreviousPage(defaultFilters);
  };

  const handlePublishSuccess = (message: string) => {
    console.log("✅ Publicação submetida:", message);
  };

  const handlePublishClick = () => {
    if (!userInfo) {
      toast.info("Login Necessário", {
        description: "Para publicar na comunidade, precisa de fazer login com a sua conta Google.",
        duration: 4000
      });
      
      try {
        signInWithGoogle();
      } catch (error) {
        console.error('Error during login:', error);
        toast.error("Erro no Login", {
          description: "Não foi possível fazer login. Tente novamente."
        });
      }
      return;
    }

    setIsPublishModalOpen(true);
  };

  // FETCH INICIAL
  useEffect(() => {
    fetchTransformations({ sort: 'recent', timeframe: 'all', search: '' });
  }, [fetchTransformations]);

  return (
    <>
      <Head>
        <title>Galeria da Comunidade | PicTuz</title>
        <meta name="description" content="Descobre transformações incríveis criadas pela nossa comunidade mágica" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand relative overflow-hidden">
        <Header />
        
        {/* BACKGROUND DECORATIONS */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-400/10 to-yellow-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-400/10 to-emerald-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-400/5 to-purple-600/5 rounded-full blur-3xl" />
        </div>

        <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          {/* HEADER SIMPLIFICADO */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 lg:mb-12"
          >

            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-ghibli-wood to-amber-600 bg-clip-text text-transparent mb-4">
              Galeria da <span className="text-amber-600">Comunidade</span>
            </h1>
            
            <p className="text-lg text-ghibli-earth max-w-2xl mx-auto leading-relaxed">
              Descobre transformações incríveis criadas pela nossa <span className="font-semibold text-amber-700">comunidade mágica</span>
            </p>

            {/* BOTÃO PUBLICAR */}
            <motion.button
              onClick={handlePublishClick}
              className="mt-8 inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Publicar Arte
            </motion.button>
          </motion.div>

          {/* GALERIA */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-7xl mx-auto"
          >
            {loadingTransformations ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-white/50 rounded-2xl animate-pulse border border-ghibli-sand/30"
                  />
                ))}
              </div>
            ) : transformations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-ghibli-sand/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl opacity-50">🎨</span>
                </div>
                <h3 className="text-xl font-semibold text-ghibli-wood mb-3">
                  Ainda não há transformações
                </h3>
                <p className="text-ghibli-earth mb-6">
                  Seja o primeiro a partilhar a sua arte com a comunidade!
                </p>
                <motion.button
                  onClick={handlePublishClick}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Publicar a Primeira Arte
                </motion.button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                  {transformations.map((transformation) => (
                    <motion.div key={transformation.id} variants={itemVariants}>
                      <CommunityTransformationCard
                        transformation={transformation}
                        isLiked={isLiked(transformation.id)}
                        isTogglingLike={isTogglingLike(transformation.id)}
                        onLike={handleLike}
                        // Removido onView - não há mais modal
                      />
                    </motion.div>
                  ))}
                </div>

                {/* PAGINAÇÃO */}
                {pagination.total_pages > 1 && (
                  <PaginationControls
                    currentPage={pagination.page}
                    totalPages={pagination.total_pages}
                    hasNextPage={pagination.has_next_page}
                    hasPrevPage={pagination.has_prev_page}
                    isLoading={loadingTransformations}
                    onGoToPage={handleGoToPage}
                    onGoToFirstPage={handleGoToFirstPage}
                    onGoToLastPage={handleGoToLastPage}
                    onGoToNextPage={handleGoToNextPage}
                    onGoToPreviousPage={handleGoToPreviousPage}
                  />
                )}
              </>
            )}
          </motion.div>
        </main>

        <Footer />
      </div>

      {/* MODAL DE PUBLICAÇÃO */}
      <SubmitToCommunityModal
        isOpen={isPublishModalOpen}
        onOpenChange={setIsPublishModalOpen}
        onSuccess={handlePublishSuccess}
      />
    </>
  );
};

export default CommunityPage; 