import { apiClient } from '@/lib/api-client';
import { mockSeries, getEpisodesBySeriesId, type Series as MockSeries } from '@/data/mockSeries';
import type { Episode, Series } from '@/types';
import { supabaseHelpers } from '@/lib/supabase';

class SeriesService {
  private useBackend = true;
  private useSupabase = true; // Use Supabase by default

  async getAllSeries(): Promise<any[]> {
    // Try Supabase first
    if (this.useSupabase) {
      try {
        const data = await supabaseHelpers.getAllSeries();
        if (data && data.length > 0) {
          return data.map(this.mapSupabaseSeries);
        }
      } catch (error) {
        console.warn('Supabase unavailable, trying backend API');
      }
    }

    // Fallback to backend API
    if (this.useBackend) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/series`);
        const data = await response.json();
        return data.data?.series || mockSeries;
      } catch (error) {
        console.warn('Backend unavailable, using mock data');
        return mockSeries;
      }
    }
    return mockSeries;
  }

  // Map Supabase format to our app format
  private mapSupabaseSeries(s: any): any {
    return {
      id: s.id,
      title: s.title,
      titleEn: s.title_en,
      description: s.description,
      descriptionEn: s.description_en,
      slug: s.slug,
      posterUrl: s.poster_url,
      logoUrl: s.logo_url,
      trailerUrl: s.trailer_url,
      thumbnailUrl: s.poster_url, // For compatibility
      bannerUrl: s.poster_url, // For compatibility
      genres: s.genres,
      genre: s.genres?.[0] || 'Drama', // For compatibility
      releaseDate: s.release_date,
      releaseYear: new Date(s.release_date).getFullYear(),
      totalEpisodes: s.total_episodes,
      freeEpisodesCount: s.free_episodes_count,
      seasonPassPrice: parseFloat(s.season_pass_price),
      currency: s.currency,
      status: s.status,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    };
  }

  // Map Supabase episode format to our app format
  private mapSupabaseEpisode(e: any): Episode {
    return {
      id: e.id,
      seriesId: e.series_id,
      episodeNumber: e.episode_number,
      title: e.title,
      titleEn: e.title_en,
      description: e.description,
      thumbnailUrl: e.thumbnail_url,
      videoUrl: e.video_url,
      duration: e.duration,
      isFree: e.is_free,
      isLocked: !e.is_free,
      views: e.views || 0,
      order: e.episode_number,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    };
  }

  async getSeries(seriesId: string): Promise<any | null> {
    // Try Supabase first
    if (this.useSupabase) {
      try {
        const allSeries = await supabaseHelpers.getAllSeries();
        const series = allSeries.find(s => s.id === seriesId);
        if (series) {
          return this.mapSupabaseSeries(series);
        }
      } catch (error) {
        console.warn('Supabase unavailable, trying backend API');
      }
    }

    // Fallback to backend API
    if (this.useBackend) {
      try {
        const response = await apiClient.getSeries(seriesId);
        return response.data;
      } catch (error) {
        console.warn('Backend unavailable, using mock data');
      }
    }
    return mockSeries.find(s => s.id === seriesId) || null;
  }

  async getSeriesById(seriesId: string): Promise<any | null> {
    return this.getSeries(seriesId);
  }

  async getSeriesBySlug(slug: string): Promise<any | null> {
    // Try Supabase first
    if (this.useSupabase) {
      try {
        const series = await supabaseHelpers.getSeriesBySlug(slug);
        if (series) {
          return this.mapSupabaseSeries(series);
        }
      } catch (error) {
        console.warn('Supabase unavailable, trying backend API');
      }
    }

    // Fallback to backend API
    if (this.useBackend) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/series`);
        const data = await response.json();
        const series = data.data?.series || [];
        return series.find((s: any) => s.slug === slug) || null;
      } catch (error) {
        console.warn('Backend unavailable, using mock data');
      }
    }
    return mockSeries.find(s => ('slug' in s ? s.slug : s.id) === slug) || null;
  }

  async getEpisodes(seriesId: string): Promise<Episode[]> {
    // Try Supabase first
    if (this.useSupabase) {
      try {
        const episodes = await supabaseHelpers.getEpisodesBySeries(seriesId);
        if (episodes && episodes.length > 0) {
          return episodes.map(e => this.mapSupabaseEpisode(e));
        }
      } catch (error) {
        console.warn('Supabase unavailable, trying backend API');
      }
    }

    // Fallback to backend API
    if (this.useBackend) {
      try {
        const response = await apiClient.getEpisodes(seriesId);
        return response.data;
      } catch (error) {
        console.warn('Backend unavailable, using mock data');
      }
    }
    return getEpisodesBySeriesId(seriesId);
  }

  async checkAccess(seriesId: string): Promise<boolean> {
    if (this.useBackend) {
      try {
        const response = await apiClient.checkAccess(seriesId);
        return response.data?.hasAccess || false;
      } catch (error) {
        console.warn('Backend unavailable, returning free access');
      }
    }
    return false;
  }

  enableBackend() {
    this.useBackend = true;
  }

  disableBackend() {
    this.useBackend = false;
  }

  enableSupabase() {
    this.useSupabase = true;
  }

  disableSupabase() {
    this.useSupabase = false;
  }
}

class EpisodesService {
  private useBackend = true;
  private useSupabase = true; // Use Supabase by default

  // Map Supabase episode format to our app format
  private mapSupabaseEpisode(e: any): Episode {
    return {
      id: e.id,
      seriesId: e.series_id,
      episodeNumber: e.episode_number,
      title: e.title,
      titleEn: e.title_en,
      description: e.description,
      thumbnailUrl: e.thumbnail_url,
      videoUrl: e.video_url,
      duration: e.duration,
      isFree: e.is_free,
      isLocked: !e.is_free,
      views: e.views || 0,
      order: e.episode_number,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
    };
  }

  async getEpisodesBySeries(seriesId: string): Promise<Episode[]> {
    // Try Supabase first
    if (this.useSupabase) {
      try {
        const episodes = await supabaseHelpers.getEpisodesBySeries(seriesId);
        if (episodes && episodes.length > 0) {
          return episodes.map(e => this.mapSupabaseEpisode(e));
        }
      } catch (error) {
        console.warn('Supabase unavailable, trying backend API');
      }
    }

    // Fallback to backend API
    if (this.useBackend) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/series/${seriesId}/episodes`);
        const data = await response.json();
        return data.data?.episodes || [];
      } catch (error) {
        console.warn('Backend unavailable, using mock data');
      }
    }
    return getEpisodesBySeriesId(seriesId);
  }

  async getEpisodeById(episodeId: string): Promise<Episode | null> {
    // Try Supabase first
    if (this.useSupabase) {
      try {
        const episode = await supabaseHelpers.getEpisodeById(episodeId);
        if (episode) {
          return this.mapSupabaseEpisode(episode);
        }
      } catch (error) {
        console.warn('Supabase unavailable, trying backend API');
      }
    }

    // Fallback to backend API
    if (this.useBackend) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/episodes/${episodeId}`);
        const data = await response.json();
        return data.data?.episode || null;
      } catch (error) {
        console.warn('Backend unavailable, using mock data');
      }
    }
    // Fallback to mock data
    for (const series of mockSeries) {
      const episodes = getEpisodesBySeriesId(series.id);
      const episode = episodes.find(e => e.id === episodeId);
      if (episode) return episode;
    }
    return null;
  }
}

export const seriesService = new SeriesService();
export const episodesService = new EpisodesService();
export default seriesService;
