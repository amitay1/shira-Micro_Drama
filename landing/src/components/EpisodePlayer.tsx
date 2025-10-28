'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  trackVideoStart,
  trackVideoComplete,
  trackVideoProgress,
  trackEvent,
} from '@/lib/analytics';
import type { Episode } from '@/types';
import VideoPlayer from './VideoPlayer';
import EpisodeList from './EpisodeList';
import Paywall from './Paywall';
import SeriesSelector from './SeriesSelector';
import { mockSeries, getEpisodesBySeriesId, type Series } from '@/data/mockSeries';

const FREE_EPISODES_COUNT = 10;

export default function EpisodePlayer() {
  const [currentSeriesId, setCurrentSeriesId] = useState(mockSeries[0].id);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    loadSeriesEpisodes(currentSeriesId);
  }, [currentSeriesId]);

  const loadSeriesEpisodes = (seriesId: string) => {
    setLoading(true);
    const seriesEpisodes = getEpisodesBySeriesId(seriesId);
    setEpisodes(seriesEpisodes);
    setCurrentEpisode(seriesEpisodes[0] || null);
    setLoading(false);
  };

  const handleSeriesChange = (seriesId: string) => {
    setCurrentSeriesId(seriesId);
    trackEvent({
      action: 'change_series',
      category: 'Navigation',
      label: seriesId,
    });
  };

  const handleEpisodeSelect = (episode: Episode) => {
    // Check if episode is locked
    if (!episode.isFree && !hasAccess) {
      setShowPaywall(true);
      trackEvent({
        action: 'show_paywall',
        category: 'Monetization',
        label: `Episode ${episode.episodeNumber}`,
      });
      return;
    }

    setCurrentEpisode(episode);
    trackEvent({
      action: 'episode_selected',
      category: 'Video',
      label: `Episode ${episode.episodeNumber}`,
    });
  };

  const handleVideoStart = (episode: Episode) => {
    trackVideoStart(episode.id, episode.episodeNumber);
  };

  const handleVideoComplete = (episode: Episode) => {
    trackVideoComplete(episode.id, episode.episodeNumber);

    // Auto-play next episode
    const currentIndex = episodes.findIndex((ep) => ep.id === episode.id);
    if (currentIndex < episodes.length - 1) {
      const nextEpisode = episodes[currentIndex + 1];

      // Check if next episode is locked (episode 11+)
      if (!nextEpisode.isFree && !hasAccess) {
        setShowPaywall(true);
        trackEvent({
          action: 'reach_episode_10',
          category: 'Monetization',
          label: 'Auto Paywall',
        });
      } else {
        setCurrentEpisode(nextEpisode);
      }
    }
  };

  const handleProgress = (episode: Episode, progress: number) => {
    // Track progress every 25%
    if (progress % 25 === 0) {
      trackVideoProgress(episode.id, episode.episodeNumber, progress);
    }

    // Save watch history
    if (progress > 5) {
      apiClient.updateWatchHistory(episode.id, progress).catch(() => {});
    }
  };

  const handlePaywallClose = () => {
    setShowPaywall(false);
  };

  const handlePurchaseComplete = () => {
    setHasAccess(true);
    setShowPaywall(false);
    // Continue to next episode
    const currentIndex = episodes.findIndex((ep) => ep.id === currentEpisode?.id);
    if (currentIndex < episodes.length - 1) {
      setCurrentEpisode(episodes[currentIndex + 1]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div id="episodes" className="max-w-7xl mx-auto px-4 py-8">
      {/* Series Selector */}
      <SeriesSelector
        series={mockSeries}
        currentSeriesId={currentSeriesId}
        onSeriesChange={handleSeriesChange}
      />

      {/* Video Player - Full Width */}
      <div className="mb-12">
        {currentEpisode && (
          <div className="bg-black">
            <VideoPlayer
              episode={currentEpisode}
              onStart={handleVideoStart}
              onComplete={handleVideoComplete}
              onProgress={handleProgress}
              ref={playerRef}
            />
            
            {/* Episode Info Below Video */}
            <div className="mt-4 px-2">
              <h2 className="text-2xl font-bold text-white mb-2">
                פרק {currentEpisode.episodeNumber}: {currentEpisode.title}
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                {currentEpisode.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{Math.floor(currentEpisode.duration / 60)} דקות</span>
                {currentEpisode.views > 0 && (
                  <span>{currentEpisode.views.toLocaleString('he-IL')} צפיות</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Episode List - Full Width Grid */}
      <EpisodeList
        episodes={episodes}
        currentEpisode={currentEpisode}
        onEpisodeSelect={handleEpisodeSelect}
        hasAccess={hasAccess}
        freeEpisodesCount={FREE_EPISODES_COUNT}
      />

      {/* Paywall Modal */}
      {showPaywall && (
        <Paywall
          seriesId={currentSeriesId}
          onClose={handlePaywallClose}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </div>
  );
}
