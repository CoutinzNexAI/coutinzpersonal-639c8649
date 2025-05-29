import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  XMarkIcon,
  HeartIcon, 
  ChatBubbleLeftIcon, 
  EyeIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { CommunityTransformation, CommunityComment } from '@/hooks/useCommunity';

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
  onAddComment: (transformationId: string, content: string) => Promise<void>;
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
      await onAddComment(transformation.id, newComment.trim());
      setNewComment('');
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

  const getUserInitial = (name?: string) => {
    return name?.[0]?.toUpperCase() || 'U';
  };

  if (!transformation) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal - FIXED SIZE */}
          <motion.div
            className="relative w-full max-w-7xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
            >
              <XMarkIcon className="w-6 h-6 text-ghibli-wood" />
            </button>

            <div className="flex flex-col lg:flex-row h-full">
              {/* Image Section - Left Side - PERFECT SQUARE */}
              <div className="lg:w-3/5 relative bg-ghibli-sand/10 flex items-center justify-center">
                <div className="relative w-full h-full max-w-[600px] max-h-[600px] aspect-square mx-auto">
                  <Image
                    src={transformation.output_url}
                    alt={transformation.public_title || 'Transformação da comunidade'}
                    fill
                    sizes="600px"
                    className="object-cover rounded-2xl"
                    priority
                  />
                </div>
              </div>

              {/* Content Section - Right Side - FIXED HEIGHT */}
              <div className="lg:w-2/5 flex flex-col h-full">
                {/* Header - Fixed height - NO AVATAR */}
                <div className="p-6 border-b border-ghibli-sand/30 flex-shrink-0">
                  {/* User Info - NO AVATAR */}
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
                  <div className="inline-block px-3 py-1 bg-gradient-to-r from-amber-400/20 to-yellow-600/20 rounded-full text-xs font-medium text-amber-700 mb-3 border border-amber-400/30">
                    {transformation.style_name || transformation.style_requested}
                  </div>

                  {/* Actions Row - REMOVED VIEW COUNT */}
                  <div className="flex items-center justify-between">
                    {/* Stats - NO VIEW COUNT */}
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

                    {/* Like Button - IMPROVED ANIMATION */}
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

                {/* Comments Section - FIXED HEIGHT */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Comments Header */}
                  <div className="px-6 py-3 border-b border-ghibli-sand/30 flex-shrink-0">
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className="flex items-center text-ghibli-wood font-semibold text-sm"
                    >
                      <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                      Comentários ({comments.length})
                    </button>
                  </div>

                  {showComments && (
                    <>
                      {/* Comments List - FIXED HEIGHT WITH SCROLL */}
                      <div 
                        className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0" 
                        style={{ height: 'calc(90vh - 350px)' }}
                      >
                        {isLoadingComments ? (
                          <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : comments.length === 0 ? (
                          <div className="text-center py-8 text-ghibli-earth">
                            <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-3 text-ghibli-sand" />
                            <p>Ainda não há comentários.</p>
                            <p className="text-sm">Sê o primeiro a comentar!</p>
                          </div>
                        ) : (
                          <>
                            {comments.map((comment) => (
                              <div key={comment.id} className="flex space-x-3">
                                {/* Comment Content - NO AVATAR */}
                                <div className="flex-1 min-w-0">
                                  <div className="bg-ghibli-sand/20 rounded-2xl px-4 py-3">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium text-ghibli-wood text-sm">
                                        {comment.user_full_name || 'Utilizador'}
                                      </span>
                                      <span className="text-xs text-ghibli-earth">
                                        {formatTimeAgo(comment.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-ghibli-earth text-sm leading-relaxed">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div ref={commentsEndRef} />
                          </>
                        )}
                      </div>

                      {/* Comment Form - Fixed at bottom - NO AVATAR */}
                      <div className="border-t border-ghibli-sand/30 p-4 flex-shrink-0 bg-white">
                        <form onSubmit={handleSubmitComment} className="flex space-x-3">
                          <div className="flex-1">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Escreve um comentário... (Ctrl+Enter para enviar)"
                              className="w-full px-4 py-3 bg-ghibli-sand/20 border border-ghibli-sand/30 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all text-sm"
                              rows={2}
                              disabled={isSubmittingComment}
                            />
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-ghibli-earth">
                                {newComment.length}/75 caracteres
                              </span>
                              <motion.button
                                type="submit"
                                disabled={!newComment.trim() || isSubmittingComment || newComment.length > 75}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
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
                          </div>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ViewTransformationModal; 