'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Share Target Handler
 * 
 * This page handles incoming shares when users share content TO the app
 * (e.g., from other apps using the Web Share Target API).
 * 
 * The manifest.json defines this as the share_target action:
 * - Receives shared text, title, and URL
 * - Parses the content to determine destination
 * - Redirects to appropriate episode or series page
 */
export default function SharePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleShare = async () => {
      // Get shared data from URL parameters
      const title = searchParams.get('title');
      const text = searchParams.get('text');
      const url = searchParams.get('url');

      console.log('Received share:', { title, text, url });

      // Parse the shared URL to determine destination
      if (url) {
        try {
          const sharedUrl = new URL(url);
          const pathname = sharedUrl.pathname;

          // Check if it's an episode URL
          if (pathname.startsWith('/watch/')) {
            const episodeId = pathname.split('/watch/')[1];
            if (episodeId) {
              console.log('Redirecting to episode:', episodeId);
              router.push(`/watch/${episodeId}`);
              return;
            }
          }

          // Check if it's a series URL
          if (pathname.startsWith('/series/')) {
            const seriesSlug = pathname.split('/series/')[1];
            if (seriesSlug) {
              console.log('Redirecting to series:', seriesSlug);
              router.push(`/series/${seriesSlug}`);
              return;
            }
          }
        } catch (error) {
          console.error('Error parsing shared URL:', error);
        }
      }

      // If no valid URL, try to parse text content
      if (text) {
        // Check if text contains a watch URL
        const watchMatch = text.match(/\/watch\/([a-zA-Z0-9-]+)/);
        if (watchMatch) {
          console.log('Found episode in text:', watchMatch[1]);
          router.push(`/watch/${watchMatch[1]}`);
          return;
        }

        // Check if text contains a series URL
        const seriesMatch = text.match(/\/series\/([a-zA-Z0-9-]+)/);
        if (seriesMatch) {
          console.log('Found series in text:', seriesMatch[1]);
          router.push(`/series/${seriesMatch[1]}`);
          return;
        }
      }

      // Default: redirect to home
      console.log('No valid share target found, redirecting to home');
      router.push('/');
    };

    handleShare();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
        <p className="text-white text-xl">מעבד שיתוף...</p>
        <p className="text-gray-400 mt-2">אנא המתן</p>
      </div>
    </div>
  );
}
