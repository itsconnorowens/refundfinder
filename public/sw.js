const CACHE_NAME = 'flghtly-v1';
const RUNTIME_CACHE = 'runtime-cache';

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll([
        '/',
        '/claim',
        '/offline.html',
        '/manifest.json',
      ]).catch((error) => {
        console.error('[Service Worker] Cache addAll error:', error);
      });
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // For navigation requests, serve from cache or network with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }

  // For API requests, try network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          // Return generic API error for offline
          return new Response(JSON.stringify({
            error: 'No internet connection. Please try again when online.',
            offline: true
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        
        return response;
      });
    }).catch(() => {
      // Return offline page for HTML requests
      if (request.headers.get('accept')?.includes('text/html')) {
        return caches.match('/offline.html');
      }
    })
  );
});

// Background sync for offline claims
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-claims') {
    event.waitUntil(syncOfflineClaims());
  }
});

async function syncOfflineClaims() {
  console.log('[Service Worker] Syncing offline claims...');
  
  try {
    // This will be called from the main app when online
    const response = await fetch('/api/sync-offline-claims');
    const data = await response.json();
    
    console.log('[Service Worker] Sync result:', data);
    return data;
  } catch (error) {
    console.error('[Service Worker] Sync error:', error);
    throw error;
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const data = event.data?.json() || {};
  const title = data.title || 'Flghtly';
  const options = {
    body: data.body || 'You have a new update',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.data,
    requireInteraction: data.requireInteraction || false,
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  const data = event.notification.data;
  
  event.waitUntil(
    clients.openWindow(data?.url || '/')
  );
});

