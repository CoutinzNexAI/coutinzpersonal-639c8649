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
    const now = new Date();
    const date = new Date(dateString);
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
    return new Date(dateString).toLocaleDateString('pt-PT', {
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

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
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

            <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
              {/* Image Section - Left Side */}
              <div className="lg:w-3/5 relative bg-ghibli-sand/10">
                <div className="relative w-full h-64 lg:h-full min-h-[400px]">
                  <Image
                    src={transformation.output_url}
                    alt={transformation.public_title || 'Transformação da comunidade'}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-contain"
                    priority
                  />
                  
                  {/* Gradient Overlay at Bottom for Mobile */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent h-16 lg:hidden" />
                </div>
              </div>

              {/* Content Section - Right Side */}
              <div className="lg:w-2/5 flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-ghibli-sand/30">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="relative">
                      {transformation.user_avatar_url ? (
                        <Image
                          src={transformation.user_avatar_url}
                          alt={transformation.user_full_name || 'Utilizador'}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 flex items-center justify-center text-lg font-semibold text-white">
                          {getUserInitial(transformation.user_full_name)}
                        </div>
                      )}
                    </div>
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
                    <h2 className="text-2xl font-bold text-ghibli-wood mb-3">
                      {transformation.public_title}
                    </h2>
                  )}

                  {/* Description */}
                  {transformation.public_description && (
                    <p className="text-ghibli-earth mb-4">
                      {transformation.public_description}
                    </p>
                  )}

                  {/* Style Tag */}
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-amber-400/20 to-yellow-600/20 rounded-full text-sm font-medium text-amber-700 mb-4 border border-amber-400/30">
                    {transformation.style_name}
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between">
                    {/* Stats */}
                    <div className="flex items-center space-x-6 text-ghibli-earth">
                      <span className="flex items-center">
                        <HeartIcon className="w-5 h-5 mr-2 text-red-500" />
                        {formatCount(transformation.like_count)}
                      </span>
                      <span className="flex items-center">
                        <ChatBubbleLeftIcon className="w-5 h-5 mr-2 text-blue-500" />
                        {formatCount(transformation.comment_count)}
                      </span>
                      <span className="flex items-center">
                        <EyeIcon className="w-5 h-5 mr-2 text-green-500" />
                        {formatCount(transformation.view_count)}
                      </span>
                    </div>

                    {/* Like Button */}
                    <motion.button
                      onClick={() => onLike(transformation.id)}
                      disabled={isTogglingLike}
                      className={`flex items-center px-4 py-2 rounded-full font-medium transition-all ${
                        isLiked
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-red-500 hover:bg-red-500 hover:text-white'
                      } ${isTogglingLike ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={{ scale: isTogglingLike ? 1 : 1.05 }}
                      whileTap={{ scale: isTogglingLike ? 1 : 0.95 }}
                    >
                      {isLiked ? (
                        <HeartIconSolid className="w-5 h-5 mr-2" />
                      ) : (
                        <HeartIcon className="w-5 h-5 mr-2" />
                      )}
                      {isLiked ? 'Gostaste' : 'Gostar'}
                    </motion.button>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Comments Header */}
                  <div className="p-4 border-b border-ghibli-sand/30">
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className="flex items-center text-ghibli-wood font-semibold"
                    >
                      <ChatBubbleLeftIcon className="w-5 h-5 mr-2" />
                      Comentários ({comments.length})
                    </button>
                  </div>

                  {showComments && (
                    <>
                      {/* Comments List */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                  {comment.user_avatar_url ? (
                                    <Image
                                      src={comment.user_avatar_url}
                                      alt={comment.user_full_name || 'Utilizador'}
                                      width={32}
                                      height={32}
                                      className="rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 flex items-center justify-center text-xs font-semibold text-white">
                                      {getUserInitial(comment.user_full_name)}
                                    </div>
                                  )}
                                </div>

                                {/* Comment Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="bg-ghibli-sand/20 rounded-2xl rounded-tl-sm px-4 py-3">
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

                      {/* Comment Form */}
                      <div className="border-t border-ghibli-sand/30 p-4">
                        <form onSubmit={handleSubmitComment} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 flex items-center justify-center text-xs font-semibold text-white">
                              <UserIcon className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Escreve um comentário... (Ctrl+Enter para enviar)"
                              className="w-full px-4 py-3 bg-ghibli-sand/20 border border-ghibli-sand/30 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
                              rows={3}
                              disabled={isSubmittingComment}
                            />
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-ghibli-earth">
                                {newComment.length}/500 caracteres
                              </span>
                              <motion.button
                                type="submit"
                                disabled={!newComment.trim() || isSubmittingComment || newComment.length > 500}
                                className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-600 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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