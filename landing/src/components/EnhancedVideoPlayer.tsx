'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { watchHistoryService } from '@/services/watchHistoryService';
import type { Episode } from '@/types';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Settings,
  X,
} from 'lucide-react';

interface EnhancedVideoPlayerProps {
  episode: Episode;
  seriesId?: string;
  seriesTitle?: string;
  nextEpisode?: Episode | null;
  previousEpisode?: Episode | null;
  onStart?: (episode: Episode) => void;
  onComplete?: (episode: Episode) => void;
  onProgress?: (episode: Episode, progress: number) => void;
  autoPlayNext?: boolean;
}

export default function EnhancedVideoPlayer({
  episode,
  seriesId,
  seriesTitle,
  nextEpisode,
  previousEpisode,
  onStart,
  onComplete,
  onProgress,
  autoPlayNext = true,
}: EnhancedVideoPlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [autoPlayCountdown, setAutoPlayCountdown] = useState(5);
  const [skipAnimation, setSkipAnimation] = useState<'forward' | 'back' | null>(null);

  // Load initial progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!episode?.id || !videoRef.current) return;

      try {
        const progress = await watchHistoryService.getEpisodeProgress(episode.id);
        if (progress > 5 && progress < 95) {
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
        );      onProgress?.(episode, progress);
    };

    const interval = setInterval(saveProgress, 5000);
    const handlePause = () => saveProgress();
    video.addEventListener('pause', handlePause);

    return () => {
      clearInterval(interval);
      video.removeEventListener('pause', handlePause);
      saveProgress();
    };
  }, [episode, seriesId, seriesTitle, onProgress]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      onStart?.(episode);
    };

    const handlePause = () => setIsPlaying(false);

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const prog = Math.floor((video.currentTime / video.duration) * 100);
      
      // Show next episode prompt at 95%
      if (prog >= 95 && !showNextEpisode && nextEpisode) {
        setShowNextEpisode(true);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handleEnded = async () => {
      onComplete?.(episode);
      if (episode?.id) {
        await watchHistoryService.markAsWatched(episode.id);
      }
      
      if (autoPlayNext && nextEpisode) {
        setShowNextEpisode(true);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('ended', handleEnded);
    };
  }, [episode, onStart, onComplete, onProgress, showNextEpisode, nextEpisode, autoPlayNext]);

  // Auto-play next episode countdown
  useEffect(() => {
    if (!showNextEpisode || !nextEpisode || !autoPlayNext) return;

    const interval = setInterval(() => {
      setAutoPlayCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push(`/watch/${nextEpisode.id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showNextEpisode, nextEpisode, autoPlayNext, router]);

  // Auto-hide controls
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'j':
          e.preventDefault();
          skip(-10);
          break;
        case 'l':
          e.preventDefault();
          skip(10);
          break;
        case 'n':
          e.preventDefault();
          if (nextEpisode) {
            router.push(`/watch/${nextEpisode.id}`);
          }
          break;
        case 'p':
          e.preventDefault();
          if (previousEpisode) {
            router.push(`/watch/${previousEpisode.id}`);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextEpisode, previousEpisode, router]);

  // Touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Swipe detection
    if (deltaTime < 500 && Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > 0) {
        // Swipe down - go to previous episode
        if (previousEpisode) {
          router.push(`/watch/${previousEpisode.id}`);
        }
      } else {
        // Swipe up - go to next episode
        if (nextEpisode) {
          router.push(`/watch/${nextEpisode.id}`);
        }
      }
    }

    touchStartRef.current = null;
  };

  // Double tap to skip
  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const isLeftSide = x < rect.width / 2;

    if (isLeftSide) {
      skip(-10);
    } else {
      skip(10);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds)
    );
    setSkipAnimation(seconds > 0 ? 'forward' : 'back');
    setTimeout(() => setSkipAnimation(null), 500);
  };

  const changeVolume = (delta: number) => {
    if (!videoRef.current) return;
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    videoRef.current.currentTime = percentage * duration;
  };

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    setPlaybackRate(rate);
    videoRef.current.playbackRate = rate;
    setShowSettings(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl"
      style={{ aspectRatio: '9/16', maxWidth: '500px', margin: '0 auto' }}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        preload="metadata"
        poster={episode.thumbnailUrl}
        onClick={togglePlay}
      >
        <source src={episode.videoUrl} type="video/mp4" />
      </video>

      {/* Skip Animation */}
      {skipAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 rounded-full p-6 animate-ping">
            {skipAnimation === 'forward' ? (
              <SkipForward className="w-12 h-12 text-white" />
            ) : (
              <SkipBack className="w-12 h-12 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Gradient Overlays */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg line-clamp-1">
              פרק {episode.episodeNumber}: {episode.title}
            </h3>
            {episode.description && (
              <p className="text-white/80 text-sm mt-1 line-clamp-2">{episode.description}</p>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="ml-3 p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div
            className="relative h-1 bg-gray-600 rounded-full cursor-pointer group"
            onClick={handleSeek}
          >
            {/* Buffered */}
            <div
              className="absolute h-full bg-gray-500 rounded-full"
              style={{ width: `${buffered}%` }}
            />
            {/* Progress */}
            <div
              className="absolute h-full bg-pink-600 rounded-full transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* Hover Effect */}
            <div className="absolute -top-1 right-0 w-3 h-3 bg-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ right: `${100 - (currentTime / duration) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/80 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-4">
            {/* Previous Episode */}
            {previousEpisode && (
              <button
                onClick={() => router.push(`/watch/${previousEpisode.id}`)}
                className="text-white hover:text-pink-500 transition"
                title="פרק קודם (P)"
              >
                <SkipBack className="w-6 h-6" />
              </button>
            )}

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
              title={isPlaying ? 'השהה (Space)' : 'נגן (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </button>

            {/* Next Episode */}
            {nextEpisode && (
              <button
                onClick={() => router.push(`/watch/${nextEpisode.id}`)}
                className="text-white hover:text-pink-500 transition"
                title="פרק הבא (N)"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            )}

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-pink-500 transition"
                title="השתק/בטל השתקה (M)"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value) - volume)}
                className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:text-pink-500 transition"
                title="הגדרות"
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[120px]">
                  <div className="text-white text-sm font-bold mb-2 px-2">מהירות</div>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`w-full px-3 py-2 text-sm text-right rounded hover:bg-gray-800 transition ${
                        playbackRate === rate ? 'text-pink-500 font-bold' : 'text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-pink-500 transition"
              title="מסך מלא (F)"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Next Episode Prompt */}
      {showNextEpisode && nextEpisode && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-sm text-center">
            <h3 className="text-2xl font-bold text-white mb-4">הפרק הבא</h3>
            <p className="text-gray-300 mb-6">
              פרק {nextEpisode.episodeNumber}: {nextEpisode.title}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNextEpisode(false)}
                className="flex-1 px-6 py-3 border border-gray-600 text-white rounded-lg hover:bg-gray-800 transition"
              >
                ביטול
              </button>
              <button
                onClick={() => router.push(`/watch/${nextEpisode.id}`)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-lg hover:from-pink-700 hover:to-purple-700 transition"
              >
                נגן עכשיו ({autoPlayCountdown})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Locked Overlay */}
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
