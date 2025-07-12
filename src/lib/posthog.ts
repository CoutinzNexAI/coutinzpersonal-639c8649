import posthog from 'posthog-js'

// Função para verificar se é conta de teste
const isTestAccount = (email?: string | null, userId?: string | null): boolean => {
  const testEmails = ['diogolemecoutinho@gmail.com'];
  const testUserIds: string[] = []; // Adiciona IDs de usuário de teste aqui se necessário
  
  return (email && testEmails.includes(email.toLowerCase())) || 
         (userId && testUserIds.includes(userId));
};

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
    // Verifica se é conta de teste antes de enviar eventos
    const userEmail = posthog.get_property('$email') || properties?.email || properties?.user_email;
    const userId = posthog.get_property('$user_id') || properties?.user_id;
    
    if (isTestAccount(userEmail as string, userId as string)) {
      return;
    }
    
    posthog.capture(eventName, properties)
  }
}

export const identifyUser = (userId: string, properties?: Record<string, string | number | boolean | null>) => {
  if (typeof window !== 'undefined') {
    const userEmail = properties?.email;
    
    if (isTestAccount(userEmail as string, userId)) {
      // Para contas de teste, vamos parar o session recording se estiver ativo
      posthog.stopSessionRecording();
      return;
    }
    
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

// PicCoin tracking functions removed since piccoins system was deprecated

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

// 🛒 E-COMMERCE TRACKING FUNCTIONS

export function trackAddToCart(data: {
  user_id: string;
  product_id: string;
  product_name: string;
  product_category: string;
  variant_id?: number;
  variant_name?: string;
  price: number;
  quantity: number;
  cart_total_items: number;
  cart_total_value: number;
  customizations: Record<string, unknown>;
  time_on_product_page?: number;
  mockup_views?: number;
  position_adjustments?: number;
}) {
  trackEvent('add_to_cart', {
    ...data,
    customizations: JSON.stringify(data.customizations),
    revenue_event: true,
    timestamp: new Date().toISOString(),
    session_id: generateSessionId(),
    ...getDeviceInfo(),
    ...getAcquisitionContext()
  });
}

export function trackRemoveFromCart(data: {
  user_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  cart_total_items: number;
  cart_total_value: number;
  removal_reason?: 'user_action' | 'quantity_change' | 'clear_cart';
}) {
  trackEvent('remove_from_cart', {
    ...data,
    revenue_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackCartView(data: {
  user_id: string;
  cart_items: number;
  cart_value: number;
  view_source: 'sidebar' | 'bottom_sheet' | 'page';
  items_by_category: Record<string, number>;
  discount_applied?: number;
  shipping_cost?: number;
}) {
  trackEvent('cart_view', {
    ...data,
    items_by_category: JSON.stringify(data.items_by_category),
    revenue_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackCheckoutStarted(data: {
  user_id: string;
  cart_items: number;
  cart_value: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  checkout_source: 'cart_sidebar' | 'cart_bottom_sheet' | 'product_page';
  items_by_category: Record<string, number>;
}) {
  trackEvent('checkout_started', {
    ...data,
    items_by_category: JSON.stringify(data.items_by_category),
    revenue_event: true,
    conversion_event: true,
    timestamp: new Date().toISOString(),
    session_id: generateSessionId(),
    ...getDeviceInfo(),
    ...getAcquisitionContext()
  });
}

export function trackPurchaseCompleted(data: {
  user_id: string;
  order_id: string;
  order_reference: string;
  payment_method: string;
  total_amount: number;
  discount_amount: number;
  shipping_cost: number;
  items_count: number;
  items_by_category: Record<string, number>;
  customer_type: 'new' | 'returning';
  order_processing_time?: number;
  transformation_to_purchase_time?: number;
}) {
  trackEvent('purchase_completed', {
    ...data,
    items_by_category: JSON.stringify(data.items_by_category),
    revenue_event: true,
    conversion_event: true,
    high_value_event: true,
    timestamp: new Date().toISOString(),
    session_id: generateSessionId(),
    ...getDeviceInfo(),
    ...getAcquisitionContext()
  });
}

export function trackCartAbandonment(data: {
  user_id: string;
  cart_items: number;
  cart_value: number;
  time_in_cart: number;
  abandonment_stage: 'cart_view' | 'checkout_started' | 'payment_info' | 'final_step';
  last_interaction: string;
  items_by_category: Record<string, number>;
}) {
  trackEvent('cart_abandonment', {
    ...data,
    items_by_category: JSON.stringify(data.items_by_category),
    revenue_event: true,
    abandonment_event: true,
    timestamp: new Date().toISOString(),
  });
}

// 🎨 PRODUCT INTERACTION TRACKING

export function trackProductView(data: {
  user_id?: string;
  product_id: string;
  product_name: string;
  product_category: string;
  product_price: number;
  view_source: 'shop_page' | 'category_page' | 'search' | 'direct_link';
  has_selected_image: boolean;
  referrer_product?: string;
}) {
  trackEvent('product_view', {
    ...data,
    engagement_event: true,
    timestamp: new Date().toISOString(),
    session_id: generateSessionId(),
    ...getDeviceInfo(),
    ...getAcquisitionContext()
  });
}

export function trackVariantSelection(data: {
  user_id: string;
  product_id: string;
  variant_id: number;
  variant_name: string;
  price_change: number;
  selection_method: 'dropdown' | 'button' | 'auto';
  previous_variant_id?: number;
  time_to_select?: number;
}) {
  trackEvent('variant_selected', {
    ...data,
    personalization_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackImageCustomization(data: {
  user_id: string;
  product_id: string;
  action: 'position_change' | 'scale_change' | 'rotation_change' | 'crop_change';
  from_value: number | string;
  to_value: number | string;
  adjustment_count: number;
  total_time_customizing: number;
}) {
  trackEvent('image_customization', {
    ...data,
    personalization_event: true,
    engagement_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackMockupGeneration(data: {
  user_id: string;
  product_id: string;
  variant_id?: number;
  generation_trigger: 'image_upload' | 'variant_change' | 'position_change' | 'manual';
  generation_time_ms: number;
  success: boolean;
  error_message?: string;
  mockup_count: number;
}) {
  trackEvent('mockup_generation', {
    ...data,
    technical_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackMockupInteraction(data: {
  user_id: string;
  product_id: string;
  interaction_type: 'view' | 'zoom' | 'navigate' | 'share' | 'download';
  mockup_index: number;
  total_mockups: number;
  time_viewing_ms: number;
}) {
  trackEvent('mockup_interaction', {
    ...data,
    engagement_event: true,
    timestamp: new Date().toISOString(),
  });
}

// 🎯 PERSONALIZATION & CUSTOMIZATION TRACKING

export function trackPersonalizationStart(data: {
  user_id: string;
  product_id: string;
  starting_configuration: Record<string, unknown>;
  entry_point: 'product_page' | 'gallery' | 'transformation_complete';
}) {
  trackEvent('personalization_start', {
    ...data,
    starting_configuration: JSON.stringify(data.starting_configuration),
    personalization_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackPersonalizationComplete(data: {
  user_id: string;
  product_id: string;
  final_configuration: Record<string, unknown>;
  total_adjustments: number;
  time_spent_personalizing: number;
  satisfaction_indicators: {
    mockup_views: number;
    position_adjustments: number;
    variant_changes: number;
  };
}) {
  trackEvent('personalization_complete', {
    ...data,
    final_configuration: JSON.stringify(data.final_configuration),
    satisfaction_indicators: JSON.stringify(data.satisfaction_indicators),
    personalization_event: true,
    engagement_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackDesignPreference(data: {
  user_id: string;
  product_category: string;
  preference_type: 'position' | 'scale' | 'variant' | 'style';
  preference_value: string | number;
  frequency: number;
  confidence_score: number;
}) {
  trackEvent('design_preference_learned', {
    ...data,
    personalization_event: true,
    ml_event: true,
    timestamp: new Date().toISOString(),
  });
}

// 📊 PERFORMANCE & TECHNICAL TRACKING

export function trackPagePerformance(data: {
  user_id?: string;
  page_path: string;
  load_time_ms: number;
  first_contentful_paint_ms: number;
  largest_contentful_paint_ms: number;
  cumulative_layout_shift: number;
  first_input_delay_ms?: number;
  connection_type: string;
  device_memory?: number;
}) {
  trackEvent('page_performance', {
    ...data,
    performance_event: true,
    timestamp: new Date().toISOString(),
    ...getDeviceInfo()
  });
}

export function trackApiPerformance(data: {
  user_id?: string;
  endpoint: string;
  method: string;
  response_time_ms: number;
  status_code: number;
  success: boolean;
  error_type?: string;
  retry_count?: number;
}) {
  trackEvent('api_performance', {
    ...data,
    performance_event: true,
    technical_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackError(data: {
  user_id?: string;
  error_type: 'javascript' | 'api' | 'network' | 'validation' | 'payment';
  error_message: string;
  error_stack?: string;
  page_path: string;
  user_action?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}) {
  trackEvent('error_occurred', {
    ...data,
    error_event: true,
    timestamp: new Date().toISOString(),
    session_id: generateSessionId(),
    ...getDeviceInfo()
  });
}

// 💰 REVENUE INTELLIGENCE TRACKING

export function trackRevenueOpportunity(data: {
  user_id: string;
  opportunity_type: 'upsell' | 'cross_sell' | 'bundle' | 'upgrade';
  suggested_product_id: string;
  current_cart_value: number;
  potential_additional_revenue: number;
  confidence_score: number;
  trigger_event: string;
}) {
  trackEvent('revenue_opportunity', {
    ...data,
    revenue_event: true,
    ml_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackPriceReaction(data: {
  user_id: string;
  product_id: string;
  price_shown: number;
  reaction_type: 'positive' | 'negative' | 'neutral';
  time_spent_on_price: number;
  proceeded_to_cart: boolean;
  discount_interest_indicators: number;
}) {
  trackEvent('price_reaction', {
    ...data,
    revenue_event: true,
    behavioral_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackDiscountEffectiveness(data: {
  user_id: string;
  discount_type: 'percentage' | 'fixed' | 'bulk' | 'free_shipping';
  discount_amount: number;
  original_price: number;
  final_price: number;
  conversion_boost: boolean;
  triggered_purchase: boolean;
}) {
  trackEvent('discount_effectiveness', {
    ...data,
    revenue_event: true,
    conversion_event: true,
    timestamp: new Date().toISOString(),
  });
}

// 🔄 ADVANCED USER JOURNEY TRACKING

export function trackValueRealization(data: {
  user_id: string;
  milestone: 'first_transformation' | 'first_mockup' | 'first_purchase' | 'first_repeat_purchase';
  time_to_milestone_hours: number;
  value_indicators: {
    engagement_score: number;
    satisfaction_indicators: number;
    usage_frequency: number;
  };
  next_predicted_action: string;
}) {
  trackEvent('value_realization', {
    ...data,
    value_indicators: JSON.stringify(data.value_indicators),
    lifecycle_event: true,
    high_value_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackFeatureAdoptionDepth(data: {
  user_id: string;
  feature_name: string;
  adoption_level: 'discovered' | 'tried' | 'adopted' | 'mastered';
  usage_frequency: number;
  feature_value_score: number;
  time_to_adoption_hours: number;
}) {
  trackEvent('feature_adoption_depth', {
    ...data,
    adoption_event: true,
    engagement_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackCrossSessionBehavior(data: {
  user_id: string;
  session_count: number;
  avg_session_duration: number;
  behavior_pattern: string;
  engagement_trend: 'increasing' | 'decreasing' | 'stable';
  retention_risk_score: number;
  value_growth_trajectory: string;
}) {
  trackEvent('cross_session_behavior', {
    ...data,
    behavioral_event: true,
    retention_event: true,
    ml_event: true,
    timestamp: new Date().toISOString(),
  });
}

// 🎪 ENGAGEMENT & INTERACTION TRACKING

export function trackEngagementQuality(data: {
  user_id: string;
  page_path: string;
  engagement_score: number;
  interactions_count: number;
  meaningful_actions: number;
  time_spent_active: number;
  scroll_depth_max: number;
  content_consumed_percent: number;
}) {
  trackEvent('engagement_quality', {
    ...data,
    engagement_event: true,
    behavioral_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackContentInteraction(data: {
  user_id?: string;
  content_type: 'gallery' | 'product' | 'tutorial' | 'testimonial' | 'faq';
  content_id: string;
  interaction_type: 'view' | 'click' | 'share' | 'bookmark' | 'download';
  interaction_depth: number;
  time_engaged: number;
}) {
  trackEvent('content_interaction', {
    ...data,
    engagement_event: true,
    content_event: true,
    timestamp: new Date().toISOString(),
  });
}

// 🔬 A/B TESTING & EXPERIMENTATION

export function trackExperimentExposure(data: {
  user_id?: string;
  experiment_id: string;
  experiment_name: string;
  variant: string;
  treatment_group: string;
  exposure_context: string;
}) {
  trackEvent('experiment_exposure', {
    ...data,
    experiment_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackExperimentConversion(data: {
  user_id: string;
  experiment_id: string;
  variant: string;
  conversion_type: string;
  conversion_value?: number;
  time_to_conversion: number;
}) {
  trackEvent('experiment_conversion', {
    ...data,
    experiment_event: true,
    conversion_event: true,
    timestamp: new Date().toISOString(),
  });
}

// 📱 MOBILE-SPECIFIC TRACKING

export function trackMobileGesture(data: {
  user_id?: string;
  gesture_type: 'swipe' | 'pinch' | 'double_tap' | 'long_press';
  element_target: string;
  gesture_success: boolean;
  intended_action: string;
}) {
  trackEvent('mobile_gesture', {
    ...data,
    mobile_event: true,
    interaction_event: true,
    timestamp: new Date().toISOString(),
  });
}

export function trackMobileUsability(data: {
  user_id?: string;
  usability_issue: 'touch_target_small' | 'scroll_difficulty' | 'load_slow' | 'navigation_unclear';
  severity: 'low' | 'medium' | 'high';
  page_path: string;
  device_info: string;
}) {
  trackEvent('mobile_usability', {
    ...data,
    mobile_event: true,
    usability_event: true,
    timestamp: new Date().toISOString(),
  });
}

// 🌟 SATISFACTION & FEEDBACK TRACKING

export function trackSatisfactionSignal(data: {
  user_id: string;
  signal_type: 'explicit' | 'implicit';
  satisfaction_score: number;
  context: string;
  feedback_text?: string;
  improvement_suggestions?: string[];
}) {
  trackEvent('satisfaction_signal', {
    ...data,
    improvement_suggestions: data.improvement_suggestions ? JSON.stringify(data.improvement_suggestions) : null,
    satisfaction_event: true,
    feedback_event: true,
    timestamp: new Date().toISOString(),
  });
}

// 🎯 MARKETING ATTRIBUTION TRACKING

export function trackMarketingAttribution(data: {
  user_id?: string;
  attribution_model: 'first_click' | 'last_click' | 'linear' | 'time_decay';
  touchpoints: Array<{
    source: string;
    medium: string;
    campaign: string;
    timestamp: string;
    value_contribution: number;
  }>;
  conversion_value: number;
  attribution_confidence: number;
}) {
  trackEvent('marketing_attribution', {
    ...data,
    touchpoints: JSON.stringify(data.touchpoints),
    attribution_event: true,
    marketing_event: true,
    timestamp: new Date().toISOString(),
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

// 🔧 UTILITIES & DEBUG FUNCTIONS

// Função para verificar se o tracking está ativo para o usuário atual
export function isTrackingEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userEmail = posthog.get_property('$email');
  const userId = posthog.get_property('$user_id');
  
  return !isTestAccount(userEmail, userId);
}

// Função para debug - verificar estado atual do PostHog
export function getPostHogDebugInfo(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  
  return {
    userEmail: posthog.get_property('$email'),
    userId: posthog.get_property('$user_id'),
    isTestAccount: isTestAccount(posthog.get_property('$email'), posthog.get_property('$user_id')),
    trackingEnabled: isTrackingEnabled(),
    sessionRecordingEnabled: posthog.sessionRecordingStarted(),
    distinctId: posthog.get_distinct_id()
  };
}

// Função para forçar parar session recording (útil para debug)
export function forceStopSessionRecording(): void {
  if (typeof window !== 'undefined') {
    posthog.stopSessionRecording();
  }
} 