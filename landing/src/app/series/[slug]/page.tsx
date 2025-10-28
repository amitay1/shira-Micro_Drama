'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Head from 'next/head';
import { seriesService, episodesService } from '@/services/seriesService';
import { Series, Episode } from '@/types';
import EpisodeList from '@/components/EpisodeList';
import VideoPlayer from '@/components/VideoPlayer';
import FavoriteButton from '@/components/FavoriteButton';
import ShareButton from '@/components/ShareButton';

export default function SeriesPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        setLoading(true);
        
        // Get series by slug
        const seriesData = await seriesService.getSeriesBySlug(slug);
        if (!seriesData) {
          setError('הסדרה לא נמצאה');
          return;
        }
        
        setSeries(seriesData);
        
        // Get episodes
        const episodesData = await episodesService.getEpisodesBySeries(seriesData.id);
        setEpisodes(episodesData);
        
        // Set first episode as selected
        if (episodesData.length > 0) {
          setSelectedEpisode(episodesData[0]);
        }
        
      } catch (err) {
        console.error('Error fetching series:', err);
        setError('שגיאה בטעינת הסדרה');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchSeriesData();
    }
  }, [slug]);

  const handleEpisodeSelect = (episode: Episode) => {
    setSelectedEpisode(episode);
    // Scroll to player
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWatchClick = (episode: Episode) => {
    router.push(`/watch/${episode.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">{error || 'הסדרה לא נמצאה'}</h1>
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

  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="video.tv_show" />
        <meta property="og:title" content={series.title} />
        <meta property="og:description" content={series.description || `צפו ב-${series.title} עכשיו`} />
        <meta property="og:image" content={series.posterUrl || '/placeholder-poster.jpg'} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_APP_URL || 'https://shira.app'}/series/${series.slug}`} />
        <meta property="og:site_name" content="Shira" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={series.title} />
        <meta name="twitter:description" content={series.description || `צפו ב-${series.title} עכשיו`} />
        <meta name="twitter:image" content={series.posterUrl || '/placeholder-poster.jpg'} />
        
        {/* Additional Meta Tags */}
        <meta name="description" content={series.description || `צפו ב-${series.title} עכשיו`} />
        <title>{series.title} | Shira</title>
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

      {/* Hero Section with Series Info */}
      <div className="relative h-[60vh] min-h-[500px]">
        <Image
          src={series.posterUrl || '/placeholder-poster.jpg'}
          alt={series.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-5xl font-bold text-white mb-4">{series.title}</h1>
            
            <div className="flex items-center gap-4 text-gray-300 mb-4">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {series.totalEpisodes} פרקים
              </span>
              {series.releaseDate && (
                <span>{new Date(series.releaseDate).getFullYear()}</span>
              )}
              {series.genres && series.genres.length > 0 && (
                <span>{series.genres.join(', ')}</span>
              )}
            </div>
            
            <p className="text-gray-300 text-lg max-w-3xl mb-6">
              {series.description}
            </p>
            
            <div className="flex items-center gap-4">
              {selectedEpisode && (
                <button
                  onClick={() => handleWatchClick(selectedEpisode)}
                  className="px-8 py-4 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-lg font-semibold flex items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  התחל לצפות
                </button>
              )}
              
              <FavoriteButton
                seriesId={series.id}
                seriesTitle={series.title}
                seriesDescription={series.description}
                posterUrl={series.posterUrl}
                totalEpisodes={series.totalEpisodes}
                size="lg"
                showLabel={true}
              />
              
              <ShareButton
                seriesSlug={series.slug}
                seriesTitle={series.title}
                seriesDescription={series.description}
                variant="secondary"
                size="lg"
                showLabel={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <h2 className="text-3xl font-bold text-white mb-8">פרקים</h2>
        
        {episodes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">אין פרקים זמינים כרגע</p>
          </div>
        ) : (
          <EpisodeList 
            episodes={episodes}
            onEpisodeClick={handleWatchClick}
          />
        )}
      </div>

      {/* Season Pass Info */}
      {series.seasonPassPrice && (
        <div className="max-w-7xl mx-auto px-8 py-12 border-t border-gray-800">
          <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">קנה גישה מלאה</h3>
            <p className="text-gray-300 mb-6">
              צפה בכל {series.totalEpisodes} הפרקים ללא הגבלה
            </p>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-pink-500">
                ₪{series.seasonPassPrice}
              </div>
              <button
                onClick={() => router.push(`/payment/${series.id}`)}
                className="px-8 py-4 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-semibold"
              >
                קנה עכשיו
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
