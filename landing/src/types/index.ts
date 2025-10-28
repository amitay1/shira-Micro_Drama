// Series & Episodes Types
export interface Series {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  posterUrl: string;
  logoUrl?: string;
  trailerUrl: string;
  genres: string[];
  genre?: string; // For compatibility with mock data
  releaseDate: string;
  totalEpisodes: number;
  freeEpisodesCount: number;
  seasonPassPrice: number;
  currency: 'ILS' | 'USD' | 'EUR';
  status: 'coming_soon' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  slug?: string; // URL-friendly identifier
  thumbnailUrl?: string; // For compatibility
  bannerUrl?: string; // For compatibility
  rating?: number; // For compatibility
  releaseYear?: number; // For compatibility
}

export interface Episode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  titleEn?: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // in seconds
  isFree: boolean;
  isLocked?: boolean;
  views: number;
  likes?: number;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

// User & Auth Types
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  hasActivePass: boolean;
  purchasedSeries: string[];
  watchHistory: WatchHistoryItem[];
  favorites: string[];
  createdAt: string;
}

export interface WatchHistoryItem {
  episodeId: string;
  seriesId: string;
  lastPosition: number; // in seconds
  completed: boolean;
  watchedAt: string;
}

// Payment & Purchase Types
export interface SeasonPass {
  id: string;
  userId: string;
  seriesId: string;
  price: number;
  currency: string;
  purchaseDate: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'refunded';
}

export interface PaymentRequest {
  seriesId: string;
  userId?: string;
  email: string;
  name: string;
  phone?: string;
  couponCode?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  orderId: string;
  invoiceUrl?: string;
  error?: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: string;
  validUntil: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
}

// Analytics Types
export interface AnalyticsEvent {
  eventName: string;
  eventCategory: string;
  eventLabel?: string;
  eventValue?: number;
  customParams?: Record<string, any>;
}

export interface VideoPlayerConfig {
  autoplay: boolean;
  controls: boolean;
  fluid: boolean;
  aspectRatio: '9:16' | '16:9';
  playbackRates: number[];
  enableDRM: boolean;
  enablePIP: boolean;
}

export interface VideoQuality {
  height: number;
  bitrate: number;
  label: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Form Types
export interface CheckoutFormData {
  email: string;
  name: string;
  phone?: string;
  acceptTerms: boolean;
  couponCode?: string;
}
