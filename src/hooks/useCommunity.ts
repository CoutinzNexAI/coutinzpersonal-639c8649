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
    limit: 8,
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

  // FETCH TRANSFORMAÇÕES - Modified for proper pagination
  const fetchTransformations = useCallback(async (
    filters: Filters,
    reset: boolean = false,
    page?: number
  ) => {
    try {
      setLoadingTransformations(true);
      const targetPage = page || (reset ? 1 : pagination.page);
      
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: pagination.limit.toString(),
        sort: filters.sort,
        timeframe: filters.timeframe
      });

      if (filters.search.trim()) {
        params.append('search', filters.search.trim());
      }

      const response = await fetch(`/api/community/get-public-transformations?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);

      if (data.success) {
        // Always replace transformations for pagination (no more concatenation)
        setTransformations(data.transformations);
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
  }, [pagination.limit]);

  // NEW: Navigate to specific page
  const goToPage = useCallback(async (page: number, filters: Filters) => {
    if (page < 1 || page > pagination.total_pages || page === pagination.page) {
      return;
    }
    await fetchTransformations(filters, false, page);
  }, [fetchTransformations, pagination.page, pagination.total_pages]);

  // NEW: Go to first page
  const goToFirstPage = useCallback(async (filters: Filters) => {
    if (pagination.page === 1) return;
    await fetchTransformations(filters, false, 1);
  }, [fetchTransformations, pagination.page]);

  // NEW: Go to last page
  const goToLastPage = useCallback(async (filters: Filters) => {
    if (pagination.page === pagination.total_pages) return;
    await fetchTransformations(filters, false, pagination.total_pages);
  }, [fetchTransformations, pagination.page, pagination.total_pages]);

  // NEW: Go to next page
  const goToNextPage = useCallback(async (filters: Filters) => {
    if (!pagination.has_next_page) return;
    await fetchTransformations(filters, false, pagination.page + 1);
  }, [fetchTransformations, pagination.has_next_page, pagination.page]);

  // NEW: Go to previous page
  const goToPreviousPage = useCallback(async (filters: Filters) => {
    if (!pagination.has_prev_page) return;
    await fetchTransformations(filters, false, pagination.page - 1);
  }, [fetchTransformations, pagination.has_prev_page, pagination.page]);

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);
      
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);

      if (data.success) {
        setComments(prev => ({
          ...prev,
          [transformationId]: page === 1 ? data.comments : [...(prev[transformationId] || []), ...data.comments]
        }));
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
  const addComment = useCallback(async (transformationId: string, content: string) => {
    try {
      setSubmittingComment(prev => ({ ...prev, [transformationId]: true }));

      const response = await fetch('/api/community/add-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transformation_id: transformationId,
          content: content.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);

      if (data.success) {
        // Update comments locally
        setComments(prev => ({
          ...prev,
          [transformationId]: [data.comment, ...(prev[transformationId] || [])]
        }));

        // Update comment count in transformations
        setTransformations(prev => 
          prev.map(t => 
            t.id === transformationId 
              ? { ...t, comment_count: t.comment_count + 1 }
              : t
          )
        );

        return data.comment;
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

  // HELPER FUNCTIONS
  const isLiked = useCallback((transformationId: string) => {
    return likedTransformations.has(transformationId);
  }, [likedTransformations]);

  const isTogglingLike = useCallback((transformationId: string) => {
    return togglingLike[transformationId] || false;
  }, [togglingLike]);

  const getComments = useCallback((transformationId: string) => {
    return comments[transformationId] || [];
  }, [comments]);

  const isLoadingComments = useCallback((transformationId: string) => {
    return loadingComments[transformationId] || false;
  }, [loadingComments]);

  const isSubmittingComment = useCallback((transformationId: string) => {
    return submittingComment[transformationId] || false;
  }, [submittingComment]);

  return {
    transformations,
    loadingTransformations,
    pagination,
    toggleLike,
    fetchTransformations,
    // NEW pagination functions
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    fetchComments,
    addComment,
    isLiked,
    isTogglingLike,
    getComments,
    isLoadingComments,
    isSubmittingComment
  };
}; 