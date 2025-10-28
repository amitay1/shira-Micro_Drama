'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Series } from '@/data/mockSeries';

interface SeriesSelectorProps {
  series: Series[];
  currentSeriesId: string;
  onSeriesChange: (seriesId: string) => void;
}

export default function SeriesSelector({ series, currentSeriesId, onSeriesChange }: SeriesSelectorProps) {
  const [showAll, setShowAll] = useState(false);
  
  const displaySeries = showAll ? series : series.slice(0, 6);
  const currentSeries = series.find(s => s.id === currentSeriesId);

  return (
    <div className="mb-12">
      {/* Current Series Banner */}
      {currentSeries && (
        <div className="mb-8">
          <div 
            className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.3)), url(${currentSeries.bannerUrl})`
            }}
          >
            <div className="absolute inset-0 flex items-end p-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded">
                    {currentSeries.genre}
                  </span>
                  <span className="text-yellow-400 flex items-center gap-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {currentSeries.rating}
                  </span>
                  <span className="text-gray-300 text-sm">
                    {currentSeries.totalEpisodes} פרקים
                  </span>
                  <span className="text-gray-300 text-sm">
                    {currentSeries.releaseYear}
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
                  {currentSeries.title}
                </h2>
                <p className="text-gray-200 text-lg mb-4">
                  {currentSeries.description}
                </p>
                {/* Link to series page */}
                <Link 
                  href={`/series/${currentSeries.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  פרטים נוספים על הסדרה
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Series Selection */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">סדרות נוספות</h2>
        <button 
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          {showAll ? 'הצג פחות' : 'הצג הכל'} ›
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displaySeries.map((s) => (
          <button
            key={s.id}
            onClick={() => onSeriesChange(s.id)}
            className={`group relative overflow-hidden rounded-lg transition-all hover:scale-105 ${
              s.id === currentSeriesId ? 'ring-4 ring-red-600' : ''
            }`}
          >
            {/* Poster */}
            <div 
              className="relative w-full aspect-[2/3] bg-gradient-to-br from-gray-800 to-gray-900 bg-cover bg-center rounded-lg overflow-hidden"
              style={{
                backgroundImage: `url(${s.thumbnailUrl}), linear-gradient(to bottom right, #1f2937, #111827)`
              }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              {/* Series Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">
                  {s.title}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-yellow-400">★ {s.rating}</span>
                  <span className="text-gray-300">{s.totalEpisodes} פרקים</span>
                </div>
              </div>

              {/* Current Badge */}
              {s.id === currentSeriesId && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
                  מציג כעת
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
