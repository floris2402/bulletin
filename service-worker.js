// Bulletin — service worker
// Met en cache les fichiers de l'app pour qu'elle fonctionne hors-ligne une fois installée.
// À chaque changement de version ci-dessous, les anciens caches sont purgés automatiquement.

const VERSION = 'bulletin-v3';

const FICHIERS_A_METTRE_EN_CACHE = [
  './',
  './index.html',
  './saisie.html',
  './apercu.html',
  './historique.html',
  './manifest.json',
  './css/style.css',
  './js/db.js',
  './js/date-utils.js',
  './js/heures-utils.js',
  './js/preferences.js',
  './js/pdf-generator.js',
  './js/nouvelle-semaine.js',
  './js/saisie.js',
  './js/apercu.js',
  './js/historique.js',
  './assets/logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/pdfmake@latest/build/pdfmake.min.js',
  'https://cdn.jsdelivr.net/npm/pdfmake@latest/build/vfs_fonts.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(FICHIERS_A_METTRE_EN_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(noms.filter((nom) => nom !== VERSION).map((nom) => caches.delete(nom)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((reponseEnCache) => {
      return reponseEnCache || fetch(event.request).then((reponseReseau) => {
        if (event.request.url.startsWith(self.location.origin)) {
          const copie = reponseReseau.clone();
          caches.open(VERSION).then((cache) => cache.put(event.request, copie));
        }
        return reponseReseau;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
