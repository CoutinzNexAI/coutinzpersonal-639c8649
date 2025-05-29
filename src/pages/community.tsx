import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Head from 'next/head';
import { 
  SparklesIcon,
  FireIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCommunity, CommunityTransformation } from '@/hooks/useCommunity';
import CommunityTransformationCard from '@/components/community/CommunityTransformationCard';
import ViewTransformationModal from '@/components/community/ViewTransformationModal';
import SubmitToCommunityModal from '@/components/community/SubmitToCommunityModal';

// =====================================================
// PICTUZ COMMUNITY - GALERIA PRINCIPAL
// Design épico no tema Ghibli consistente com o site
// =====================================================

// Changed to remove empty interface error
type CommunityPageProps = Record<string, never>;

const CommunityPage: React.FC<CommunityPageProps> = () => {
  // HOOKS
  const {
    transformations,
    loadingTransformations,
    pagination,
    toggleLike,
    fetchTransformations,
    loadMoreTransformations,
    fetchComments,
    addComment,
    isLiked,
    isTogglingLike,
    getComments,
    isLoadingComments,
    isSubmittingComment
  } = useCommunity();

  // ESTADO LOCAL
  const [filters, setFilters] = useState({
    sort: 'recent' as 'recent' | 'popular' | 'trending',
    timeframe: 'all' as 'day' | 'week' | 'month' | 'all',
    search: ''
  });
  const [selectedTransformation, setSelectedTransformation] = useState<CommunityTransformation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  
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

  // HANDLERS
  const handleViewTransformation = (transformation: CommunityTransformation) => {
    setSelectedTransformation(transformation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransformation(null);
  };

  const handleLike = async (transformationId: string) => {
    try {
      await toggleLike(transformationId);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async (transformationId: string, content: string) => {
    try {
      const result = await addComment(transformationId, content);
      return result;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput.trim() }));
  };

  const handlePublishSuccess = (message: string) => {
    console.log("✅ Publicação submetida:", message);
    // Success is already handled by the modal's PicCoin animation
  };

  // EFFECTS
  useEffect(() => {
    fetchTransformations(filters, true);
  }, [filters, fetchTransformations]);

  return (
    <>
      <Head>
        <title>Comunidade PicTuz | Descobre Arte AI Incrível</title>
        <meta name="description" content="Explora a galeria da comunidade PicTuz e descobre transformações de arte AI incríveis criadas pelos nossos utilizadores." />
        <meta property="og:title" content="Comunidade PicTuz | Galeria de Arte AI" />
        <meta property="og:description" content="Descobre, gosta e comenta transformações de arte AI incríveis na comunidade PicTuz" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="min-h-screen bg-ghibli-cream flex flex-col">
        {/* Header */}
        <Header />

        {/* Decorative Elements */}
        <div className="leaf-decoration top-20 left-10 text-3xl">🍃</div>
        <div className="leaf-decoration bottom-28 right-16 text-2xl">🍂</div>
        <div className="star-decoration top-40 right-28 text-xl">✨</div>
        <div className="star-decoration bottom-16 left-20 text-2xl">⭐</div>

        {/* Main Content */}
        <main className="flex-grow pt-20 sm:pt-24 pb-8 sm:pb-16">
          <div className="container mx-auto px-4">
            {/* HERO SECTION - Mobile Optimized */}
            <motion.div 
              className="text-center mb-8 sm:mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-600/20 border border-amber-400/30 mb-4 sm:mb-6"
              >
                <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mr-2" />
                <span className="text-ghibli-wood text-xs sm:text-sm font-medium">Comunidade PicTuz</span>
              </motion.div>

              <motion.h1 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-ghibli font-bold text-ghibli-wood mb-3 sm:mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                🎨 Galeria da{' '}
                <span className="bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                  Comunidade
                </span>
              </motion.h1>

              <motion.p 
                className="text-base sm:text-lg md:text-xl text-ghibli-earth mb-4 sm:mb-6 max-w-2xl mx-auto px-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                Descobre transformações incríveis criadas pela nossa{' '}
                <span className="font-semibold text-ghibli-wood">comunidade mágica</span>
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4"
              >
                <Link href="/">
                  <motion.button
                    className="ghibli-button inline-flex items-center px-4 py-2.5 sm:px-6 sm:py-3 font-semibold text-sm sm:text-base w-full sm:w-auto"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Criar Nova Transformação
                  </motion.button>
                </Link>

                <motion.button
                  onClick={() => setIsPublishModalOpen(true)}
                  className="inline-flex items-center px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base w-full sm:w-auto"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Publicar a Minha Arte
                </motion.button>
              </motion.div>
            </motion.div>

            {/* SEARCH BAR - Mobile Optimized */}
            <motion.section 
              className="mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Pesquisar transformações..."
                    className="w-full px-4 py-3 sm:px-6 sm:py-4 pl-12 sm:pl-14 bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm sm:text-base"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-ghibli-earth" />
                  {searchInput && (
                    <button
                      type="submit"
                      className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-400 text-white rounded-lg hover:bg-amber-500 transition-colors text-xs sm:text-sm"
                    >
                      Buscar
                    </button>
                  )}
                </div>
              </form>
            </motion.section>

            {/* FILTERS SECTION - Mobile Optimized */}
            <motion.section 
              className="mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-ghibli-sand/30 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Sort Filters - Mobile First */}
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-2">
                    <div className="flex items-center space-x-2">
                      <AdjustmentsHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5 text-ghibli-earth" />
                      <span className="text-sm font-medium text-ghibli-earth">Ordenar:</span>
                    </div>
                    <div className="flex rounded-lg bg-ghibli-sand/20 p-1 overflow-x-auto">
                      {[
                        { key: 'recent', label: 'Recentes', icon: ClockIcon },
                        { key: 'popular', label: 'Populares', icon: HeartIcon },
                        { key: 'trending', label: 'Trending', icon: FireIcon }
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setFilters(prev => ({ ...prev, sort: key as 'recent' | 'popular' | 'trending' }))}
                          className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                            filters.sort === key
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-600 text-white shadow-lg'
                              : 'text-ghibli-earth hover:text-ghibli-wood hover:bg-ghibli-sand/30'
                          }`}
                        >
                          <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline">{label}</span>
                          <span className="xs:hidden">{key === 'recent' ? '🕐' : key === 'popular' ? '❤️' : '🔥'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeframe Filters - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <span className="text-sm font-medium text-ghibli-earth">Período:</span>
                    <div className="flex rounded-lg bg-ghibli-sand/20 p-1 overflow-x-auto">
                      {[
                        { key: 'day', label: 'Hoje' },
                        { key: 'week', label: 'Semana' },
                        { key: 'month', label: 'Mês' },
                        { key: 'all', label: 'Tudo' }
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setFilters(prev => ({ ...prev, timeframe: key as 'day' | 'week' | 'month' | 'all' }))}
                          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                            filters.timeframe === key
                              ? 'bg-ghibli-moss text-white'
                              : 'text-ghibli-earth hover:text-ghibli-wood hover:bg-ghibli-sand/30'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Search Filter */}
                {filters.search && (
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-amber-50 border border-amber-200 rounded-lg p-3 gap-2">
                    <span className="text-amber-800 text-sm">
                      A pesquisar por: <strong>"{filters.search}"</strong>
                    </span>
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, search: '' }));
                        setSearchInput('');
                      }}
                      className="text-amber-600 hover:text-amber-800 text-sm underline self-start sm:self-auto"
                    >
                      Limpar
                    </button>
                  </div>
                )}
              </div>
            </motion.section>

            {/* TRANSFORMATIONS GRID - Mobile Optimized */}
            <motion.section 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {loadingTransformations && transformations.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-ghibli-sand/20 rounded-2xl aspect-square animate-pulse border border-ghibli-sand/30" />
                  ))}
                </div>
              ) : transformations.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <SparklesIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-ghibli-sand" />
                  <h3 className="text-lg sm:text-xl font-semibold text-ghibli-wood mb-2">
                    {filters.search ? 'Nenhum resultado encontrado' : 'Nenhuma transformação encontrada'}
                  </h3>
                  <p className="text-ghibli-earth text-sm sm:text-base">
                    {filters.search 
                      ? 'Tenta pesquisar com outros termos.'
                      : 'Sê o primeiro a partilhar uma transformação incrível!'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  <AnimatePresence>
                    {transformations.map((transformation) => (
                      <motion.div
                        key={transformation.id}
                        variants={itemVariants}
                        layout
                      >
                        <CommunityTransformationCard
                          transformation={transformation}
                          isLiked={isLiked(transformation.id)}
                          isTogglingLike={isTogglingLike(transformation.id)}
                          onLike={handleLike}
                          onView={handleViewTransformation}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Load More - Mobile Optimized */}
              {pagination.has_next_page && !loadingTransformations && (
                <motion.div 
                  className="flex justify-center mt-8 sm:mt-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button
                    onClick={() => loadMoreTransformations(filters)}
                    className="ghibli-button px-6 py-2.5 sm:px-8 sm:py-3 font-medium text-sm sm:text-base"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Carregar Mais Transformações
                  </motion.button>
                </motion.div>
              )}
            </motion.section>
          </div>
        </main>

        {/* Footer */}
        <Footer />

        {/* View Transformation Modal */}
        <ViewTransformationModal
          isOpen={isModalOpen}
          transformation={selectedTransformation}
          isLiked={selectedTransformation ? isLiked(selectedTransformation.id) : false}
          isTogglingLike={selectedTransformation ? isTogglingLike(selectedTransformation.id) : false}
          comments={selectedTransformation ? getComments(selectedTransformation.id) : []}
          isLoadingComments={selectedTransformation ? isLoadingComments(selectedTransformation.id) : false}
          isSubmittingComment={selectedTransformation ? isSubmittingComment(selectedTransformation.id) : false}
          onClose={handleCloseModal}
          onLike={handleLike}
          onFetchComments={fetchComments}
          onAddComment={handleAddComment}
        />

        {/* Submit to Community Modal */}
        <SubmitToCommunityModal 
          isOpen={isPublishModalOpen}
          onOpenChange={setIsPublishModalOpen}
          onSuccess={handlePublishSuccess}
        />
      </div>
    </>
  );
};

export default CommunityPage; 