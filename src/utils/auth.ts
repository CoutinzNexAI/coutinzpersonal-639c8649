/**
 * Google OAuth2 Configuration
 */

const GOOGLE_CLIENT_ID = '224760312428-1hukt2gnj04iq1p3unrfgr1capuvjmcq.apps.googleusercontent.com';
const REDIRECT_URI = 
  typeof window !== 'undefined' 
    ? `${window.location.origin}/api/auth/google/callback`
    : 'https://diogocoutinho.com/api/auth/google/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Get the Google OAuth authorization URL
 */
export const getGoogleAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Check if user is authenticated by checking for auth params
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const params = new URLSearchParams(window.location.search);
  return params.get('auth') === 'success';
};


