import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

// =====================================================
// COMMUNITY HOOK - VERSÃO SIMPLIFICADA
// Hook simplificado apenas para transformações e likes
// =====================================================

export interface CommunityTransformation {
  id: string;
  output_url: string;
  input_url?: string;
  style_name: string;
  public_title?: string;
  public_description?: string;
  published_at: string;
  like_count: number;
  user_full_name?: string;
  is_featured?: boolean;
  is_trending?: boolean;
}

export interface Filters {
  sort: 'recent' | 'popular' | 'trending';
  timeframe: 'day' | 'week' | 'month' | 'all';
  search: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export const useCommunity = () => {
  // ESTADO PRINCIPAL
  const [transformations, setTransformations] = useState<CommunityTransformation[]>([]);
  const [likedTransformations, setLikedTransformations] = useState<Set<string>>(new Set());
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
  const [togglingLike, setTogglingLike] = useState<Record<string, boolean>>({});

  // FETCH TRANSFORMATIONS - Fixed to accept page parameter
  const fetchTransformations = useCallback(async (filters: Filters, reset: boolean = false, targetPage?: number) => {
    try {
      setLoadingTransformations(true);

      const pageToUse = targetPage !== undefined ? targetPage : (reset ? 1 : pagination.page);

      const params = new URLSearchParams({
        page: pageToUse.toString(),
        limit: pagination.limit.toString(),
        sort: filters.sort,
        timeframe: filters.timeframe,
        search: filters.search
      });

      const response = await fetch(`/api/community/get-public-transformations?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransformations(data.transformations);
        setPagination(data.pagination);
        setLikedTransformations(new Set(data.liked_transformation_ids || []));
      } else {
        throw new Error(data.error || 'Failed to fetch transformations');
      }
    } catch (error) {
      toast.error('Erro ao carregar transformações');
    } finally {
      setLoadingTransformations(false);
    }
  }, [pagination.limit]);

  // TOGGLE LIKE
  const toggleLike = useCallback(async (transformationId: string) => {
    try {
      setTogglingLike(prev => ({ ...prev, [transformationId]: true }));

      const response = await fetch('/api/community/toggle-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transformation_id: transformationId })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setLikedTransformations(prev => {
          const newSet = new Set(prev);
          if (data.is_liked) {
            newSet.add(transformationId);
          } else {
            newSet.delete(transformationId);
          }
          return newSet;
        });

        // Update like count in transformations
        setTransformations(prev => 
          prev.map(t => 
            t.id === transformationId 
              ? { ...t, like_count: data.is_liked ? t.like_count + 1 : t.like_count - 1 }
              : t
          )
        );
      } else {
        throw new Error(data.error || 'Failed to toggle like');
      }
    } catch (error) {
      toast.error('Erro ao dar like');
    } finally {
      setTogglingLike(prev => ({ ...prev, [transformationId]: false }));
    }
  }, []);

  // PAGINATION HELPERS - Fixed to pass page directly to fetchTransformations
  const goToPage = useCallback(async (page: number, filters: Filters) => {
    await fetchTransformations(filters, false, page);
  }, [fetchTransformations]);

  const goToFirstPage = useCallback(async (filters: Filters) => {
    await fetchTransformations(filters, false, 1);
  }, [fetchTransformations]);

  const goToLastPage = useCallback(async (filters: Filters) => {
    await fetchTransformations(filters, false, pagination.total_pages);
  }, [fetchTransformations, pagination.total_pages]);

  const goToNextPage = useCallback(async (filters: Filters) => {
    if (pagination.has_next_page) {
      await fetchTransformations(filters, false, pagination.page + 1);
    }
  }, [pagination.has_next_page, pagination.page, fetchTransformations]);

  const goToPreviousPage = useCallback(async (filters: Filters) => {
    if (pagination.has_prev_page) {
      await fetchTransformations(filters, false, pagination.page - 1);
    }
  }, [pagination.has_prev_page, pagination.page, fetchTransformations]);

  // HELPER FUNCTIONS
  const isLiked = useCallback((transformationId: string) => {
    return likedTransformations.has(transformationId);
  }, [likedTransformations]);

  const isTogglingLike = useCallback((transformationId: string) => {
    return togglingLike[transformationId] || false;
  }, [togglingLike]);

  return {
    // States
    transformations,
    loadingTransformations,
    pagination,
    
    // Actions
    fetchTransformations,
    toggleLike,
    
    // Pagination
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    
    // Helpers
    isLiked,
    isTogglingLike,
  };
}; 