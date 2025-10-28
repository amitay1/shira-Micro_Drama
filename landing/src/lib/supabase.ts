/**
 * Supabase Client Configuration
 * Handles database and storage operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Database Types (will be auto-generated from Supabase later)
export interface Database {
  public: {
    Tables: {
      series: {
        Row: {
          id: string;
          title: string;
          title_en: string | null;
          description: string;
          description_en: string | null;
          slug: string;
          poster_url: string;
          logo_url: string | null;
          trailer_url: string;
          genres: string[];
          release_date: string;
          total_episodes: number;
          free_episodes_count: number;
          season_pass_price: number;
          currency: string;
          status: 'coming_soon' | 'active' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['series']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['series']['Insert']>;
      };
      episodes: {
        Row: {
          id: string;
          series_id: string;
          episode_number: number;
          title: string;
          title_en: string | null;
          description: string | null;
          thumbnail_url: string;
          video_url: string;
          duration: number;
          is_free: boolean;
          views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['episodes']['Row'], 'id' | 'created_at' | 'updated_at' | 'views'>;
        Update: Partial<Database['public']['Tables']['episodes']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          series_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['favorites']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
      watch_history: {
        Row: {
          id: string;
          user_id: string;
          episode_id: string;
          series_id: string;
          last_position: number;
          completed: boolean;
          watched_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['watch_history']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['watch_history']['Insert']>;
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          series_id: string;
          price: number;
          currency: string;
          transaction_id: string;
          invoice_url: string | null;
          status: 'active' | 'expired' | 'refunded';
          purchased_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['purchases']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['purchases']['Insert']>;
      };
    };
  };
}

// Helper functions
export const supabaseHelpers = {
  /**
   * Get all series with episode count
   */
  async getAllSeries() {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .order('release_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get series by slug
   */
  async getSeriesBySlug(slug: string) {
    const { data, error } = await supabase
      .from('series')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get episodes for a series
   */
  async getEpisodesBySeries(seriesId: string) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('series_id', seriesId)
      .order('episode_number', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Get single episode
   */
  async getEpisodeById(episodeId: string) {
    const { data, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Save watch progress
   */
  async saveWatchProgress(
    userId: string,
    episodeId: string,
    seriesId: string,
    lastPosition: number,
    completed: boolean
  ) {
    const { data, error } = await supabase
      .from('watch_history')
      .upsert({
        user_id: userId,
        episode_id: episodeId,
        series_id: seriesId,
        last_position: lastPosition,
        completed,
        watched_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,episode_id',
      });

    if (error) throw error;
    return data;
  },

  /**
   * Get user's watch history
   */
  async getWatchHistory(userId: string) {
    const { data, error } = await supabase
      .from('watch_history')
      .select(`
        *,
        episodes (
          *,
          series (*)
        )
      `)
      .eq('user_id', userId)
      .order('watched_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Add to favorites
   */
  async addToFavorites(userId: string, seriesId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        series_id: seriesId,
      });

    if (error) throw error;
    return data;
  },

  /**
   * Remove from favorites
   */
  async removeFromFavorites(userId: string, seriesId: string) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('series_id', seriesId);

    if (error) throw error;
  },

  /**
   * Get user's favorites
   */
  async getFavorites(userId: string) {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        series (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Check if user has purchased series
   */
  async checkPurchase(userId: string, seriesId: string) {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('series_id', seriesId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  /**
   * Upload video to Supabase Storage
   */
  async uploadVideo(file: File, path: string) {
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data;
  },

  /**
   * Get public URL for video
   */
  getVideoUrl(path: string) {
    const { data } = supabase.storage
      .from('videos')
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(file: File, path: string) {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data;
  },

  /**
   * Get public URL for image
   */
  getImageUrl(path: string) {
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(path);

    return data.publicUrl;
  },
};

export default supabase;
