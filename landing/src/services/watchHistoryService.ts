// Watch History Service
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface WatchHistoryItem {
  id: string;
  episodeId: string;
  seriesId: string;
  seriesTitle: string;
  episodeTitle: string;
  episodeNumber: number;
  seasonNumber: number;
  thumbnailUrl: string;
  progress: number; // 0-100
  duration: number; // seconds
  lastWatchedAt: string;
  videoUrl: string;
}

class WatchHistoryService {
  private localStorageKey = 'watchHistory';

  // Get all watch history
  async getWatchHistory(): Promise<WatchHistoryItem[]> {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        // Return local storage if not authenticated
        return this.getLocalWatchHistory();
      }

      const response = await fetch(`${API_URL}/playback/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch watch history');
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching watch history:', error);
      return this.getLocalWatchHistory();
    }
  }

  // Get continue watching (in-progress episodes)
  async getContinueWatching(): Promise<WatchHistoryItem[]> {
    const history = await this.getWatchHistory();
    
    // Filter episodes with progress between 5% and 95%
    const inProgress = history.filter(item => 
      item.progress > 5 && item.progress < 95
    );

    // Sort by last watched
    return inProgress.sort((a, b) => 
      new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
    );
  }

  // Save/Update watch progress
  async updateProgress(
    episodeId: string,
    progress: number,
    duration: number,
    episodeData?: {
      seriesId: string;
      seriesTitle: string;
      episodeTitle: string;
      episodeNumber: number;
      seasonNumber: number;
      thumbnailUrl: string;
      videoUrl: string;
    }
  ): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');

      // Always save to local storage
      this.saveToLocalStorage(episodeId, progress, duration, episodeData);

      if (token) {
        // Save to backend if authenticated
        await fetch(`${API_URL}/playback/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            episodeId,
            progress,
            duration,
            timestamp: Math.floor((progress / 100) * duration),
          }),
        });
      }
    } catch (error) {
      console.error('Error updating watch progress:', error);
    }
  }

  // Get progress for specific episode
  async getEpisodeProgress(episodeId: string): Promise<number> {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        return this.getLocalProgress(episodeId);
      }

      const response = await fetch(`${API_URL}/playback/progress/${episodeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return this.getLocalProgress(episodeId);
      }

      const result = await response.json();
      return result.data?.progress || 0;
    } catch (error) {
      console.error('Error fetching episode progress:', error);
      return this.getLocalProgress(episodeId);
    }
  }

  // Mark episode as watched
  async markAsWatched(episodeId: string): Promise<void> {
    await this.updateProgress(episodeId, 100, 0);
  }

  // Remove from watch history
  async removeFromHistory(episodeId: string): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');

      // Remove from local storage
      this.removeFromLocalStorage(episodeId);

      if (token) {
        await fetch(`${API_URL}/playback/history/${episodeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  }

  // Local Storage Methods
  private getLocalWatchHistory(): WatchHistoryItem[] {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      if (!data) return [];
      
      const history = JSON.parse(data);
      return Object.values(history) as WatchHistoryItem[];
    } catch (error) {
      console.error('Error reading local watch history:', error);
      return [];
    }
  }

  private saveToLocalStorage(
    episodeId: string,
    progress: number,
    duration: number,
    episodeData?: any
  ): void {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      const history = data ? JSON.parse(data) : {};

      history[episodeId] = {
        id: episodeId,
        episodeId,
        progress,
        duration,
        lastWatchedAt: new Date().toISOString(),
        ...(episodeData || history[episodeId] || {}),
      };

      localStorage.setItem(this.localStorageKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  private getLocalProgress(episodeId: string): number {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      if (!data) return 0;

      const history = JSON.parse(data);
      return history[episodeId]?.progress || 0;
    } catch (error) {
      console.error('Error reading local progress:', error);
      return 0;
    }
  }

  private removeFromLocalStorage(episodeId: string): void {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      if (!data) return;

      const history = JSON.parse(data);
      delete history[episodeId];

      localStorage.setItem(this.localStorageKey, JSON.stringify(history));
    } catch (error) {
      console.error('Error removing from local storage:', error);
    }
  }

  // Clear all history
  async clearHistory(): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');

      localStorage.removeItem(this.localStorageKey);

      if (token) {
        await fetch(`${API_URL}/playback/history`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }
}

export const watchHistoryService = new WatchHistoryService();
