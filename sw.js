---
layout: null
---
const CACHE_VERSION = 'fxlip-v{{ site.time | date: "%s" }}';

const PRECACHE_URLS = [
  '/',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/js/autolink.js',
  '/assets/js/autoterm.js',
  '/assets/js/syntax.js',
  '/assets/js/greeting.js',
  '/assets/data/knowledge.json',
  '/assets/fonts/jetbrains-mono-v24-latin-regular.woff2',
  '/assets/img/favicon.svg'
];

// Install: pre-cacheia assets essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

const OFFLINE_HTML =
  '<html><body style="background:#13121d;color:#c5c6d0;font-family:monospace;padding:40px">' +
  '<pre>[OFFLINE] servindo do cache local\n\n' +
  'A página solicitada não está disponível offline.\n' +
  'Páginas já visitadas continuam acessíveis.</pre></body></html>';

// Fetch: estratégia por tipo de recurso
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignora requests não-GET e origens externas
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Redirects internos: resolve no SW sem carregar nenhuma página
  const p = url.pathname.replace(/\/$/, '');
  if (p === '/feed') { event.respondWith(Response.redirect('/', 302)); return; }
  if (p === '/busca') { event.respondWith(Response.redirect('/s', 302)); return; }

  // HTML: stale-while-revalidate (instantâneo do cache, atualiza em background)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Assets: cache-first (instantâneo, sem rede)
  event.respondWith(cacheFirst(event.request));
});

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  // Revalida em background independente de ter cache
  const fresh = fetch(request)
    .then(r => { if (r.ok) cache.put(request, r.clone()); return r; })
    .catch(() => null);

  // Serve cache imediatamente; se não tiver, espera a rede
  if (cached) return cached;
  return (await fresh) || new Response(OFFLINE_HTML,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    return new Response('', { status: 408 });
  }
}
