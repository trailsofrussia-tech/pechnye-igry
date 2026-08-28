const CACHE_NAME = 'stoves-pwa-v7';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  '../shared/museum-promo.js',
  '../shared/embed-height.js',
  './icon-192.png',
  './icon-512.png',
  // gifs
  './gg122c7d9760.gif','./gg13441bdd7f.gif','./gg62f36d7bfd.gif','./ggf82250599e.gif',
  './gg35b3bef6e2.gif','./gg8fe06d82fe.gif','./gg65b65bc738.gif','./gg04a7642ce9.gif','./gg5bc208e054.gif',
  './gg2ccb60836e.gif'
  ,'./pech-po-chernomu.png','./pech-po-chernomu-fire.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        // only cache GET requests and same-origin
        if (e.request.method === 'GET' && new URL(e.request.url).origin === location.origin) {
          cache.put(e.request, copy);
        }
      });
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
