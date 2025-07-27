const CACHE_NAME = 'brewit-v1';
const urlsToCache = [
  './',
  './index.html',
  './src/styles/styles.css',
  './src/script/script.js',
  './src/data/recipes.json',
  './manifest.json',
  './public/images/letter-b.png',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Cache installation failed:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip unsupported schemes and non-GET requests
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://') || 
      event.request.url.startsWith('moz-extension://') ||
      event.request.url.startsWith('ms-browser-extension://') ||
      event.request.url.startsWith('safari-extension://') ||
      event.request.url.startsWith('opera-extension://') ||
      event.request.url.startsWith('edge-extension://')) {
    return;
  }
  
  // Skip data URLs and blob URLs
  if (event.request.url.startsWith('data:') || 
      event.request.url.startsWith('blob:') ||
      event.request.url.startsWith('file:')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Only cache same-origin requests or specific external resources
          const url = new URL(event.request.url);
          const isSameOrigin = url.origin === self.location.origin;
          const isAllowedExternal = [
            'cdn.jsdelivr.net',
            'fonts.googleapis.com',
            'fonts.gstatic.com'
          ].some(domain => url.hostname.includes(domain));
          
          if (isSameOrigin || isAllowedExternal) {
            caches.open(CACHE_NAME)
              .then(cache => {
                return cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.log('Cache put failed for:', event.request.url, error);
              });
          }
          
          return response;
        }).catch(error => {
          console.log('Fetch failed for:', event.request.url, error);
          // If both cache and network fail, show offline page
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
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