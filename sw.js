const CACHE_NAME = 'portafolio-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './pupuseria-la-bendicion.html',
  './trivia.html',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './screenshots/portafolio-desktop.png',
  './screenshots/portafolio-movil.png'
];
const APP_BASE = new URL('./', self.registration.scope);
const INDEX_URL = new URL('./index.html', APP_BASE).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('portafolio-shell-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) {
          try { await cache.put(request, response.clone()); } catch (_) {}
        }
        return response;
      } catch (_) {
        return (await cache.match(request)) ||
          (url.pathname === APP_BASE.pathname ? await cache.match(INDEX_URL) : null) ||
          new Response('Sin conexión. Vuelve a intentarlo cuando tengas internet.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
      }
    })());
    return;
  }

  if (url.pathname.startsWith(APP_BASE.pathname)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        try { await (await caches.open(CACHE_NAME)).put(request, response.clone()); } catch (_) {}
      }
      return response;
    })());
  }
});
