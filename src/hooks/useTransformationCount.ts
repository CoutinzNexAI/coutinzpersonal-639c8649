import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useTransformationCount = () => {
  const { userInfo, isLoading: authLoading } = useAuth();
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransformationCount = async () => {
    if (!userInfo?.id || authLoading) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { count: transformationCount, error } = await supabase
        .from('transformations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userInfo.id);

      if (error) {
        setCount(0);
      } else {
        setCount(transformationCount || 0);
      }
    } catch (error) {
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransformationCount();
  }, [userInfo?.id, authLoading]);

  return {
    count,
    isLoading,
    refreshCount: fetchTransformationCount
  };
}; 