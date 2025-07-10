import { useEffect, useRef } from 'react';

/**
 * Hook para detectar cliques fora de um elemento
 * @param callback - Função chamada quando clica fora
 * @param enabled - Se o hook está ativo (opcional, default: true)
 */
export const useOutsideClick = <T extends HTMLElement = HTMLElement>(
  callback: () => void,
  enabled: boolean = true
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Verificar se o clique foi fora do elemento
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    // Adicionar event listeners para mouse e touch
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [callback, enabled]);

  return ref;
}; 