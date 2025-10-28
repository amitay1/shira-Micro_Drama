const CACHE_NAME = 'shira-shorts-v1';
const STATIC_CACHE = 'shira-static-v1';
const DYNAMIC_CACHE = 'shira-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - Network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Videos - Network only (don't cache large video files)
  if (request.destination === 'video') {
    event.respondWith(fetch(request));
    return;
  }

  // Images - Cache first, fallback to network
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((response) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // HTML pages - Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();
        
        // Cache the response
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          
          // If no cache, return offline page
          if (request.destination === 'document') {
            return caches.match('/offline');
          }
        });
      })
  );
});

// Background sync for favorites and watch history
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
  
  if (event.tag === 'sync-watch-history') {
    event.waitUntil(syncWatchHistory());
  }
});

async function syncFavorites() {
  try {
    // Get pending favorites from IndexedDB or localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites') || '{}');
    const token = localStorage.getItem('accessToken');
    
    if (!token || Object.keys(favorites).length === 0) {
      return;
    }

    // Sync each favorite
    for (const [seriesId, data] of Object.entries(favorites)) {
      await fetch(`${self.location.origin}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ seriesId }),
      });
    }
    
    console.log('[Service Worker] Favorites synced');
  } catch (error) {
    console.error('[Service Worker] Sync favorites failed:', error);
    throw error;
  }
}

async function syncWatchHistory() {
  try {
    const history = JSON.parse(localStorage.getItem('watchHistory') || '{}');
    const token = localStorage.getItem('accessToken');
    
    if (!token || Object.keys(history).length === 0) {
      return;
    }

    // Sync each watch progress
    for (const [episodeId, data] of Object.entries(history)) {
      await fetch(`${self.location.origin}/api/playback/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          episodeId,
          progress: data.progress,
          duration: data.duration,
          timestamp: Math.floor((data.progress / 100) * data.duration),
        }),
      });
    }
    
    console.log('[Service Worker] Watch history synced');
  } catch (error) {
    console.error('[Service Worker] Sync watch history failed:', error);
    throw error;
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'פרק חדש זמין לצפייה!',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    image: data.image,
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    data: {
      url: data.url || '/',
    },
    actions: [
      {
        action: 'open',
        title: 'צפה עכשיו',
        icon: '/icons/icon.svg',
      },
      {
        action: 'close',
        title: 'סגור',
        icon: '/icons/icon.svg',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Shira Shorts',
      options
    )
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message from client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      })
    );
  }
});
