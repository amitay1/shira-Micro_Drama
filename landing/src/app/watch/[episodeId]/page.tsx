'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Head from 'next/head';
import { episodesService, seriesService } from '@/services/seriesService';
import { Episode, Series } from '@/types';
import EnhancedVideoPlayer from '@/components/EnhancedVideoPlayer';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import ShareButton from '@/components/ShareButton';
import Image from 'next/image';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const episodeId = params.episodeId as string;
  
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [allEpisodes, setAllEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        setLoading(true);
        
        // Get episode details
        const episodeData = await episodesService.getEpisodeById(episodeId);
        if (!episodeData) {
          setError('הפרק לא נמצא');
          return;
        }
        
        setEpisode(episodeData);
        
        // Get series details
        const seriesData = await seriesService.getSeriesById(episodeData.seriesId);
        setSeries(seriesData);
        
        // Get all episodes for this series
        const episodesData = await episodesService.getEpisodesBySeries(episodeData.seriesId);
        setAllEpisodes(episodesData);

        // Check access to episode
        await checkEpisodeAccess(episodeData, seriesData);
        
      } catch (err) {
        console.error('Error fetching episode:', err);
        setError('שגיאה בטעינת הפרק');
      } finally {
        setLoading(false);
      }
    };

    if (episodeId) {
      fetchEpisodeData();
    }
  }, [episodeId]);

  const checkEpisodeAccess = async (episodeData: Episode, seriesData: Series | null) => {
    try {
      setCheckingAccess(true);
      
      // If episode is free, allow access
      if (episodeData.isFree) {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }

      // Check if user has purchased Season Pass for this series
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setHasAccess(false);
        setCheckingAccess(false);
        return;
      }

      // Check purchases table
      const { data: purchase } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('series_id', episodeData.seriesId)
        .eq('status', 'active')
        .maybeSingle();

      setHasAccess(!!purchase);
      setCheckingAccess(false);
    } catch (err) {
      console.error('Error checking access:', err);
      setHasAccess(false);
      setCheckingAccess(false);
    }
  };

  const handleNextEpisode = () => {
    if (!episode || allEpisodes.length === 0) return;
    
    const currentIndex = allEpisodes.findIndex(ep => ep.id === episode.id);
    if (currentIndex < allEpisodes.length - 1) {
      const nextEpisode = allEpisodes[currentIndex + 1];
      router.push(`/watch/${nextEpisode.id}`);
    }
  };

  const handlePreviousEpisode = () => {
    if (!episode || allEpisodes.length === 0) return;
    
    const currentIndex = allEpisodes.findIndex(ep => ep.id === episode.id);
    if (currentIndex > 0) {
      const prevEpisode = allEpisodes[currentIndex - 1];
      router.push(`/watch/${prevEpisode.id}`);
    }
  };

  const getNextEpisode = (): Episode | null => {
    if (!episode || allEpisodes.length === 0) return null;
    const currentIndex = allEpisodes.findIndex(ep => ep.id === episode.id);
    return currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;
  };

  const getPreviousEpisode = (): Episode | null => {
    if (!episode || allEpisodes.length === 0) return null;
    const currentIndex = allEpisodes.findIndex(ep => ep.id === episode.id);
    return currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">{error || 'הפרק לא נמצא'}</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  // Show paywall if episode is locked
  if (!checkingAccess && !hasAccess && !episode.isFree) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            חזור
          </button>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 text-center">
            {/* Lock Icon */}
            <div className="mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-white mb-4">
              🔒 פרק נעול
            </h1>

            {/* Episode Info */}
            <p className="text-xl text-gray-300 mb-2">
              {episode.title}
            </p>
            <p className="text-gray-400 mb-8">
              פרק {episode.episodeNumber} | {series?.title}
            </p>

            {/* Description */}
            <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
              <p className="text-gray-300 text-lg mb-4">
                כדי לצפות בפרק זה, יש צורך ב-Season Pass
              </p>
              <p className="text-gray-400">
                Season Pass נותן לך גישה מלאה לכל הפרקים בסדרה זו
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-pink-500 text-2xl mb-2">✓</div>
                <p className="text-white font-semibold mb-1">גישה מלאה</p>
                <p className="text-gray-400 text-sm">לכל הפרקים בסדרה</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-pink-500 text-2xl mb-2">✓</div>
                <p className="text-white font-semibold mb-1">צפייה ללא הגבלה</p>
                <p className="text-gray-400 text-sm">כמה פעמים שתרצה</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-pink-500 text-2xl mb-2">✓</div>
                <p className="text-white font-semibold mb-1">HD איכות</p>
                <p className="text-gray-400 text-sm">צפייה באיכות מקסימלית</p>
              </div>
            </div>

            {/* Price */}
            {series && (
              <div className="mb-8">
                <div className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl px-8 py-4">
                  <p className="text-white text-sm mb-1">מחיר חד פעמי</p>
                  <p className="text-white text-4xl font-bold">
                    ₪{series.seasonPassPrice}
                  </p>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={() => router.push(`/payment/${series?.id}`)}
              className="w-full max-w-md mx-auto px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xl font-bold rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              קנה Season Pass עכשיו
            </button>

            {/* Free Episodes Link */}
            <button
              onClick={() => router.push(`/series/${series?.id}`)}
              className="mt-6 text-gray-400 hover:text-white transition-colors"
            >
              ← חזור לצפות בפרקים החינמיים
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="video.episode" />
        <meta property="og:title" content={`${episode.title} - ${series?.title || ''}`} />
        <meta property="og:description" content={episode.description || `פרק ${episode.episodeNumber} - ${episode.title}`} />
        <meta property="og:image" content={episode.thumbnailUrl || series?.posterUrl || '/placeholder-poster.jpg'} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_APP_URL || 'https://shira.app'}/watch/${episode.id}`} />
        <meta property="og:site_name" content="Shira" />
        <meta property="og:video" content={episode.videoUrl} />
        <meta property="og:video:type" content="video/mp4" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="player" />
        <meta name="twitter:title" content={`${episode.title} - ${series?.title || ''}`} />
        <meta name="twitter:description" content={episode.description || `פרק ${episode.episodeNumber} - ${episode.title}`} />
        <meta name="twitter:image" content={episode.thumbnailUrl || series?.posterUrl || '/placeholder-poster.jpg'} />
        <meta name="twitter:player" content={`${process.env.NEXT_PUBLIC_APP_URL || 'https://shira.app'}/watch/${episode.id}`} />
        <meta name="twitter:player:width" content="1280" />
        <meta name="twitter:player:height" content="720" />
        
        {/* Additional Meta Tags */}
        <meta name="description" content={episode.description || `פרק ${episode.episodeNumber} - ${episode.title}`} />
        <title>{episode.title} - {series?.title || ''} | Shira</title>
      </Head>

      {/* Back Button */}
      <div className="fixed top-20 left-4 z-50">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-black/80 hover:bg-black text-white rounded-lg backdrop-blur-sm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          חזור
        </button>
      </div>

      {/* Video Player */}
      <div className="w-full bg-black">
        <div className="max-w-7xl mx-auto py-8">
          <EnhancedVideoPlayer
            episode={episode}
            seriesId={series?.id}
            seriesTitle={series?.title}
            nextEpisode={getNextEpisode()}
            previousEpisode={getPreviousEpisode()}
            autoPlayNext={true}
            onStart={(ep) => console.log('Started:', ep.title)}
            onComplete={(ep) => console.log('Completed:', ep.title)}
            onProgress={(ep, progress) => {
              // Progress is saved automatically by the player
            }}
          />
        </div>
      </div>

      {/* Episode Info */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => series && router.push(`/series/${series.id}`)}
            className="text-pink-500 hover:text-pink-400 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            חזרה לסדרה
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            פרק {episode.episodeNumber}: {episode.title}
          </h1>
          
          {series && (
            <p className="text-gray-400 text-lg mb-4">{series.title}</p>
          )}
          
          {episode.description && (
            <p className="text-gray-300">{episode.description}</p>
          )}
        </div>

        {/* Share Button - Only for free episodes (1-10) */}
        <div className="mb-8">
          <ShareButton
            episodeId={Number(episode.id)}
            episodeNumber={episode.episodeNumber}
            episodeTitle={episode.title}
            seriesTitle={series?.title}
            variant="secondary"
            size="md"
            showLabel={true}
          />
        </div>

        {/* Episode Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handlePreviousEpisode}
            disabled={!episode || allEpisodes.findIndex(ep => ep.id === episode.id) === 0}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            פרק קודם
          </button>
          
          <button
            onClick={handleNextEpisode}
            disabled={!episode || allEpisodes.findIndex(ep => ep.id === episode.id) === allEpisodes.length - 1}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            פרק הבא
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* More Episodes */}
        {allEpisodes.length > 1 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">עוד פרקים</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allEpisodes
                .filter(ep => ep.id !== episode.id)
                .slice(0, 8)
                .map(ep => (
                  <div
                    key={ep.id}
                    onClick={() => router.push(`/watch/${ep.id}`)}
                    className="cursor-pointer group"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                      <Image
                        src={ep.thumbnailUrl || '/placeholder-episode.jpg'}
                        alt={ep.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      {!ep.isFree && (
                        <div className="absolute top-2 right-2 bg-pink-600 text-white text-xs px-2 py-1 rounded">
                          נעול
                        </div>
                      )}
                    </div>
                    <h3 className="text-white font-semibold group-hover:text-pink-500 transition-colors">
                      פרק {ep.episodeNumber}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">{ep.title}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Helper */}
      <KeyboardShortcuts />
    </div>
  );
}
