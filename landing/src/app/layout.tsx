import type { Metadata, Viewport } from 'next';
import { Heebo, Assistant } from 'next/font/google';
import '@/styles/globals.css';
import Script from 'next/script';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import InstallPrompt from '@/components/InstallPrompt';
import NotificationPrompt from '@/components/NotificationPrompt';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  variable: '--font-assistant',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ec4899' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Ananey Studios - מיקרו דרמה',
    template: '%s | Ananey Studios',
  },
  description: 'צפו בסדרת מיקרו דרמה מרתקת - 10 פרקים ראשונים חינם!',
  keywords: [
    'מיקרו דרמה',
    'סדרה ישראלית',
    'צפייה בסטרימינג',
    'דרמה רומנטית',
    'פרקים קצרים',
    'Ananey Studios',
    'micro drama',
  ],
  authors: [{ name: 'Ananey Studios' }],
  creator: 'Ananey Studios',
  publisher: 'Ananey Studios',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Shira Shorts',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Ananey Studios',
    title: 'Ananey Studios - מיקרו דרמה',
    description: 'צפו בסדרת מיקרו דרמה מרתקת - 10 פרקים ראשונים חינם!',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ananey Studios - מיקרו דרמה',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ananey Studios - מיקרו דרמה',
    description: 'צפו בסדרת מיקרו דרמה מרתקת - 10 פרקים ראשונים חינם!',
    images: ['/twitter-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${assistant.variable}`}
    >
      <head>
        {/* Google Tag Manager */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <Script
            id="gtm"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
              `,
            }}
          />
        )}

        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="antialiased">
        {/* GTM noscript */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <ServiceWorkerRegister />
        <InstallPrompt />
        <NotificationPrompt />
        {children}
      </body>
    </html>
  );
}
