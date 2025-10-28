'use client';

interface ShareData {
  title: string;
  text: string;
  url: string;
}

class ShareService {
  private static instance: ShareService;

  private constructor() {}

  static getInstance(): ShareService {
    if (!ShareService.instance) {
      ShareService.instance = new ShareService();
    }
    return ShareService.instance;
  }

  /**
   * Check if Web Share API is supported
   */
  isShareSupported(): boolean {
    return typeof window !== 'undefined' && 'share' in navigator;
  }

  /**
   * Check if episode is free (episodes 1-10)
   */
  isEpisodeFree(episodeNumber: number): boolean {
    return episodeNumber >= 1 && episodeNumber <= 10;
  }

  /**
   * Check if episode can be shared
   */
  canShareEpisode(episodeNumber: number): boolean {
    return this.isEpisodeFree(episodeNumber);
  }

  /**
   * Share using native Web Share API
   */
  async share(data: ShareData): Promise<boolean> {
    if (!this.isShareSupported()) {
      console.warn('Web Share API not supported');
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled share
        return false;
      }
      console.error('Error sharing:', error);
      return false;
    }
  }

  /**
   * Share episode (only free episodes)
   */
  async shareEpisode(
    episodeId: number,
    episodeNumber: number,
    episodeTitle: string,
    seriesTitle: string,
    currentTime?: number
  ): Promise<boolean> {
    // Check if episode is free
    if (!this.canShareEpisode(episodeNumber)) {
      console.warn('Cannot share premium episode');
      return false;
    }

    const url = this.buildEpisodeUrl(episodeId, currentTime);
    const text = `צפה בפרק ${episodeNumber}: "${episodeTitle}" מתוך "${seriesTitle}" ב-Shira Shorts!`;

    return this.share({
      title: `${seriesTitle} - פרק ${episodeNumber}`,
      text,
      url,
    });
  }

  /**
   * Share series
   */
  async shareSeries(
    seriesSlug: string,
    seriesTitle: string,
    description?: string
  ): Promise<boolean> {
    const url = `${window.location.origin}/series/${seriesSlug}`;
    const text = description || `צפה בסדרה "${seriesTitle}" ב-Shira Shorts - 10 פרקים ראשונים חינם!`;

    return this.share({
      title: seriesTitle,
      text,
      url,
    });
  }

  /**
   * Share to WhatsApp
   */
  shareToWhatsApp(text: string, url: string): void {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(whatsappUrl, '_blank');
  }

  /**
   * Share to Facebook
   */
  shareToFacebook(url: string): void {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  }

  /**
   * Share to Twitter
   */
  shareToTwitter(text: string, url: string): void {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  }

  /**
   * Copy link to clipboard
   */
  async copyToClipboard(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Build episode URL with optional timestamp
   */
  private buildEpisodeUrl(episodeId: number, currentTime?: number): string {
    const baseUrl = `${window.location.origin}/watch/${episodeId}`;
    
    if (currentTime && currentTime > 0) {
      return `${baseUrl}?t=${Math.floor(currentTime)}`;
    }
    
    return baseUrl;
  }

  /**
   * Get share text for episode
   */
  getEpisodeShareText(
    episodeNumber: number,
    episodeTitle: string,
    seriesTitle: string
  ): string {
    return `צפה בפרק ${episodeNumber}: "${episodeTitle}" מתוך "${seriesTitle}" ב-Shira Shorts! 🎬`;
  }

  /**
   * Get share text for series
   */
  getSeriesShareText(seriesTitle: string, totalEpisodes: number): string {
    return `צפה בסדרה "${seriesTitle}" ב-Shira Shorts - ${totalEpisodes} פרקים מרתקים! 10 ראשונים חינם! 🎬`;
  }
}

export const shareService = ShareService.getInstance();
export default shareService;
