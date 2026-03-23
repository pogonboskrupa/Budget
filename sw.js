const CACHE = 'budzet-v6';

// Files to pre-cache on install
const PRECACHE = ['/', '/Budget/', '/Budget/index.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never intercept Firebase realtime DB traffic
  if(url.includes('firebasedatabase') || url.includes('firebaseio')) return;

  // Never intercept Firebase SDK / gstatic CDN — always load fresh
  if(url.includes('gstatic.com') || url.includes('googleapis.com')) return;

  // For navigation requests (page loads), always try network first
  // If network fails, serve cached index.html so PWA doesn't show 404
  if(e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if(res && res.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match('/Budget/index.html') || caches.match('/Budget/'))
    );
    return;
  }

  // Network-first: try live network, cache result; fall back to cache if offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if(res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
