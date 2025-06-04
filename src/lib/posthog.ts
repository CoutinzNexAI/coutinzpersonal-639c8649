import posthog from 'posthog-js'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only', // Para tracking anônimo + identificado
    capture_pageview: false, // Vamos controlar pageviews manualmente
    capture_pageleave: true,
    debug: process.env.NODE_ENV === 'development',
  })
}

export { posthog }

// Helper functions para tracking
export const trackEvent = (eventName: string, properties?: Record<string, string | number | boolean | null>) => {
  if (typeof window !== 'undefined') {
    posthog.capture(eventName, properties)
  }
}

export const identifyUser = (userId: string, properties?: Record<string, string | number | boolean | null>) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, properties)
  }
}

export const resetUser = () => {
  if (typeof window !== 'undefined') {
    posthog.reset()
  }
} 