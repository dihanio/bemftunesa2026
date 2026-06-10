const CACHE_NAME = 'bemft-ims-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logobemft.png',
  '/logo-kabinet.png',
  '/ft_unesa.webp',
  '/403'
];

// Install Event - Caching static app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('👷 [PWA SW] Pre-caching static app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('👷 [PWA SW] Clearing old cache: ', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale-While-Revalidate caching strategy
self.addEventListener('fetch', (event) => {
  // Only handle local/GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests, browser extensions, or WebSockets
  if (url.origin !== self.location.origin && !url.origin.includes('localhost') && !url.origin.includes('bemft')) {
    return;
  }

  // Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // If response is valid, clone and cache it
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          console.log('👷 [PWA SW] Fetch failed, network offline', err);
        });

        // Return cached response instantly if available, fallback to network fetch
        return cachedResponse || fetchPromise;
      });
    })
  );
});
