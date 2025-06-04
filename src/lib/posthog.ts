import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  // Debug logs para verificar se as variáveis estão a ser carregadas
  console.log('🔥 PostHog Debug - INIT START');
  console.log('NEXT_PUBLIC_POSTHOG_KEY:', process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'EXISTS' : 'MISSING');
  console.log('NEXT_PUBLIC_POSTHOG_HOST:', process.env.NEXT_PUBLIC_POSTHOG_HOST || 'DEFAULT');
  
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';
  
  if (!posthogKey) {
    console.error('❌ PostHog Key is missing!');
  } else {
    console.log('✅ PostHog Key found, initializing...');
    
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only',
      capture_pageview: false, // Controlamos manualmente
      capture_pageleave: true,
      debug: true, // SEMPRE debug para verificar
      loaded: function(posthog) {
        console.log('✅ PostHog loaded successfully!', posthog);
      },
      bootstrap: {
        // Força reinicialização se necessário
        featureFlags: {},
      },
    });
    
    console.log('🔥 PostHog initialization completed');
  }
}

export { posthog }

// Helper functions para tracking com debug
export const trackEvent = (eventName: string, properties?: Record<string, string | number | boolean | null>) => {
  if (typeof window !== 'undefined') {
    console.log('🔥 TRACKING EVENT:', eventName, properties);
    
    if (!posthog.__loaded) {
      console.warn('⚠️ PostHog not loaded yet, queuing event:', eventName);
    }
    
    posthog.capture(eventName, properties);
    console.log('✅ Event sent to PostHog');
  } else {
    console.log('🔴 Event skipped (server-side):', eventName);
  }
}

export const identifyUser = (userId: string, properties?: Record<string, string | number | boolean | null>) => {
  if (typeof window !== 'undefined') {
    console.log('🔥 IDENTIFYING USER:', userId, properties);
    posthog.identify(userId, properties);
    console.log('✅ User identified in PostHog');
  }
}

export const resetUser = () => {
  if (typeof window !== 'undefined') {
    console.log('🔥 RESETTING USER');
    posthog.reset();
    console.log('✅ User reset in PostHog');
  }
} 