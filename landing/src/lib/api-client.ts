import axios, { AxiosInstance, AxiosError } from 'axios';
import type { ApiResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError<ApiResponse<any>>) => {
        if (error.code === 'ERR_NETWORK') {
          console.warn('Backend not available - working in offline mode');
        }
        return Promise.reject(error.response?.data || error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  }

  // Series APIs
  async getSeries(seriesId: string) {
    return this.client.get(`/series/${seriesId}`);
  }

  async getEpisodes(seriesId: string) {
    return this.client.get(`/series/${seriesId}/episodes`);
  }

  async getEpisode(episodeId: string) {
    return this.client.get(`/episodes/${episodeId}`);
  }

  // Playback APIs
  async getVideoUrl(episodeId: string, quality?: string) {
    return this.client.get(`/playback/${episodeId}/url`, {
      params: { quality },
    });
  }

  async trackPlayback(episodeId: string, position: number, duration: number) {
    return this.client.post(`/playback/${episodeId}/track`, {
      position,
      duration,
    });
  }

  // Payment APIs
  async createPayment(data: {
    seriesId: string;
    email: string;
    name: string;
    phone?: string;
    couponCode?: string;
  }) {
    return this.client.post('/season-pass/create-order', data);
  }

  async validateCoupon(code: string, seriesId: string) {
    return this.client.post('/season-pass/validate-coupon', {
      code,
      seriesId,
    });
  }

  async checkAccess(seriesId: string) {
    return this.client.get(`/season-pass/check-access/${seriesId}`);
  }

  async getMyPasses() {
    return this.client.get('/season-pass/my-passes');
  }

  async getInvoice(orderId: string) {
    return this.client.get(`/season-pass/invoice/${orderId}`);
  }

  // User APIs
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', {
      email,
      password,
    });
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async register(email: string, name: string, password: string) {
    return this.client.post('/auth/register', {
      email,
      name,
      password,
    });
  }

  async getProfile() {
    return this.client.get('/users/profile');
  }

  async updateWatchHistory(episodeId: string, position: number) {
    return this.client.post('/users/watch-history', {
      episodeId,
      position,
    });
  }

  async getPurchases() {
    return this.client.get('/users/purchases');
  }

  // Analytics APIs
  async trackEvent(eventName: string, params: Record<string, any>) {
    return this.client.post('/analytics/events', {
      eventName,
      params,
      timestamp: new Date().toISOString(),
    });
  }

  async getInvoice(orderId: string) {
    return this.client.get(`/invoices/${orderId}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
