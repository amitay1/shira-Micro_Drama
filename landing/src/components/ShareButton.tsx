'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Lock } from 'lucide-react';
import shareService from '@/services/shareService';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  // Episode sharing
  episodeId?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  seriesTitle?: string;
  currentTime?: number;
  
  // Series sharing
  seriesSlug?: string;
  seriesDescription?: string;
  
  // Styling
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ShareButton({
  episodeId,
  episodeNumber,
  episodeTitle,
  seriesTitle,
  currentTime,
  seriesSlug,
  seriesDescription,
  variant = 'secondary',
  size = 'md',
  showLabel = true,
}: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if this is episode sharing
  const isEpisodeShare = episodeId && episodeNumber && episodeTitle && seriesTitle;
  
  // Check if episode is free (1-10)
  const isEpisodeFree = episodeNumber ? shareService.isEpisodeFree(episodeNumber) : false;
  
  // Don't show button for premium episodes
  if (isEpisodeShare && !isEpisodeFree) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Lock className="w-4 h-4" />
        {showLabel && <span>רק פרקים חינמיים ניתנים לשיתוף</span>}
      </div>
    );
  }

  const handleNativeShare = async () => {
    let success = false;

    if (isEpisodeShare) {
      success = await shareService.shareEpisode(
        episodeId!,
        episodeNumber!,
        episodeTitle!,
        seriesTitle!,
        currentTime
      );
    } else if (seriesSlug && seriesTitle) {
      success = await shareService.shareSeries(
        seriesSlug,
        seriesTitle,
        seriesDescription
      );
    }

    if (success) {
      toast.success('שותף בהצלחה!');
      setShowMenu(false);
    }
  };

  const handleWhatsApp = () => {
    const url = isEpisodeShare
      ? `${window.location.origin}/watch/${episodeId}${currentTime ? `?t=${Math.floor(currentTime)}` : ''}`
      : `${window.location.origin}/series/${seriesSlug}`;
    
    const text = isEpisodeShare
      ? shareService.getEpisodeShareText(episodeNumber!, episodeTitle!, seriesTitle!)
      : shareService.getSeriesShareText(seriesTitle!, 0);

    shareService.shareToWhatsApp(text, url);
    toast.success('פותח ווצאפ...');
    setShowMenu(false);
  };

  const handleFacebook = () => {
    const url = isEpisodeShare
      ? `${window.location.origin}/watch/${episodeId}`
      : `${window.location.origin}/series/${seriesSlug}`;

    shareService.shareToFacebook(url);
    toast.success('פותח פייסבוק...');
    setShowMenu(false);
  };

  const handleCopyLink = async () => {
    const url = isEpisodeShare
      ? `${window.location.origin}/watch/${episodeId}${currentTime ? `?t=${Math.floor(currentTime)}` : ''}`
      : `${window.location.origin}/series/${seriesSlug}`;

    const success = await shareService.copyToClipboard(url);
    
    if (success) {
      setCopied(true);
      toast.success('הקישור הועתק ללוח!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('שגיאה בהעתקת הקישור');
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
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => {
          if (shareService.isShareSupported()) {
            handleNativeShare();
          } else {
            setShowMenu(!showMenu);
          }
        }}
        className={`
          flex items-center gap-2 transition-all
          ${variant === 'icon' ? sizeClasses[size] : 'px-4 py-2'}
          ${variant === 'primary' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:opacity-90' : ''}
          ${variant === 'secondary' ? 'bg-gray-700 hover:bg-gray-600 text-white rounded-xl' : ''}
          ${variant === 'icon' ? 'bg-gray-800/80 hover:bg-gray-700 text-white rounded-full justify-center' : ''}
        `}
      >
        <Share2 className={iconSizes[size]} />
        {showLabel && variant !== 'icon' && <span>שתף</span>}
      </button>

      {/* Share Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute left-0 top-full mt-2 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-50 min-w-[200px]">
            <div className="p-2 space-y-1">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 rounded-lg transition text-right"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="text-white">ווצאפ</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleFacebook}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 rounded-lg transition text-right"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-white">פייסבוק</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 rounded-lg transition text-right"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
                <span className="text-white">
                  {copied ? 'הועתק!' : 'העתק קישור'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
