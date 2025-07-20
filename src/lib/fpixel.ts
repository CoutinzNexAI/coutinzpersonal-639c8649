export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

declare global {
  interface Window {
    fbq: (command: string, eventName?: string, parameters?: object) => void;
  }
}

export const grantConsent = (): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('consent', 'grant');
  }
};

export const revokeConsent = (): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('consent', 'revoke');
  }
};

export const pageview = (): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
};

export const event = (name: string, options: object = {}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', name, options);
  }
};

// 🚀 NOVOS EVENTOS AVANÇADOS PARA FACEBOOK PIXEL

// ViewContent - Quando utilizador vê um produto
export const viewContent = (options: {
  content_name: string;
  content_ids: string[];
  content_type: 'product' | 'product_group';
  value?: number;
  currency?: string;
  content_category?: string;
}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'ViewContent', {
      content_name: options.content_name,
      content_ids: options.content_ids,
      content_type: options.content_type,
      value: options.value || 0,
      currency: options.currency || 'EUR',
      content_category: options.content_category || 'personalized_products'
    });
  }
};

// Search - Quando utilizador faz pesquisa
export const search = (options: {
  search_string: string;
  content_category?: string;
  content_ids?: string[];
}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Search', {
      search_string: options.search_string,
      content_category: options.content_category || 'products',
      content_ids: options.content_ids || []
    });
  }
};

// AddToWishlist - Quando adiciona à wishlist/favoritos
export const addToWishlist = (options: {
  content_name: string;
  content_ids: string[];
  content_type: 'product';
  value: number;
  currency?: string;
}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'AddToWishlist', {
      content_name: options.content_name,
      content_ids: options.content_ids,
      content_type: options.content_type,
      value: options.value,
      currency: options.currency || 'EUR'
    });
  }
};

// InitiateCheckout - Quando inicia processo de checkout
export const initiateCheckout = (options: {
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  value: number;
  currency?: string;
  num_items: number;
}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: options.content_ids,
      contents: options.contents,
      content_type: 'product',
      value: options.value,
      currency: options.currency || 'EUR',
      num_items: options.num_items
    });
  }
};

// AddPaymentInfo - Quando adiciona informações de pagamento
export const addPaymentInfo = (options: {
  content_ids: string[];
  value: number;
  currency?: string;
  payment_method?: string;
}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'AddPaymentInfo', {
      content_ids: options.content_ids,
      content_type: 'product',
      value: options.value,
      currency: options.currency || 'EUR',
      payment_method: options.payment_method || 'card'
    });
  }
};

// Purchase - Versão melhorada com detalhes dos items
export const purchase = (options: {
  value: number;
  currency?: string;
  content_ids: string[];
  contents: Array<{
    id: string;
    quantity: number;
    item_price: number;
  }>;
  num_items: number;
  order_id: string;
  content_type?: string;
}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Purchase', {
      value: options.value,
      currency: options.currency || 'EUR',
      content_ids: options.content_ids,
      contents: options.contents,
      content_type: options.content_type || 'product',
      num_items: options.num_items,
      order_id: options.order_id
    });
  }
};

// CompleteRegistration - Quando utilizador completa registo
export const completeRegistration = (options: {
  content_name?: string;
  status?: boolean;
  method?: string;
}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'CompleteRegistration', {
      content_name: options.content_name || 'Account Registration',
      status: options.status !== false,
      method: options.method || 'google'
    });
  }
};

// Lead - Quando utilizador demonstra interesse (ex: newsletter, contacto)
export const lead = (options: {
  content_name: string;
  content_category?: string;
  value?: number;
  currency?: string;
}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', {
      content_name: options.content_name,
      content_category: options.content_category || 'engagement',
      value: options.value || 0,
      currency: options.currency || 'EUR'
    });
  }
};

// StartTrial - Quando inicia período de teste/gratuito
export const startTrial = (options: {
  content_name: string;
  value?: number;
  currency?: string;
  predicted_ltv?: number;
}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'StartTrial', {
      content_name: options.content_name,
      value: options.value || 0,
      currency: options.currency || 'EUR',
      predicted_ltv: options.predicted_ltv || 25
    });
  }
};

// Subscribe - Quando subscreve serviço/newsletter
export const subscribe = (options: {
  content_name: string;
  value?: number;
  currency?: string;
  predicted_ltv?: number;
}): void => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Subscribe', {
      content_name: options.content_name,
      value: options.value || 0,
      currency: options.currency || 'EUR',
      predicted_ltv: options.predicted_ltv || 50
    });
  }
};

// 🎯 HELPER FUNCTION - Verifica se deve trackar baseado no consentimento
export const shouldTrack = (): boolean => {
  return typeof window !== 'undefined' && localStorage.getItem('cookie_consent') === 'granted';
};

// 🎯 WRAPPER FUNCTIONS - Versões que verificam consentimento automaticamente
export const trackViewContent = (options: Parameters<typeof viewContent>[0]): void => {
  if (shouldTrack()) {
    viewContent(options);
  }
};

export const trackSearch = (options: Parameters<typeof search>[0]): void => {
  if (shouldTrack()) {
    search(options);
  }
};

export const trackAddToWishlist = (options: Parameters<typeof addToWishlist>[0]): void => {
  if (shouldTrack()) {
    addToWishlist(options);
  }
};

export const trackInitiateCheckout = (options: Parameters<typeof initiateCheckout>[0]): void => {
  if (shouldTrack()) {
    initiateCheckout(options);
  }
};

export const trackAddPaymentInfo = (options: Parameters<typeof addPaymentInfo>[0]): void => {
  if (shouldTrack()) {
    addPaymentInfo(options);
  }
};

export const trackPurchase = (options: Parameters<typeof purchase>[0]): void => {
  if (shouldTrack()) {
    purchase(options);
  }
};

export const trackCompleteRegistration = (options: Parameters<typeof completeRegistration>[0] = {}): void => {
  if (shouldTrack()) {
    completeRegistration(options);
  }
};

export const trackLead = (options: Parameters<typeof lead>[0]): void => {
  if (shouldTrack()) {
    lead(options);
  }
};

export const trackStartTrial = (options: Parameters<typeof startTrial>[0]): void => {
  if (shouldTrack()) {
    startTrial(options);
  }
};

export const trackSubscribe = (options: Parameters<typeof subscribe>[0]): void => {
  if (shouldTrack()) {
    subscribe(options);
  }
};