import { useState, useEffect, useCallback, useRef } from 'react';
import { CartItem } from '@/lib/cart/cartTypes';
import { useAuth } from '@/hooks/useAuth';

interface ShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  region?: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
}

interface UseShippingCalculationResult {
  shippingCost: number | null;
  isLoadingShipping: boolean;
  shippingError: string | null;
  calculateShipping: (cartItems: CartItem[], address: ShippingAddress) => Promise<void>;
  calculateShippingDebounced: (cartItems: CartItem[], address: ShippingAddress) => void;
}

export const useShippingCalculation = (): UseShippingCalculationResult => {
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const { session } = useAuth();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const calculateShipping = useCallback(async (cartItems: CartItem[], address: ShippingAddress) => {
    if (cartItems.length === 0 || !address) {
      setShippingCost(null);
      return;
    }

    setIsLoadingShipping(true);
    setShippingError(null);

    try {
      const token = session?.access_token;
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/printify/calculate-shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          line_items: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            customizations: {
              variantId: item.customizations.variantId,
            },
          })),
          address_to: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate shipping');
      }

      if (data.success && typeof data.cheapestCost === 'number') {
        setShippingCost(data.cheapestCost);
      } else {
        throw new Error('Invalid shipping calculation response');
      }

    } catch (error) {
      setShippingError(error instanceof Error ? error.message : 'Unknown error');
      setShippingCost(null);
    } finally {
      setIsLoadingShipping(false);
    }
  }, [session?.access_token]);

  // Função com debouncing para evitar múltiplas chamadas rápidas
  const calculateShippingDebounced = useCallback((cartItems: CartItem[], address: ShippingAddress) => {
    // Limpa o timer anterior se existir
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Se não houver itens ou morada, não faz nada
    if (cartItems.length === 0 || !address) {
      setShippingCost(null);
      return;
    }

    // Cria um novo timer que será executado após 500ms
    debounceTimer.current = setTimeout(() => {
      calculateShipping(cartItems, address);
    }, 500); // Atraso de 500ms para debouncing
  }, [calculateShipping]);

  // Limpa o timer quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    shippingCost,
    isLoadingShipping,
    shippingError,
    calculateShipping,
    calculateShippingDebounced,
  };
}; 