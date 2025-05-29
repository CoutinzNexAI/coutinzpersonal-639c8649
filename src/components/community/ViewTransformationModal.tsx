import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  XMarkIcon,
  HeartIcon, 
  ChatBubbleLeftIcon, 
  PaperAirplaneIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { CommunityTransformation, CommunityComment } from '@/hooks/useCommunity';
import PicCoinAnimation from './PicCoinAnimation';

// =====================================================
// VIEW TRANSFORMATION MODAL
// Modal completo para ver detalhes e comentários
// =====================================================

interface ViewTransformationModalProps {
  isOpen: boolean;
  transformation: CommunityTransformation | null;
  isLiked: boolean;
  isTogglingLike: boolean;
  comments: CommunityComment[];
  isLoadingComments: boolean;
  isSubmittingComment: boolean;
  onClose: () => void;
  onLike: (transformationId: string) => void;
  onFetchComments: (transformationId: string) => void;
  onAddComment: (transformationId: string, content: string) => Promise<{ earned_piccoin?: boolean; message?: string }>;
}

const ViewTransformationModal: React.FC<ViewTransformationModalProps> = ({
  isOpen,
  transformation,
  isLiked,
  isTogglingLike,
  comments,
  isLoadingComments,
  isSubmittingComment,
  onClose,
  onLike,
  onFetchComments,
  onAddComment
}) => {
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [showPicCoinAnimation, setShowPicCoinAnimation] = useState(false);
  const [picCoinMessage, setPicCoinMessage] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // EFFECTS
  useEffect(() => {
    if (isOpen && transformation) {
      onFetchComments(transformation.id);
    }
  }, [isOpen, transformation, onFetchComments]);

  useEffect(() => {
    if (comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  // HANDLERS
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !transformation) return;

    try {
      const result = await onAddComment(transformation.id, newComment.trim());
      setNewComment('');
      
      // Show PicCoin animation if earned
      if (result?.earned_piccoin) {
        setPicCoinMessage(result.message || 'Ganhaste 1 PicCoin! 🪙');
        setShowPicCoinAnimation(true);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitComment(e);
    }
  };

  // FORMATAÇÃO
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Data inválida';
    
    const now = new Date();
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const formatCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data inválida';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    return date.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  // Check if comment is from the author of the transformation
  const isAuthorComment = (comment: CommunityComment) => {
    return transformation && comment.user_id === transformation.user_id;
  };

  // Sort comments to show author's comment first if it exists
  const sortedComments = transformation ? [...comments].sort((a, b) => {
    const aIsAuthor = isAuthorComment(a);
    const bIsAuthor = isAuthorComment(b);
    
    if (aIsAuthor && !bIsAuthor) return -1;
    if (!aIsAuthor && bIsAuthor) return 1;
    
    // If both are author comments or both are not, maintain chronological order
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }) : comments;

  if (!transformation) return null;

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
            onClick={onClose}
          />

          {/* Modal - Mobile Optimized */}
          <motion.div
            className="relative w-full max-w-7xl h-[95vh] sm:h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Close Button - Mobile Optimized */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-6 sm:right-6 z-10 p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg touch-manipulation"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-ghibli-wood" />
            </button>

            <div className="flex flex-col lg:flex-row h-full">
              {/* Image Section - Mobile First with Overlay Info */}
              <div className="lg:w-3/5 relative bg-ghibli-sand/10 flex items-center justify-center h-1/2 lg:h-full">
                <div className="relative w-full h-full max-w-[600px] max-h-[600px] aspect-square mx-auto p-2 sm:p-4">
                  <Image
                    src={transformation.output_url}
                    alt={transformation.public_title || 'Transformação da comunidade'}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover rounded-xl sm:rounded-2xl"
                    priority
                  />
                  
                  {/* Mobile Overlay Info */}
                  <div className="lg:hidden absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 rounded-xl sm:rounded-2xl">
                    {/* Top Info */}
                    <div className="absolute top-3 left-3 right-3">
                      <div className="flex items-center justify-between">
                        {/* User & Date */}
                        <div className="flex items-center space-x-2">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                            <span className="text-ghibli-wood text-xs font-medium">
                              {transformation.user_full_name || 'Utilizador'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Like Button */}
                        <motion.button
                          onClick={() => onLike(transformation.id)}
                          disabled={isTogglingLike}
                          className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 touch-manipulation backdrop-blur-sm ${
                            isLiked
                              ? 'bg-red-500 text-white shadow-lg'
                              : 'bg-white/90 text-red-500 hover:bg-red-50'
                          } ${isTogglingLike ? 'opacity-50 cursor-not-allowed' : ''}`}
                          whileHover={{ scale: isTogglingLike ? 1 : 1.05 }}
                          whileTap={{ scale: isTogglingLike ? 1 : 0.95 }}
                        >
                          {isLiked ? (
                            <HeartIconSolid className="w-3 h-3 mr-1 animate-pulse" />
                          ) : (
                            <HeartIcon className="w-3 h-3 mr-1" />
                          )}
                          <span>{formatCount(transformation.like_count)}</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-3 left-3 right-3">
                      {/* Title */}
                      {transformation.public_title && (
                        <h2 className="text-white text-lg font-bold mb-2 drop-shadow-lg">
                          {transformation.public_title}
                        </h2>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {/* Style Tag & Stats */}
                        <div className="flex items-center space-x-2">
                          <div className="px-2 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                            {transformation.style_name || transformation.style_requested}
                          </div>
                          
                          <div className="flex items-center space-x-2 text-white/80 text-xs">
                            <span className="flex items-center">
                              <ChatBubbleLeftIcon className="w-3 h-3 mr-1" />
                              {formatCount(transformation.comment_count)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Date */}
                        <div className="text-white/60 text-xs">
                          {formatTimeAgo(transformation.published_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section - Mobile Optimized for Comments */}
              <div className="lg:w-2/5 flex flex-col h-1/2 lg:h-full">
                {/* Header - Desktop Only */}
                <div className="hidden lg:block p-6 border-b border-ghibli-sand/30 flex-shrink-0">
                  {/* User Info - No Avatar */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div>
                      <h3 className="font-semibold text-ghibli-wood">
                        {transformation.user_full_name || 'Utilizador'}
                      </h3>
                      <div className="flex items-center text-ghibli-earth text-sm">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDate(transformation.published_at)}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  {transformation.public_title && (
                    <h2 className="text-xl font-bold text-ghibli-wood mb-2">
                      {transformation.public_title}
                    </h2>
                  )}

                  {/* Description */}
                  {transformation.public_description && (
                    <p className="text-ghibli-earth mb-3 text-sm">
                      {transformation.public_description}
                    </p>
                  )}

                  {/* Style Tag */}
                  <div className="inline-block px-3 py-1.5 bg-gradient-to-r from-amber-400/20 to-yellow-600/20 rounded-full text-xs font-medium text-amber-700 mb-3 border border-amber-400/30">
                    {transformation.style_name || transformation.style_requested}
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between">
                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-ghibli-earth text-sm">
                      <span className="flex items-center">
                        <HeartIcon className="w-4 h-4 mr-1 text-red-500" />
                        {formatCount(transformation.like_count)}
                      </span>
                      <span className="flex items-center">
                        <ChatBubbleLeftIcon className="w-4 h-4 mr-1 text-blue-500" />
                        {formatCount(transformation.comment_count)}
                      </span>
                    </div>

                    {/* Like Button */}
                    <motion.button
                      onClick={() => onLike(transformation.id)}
                      disabled={isTogglingLike}
                      className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        isLiked
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-red-500 hover:bg-red-50 border border-red-200'
                      } ${isTogglingLike ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={{ scale: isTogglingLike ? 1 : (isLiked ? 1.05 : 1.02) }}
                      whileTap={{ scale: isTogglingLike ? 1 : 0.98 }}
                      animate={isLiked ? { 
                        boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)",
                      } : {}}
                    >
                      {isLiked ? (
                        <HeartIconSolid className="w-4 h-4 mr-1 animate-pulse" />
                      ) : (
                        <HeartIcon className="w-4 h-4 mr-1" />
                      )}
                      {isLiked ? 'Gostaste' : 'Gostar'}
                    </motion.button>
                  </div>
                </div>

                {/* Comments Section - Mobile Optimized with More Space */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Comments Header - Simplified for Mobile */}
                  <div className="px-3 py-2 lg:px-6 lg:py-3 border-b border-ghibli-sand/30 flex-shrink-0">
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className="flex items-center text-ghibli-wood font-semibold text-sm lg:text-base"
                    >
                      <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                      Comentários ({comments.length})
                    </button>
                  </div>

                  {showComments && (
                    <>
                      {/* Comments List - Much More Space on Mobile */}
                      <div 
                        className="flex-1 overflow-y-auto px-3 py-3 lg:px-6 lg:py-4 space-y-3 min-h-0" 
                        style={{ 
                          height: 'calc(50vh - 80px)', // Much more space on mobile
                          maxHeight: 'calc(90vh - 200px)' // Larger on desktop
                        }}
                      >
                        {isLoadingComments ? (
                          <div className="flex justify-center py-8">
                            <div className="w-6 h-6 lg:w-8 lg:h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : comments.length === 0 ? (
                          <div className="text-center py-8 text-ghibli-earth">
                            <ChatBubbleLeftIcon className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 text-ghibli-sand" />
                            <p className="text-sm lg:text-base">Ainda não há comentários.</p>
                            <p className="text-xs lg:text-sm">Sê o primeiro a comentar!</p>
                          </div>
                        ) : (
                          <>
                            {sortedComments.map((comment) => {
                              const isAuthor = isAuthorComment(comment);
                              return (
                                <div key={comment.id} className="flex space-x-2 lg:space-x-3">
                                  {/* Comment Content - No Avatar */}
                                  <div className="flex-1 min-w-0">
                                    <div className={`rounded-xl lg:rounded-2xl px-3 py-2 lg:px-4 lg:py-3 ${
                                      isAuthor 
                                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200' 
                                        : 'bg-ghibli-sand/20'
                                    }`}>
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className={`font-medium text-sm ${
                                          isAuthor ? 'text-amber-800' : 'text-ghibli-wood'
                                        }`}>
                                          {comment.user_full_name || 'Utilizador'}
                                        </span>
                                        {isAuthor && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500 text-white">
                                            📌 Autor
                                          </span>
                                        )}
                                        <span className="text-xs text-ghibli-earth">
                                          {formatTimeAgo(comment.created_at)}
                                        </span>
                                      </div>
                                      <p className={`text-sm leading-relaxed ${
                                        isAuthor ? 'text-amber-800' : 'text-ghibli-earth'
                                      }`}>
                                        {comment.content}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={commentsEndRef} />
                          </>
                        )}
                      </div>

                      {/* Comment Form - Compact for Mobile */}
                      <div className="border-t border-ghibli-sand/30 p-3 lg:p-4 flex-shrink-0 bg-white">
                        <form onSubmit={handleSubmitComment} className="space-y-2">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escreve um comentário..."
                            className="w-full px-3 py-2 lg:px-4 lg:py-3 bg-ghibli-sand/20 border border-ghibli-sand/30 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm"
                            rows={2}
                            disabled={isSubmittingComment}
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-ghibli-earth">
                              {newComment.length}/75
                            </span>
                            <motion.button
                              type="submit"
                              disabled={!newComment.trim() || isSubmittingComment || newComment.length > 75}
                              className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm touch-manipulation"
                              whileHover={{ scale: !newComment.trim() || isSubmittingComment ? 1 : 1.05 }}
                              whileTap={{ scale: !newComment.trim() || isSubmittingComment ? 1 : 0.95 }}
                            >
                              {isSubmittingComment ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              ) : (
                                <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                              )}
                              {isSubmittingComment ? 'A enviar...' : 'Comentar'}
                            </motion.button>
                          </div>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
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

export default ViewTransformationModal; 