// src/lib/fpixel.ts
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

declare global {
  interface Window {
    fbq: (command: string, eventName?: string, parameters?: object) => void;
  }
}

// Função para disparar o evento PageView
export const pageview = (): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
};

// Função genérica para disparar eventos personalizados (ex: AddToCart, Purchase)
export const event = (name: string, options: object = {}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', name, options);
  }
}; 