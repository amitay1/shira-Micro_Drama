'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { watchHistoryService } from '@/services/watchHistoryService';
import type { Episode } from '@/types';

interface VideoPlayerProps {
  episode: Episode;
  seriesId?: string;
  seriesTitle?: string;
  onStart: (episode: Episode) => void;
  onComplete: (episode: Episode) => void;
  onProgress: (episode: Episode, progress: number) => void;
}

const VideoPlayer = forwardRef<any, VideoPlayerProps>(
  ({ episode, seriesId, seriesTitle, onStart, onComplete, onProgress }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [initialProgress, setInitialProgress] = useState(0);

    useImperativeHandle(ref, () => ({
      play: () => videoRef.current?.play(),
      pause: () => videoRef.current?.pause(),
      getCurrentTime: () => videoRef.current?.currentTime || 0,
      getDuration: () => videoRef.current?.duration || 0,
    }));

    // Load initial progress
    useEffect(() => {
      const loadProgress = async () => {
        if (!episode?.id) return;
        
        try {
          const progress = await watchHistoryService.getEpisodeProgress(episode.id);
          setInitialProgress(progress);
          
          // Set video position if progress exists
          if (videoRef.current && progress > 5 && progress < 95) {
            const duration = videoRef.current.duration;
            if (duration && !isNaN(duration)) {
              videoRef.current.currentTime = (progress / 100) * duration;
            }
          }
        } catch (error) {
          console.error('Failed to load progress:', error);
        }
      };

      loadProgress();
    }, [episode?.id]);

    // Save progress periodically
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !episode?.id) return;

      const saveProgress = async () => {
        if (!video.duration || isNaN(video.duration)) return;
        
        const progress = Math.floor((video.currentTime / video.duration) * 100);
        
        await watchHistoryService.updateProgress(
          episode.id,
          progress,
          Math.floor(video.duration),
          {
            seriesId: seriesId || '',
            seriesTitle: seriesTitle || '',
            episodeTitle: episode.title,
            episodeNumber: episode.episodeNumber,
            seasonNumber: 1,
            thumbnailUrl: episode.thumbnailUrl || '',
            videoUrl: episode.videoUrl,
          }
        );
      };

      // Save progress every 5 seconds
      const interval = setInterval(saveProgress, 5000);

      // Save on pause
      const handlePause = () => saveProgress();
      video.addEventListener('pause', handlePause);

      return () => {
        clearInterval(interval);
        video.removeEventListener('pause', handlePause);
        saveProgress(); // Save on unmount
      };
    }, [episode, seriesId, seriesTitle]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handlePlay = () => {
        onStart(episode);
      };

      const handleEnded = async () => {
        onComplete(episode);
        // Mark as watched
        if (episode?.id) {
          await watchHistoryService.markAsWatched(episode.id);
        }
      };

      const handleTimeUpdate = () => {
        if (!video.duration) return;
        const progress = Math.floor((video.currentTime / video.duration) * 100);
        onProgress(episode, progress);
      };

      video.addEventListener('play', handlePlay);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }, [episode, onStart, onComplete, onProgress]);

    return (
      <div
        ref={containerRef}
        className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl"
        style={{ aspectRatio: '9/16', maxWidth: '500px', margin: '0 auto' }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          controls
          playsInline
          preload="metadata"
          poster={episode.thumbnailUrl}
          controlsList="nodownload"
        >
          <source src={episode.videoUrl} type="video/mp4" />
          <track kind="captions" srcLang="he" label="עברית" />
        </video>

        {/* Episode Info Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <h3 className="text-white font-bold text-lg">
            פרק {episode.episodeNumber}: {episode.title}
          </h3>
          {episode.description && (
            <p className="text-white/80 text-sm mt-1">{episode.description}</p>
          )}
        </div>

        {/* Lock Icon for Locked Episodes */}
        {episode.isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🔒</div>
              <p className="text-xl font-bold">פרק זה נעול</p>
              <p className="text-sm mt-2">רכשו גישה מלאה לצפייה</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
