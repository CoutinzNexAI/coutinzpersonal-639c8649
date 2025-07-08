import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';

export interface DailyLimitStatus {
  can_transform: boolean;
  current_usage: number;
  remaining_count: number;
  daily_limit: number;
  reset_time: string;
  hours_until_reset: number;
}

export interface DailyTransformationResult {
  success: boolean;
  error?: string;
  message?: string;
  current_usage: number;
  remaining_count: number;
  daily_limit: number;
  transformation_id?: string;
}

export const useDailyTransformations = () => {
  const { userInfo } = useAuth();
  const [status, setStatus] = useState<DailyLimitStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Constante para limite diário
  const DAILY_LIMIT = 10;

  /**
   * Verifica o status atual das transformações diárias
   */
  const checkDailyLimit = useCallback(async (): Promise<DailyLimitStatus | null> => {
    if (!userInfo?.id) {
      setError('Utilizador não autenticado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase.rpc('check_daily_transformation_limit', {
        p_user_id: userInfo.id,
        p_limit: DAILY_LIMIT
      });

      if (dbError) {
        console.error('[useDailyTransformations] Erro ao verificar limite:', dbError);
        setError('Erro ao verificar limite diário');
        return null;
      }

      const limitStatus = data as DailyLimitStatus;
      setStatus(limitStatus);
      return limitStatus;

    } catch (err) {
      console.error('[useDailyTransformations] Erro na verificação:', err);
      setError('Erro interno ao verificar limite');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  /**
   * Consome uma transformação diária
   */
  const useTransformation = useCallback(async (transformationId?: string): Promise<DailyTransformationResult | null> => {
    if (!userInfo?.id) {
      setError('Utilizador não autenticado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase.rpc('use_daily_transformation', {
        p_user_id: userInfo.id,
        p_transformation_id: transformationId || null,
        p_limit: DAILY_LIMIT
      });

      if (dbError) {
        console.error('[useDailyTransformations] Erro ao usar transformação:', dbError);
        setError('Erro ao processar transformação');
        return null;
      }

      const result = data as DailyTransformationResult;
      
      // Atualizar status local se sucesso
      if (result.success && status) {
        setStatus({
          ...status,
          current_usage: result.current_usage,
          remaining_count: result.remaining_count,
          can_transform: result.remaining_count > 0
        });
      }

      return result;

    } catch (err) {
      console.error('[useDailyTransformations] Erro ao usar transformação:', err);
      setError('Erro interno ao processar transformação');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id, status]);

  /**
   * Recarrega o status das transformações
   */
  const refetch = useCallback(async () => {
    await checkDailyLimit();
  }, [checkDailyLimit]);

  /**
   * Verifica se o utilizador pode fazer uma transformação
   */
  const canTransform = useCallback((): boolean => {
    return status?.can_transform ?? false;
  }, [status]);

  /**
   * Obtém mensagem de limite esgotado com countdown
   */
  const getLimitMessage = useCallback((): string => {
    if (!status) return '';
    
    if (status.can_transform) {
      return `${status.remaining_count} transformações restantes hoje`;
    }

    const hours = Math.floor(status.hours_until_reset);
    const minutes = Math.floor((status.hours_until_reset - hours) * 60);
    
    if (hours > 0) {
      return `Mais transformações disponíveis em ${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    } else {
      return `Mais transformações disponíveis em ${minutes}m`;
    }
  }, [status]);

  /**
   * Carrega o status inicial quando o component monta
   */
  useEffect(() => {
    if (userInfo?.id) {
      checkDailyLimit();
    }
  }, [userInfo?.id, checkDailyLimit]);

  return {
    // Status atual
    status,
    loading,
    error,
    
    // Informações úteis
    dailyLimit: DAILY_LIMIT,
    canTransform: canTransform(),
    remainingCount: status?.remaining_count ?? 0,
    currentUsage: status?.current_usage ?? 0,
    limitMessage: getLimitMessage(),
    
    // Funções
    checkDailyLimit,
    useTransformation,
    refetch,
    
    // Para compatibilidade com componentes existentes
    balance: status?.remaining_count ?? 0, // Daily transformations remaining
  };
}; 