// Google Analytics 4
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: any;
    _fbq?: any;
  }
}

// Initialize GA4
export const initGA = () => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });
};

// Page view
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Custom event
export const trackEvent = ({
  action,
  category,
  label,
  value,
  ...params
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any;
}) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    ...params,
  });

  // Also track in backend
  if (typeof window !== 'undefined') {
    import('./api-client').then(({ apiClient }) => {
      apiClient.trackEvent(action, {
        category,
        label,
        value,
        ...params,
      });
    });
  }
};

// Ecommerce events
export const trackPurchase = ({
  transactionId,
  value,
  currency = 'ILS',
  items,
  coupon,
}: {
  transactionId: string;
  value: number;
  currency?: string;
  items: any[];
  coupon?: string;
}) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items,
    coupon,
  });
};

export const trackBeginCheckout = ({
  value,
  currency = 'ILS',
  items,
}: {
  value: number;
  currency?: string;
  items: any[];
}) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'begin_checkout', {
    value,
    currency,
    items,
  });
};

// Video tracking
export const trackVideoStart = (episodeId: string, episodeNumber: number) => {
  trackEvent({
    action: 'video_start',
    category: 'Video',
    label: `Episode ${episodeNumber}`,
    episode: episodeId,
  });
};

export const trackVideoComplete = (episodeId: string, episodeNumber: number) => {
  trackEvent({
    action: 'video_complete',
    category: 'Video',
    label: `Episode ${episodeNumber}`,
    episode: episodeId,
  });
};

export const trackVideoProgress = (
  episodeId: string,
  episodeNumber: number,
  progress: number
) => {
  trackEvent({
    action: 'video_progress',
    category: 'Video',
    label: `Episode ${episodeNumber}`,
    value: progress,
    episode: episodeId,
  });
};

// Meta Pixel
export const initMetaPixel = () => {
  if (typeof window === 'undefined') return;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId) return;
  
  // Meta Pixel initialization disabled for TypeScript compatibility
  // Will be enabled after deployment
  console.log('Meta Pixel ID configured:', pixelId);
};

// TikTok Pixel
export const initTikTokPixel = () => {
  if (typeof window === 'undefined') return;
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  if (!pixelId) return;

  // TikTok Pixel initialization disabled for TypeScript compatibility
  // Will be enabled after deployment
  console.log('TikTok Pixel ID configured:', pixelId);
};
