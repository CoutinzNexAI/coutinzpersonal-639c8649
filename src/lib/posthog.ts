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

// Utility function to get device and browser info
function getDeviceInfo() {
  return {
    user_agent: navigator.userAgent,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    device_pixel_ratio: window.devicePixelRatio,
    is_mobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    is_tablet: /iPad|Android.*tablet|Windows.*tablet/i.test(navigator.userAgent),
    browser: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/)?.[0] || 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform
  };
}

// Utility function to get acquisition context
function getAcquisitionContext() {
  return {
    referrer: document.referrer || 'direct',
    referrer_domain: document.referrer ? new URL(document.referrer).hostname : null,
    utm_source: new URLSearchParams(window.location.search).get('utm_source'),
    utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
    utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
    utm_content: new URLSearchParams(window.location.search).get('utm_content'),
    utm_term: new URLSearchParams(window.location.search).get('utm_term'),
    url: window.location.href,
    path: window.location.pathname,
    query_params: window.location.search
  };
}

// 🎯 FUNNEL TRACKING FUNCTIONS

export function trackFunnelStep(step: string, data: Record<string, unknown> = {}) {
  const stepStartTime = Date.now();
  
  trackEvent(`funnel_${step}`, {
    ...data,
    funnel_step: step,
    step_timestamp: new Date().toISOString(),
    step_start_time: stepStartTime,
    session_id: generateSessionId(),
    ...getDeviceInfo(),
    ...getAcquisitionContext()
  });

  // Store in localStorage for timing calculations
  localStorage.setItem(`funnel_${step}_start`, stepStartTime.toString());
}

// Landing page visit
export function trackLandingPageVisit(data: Record<string, unknown> = {}) {
  trackFunnelStep('landing_page_visit', {
    ...data,
    page_title: document.title,
    first_visit: !localStorage.getItem('has_visited_before'),
    session_start: true
  });
  
  localStorage.setItem('has_visited_before', 'true');
  localStorage.setItem('session_start_time', Date.now().toString());
}

// Image upload funnel tracking
export function trackImageUploadStart(data: Record<string, unknown> = {}) {
  const landingTime = localStorage.getItem('funnel_landing_page_visit_start');
  const timeFromLanding = landingTime ? Date.now() - parseInt(landingTime) : null;
  
  trackFunnelStep('image_upload_start', {
    ...data,
    time_from_landing_ms: timeFromLanding,
    upload_attempt_number: getUploadAttemptNumber()
  });
}

export function trackImageUploadSuccess(data: Record<string, unknown> = {}) {
  const uploadStartTime = localStorage.getItem('funnel_image_upload_start_start');
  const uploadDuration = uploadStartTime ? Date.now() - parseInt(uploadStartTime) : null;
  
  trackFunnelStep('image_upload_success', {
    ...data,
    upload_duration_ms: uploadDuration,
    upload_success: true
  });
}

// Style selection funnel tracking
export function trackStyleSelectionStart(data: Record<string, unknown> = {}) {
  const uploadTime = localStorage.getItem('funnel_image_upload_success_start');
  const timeFromUpload = uploadTime ? Date.now() - parseInt(uploadTime) : null;
  
  trackFunnelStep('style_selection_start', {
    ...data,
    time_from_upload_ms: timeFromUpload
  });
}

export function trackStyleSelected(data: Record<string, unknown> = {}) {
  const selectionStartTime = localStorage.getItem('funnel_style_selection_start_start');
  const selectionDuration = selectionStartTime ? Date.now() - parseInt(selectionStartTime) : null;
  
  trackFunnelStep('style_selected', {
    ...data,
    selection_duration_ms: selectionDuration,
    style_selection_complete: true
  });
}

// Transformation process funnel tracking
export function trackTransformationProcessStart(data: Record<string, unknown> = {}) {
  const styleTime = localStorage.getItem('funnel_style_selected_start');
  const timeFromStyle = styleTime ? Date.now() - parseInt(styleTime) : null;
  
  trackFunnelStep('transformation_process_start', {
    ...data,
    time_from_style_selection_ms: timeFromStyle,
    transformation_initiated: true
  });
}

export function trackTransformationProcessComplete(data: Record<string, unknown> = {}) {
  const processStartTime = localStorage.getItem('funnel_transformation_process_start_start');
  const processDuration = processStartTime ? Date.now() - parseInt(processStartTime) : null;
  const landingTime = localStorage.getItem('funnel_landing_page_visit_start');
  const totalJourneyTime = landingTime ? Date.now() - parseInt(landingTime) : null;
  
  trackFunnelStep('transformation_complete', {
    ...data,
    processing_duration_ms: processDuration,
    total_journey_time_ms: totalJourneyTime,
    conversion_complete: true,
    funnel_conversion: true
  });
  
  // Clear funnel data after successful conversion
  clearFunnelData();
}

// Error/abandonment tracking
export function trackFunnelAbandonment(step: string, reason: string, data: Record<string, unknown> = {}) {
  const stepStartTime = localStorage.getItem(`funnel_${step}_start`);
  const timeOnStep = stepStartTime ? Date.now() - parseInt(stepStartTime) : null;
  const landingTime = localStorage.getItem('funnel_landing_page_visit_start');
  const totalTimeToAbandon = landingTime ? Date.now() - parseInt(landingTime) : null;
  
  trackEvent('funnel_abandonment', {
    ...data,
    abandoned_at_step: step,
    abandonment_reason: reason,
    time_on_step_ms: timeOnStep,
    total_time_to_abandon_ms: totalTimeToAbandon,
    funnel_incomplete: true,
    ...getDeviceInfo(),
    ...getAcquisitionContext()
  });
}

// Drop-off point tracking
export function trackDropOff(fromStep: string, expectedNextStep: string, data: Record<string, unknown> = {}) {
  trackEvent('funnel_drop_off', {
    ...data,
    from_step: fromStep,
    expected_next_step: expectedNextStep,
    drop_off_point: true,
    timestamp: new Date().toISOString()
  });
}

// 💰 PICCOINS ECONOMICS TRACKING

export function trackPicCoinEvent(event: string, data: Record<string, unknown> = {}) {
  trackEvent(`piccoin_${event}`, {
    ...data,
    economics_event: true,
    timestamp: new Date().toISOString()
  });
}

export function trackPicCoinEarning(amount: number, source: string, data: Record<string, unknown> = {}) {
  trackPicCoinEvent('earned', {
    ...data,
    amount,
    source,
    transaction_type: 'earn'
  });
}

export function trackPicCoinSpending(amount: number, purpose: string, data: Record<string, unknown> = {}) {
  trackPicCoinEvent('spent', {
    ...data,
    amount,
    purpose,
    transaction_type: 'spend'
  });
}

export function trackPicCoinPurchase(amount: number, price: number, method: string, data: Record<string, unknown> = {}) {
  trackPicCoinEvent('purchased', {
    ...data,
    amount,
    price_eur: price,
    payment_method: method,
    transaction_type: 'purchase',
    conversion_value: price
  });
}

export function trackPicCoinBalance(balance: number, data: Record<string, unknown> = {}) {
  trackPicCoinEvent('balance_checked', {
    ...data,
    current_balance: balance,
    balance_check: true
  });
}

export function trackPicCoinRefund(amount: number, reason: string, data: Record<string, unknown> = {}) {
  trackPicCoinEvent('refunded', {
    ...data,
    amount,
    refund_reason: reason,
    transaction_type: 'refund'
  });
}

// 🎮 BEHAVIORAL MICRO-EVENTS

export function trackHover(element: string, data: Record<string, unknown> = {}) {
  trackEvent('element_hover', {
    ...data,
    element_type: element,
    interaction_type: 'hover',
    timestamp: new Date().toISOString()
  });
}

export function trackScroll(depth: number, data: Record<string, unknown> = {}) {
  trackEvent('page_scroll', {
    ...data,
    scroll_depth_percent: depth,
    scroll_milestone: true,
    timestamp: new Date().toISOString()
  });
}

export function trackTimeOnPage(duration: number, page: string, data: Record<string, unknown> = {}) {
  trackEvent('time_on_page', {
    ...data,
    duration_seconds: duration,
    page_name: page,
    engagement_metric: true
  });
}

export function trackElementVisible(element: string, data: Record<string, unknown> = {}) {
  trackEvent('element_visible', {
    ...data,
    element_type: element,
    visibility_event: true,
    timestamp: new Date().toISOString()
  });
}

// 👥 COHORT & LIFECYCLE TRACKING

export function trackUserLifecycleStage(stage: string, data: Record<string, unknown> = {}) {
  trackEvent('user_lifecycle_stage', {
    ...data,
    lifecycle_stage: stage,
    stage_timestamp: new Date().toISOString()
  });
}

export function trackReturnVisit(daysSinceLastVisit: number, data: Record<string, unknown> = {}) {
  trackEvent('return_visit', {
    ...data,
    days_since_last_visit: daysSinceLastVisit,
    return_visitor: true,
    retention_event: true
  });
}

export function trackFeatureAdoption(feature: string, isFirstTime: boolean, data: Record<string, unknown> = {}) {
  trackEvent('feature_adoption', {
    ...data,
    feature_name: feature,
    first_time_use: isFirstTime,
    adoption_event: true
  });
}

// 🔄 SESSION & ENGAGEMENT TRACKING

export function trackSessionStart(data: Record<string, unknown> = {}) {
  const sessionId = generateSessionId();
  localStorage.setItem('current_session_id', sessionId);
  
  trackEvent('session_start', {
    ...data,
    session_id: sessionId,
    session_start_time: new Date().toISOString(),
    ...getDeviceInfo(),
    ...getAcquisitionContext()
  });
}

export function trackSessionEnd(duration: number, data: Record<string, unknown> = {}) {
  const sessionId = localStorage.getItem('current_session_id');
  
  trackEvent('session_end', {
    ...data,
    session_id: sessionId,
    session_duration_seconds: duration,
    session_end_time: new Date().toISOString()
  });
}

// 🛠️ UTILITY FUNCTIONS

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getUploadAttemptNumber(): number {
  const attempts = localStorage.getItem('upload_attempts');
  const count = attempts ? parseInt(attempts) + 1 : 1;
  localStorage.setItem('upload_attempts', count.toString());
  return count;
}

function clearFunnelData(): void {
  const keys = Object.keys(localStorage).filter(key => key.startsWith('funnel_'));
  keys.forEach(key => localStorage.removeItem(key));
  localStorage.removeItem('upload_attempts');
}

// 📍 AUTOMATIC SCROLL DEPTH TRACKING
let maxScrollDepth = 0;
let scrollMilestones = [25, 50, 75, 90, 100];

export function initializeScrollTracking() {
  if (typeof window === 'undefined') return;
  
  const handleScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    
    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = scrollPercent;
      
      // Track milestone achievements
      scrollMilestones.forEach(milestone => {
        if (scrollPercent >= milestone && maxScrollDepth >= milestone) {
          trackScroll(milestone, {
            page_url: window.location.href,
            milestone_reached: milestone
          });
          // Remove milestone to avoid duplicate tracking
          scrollMilestones = scrollMilestones.filter(m => m !== milestone);
        }
      });
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Cleanup function
  return () => window.removeEventListener('scroll', handleScroll);
}

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  // Initialize scroll tracking when the module loads
  document.addEventListener('DOMContentLoaded', initializeScrollTracking);
} 