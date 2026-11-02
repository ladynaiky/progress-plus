/* =====================================================================
   Progress+ · sw.js (service worker)
   Guarda una copia de la app en el móvil para que se abra sin conexión.
   - Archivos de la app: primero se piden a internet (así siempre tienes
     la última versión) y, si no hay conexión, se usa la copia guardada.
   - Tipografías: se usa la copia guardada, porque no cambian nunca.
   ===================================================================== */

const CACHE = 'progress-plus-v1';

const ARCHIVOS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/favicon-32.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(nombres => Promise.all(nombres.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evento => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;
  const url = new URL(peticion.url);

  if (url.origin === self.location.origin) {
    evento.respondWith(
      fetch(peticion)
        .then(respuesta => {
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE).then(cache => cache.put(peticion, copia));
          }
          return respuesta;
        })
        .catch(() => caches.match(peticion, { ignoreSearch: true })
          .then(guardada => guardada || caches.match('./index.html')))
    );
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    evento.respondWith(
      caches.match(peticion).then(guardada => guardada || fetch(peticion).then(respuesta => {
        const copia = respuesta.clone();
        caches.open(CACHE).then(cache => cache.put(peticion, copia));
        return respuesta;
      }))
    );
  }
});
