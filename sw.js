// Bump this when the shell (index.html / icons) changes meaningfully —
// old caches are dropped automatically on activate.
var CACHE_NAME = 'turbors-shell-v1';
var SHELL = ['/', '/index.html', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // Photos: serve instantly from cache if present, refresh in the background.
  if (url.pathname.indexOf('/images/') === 0) {
    e.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(e.request).then(function (cached) {
          var fetchPromise = fetch(e.request).then(function (res) {
            cache.put(e.request, res.clone());
            return res;
          }).catch(function () { return cached; });
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Page shell: prefer the network so edits ship immediately, fall back
  // to the cached copy when offline or the connection is bad.
  if (url.pathname === '/' || url.pathname.indexOf('/index.html') !== -1) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        caches.open(CACHE_NAME).then(function (cache) { cache.put(e.request, res.clone()); });
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
  }
});
