// Service Worker for BrewIt - Coffee Recipe Hub
const CACHE_NAME = 'brewit-v1.0.4';
const urlsToCache = [
  './',
  './index.html',
  './src/styles/styles.css',
  './src/script/script.js',
  './src/data/recipes.json',
  './manifest.json',
  './public/images/coffeebeans.jpg',
  './public/images/letter-b.png',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('SW installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('SW cache addAll failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('SW activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip unsupported schemes
  const url = new URL(event.request.url);
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' || 
      url.protocol === 'ms-browser-extension:' || 
      url.protocol === 'safari-extension:' || 
      url.protocol === 'opera-extension:' || 
      url.protocol === 'edge-extension:' ||
      url.protocol === 'data:' ||
      url.protocol === 'blob:' ||
      url.protocol === 'file:') {
    return;
  }

  // Only cache same-origin requests or specific external resources
  const isSameOrigin = url.origin === location.origin;
  const isAllowedExternal = url.hostname === 'cdn.jsdelivr.net' || 
                           url.hostname === 'fonts.googleapis.com' || 
                           url.hostname === 'fonts.gstatic.com';

  if (!isSameOrigin && !isAllowedExternal) {
    return;
  }

  // Special handling for CSS files - always try network first for fresh styles
  if (event.request.url.includes('styles.css')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.error('SW cache.put failed:', error);
              });

            return response;
          })
          .catch(error => {
            console.error('SW fetch failed:', error);
            
            // For document requests, serve index.html as fallback
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// Handle background sync for offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle any background sync tasks
  console.log('Background sync triggered');
} 