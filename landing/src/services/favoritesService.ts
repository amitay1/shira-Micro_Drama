// Favorites Service
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface FavoriteItem {
  id: string;
  seriesId: string;
  seriesTitle: string;
  seriesDescription?: string;
  posterUrl: string;
  totalEpisodes: number;
  addedAt: string;
}

class FavoritesService {
  private localStorageKey = 'favorites';

  // Get all favorites
  async getFavorites(): Promise<FavoriteItem[]> {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        return this.getLocalFavorites();
      }

      const response = await fetch(`${API_URL}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return this.getLocalFavorites();
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return this.getLocalFavorites();
    }
  }

  // Check if series is favorite
  async isFavorite(seriesId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(fav => fav.seriesId === seriesId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }

  // Add to favorites
  async addFavorite(seriesData: {
    seriesId: string;
    seriesTitle: string;
    seriesDescription?: string;
    posterUrl: string;
    totalEpisodes: number;
  }): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');

      // Always save to local storage
      this.saveToLocalStorage(seriesData);

      if (token) {
        await fetch(`${API_URL}/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            seriesId: seriesData.seriesId,
          }),
        });
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  // Remove from favorites
  async removeFavorite(seriesId: string): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');

      // Remove from local storage
      this.removeFromLocalStorage(seriesId);

      if (token) {
        await fetch(`${API_URL}/favorites/${seriesId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  // Toggle favorite
  async toggleFavorite(
    seriesId: string,
    seriesData?: {
      seriesTitle: string;
      seriesDescription?: string;
      posterUrl: string;
      totalEpisodes: number;
    }
  ): Promise<boolean> {
    const isFav = await this.isFavorite(seriesId);
    
    if (isFav) {
      await this.removeFavorite(seriesId);
      return false;
    } else {
      if (!seriesData) {
        throw new Error('Series data required to add favorite');
      }
      await this.addFavorite({ seriesId, ...seriesData });
      return true;
    }
  }

  // Clear all favorites
  async clearFavorites(): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');

      localStorage.removeItem(this.localStorageKey);

      if (token) {
        await fetch(`${API_URL}/favorites`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Error clearing favorites:', error);
      throw error;
    }
  }

  // Local Storage Methods
  private getLocalFavorites(): FavoriteItem[] {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      if (!data) return [];
      
      const favorites = JSON.parse(data);
      return Object.values(favorites) as FavoriteItem[];
    } catch (error) {
      console.error('Error reading local favorites:', error);
      return [];
    }
  }

  private saveToLocalStorage(seriesData: {
    seriesId: string;
    seriesTitle: string;
    seriesDescription?: string;
    posterUrl: string;
    totalEpisodes: number;
  }): void {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      const favorites = data ? JSON.parse(data) : {};

      favorites[seriesData.seriesId] = {
        id: seriesData.seriesId,
        seriesId: seriesData.seriesId,
        seriesTitle: seriesData.seriesTitle,
        seriesDescription: seriesData.seriesDescription,
        posterUrl: seriesData.posterUrl,
        totalEpisodes: seriesData.totalEpisodes,
        addedAt: new Date().toISOString(),
      };

      localStorage.setItem(this.localStorageKey, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  private removeFromLocalStorage(seriesId: string): void {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      if (!data) return;

      const favorites = JSON.parse(data);
      delete favorites[seriesId];

      localStorage.setItem(this.localStorageKey, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error removing from local storage:', error);
    }
  }

  // Sync local favorites with backend when user logs in
  async syncFavorites(): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const localFavorites = this.getLocalFavorites();
      if (localFavorites.length === 0) return;

      // Upload local favorites to backend
      await Promise.all(
        localFavorites.map(fav =>
          fetch(`${API_URL}/favorites`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              seriesId: fav.seriesId,
            }),
          }).catch(err => console.error('Sync error:', err))
        )
      );

      console.log('Favorites synced successfully');
    } catch (error) {
      console.error('Error syncing favorites:', error);
    }
  }
}

export const favoritesService = new FavoritesService();
