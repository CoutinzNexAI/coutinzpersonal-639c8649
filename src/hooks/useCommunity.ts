import { useState, useCallback } from 'react';

// =====================================================
// HOOK: USE COMMUNITY
// Centraliza toda a lógica de estado da comunidade
// =====================================================

export interface CommunityTransformation {
  id: string;
  public_title?: string;
  public_description?: string;
  output_url: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  published_at: string;
  user_id: string;
  user_full_name?: string;
  user_avatar_url?: string;
  style_name?: string;
  style_requested: string;
}

export interface CommunityComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_full_name?: string;
  user_avatar_url?: string;
  parent_comment_id?: string;
  replies?: CommunityComment[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

interface Filters {
  sort: 'recent' | 'popular' | 'trending';
  timeframe: 'day' | 'week' | 'month' | 'all';
  search: string;
}

export const useCommunity = () => {
  // ESTADO PRINCIPAL
  const [transformations, setTransformations] = useState<CommunityTransformation[]>([]);
  const [likedTransformations, setLikedTransformations] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    total_pages: 0,
    has_next_page: false,
    has_prev_page: false
  });
  
  // ESTADOS DE LOADING
  const [loadingTransformations, setLoadingTransformations] = useState(false);
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [togglingLike, setTogglingLike] = useState<Record<string, boolean>>({});

  // FETCH TRANSFORMAÇÕES
  const fetchTransformations = useCallback(async (
    filters: Filters,
    reset: boolean = false,
    page?: number
  ) => {
    try {
      setLoadingTransformations(true);
      const currentPage = reset ? 1 : (page || pagination.page);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        sort: filters.sort,
        timeframe: filters.timeframe
      });

      if (filters.search.trim()) {
        params.append('search', filters.search.trim());
      }

      const response = await fetch(`/api/community/get-public-transformations?${params}`);
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setTransformations(data.transformations);
        } else {
          setTransformations(prev => [...prev, ...data.transformations]);
        }
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch transformations');
      }
    } catch (error) {
      console.error('Error fetching transformations:', error);
      throw error;
    } finally {
      setLoadingTransformations(false);
    }
  }, [pagination.page, pagination.limit]);

  // TOGGLE LIKE COM OPTIMISTIC UPDATE
  const toggleLike = useCallback(async (transformationId: string) => {
    try {
      setTogglingLike(prev => ({ ...prev, [transformationId]: true }));

      // Optimistic update
      const wasLiked = likedTransformations.has(transformationId);
      const newLikedSet = new Set(likedTransformations);
      
      if (wasLiked) {
        newLikedSet.delete(transformationId);
      } else {
        newLikedSet.add(transformationId);
      }
      setLikedTransformations(newLikedSet);

      // Update like count optimistically
      setTransformations(prev => 
        prev.map(t => 
          t.id === transformationId 
            ? { ...t, like_count: t.like_count + (wasLiked ? -1 : 1) }
            : t
        )
      );

      const response = await fetch('/api/community/toggle-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transformation_id: transformationId })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update with real data from server
        setTransformations(prev => 
          prev.map(t => 
            t.id === transformationId 
              ? { ...t, like_count: data.like_count }
              : t
          )
        );

        // Update liked state with server response
        const finalLikedSet = new Set(likedTransformations);
        if (data.is_liked) {
          finalLikedSet.add(transformationId);
        } else {
          finalLikedSet.delete(transformationId);
        }
        setLikedTransformations(finalLikedSet);
      } else {
        // Revert optimistic update on error
        setLikedTransformations(likedTransformations);
        setTransformations(prev => 
          prev.map(t => 
            t.id === transformationId 
              ? { ...t, like_count: t.like_count + (wasLiked ? 1 : -1) }
              : t
          )
        );
        throw new Error(data.error || 'Failed to toggle like');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    } finally {
      setTogglingLike(prev => ({ ...prev, [transformationId]: false }));
    }
  }, [likedTransformations]);

  // FETCH COMENTÁRIOS
  const fetchComments = useCallback(async (transformationId: string, page: number = 1) => {
    try {
      setLoadingComments(prev => ({ ...prev, [transformationId]: true }));

      const params = new URLSearchParams({
        transformation_id: transformationId,
        page: page.toString(),
        limit: '20'
      });

      const response = await fetch(`/api/community/comments?${params}`);
      const data = await response.json();

      if (data.success) {
        setComments(prev => ({
          ...prev,
          [transformationId]: page === 1 ? data.comments : [...(prev[transformationId] || []), ...data.comments]
        }));
        return data;
      } else {
        throw new Error(data.error || 'Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    } finally {
      setLoadingComments(prev => ({ ...prev, [transformationId]: false }));
    }
  }, []);

  // ADICIONAR COMENTÁRIO
  const addComment = useCallback(async (
    transformationId: string,
    content: string,
    parentCommentId?: string
  ) => {
    try {
      setSubmittingComment(prev => ({ ...prev, [transformationId]: true }));

      const response = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transformation_id: transformationId,
          content: content.trim(),
          parent_comment_id: parentCommentId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update comment count
        setTransformations(prev => 
          prev.map(t => 
            t.id === transformationId 
              ? { ...t, comment_count: t.comment_count + 1 }
              : t
          )
        );

        // Add new comment to local state
        setComments(prev => ({
          ...prev,
          [transformationId]: [data.comment, ...(prev[transformationId] || [])]
        }));

        return data;
      } else {
        throw new Error(data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    } finally {
      setSubmittingComment(prev => ({ ...prev, [transformationId]: false }));
    }
  }, []);

  // LOAD MORE TRANSFORMAÇÕES
  const loadMoreTransformations = useCallback(async (filters: Filters) => {
    if (pagination.has_next_page && !loadingTransformations) {
      await fetchTransformations(filters, false, pagination.page + 1);
    }
  }, [pagination.has_next_page, pagination.page, loadingTransformations, fetchTransformations]);

  // RESET STATE
  const resetCommunityState = useCallback(() => {
    setTransformations([]);
    setLikedTransformations(new Set());
    setComments({});
    setPagination({
      page: 1,
      limit: 12,
      total: 0,
      total_pages: 0,
      has_next_page: false,
      has_prev_page: false
    });
  }, []);

  return {
    // Estado
    transformations,
    likedTransformations,
    comments,
    pagination,
    
    // Loading states
    loadingTransformations,
    loadingComments,
    submittingComment,
    togglingLike,
    
    // Ações
    fetchTransformations,
    toggleLike,
    fetchComments,
    addComment,
    loadMoreTransformations,
    resetCommunityState,
    
    // Utilitários
    isLiked: (transformationId: string) => likedTransformations.has(transformationId),
    isLoadingComments: (transformationId: string) => loadingComments[transformationId] || false,
    isSubmittingComment: (transformationId: string) => submittingComment[transformationId] || false,
    isTogglingLike: (transformationId: string) => togglingLike[transformationId] || false,
    getComments: (transformationId: string) => comments[transformationId] || []
  };
}; 