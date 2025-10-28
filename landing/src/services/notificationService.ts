'use client';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface PushSubscriptionInfo {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default',
    };
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        
        // Subscribe to push notifications
        await this.subscribeToPush();
        
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('Already subscribed to push notifications');
        return subscription;
      }

      // Subscribe to push notifications
      // Note: In production, you'll need to generate VAPID keys
      // For now, we'll use a placeholder
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      
      if (!vapidPublicKey) {
        console.warn('VAPID public key not configured');
        return null;
      }

      const uint8Array = this.urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: uint8Array.buffer as ArrayBuffer,
      });

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription);

      console.log('Subscribed to push notifications');
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove subscription from backend
        await this.removeSubscriptionFromBackend(subscription);
        
        console.log('Unsubscribed from push notifications');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    }
  }

  /**
   * Show a local notification
   */
  async showNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    const permission = this.getPermissionStatus();
    if (!permission.granted) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(title, {
        icon: '/icons/icon.svg',
        badge: '/icons/icon.svg',
        ...options,
      } as NotificationOptions);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Show new episode notification
   */
  async notifyNewEpisode(
    seriesTitle: string,
    episodeTitle: string,
    episodeId: number
  ): Promise<void> {
    await this.showNotification('פרק חדש זמין!', {
      body: `${seriesTitle} - ${episodeTitle}`,
      tag: `episode-${episodeId}`,
      data: {
        url: `/watch/${episodeId}`,
      },
    } as any);
  }

  /**
   * Show continue watching reminder
   */
  async notifyContinueWatching(
    seriesTitle: string,
    episodeTitle: string,
    episodeId: number,
    progress: number
  ): Promise<void> {
    await this.showNotification('המשך מהמקום שעצרת', {
      body: `${seriesTitle} - ${episodeTitle} (${progress}%)`,
      tag: `continue-${episodeId}`,
      data: {
        url: `/watch/${episodeId}`,
      },
    } as any);
  }

  /**
   * Schedule a notification reminder
   */
  scheduleReminder(hours: number): void {
    const delay = hours * 60 * 60 * 1000;
    
    setTimeout(() => {
      this.notifyContinueWatchingFromHistory();
    }, delay);
    
    // Save reminder in localStorage
    localStorage.setItem('notification-reminder', 
      JSON.stringify({
        scheduledAt: new Date().toISOString(),
        scheduledFor: new Date(Date.now() + delay).toISOString(),
      })
    );
  }

  /**
   * Send a continue watching notification based on watch history
   */
  private async notifyContinueWatchingFromHistory(): Promise<void> {
    try {
      // Get watch history from localStorage
      const history = JSON.parse(localStorage.getItem('watchHistory') || '{}');
      
      // Find episodes with progress between 5% and 95%
      const inProgress = Object.values(history).filter((item: any) => 
        item.progress >= 5 && item.progress < 95
      );
      
      if (inProgress.length === 0) {
        return;
      }
      
      // Get the most recent one
      const latest = inProgress.sort((a: any, b: any) => 
        new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
      )[0] as any;
      
      await this.notifyContinueWatching(
        latest.seriesTitle,
        latest.episodeTitle,
        latest.episodeId,
        Math.round(latest.progress)
      );
    } catch (error) {
      console.error('Error sending continue watching notification:', error);
    }
  }

  /**
   * Send subscription to backend
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('User not authenticated, skipping subscription sync');
        return;
      }

      const subscriptionData = subscription.toJSON();
      
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscriptionData.endpoint,
          keys: subscriptionData.keys,
        }),
      });
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
    }
  }

  /**
   * Remove subscription from backend
   */
  private async removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      const subscriptionData = subscription.toJSON();
      
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscriptionData.endpoint,
        }),
      });
    } catch (error) {
      console.error('Error removing subscription from backend:', error);
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;
