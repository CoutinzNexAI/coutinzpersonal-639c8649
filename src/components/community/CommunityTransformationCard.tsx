import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  EyeIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { CommunityTransformation } from '@/hooks/useCommunity';

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

  const getUserInitial = () => {
    return transformation.user_full_name?.[0]?.toUpperCase() || 'U';
  };

  return (
    <motion.div
      className="group relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-ghibli-sand/30 hover:border-amber-400/50 transition-all duration-300 hover:shadow-xl cursor-pointer"
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => onView(transformation)}
      layout
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={transformation.output_url}
          alt={transformation.public_title || 'Transformação da comunidade'}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          priority={false}
        />
        
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick Actions - Top Right */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onLike(transformation.id);
            }}
            disabled={isTogglingLike}
            className={`p-2 rounded-full backdrop-blur-md transition-all ${
              isLiked
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white/80 text-red-500 hover:bg-red-500 hover:text-white'
            } ${isTogglingLike ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={{ scale: isTogglingLike ? 1 : 1.1 }}
            whileTap={{ scale: isTogglingLike ? 1 : 0.9 }}
          >
            {isLiked ? (
              <HeartIconSolid className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        {/* View Indicator - Bottom Right */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-medium">
            Clica para ver
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        {transformation.public_title && (
          <h3 className="text-lg font-semibold text-ghibli-wood mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
            {transformation.public_title}
          </h3>
        )}

        {/* Description */}
        {transformation.public_description && (
          <p className="text-ghibli-earth text-sm mb-3 line-clamp-2">
            {transformation.public_description}
          </p>
        )}

        {/* Style Tag */}
        <div className="inline-block px-3 py-1 bg-gradient-to-r from-amber-400/20 to-yellow-600/20 rounded-full text-xs font-medium text-amber-700 mb-3 border border-amber-400/30">
          {transformation.style_name}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-ghibli-earth text-sm mb-3">
          <div className="flex items-center space-x-4">
            {/* Likes */}
            <motion.span 
              className="flex items-center"
              animate={{ scale: isTogglingLike ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <HeartIcon className="w-4 h-4 mr-1 text-red-500" />
              {formatCount(transformation.like_count)}
            </motion.span>

            {/* Comments */}
            <span className="flex items-center">
              <ChatBubbleLeftIcon className="w-4 h-4 mr-1 text-blue-500" />
              {formatCount(transformation.comment_count)}
            </span>

            {/* Views */}
            <span className="flex items-center">
              <EyeIcon className="w-4 h-4 mr-1 text-green-500" />
              {formatCount(transformation.view_count)}
            </span>
          </div>

          {/* Time Ago */}
          <span className="text-xs text-ghibli-earth/60">
            {formatTimeAgo(transformation.published_at)}
          </span>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3">
          {/* User Avatar */}
          <div className="relative">
            {transformation.user_avatar_url ? (
              <Image
                src={transformation.user_avatar_url}
                alt={transformation.user_full_name || 'Utilizador'}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 flex items-center justify-center text-xs font-semibold text-white">
                {getUserInitial()}
              </div>
            )}
          </div>

          {/* User Name */}
          <span className="text-ghibli-earth text-sm font-medium">
            {transformation.user_full_name || 'Utilizador'}
          </span>
        </div>
      </div>

      {/* Hover Border Effect */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-amber-400/30 transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default CommunityTransformationCard; 