// Service Worker for BrewIt - Coffee Recipe Hub
const CACHE_NAME = 'brewit-v1.4.0';
const urlsToCache = [
  './',
  './index.html',
  './coffee-guide.html',
  './src/script/script.js',
  './src/styles/styles.css',
  './src/data/recipes.json',
  './manifest.json',
  './public/images/letter-b.png',
  './public/images/coffeebeans.jpg',
  './public/images/beansbg.jpg',
  './public/images/bg.jpg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache)
          .catch(error => {
            console.warn('Failed to cache some resources:', error);
            // Cache individually to avoid total failure
            return Promise.allSettled(
              urlsToCache.map(url => cache.add(url))
            );
          });
      })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and unsupported URL schemes
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://') ||
      event.request.url.startsWith('moz-extension://') ||
      event.request.url.startsWith('safari-extension://') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Special handling for CSS files (remove query parameters for caching)
        if (event.request.url.includes('styles.css')) {
          const baseUrl = event.request.url.split('?')[0];
          return fetch(baseUrl)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(baseUrl, responseToCache);
                  });
              }
              return networkResponse;
            })
            .catch(() => {
              // If network fetch fails, try original request
              return fetch(event.request);
            });
        }

        // Special handling for recipes.json with multiple fallback strategies
        if (event.request.url.includes('recipes.json')) {
          const fallbackUrls = [
            './src/data/recipes.json',
            'src/data/recipes.json',
            '/BrewIt/src/data/recipes.json'
          ];
          
          return tryFetchStrategies([event.request.url, ...fallbackUrls])
            .then(response => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return response;
            });
        }

        // Regular network request with caching
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch((err) => {
            // Offline fallback for HTML pages
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            throw err;
          });
      })
  );
});

// Helper function to try multiple fetch strategies
async function tryFetchStrategies(urls) {
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      continue;
    }
  }
  throw new Error('All fetch strategies failed');
}

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
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