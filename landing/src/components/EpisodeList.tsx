'use client';

import Image from 'next/image';
import type { Episode } from '@/types';

interface EpisodeListProps {
  episodes: Episode[];
  currentEpisode?: Episode | null;
  onEpisodeSelect?: (episode: Episode) => void;
  onEpisodeClick?: (episode: Episode) => void;
  hasAccess?: boolean;
  freeEpisodesCount?: number;
}

export default function EpisodeList({
  episodes,
  currentEpisode = null,
  onEpisodeSelect,
  onEpisodeClick,
  hasAccess = false,
  freeEpisodesCount = 10,
}: EpisodeListProps) {
  const handleClick = (episode: Episode) => {
    if (onEpisodeClick) {
      onEpisodeClick(episode);
    } else if (onEpisodeSelect) {
      onEpisodeSelect(episode);
    }
  };

  return (
    <div className="bg-black">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">רשימת פרקים</h2>
        <button className="text-sm text-gray-400 hover:text-white transition-colors">
          הצג הכל ›
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
        {episodes.map((episode) => {
          const isLocked = episode.episodeNumber > freeEpisodesCount && !hasAccess;
          const isCurrent = currentEpisode?.id === episode.id;

          return (
            <button
              key={episode.id}
              onClick={() => handleClick(episode)}
              className="group relative overflow-hidden rounded-lg transition-all hover:scale-105 hover:z-10"
            >
              {/* Poster */}
              <div 
                className="relative w-full aspect-[2/3] bg-gradient-to-br from-gray-800 to-gray-900 bg-cover bg-center rounded-lg overflow-hidden"
                style={{
                  backgroundImage: `url(${episode.thumbnailUrl}), linear-gradient(to bottom right, #1f2937, #111827)`
                }}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                
                {/* Lock Icon */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Current Episode Indicator */}
                {isCurrent && (
                  <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                )}

                {/* Episode Info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">
                    {episode.title}
                  </h3>
                  {episode.isFree && (
                    <span className="inline-block text-xs bg-red-600 text-white px-2 py-0.5 rounded">
                      EXCLUSIVE
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Free Episodes Notice */}
      {!hasAccess && (
        <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <p className="text-sm text-white font-medium">
            💡 {freeEpisodesCount} פרקים ראשונים חינמיים
          </p>
          <p className="text-xs text-gray-400 mt-1">
            לצפייה מלאה בכל הסדרה - רכשו גישה
          </p>
        </div>
      )}
    </div>
  );
}
