import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTransformationCount } from '@/hooks/useTransformationCount';

export const useSmartRedirect = () => {
  const { userInfo } = useAuth();
  const { count, isLoading } = useTransformationCount();

  /**
   * Determina a URL de redirecionamento baseada no status do usuário
   * @param productUrl - URL original do produto
   * @returns URL de destino (produto ou transformações)
   */
  const getRedirectUrl = useCallback((productUrl: string): string => {
    // Não logado → /transformacoes
    if (!userInfo) {
      return '/transformacoes';
    }
    
    // Logado mas sem transformações → /transformacoes
    if (count === 0) {
      return '/transformacoes';
    }
    
    // Logado com transformações → página do produto
    return productUrl;
  }, [userInfo, count]);

  /**
   * Verifica se deve redirecionar para transformações
   * @returns true se deve redirecionar para /transformacoes
   */
  const shouldRedirectToTransformations = useCallback((): boolean => {
    return !userInfo || count === 0;
  }, [userInfo, count]);

  return {
    getRedirectUrl,
    shouldRedirectToTransformations,
    isLoading,
    userInfo,
    transformationCount: count
  };
}; 