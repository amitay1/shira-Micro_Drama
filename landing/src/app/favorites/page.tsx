'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Trash2 } from 'lucide-react';
import { favoritesService, FavoriteItem } from '@/services/favoritesService';
import Header from '@/components/Header';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await favoritesService.getFavorites();
      setFavorites(data.sort((a, b) => 
        new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      ));
    } catch (error) {
      console.error('Failed to load favorites:', error);
      toast.error('שגיאה בטעינת המועדפים');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (seriesId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await favoritesService.removeFavorite(seriesId);
      setFavorites(prev => prev.filter(item => item.seriesId !== seriesId));
      toast.success('הוסר מהמועדפים');
    } catch (error) {
      toast.error('שגיאה בהסרה');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל המועדפים?')) {
      return;
    }

    try {
      await favoritesService.clearFavorites();
      setFavorites([]);
      toast.success('כל המועדפים נמחקו');
    } catch (error) {
      toast.error('שגיאה במחיקה');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-pink-500 fill-current" />
                <h1 className="text-3xl font-bold text-white">המועדפים שלי</h1>
              </div>
              <p className="text-gray-400 mt-1">{favorites.length} סדרות</p>
            </div>
          </div>

          {favorites.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-6 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              מחק הכל
            </button>
          )}
        </div>

        {/* Empty State */}
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">אין מועדפים עדיין</h2>
            <p className="text-gray-400 mb-6">הוסף סדרות למועדפים כדי למצוא אותן בקלות</p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl hover:from-pink-700 hover:to-purple-700 transition"
            >
              גלה סדרות
            </button>
          </div>
        ) : (
          /* Favorites Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {favorites.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/series/${item.seriesId}`)}
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3 bg-gray-800">
                  <Image
                    src={item.posterUrl || '/placeholder.jpg'}
                    alt={item.seriesTitle}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemove(item.seriesId, e)}
                    className="absolute top-3 left-3 w-10 h-10 rounded-full bg-black/70 hover:bg-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                    title="הסר ממועדפים"
                  >
                    <Heart className="w-5 h-5 text-pink-500 fill-current" />
                  </button>

                  {/* Episodes Badge */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-white">
                      {item.totalEpisodes} פרקים
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div>
                  <h3 className="text-white font-bold text-lg group-hover:text-pink-500 transition-colors line-clamp-2 mb-1">
                    {item.seriesTitle}
                  </h3>
                  {item.seriesDescription && (
                    <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                      {item.seriesDescription}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs">
                    נוסף ב-{formatDate(item.addedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
