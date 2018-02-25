var cacheName = 'pwa-step-1-0';
var filesToCache = [
  '/index.html',
  '/settings.html',
  '/settings.js',
  '/info.html',
  '/chart.js',
  '/chartpage.html',
  '/app.js',
  '/css/materialize.css',
  '/css/style.css',
  '/js/init.js',
  '/manifest.json',
  '/js/materialize.js',
  '/js/jquery-2.1.1.min.js',
  '/js/Chart.bundle.min.js',
  '/fonts/roboto/Roboto-Regular.woff2',
  '/fonts/roboto/Roboto-Medium.woff2',
  '/fonts/roboto/Roboto-Light.woff2'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install - pwa-step1');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell (pwa)');
      console.log('files to cache: ' + filesToCache);
      return cache.addAll(filesToCache);
    }).catch( (result) => {
      console.log('HUPS catch error: ' + result);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate Install - pwa-step1');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    console.log('[ServiceWorker] Fetch', event.request.url);
    event.respondWith(
      caches.match(event.request).then(function(response) {
        console.log('response ' + JSON.stringify(response) + " event: " + event.request.url);
        if ( response !== null && response !== undefined ) {
          return response 
        } else {
          console.log('need to get from network: ' + JSON.stringify(event.request));
          return fetch(event.request);
        }
      }).catch ( err => {
        console.log('error during fetch from network: ' + err);
      })
    );
});
