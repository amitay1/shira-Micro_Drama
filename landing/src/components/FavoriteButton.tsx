'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { favoritesService } from '@/services/favoritesService';
import toast from 'react-hot-toast';

interface FavoriteButtonProps {
  seriesId: string;
  seriesTitle: string;
  seriesDescription?: string;
  posterUrl: string;
  totalEpisodes: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function FavoriteButton({
  seriesId,
  seriesTitle,
  seriesDescription,
  posterUrl,
  totalEpisodes,
  size = 'md',
  showLabel = false,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
  }, [seriesId]);

  const checkFavoriteStatus = async () => {
    try {
      const status = await favoritesService.isFavorite(seriesId);
      setIsFavorite(status);
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    try {
      setLoading(true);
      const newStatus = await favoritesService.toggleFavorite(seriesId, {
        seriesTitle,
        seriesDescription,
        posterUrl,
        totalEpisodes,
      });

      setIsFavorite(newStatus);
      
      if (newStatus) {
        toast.success('✨ נוסף למועדפים!');
      } else {
        toast.success('הוסר מהמועדפים');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('שגיאה בשמירה');
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
        isFavorite
          ? 'bg-pink-600 text-white'
          : 'bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm'
      } ${showLabel ? 'px-4 w-auto gap-2' : ''}`}
      title={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
    >
      <Heart
        className={`${iconSizes[size]} ${isFavorite ? 'fill-current' : ''} transition-all`}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {isFavorite ? 'במועדפים' : 'הוסף למועדפים'}
        </span>
      )}
    </button>
  );
}
