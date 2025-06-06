import { trackEvent } from '@/lib/posthog';

interface SEOTrackingData {
  user_id?: string | null;
  page_path: string;
  page_title: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  search_query?: string;
  organic_traffic?: boolean;
}

// Track organic search traffic
export function trackOrganicTraffic(data: Partial<SEOTrackingData> = {}) {
  const url = new URL(window.location.href);
  const referrer = document.referrer;
  const searchParams = new URLSearchParams(url.search);
  
  // Detect if traffic is from organic search
  const organicDomains = [
    'google.com', 'google.pt', 'google.br',
    'bing.com', 'yahoo.com', 'duckduckgo.com',
    'baidu.com', 'yandex.com'
  ];
  
  const isOrganic = organicDomains.some(domain => 
    referrer.includes(domain) && !referrer.includes('ads')
  );
  
  // Extract search query if available
  let searchQuery: string | undefined;
  if (referrer.includes('google.com')) {
    const referrerUrl = new URL(referrer);
    searchQuery = referrerUrl.searchParams.get('q') || undefined;
  }
  
  const trackingData: SEOTrackingData = {
    page_path: window.location.pathname,
    page_title: document.title,
    referrer: referrer || 'direct',
    utm_source: searchParams.get('utm_source') || undefined,
    utm_medium: searchParams.get('utm_medium') || undefined,
    utm_campaign: searchParams.get('utm_campaign') || undefined,
    search_query: searchQuery,
    organic_traffic: isOrganic,
    ...data
  };
  
  // Convert data to proper format for tracking
  const eventData = Object.fromEntries(
    Object.entries(trackingData).filter(([, value]) => value != null)
  ) as Record<string, string | number | boolean>;

  if (isOrganic) {
    trackEvent('organic_search_visit', eventData);
  } else if (trackingData.utm_source) {
    trackEvent('campaign_visit', eventData);
  } else {
    trackEvent('direct_visit', eventData);
  }
}

// Track SEO performance metrics
export function trackSEOMetrics(data: {
  user_id?: string | null;
  time_to_first_interaction?: number;
  bounce_rate_indicator?: boolean;
  pages_per_session?: number;
  conversion_type?: 'signup' | 'purchase' | 'transformation' | 'community_engagement';
}) {
  trackEvent('seo_performance_metrics', {
    ...data,
    page_path: window.location.pathname,
    session_id: sessionStorage.getItem('session_id') || 'unknown',
    timestamp: new Date().toISOString()
  });
}

// Track search query performance
export function trackSearchQueryPerformance(query: string, results_count: number) {
  trackEvent('internal_search', {
    search_query: query,
    results_count,
    page_path: window.location.pathname,
    timestamp: new Date().toISOString()
  });
}

// Track content engagement for SEO
export function trackContentEngagement(data: {
  user_id?: string | null;
  content_type: 'gallery' | 'pricing' | 'community' | 'blog' | 'faq';
  engagement_depth: 'surface' | 'medium' | 'deep';
  time_spent_seconds: number;
}) {
  trackEvent('content_engagement', {
    ...data,
    page_path: window.location.pathname,
    user_agent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
}

// Track feature discovery through SEO
export function trackFeatureDiscovery(feature: string, discovery_method: 'organic' | 'navigation' | 'social') {
  trackEvent('feature_discovery', {
    feature_name: feature,
    discovery_method,
    page_path: window.location.pathname,
    referrer: document.referrer,
    timestamp: new Date().toISOString()
  });
} 