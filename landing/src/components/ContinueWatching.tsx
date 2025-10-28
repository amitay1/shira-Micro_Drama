'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Play, Clock, X } from 'lucide-react';
import { watchHistoryService, WatchHistoryItem } from '@/services/watchHistoryService';
import toast from 'react-hot-toast';

export default function ContinueWatching() {
  const router = useRouter();
  const [continueWatching, setContinueWatching] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContinueWatching();
  }, []);

  const loadContinueWatching = async () => {
    try {
      const data = await watchHistoryService.getContinueWatching();
      setContinueWatching(data.slice(0, 6)); // Show max 6 items
    } catch (error) {
      console.error('Failed to load continue watching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (episodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await watchHistoryService.removeFromHistory(episodeId);
      setContinueWatching(prev => prev.filter(item => item.episodeId !== episodeId));
      toast.success('הוסר מהמשך לצפות');
    } catch (error) {
      toast.error('שגיאה בהסרה');
    }
  };

  const handleWatch = (episodeId: string) => {
    router.push(`/watch/${episodeId}`);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl font-bold text-white">המשך לצפות</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[9/16] bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (continueWatching.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl font-bold text-white">המשך לצפות</h2>
        </div>
      </div>

      {/* Episodes Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {continueWatching.map((item) => (
          <div
            key={item.id}
            className="relative group cursor-pointer"
            onClick={() => handleWatch(item.episodeId)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-gray-800">
              <Image
                src={item.thumbnailUrl || '/placeholder.jpg'}
                alt={item.episodeTitle}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                <div
                  className="h-full bg-pink-500 transition-all"
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <div className="w-16 h-16 rounded-full bg-pink-600 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={(e) => handleRemove(item.episodeId, e)}
                className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Episode Info */}
              <div className="absolute bottom-4 left-3 right-3">
                <div className="text-xs text-gray-300 mb-1">
                  {item.seriesTitle}
                </div>
                <div className="text-sm font-bold text-white line-clamp-2">
                  פרק {item.episodeNumber}: {item.episodeTitle}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round(item.progress)}% • {formatDuration(Math.floor((item.progress / 100) * item.duration))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
