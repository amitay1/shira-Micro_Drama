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

  // @ts-ignore - Meta Pixel initialization code
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    // @ts-ignore - Dynamic fbq assignment
    n = f.fbq = function () {
      // @ts-ignore
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js'
  );
  // @ts-expect-error - fbq is dynamically added
  fbq('init', pixelId);
  // @ts-expect-error - fbq is dynamically added
  fbq('track', 'PageView');
};

// TikTok Pixel
export const initTikTokPixel = () => {
  if (typeof window === 'undefined') return;
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  if (!pixelId) return;

  // @ts-ignore
  !(function (w, d, t) {
    w.TiktokAnalyticsObject = t;
    var ttq = (w[t] = w[t] || []);
    (ttq.methods = [
      'page',
      'track',
      'identify',
      'instances',
      'debug',
      'on',
      'off',
      'once',
      'ready',
      'alias',
      'group',
      'enableCookie',
      'disableCookie',
    ]),
      (ttq.setAndDefer = function (t, e) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      });
    for (var i = 0; i < ttq.methods.length; i++)
      ttq.setAndDefer(ttq, ttq.methods[i]);
    (ttq.instance = function (t) {
      for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
        ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    }),
      (ttq.load = function (e, n) {
        var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        (ttq._i = ttq._i || {}),
          (ttq._i[e] = []),
          (ttq._i[e]._u = i),
          (ttq._t = ttq._t || {}),
          (ttq._t[e] = +new Date()),
          (ttq._o = ttq._o || {}),
          (ttq._o[e] = n || {});
        var c = d.createElement('script');
        (c.type = 'text/javascript'),
          (c.async = !0),
          (c.src = i + '?sdkid=' + e + '&lib=' + t);
        var a = d.getElementsByTagName('script')[0];
        a.parentNode.insertBefore(c, a);
      });
    ttq.load(pixelId);
    ttq.page();
  })(window, document, 'ttq');
};
