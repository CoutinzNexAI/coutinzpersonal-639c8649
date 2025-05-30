import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { CommunityTransformation } from '@/hooks/useCommunity';
import { useAuth } from '@/hooks/useAuth';

// =====================================================
// COMMUNITY TRANSFORMATION CARD
// Card individual para cada transformação na grelha
// =====================================================

interface CommunityTransformationCardProps {
  transformation: CommunityTransformation;
  isLiked: boolean;
  isTogglingLike: boolean;
  onLike: (transformationId: string) => void;
  onView: (transformation: CommunityTransformation) => void;
}

const CommunityTransformationCard: React.FC<CommunityTransformationCardProps> = ({
  transformation,
  isLiked,
  isTogglingLike,
  onLike,
  onView
}) => {
  const { userInfo } = useAuth();
  const router = useRouter();

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

  // HANDLERS
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!userInfo) {
      router.push('/auth/login');
      return;
    }
    
    onLike(transformation.id);
  };

  return (
    <motion.div
      className="group relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-ghibli-sand/30 hover:border-amber-400/50 transition-all duration-300 hover:shadow-xl cursor-pointer"
      whileHover={{ y: -2, scale: 1.01 }}
      onClick={() => onView(transformation)}
      layout
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={transformation.output_url}
          alt={transformation.public_title || 'Transformação da comunidade'}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          priority={false}
        />
        
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick Actions - Mobile Optimized */}
        <div className="absolute top-3 right-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 z-40">
          <motion.button
            onClick={handleLikeClick}
            disabled={isTogglingLike}
            className={`p-2.5 sm:p-2.5 rounded-full backdrop-blur-md transition-all touch-manipulation relative z-50 ${
              isLiked
                ? 'bg-red-500 text-white shadow-lg'
                : userInfo 
                  ? 'bg-white/90 text-red-500 hover:bg-red-500 hover:text-white'
                  : 'bg-white/90 text-gray-400 hover:bg-amber-500 hover:text-white'
            } ${isTogglingLike ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={{ scale: isTogglingLike ? 1 : 1.1 }}
            whileTap={{ scale: isTogglingLike ? 1 : 0.9 }}
            style={{ 
              position: 'relative',
              zIndex: 50,
              pointerEvents: 'auto'
            }}
            title={!userInfo ? 'Faça login para gostar' : isLiked ? 'Remover like' : 'Gostar'}
          >
            {isLiked ? (
              <HeartIconSolid className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </motion.button>
        </div>

        {/* View Indicator - Mobile Optimized */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
          <div className="px-2 py-1 sm:px-3 sm:py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-medium">
            👆 Toca para ver
          </div>
        </div>
      </div>

      {/* Content - Mobile Optimized */}
      <div className="p-3 sm:p-4 lg:p-5">
        {/* Title */}
        {transformation.public_title && (
          <h3 className="text-base sm:text-lg font-semibold text-ghibli-wood mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
            {transformation.public_title}
          </h3>
        )}

        {/* Description - Hidden on very small screens */}
        {transformation.public_description && (
          <p className="hidden sm:block text-ghibli-earth text-sm mb-3 line-clamp-2">
            {transformation.public_description}
          </p>
        )}

        {/* Style Tag */}
        <div className="inline-block px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-amber-400/20 to-yellow-600/20 rounded-full text-xs font-medium text-amber-700 mb-3 border border-amber-400/30">
          {transformation.style_name}
        </div>

        {/* Stats Row - Mobile Optimized */}
        <div className="flex items-center justify-between text-ghibli-earth text-sm mb-3">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Likes */}
            <motion.span 
              className="flex items-center"
              animate={{ scale: isTogglingLike ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <HeartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-red-500" />
              <span className="text-xs sm:text-sm">{formatCount(transformation.like_count)}</span>
            </motion.span>

            {/* Comments */}
            <span className="flex items-center">
              <ChatBubbleLeftIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-blue-500" />
              <span className="text-xs sm:text-sm">{formatCount(transformation.comment_count)}</span>
            </span>
          </div>

          {/* Time Ago */}
          <span className="text-xs text-ghibli-earth/60">
            {formatTimeAgo(transformation.published_at)}
          </span>
        </div>

        {/* User Info - No Avatar */}
        <div className="flex items-center justify-between">
          <span className="text-ghibli-earth text-xs sm:text-sm font-medium truncate">
            por {transformation.user_full_name || 'Utilizador'}
          </span>
        </div>
      </div>

      {/* Hover Border Effect */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-amber-400/30 transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default CommunityTransformationCard; 