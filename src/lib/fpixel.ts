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