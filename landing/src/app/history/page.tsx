'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Play, Clock, Trash2, X } from 'lucide-react';
import { watchHistoryService, WatchHistoryItem } from '@/services/watchHistoryService';
import toast from 'react-hot-toast';
import Header from '@/components/Header';

export default function WatchHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await watchHistoryService.getWatchHistory();
      setHistory(data.sort((a, b) => 
        new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
      ));
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('שגיאה בטעינת ההיסטוריה');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (episodeId: string) => {
    try {
      await watchHistoryService.removeFromHistory(episodeId);
      setHistory(prev => prev.filter(item => item.episodeId !== episodeId));
      toast.success('הוסר מההיסטוריה');
    } catch (error) {
      toast.error('שגיאה בהסרה');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל ההיסטוריה?')) {
      return;
    }

    try {
      await watchHistoryService.clearHistory();
      setHistory([]);
      toast.success('ההיסטוריה נמחקה');
    } catch (error) {
      toast.error('שגיאה במחיקה');
    }
  };

  const handleRemoveSelected = async () => {
    try {
      await Promise.all(
        Array.from(selectedItems).map(id => watchHistoryService.removeFromHistory(id))
      );
      setHistory(prev => prev.filter(item => !selectedItems.has(item.episodeId)));
      setSelectedItems(new Set());
      setSelectMode(false);
      toast.success(`${selectedItems.size} פרקים הוסרו`);
    } catch (error) {
      toast.error('שגיאה בהסרה');
    }
  };

  const toggleSelect = (episodeId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(episodeId)) {
        newSet.delete(episodeId);
      } else {
        newSet.add(episodeId);
      }
      return newSet;
    });
  };

  const handleWatch = (episodeId: string) => {
    if (selectMode) {
      toggleSelect(episodeId);
    } else {
      router.push(`/watch/${episodeId}`);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'היום';
    } else if (diffDays === 1) {
      return 'אתמול';
    } else if (diffDays < 7) {
      return `לפני ${diffDays} ימים`;
    } else {
      return date.toLocaleDateString('he-IL');
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                <Clock className="w-8 h-8 text-pink-500" />
                <h1 className="text-3xl font-bold text-white">היסטוריית צפייה</h1>
              </div>
              <p className="text-gray-400 mt-1">{history.length} פרקים</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectMode ? (
              <>
                <button
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedItems(new Set());
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition"
                >
                  ביטול
                </button>
                <button
                  onClick={handleRemoveSelected}
                  disabled={selectedItems.size === 0}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  מחק ({selectedItems.size})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectMode(true)}
                  className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition"
                >
                  בחר
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={history.length === 0}
                  className="px-6 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  מחק הכל
                </button>
              </>
            )}
          </div>
        </div>

        {/* Empty State */}
        {history.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">אין היסטוריית צפייה</h2>
            <p className="text-gray-400 mb-6">התחל לצפות בפרקים כדי לראות אותם כאן</p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl hover:from-pink-700 hover:to-purple-700 transition"
            >
              עבור לעמוד הבית
            </button>
          </div>
        ) : (
          /* History Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                className={`relative group cursor-pointer ${selectMode && selectedItems.has(item.episodeId) ? 'ring-4 ring-pink-500' : ''}`}
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

                  {/* Select Checkbox */}
                  {selectMode && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center">
                      {selectedItems.has(item.episodeId) && (
                        <div className="w-4 h-4 rounded-full bg-pink-500" />
                      )}
                    </div>
                  )}

                  {/* Play Button Overlay */}
                  {!selectMode && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="w-16 h-16 rounded-full bg-pink-600 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                  )}

                  {/* Remove Button */}
                  {!selectMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.episodeId);
                      }}
                      className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}

                  {/* Episode Info */}
                  <div className="absolute bottom-4 left-3 right-3">
                    <div className="text-xs text-gray-300 mb-1">
                      {item.seriesTitle}
                    </div>
                    <div className="text-sm font-bold text-white line-clamp-2">
                      פרק {item.episodeNumber}: {item.episodeTitle}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(item.lastWatchedAt)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {Math.round(item.progress)}% • {formatDuration(Math.floor((item.progress / 100) * item.duration))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
