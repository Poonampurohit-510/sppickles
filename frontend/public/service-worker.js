/**
 * Service Worker
 * Enables offline support and strategic caching
 */

const CACHE_NAME = "sp-pickles-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
];

// Install event - cache static assets
self.addEventListener("install", (event: any) => {
  console.log("[ServiceWorker] Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event: any) => {
  console.log("[ServiceWorker] Activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[ServiceWorker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Strategy: API calls - network first, fallback to cache
  if (url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log("[ServiceWorker] Serving from cache:", request.url);
              return cached;
            }
            // Return offline page or generic response
            return new Response(
              JSON.stringify({
                error: "Offline - cached data not available",
              }),
              {
                status: 503,
                statusText: "Service Unavailable",
                headers: new Headers({ "Content-Type": "application/json" }),
              }
            );
          });
        })
    );
    return;
  }

  // Strategy: Static assets - cache first, fallback to network
  if (
    request.url.endsWith(".css") ||
    request.url.endsWith(".js") ||
    request.url.endsWith(".woff2") ||
    request.url.endsWith(".woff")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        });
      })
    );
    return;
  }

  // Strategy: Images - cache first with network fallback
  if (
    request.url.endsWith(".jpg") ||
    request.url.endsWith(".png") ||
    request.url.endsWith(".webp") ||
    request.url.endsWith(".svg")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const cache = caches.open(CACHE_NAME);
              cache.then((c) => c.put(request, response.clone()));
            }
            return response;
          })
        );
      })
    );
    return;
  }

  // Default: network first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || new Response("Offline - Page not available", { status: 503 });
        });
      })
  );
});
