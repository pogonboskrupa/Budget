const CACHE = 'budzet-v4';

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

  // Never intercept Firebase realtime DB or auth traffic
  if(
    url.includes('firebasedatabase') ||
    url.includes('firebaseio') ||
    url.includes('identitytoolkit') ||
    url.includes('securetoken.googleapis.com')
  ) return;

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
