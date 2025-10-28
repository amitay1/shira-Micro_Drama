'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { seriesService } from '@/services/seriesService';
import { Series } from '@/types';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  
  const genres = ['רומנטיקה', 'דרמה', 'קומדיה', 'מותחן', 'אקשן', 'מדע בדיוני'];

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const allSeries = await seriesService.getAllSeries();
      
      // Filter by search term
      let filtered = allSeries.filter(series =>
        series.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        series.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Filter by genre if selected
      if (selectedGenre) {
        filtered = filtered.filter(series =>
          series.genres?.includes(selectedGenre)
        );
      }
      
      setResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch(searchQuery);
    }
  };

  const handleGenreClick = (genre: string) => {
    if (selectedGenre === genre) {
      setSelectedGenre('');
    } else {
      setSelectedGenre(genre);
    }
    if (searchQuery) {
      performSearch(searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-24 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            חזור
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש סדרות..."
              className="w-full px-6 py-4 bg-gray-800 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 pr-14"
              autoFocus
            />
            <button
              type="submit"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Genre Filters */}
        <div className="mb-8">
          <h2 className="text-white text-lg font-semibold mb-4">סינון לפי ז'אנר:</h2>
          <div className="flex flex-wrap gap-3">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => handleGenreClick(genre)}
                className={`px-6 py-2 rounded-full transition-colors ${
                  selectedGenre === genre
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-white text-xl">מחפש...</div>
          </div>
        ) : results.length > 0 ? (
          <div>
            <h2 className="text-white text-2xl font-bold mb-6">
              נמצאו {results.length} תוצאות
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {results.map(series => (
                <div
                  key={series.id}
                  onClick={() => router.push(`/series/${series.id}`)}
                  className="cursor-pointer group"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3">
                    <Image
                      src={series.posterUrl || '/placeholder-poster.jpg'}
                      alt={series.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-white font-semibold group-hover:text-pink-500 transition-colors">
                    {series.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {series.totalEpisodes} פרקים
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-white text-2xl font-bold mb-2">לא נמצאו תוצאות</h2>
            <p className="text-gray-400">נסה לחפש במילים אחרות או בחר ז'אנר אחר</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-white text-2xl font-bold mb-2">התחל לחפש</h2>
            <p className="text-gray-400">הקלד משהו בשדה החיפוש למעלה</p>
          </div>
        )}
      </div>
    </div>
  );
}
