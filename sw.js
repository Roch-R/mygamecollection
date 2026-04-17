const CACHE = 'gamezone-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/game.css',
  '/game.js',
  '/flappy.css',
  '/tetris-patch.js',
  '/blockblast-game.js',
  '/snake-game.js',
  '/pacman-game.js',
  '/clickergame.js',
  '/memorygame.js',
  '/rockpaperscissors.js',
  '/skyjump-game.js',
  '/car-racing-game.js',
  '/wordsearch-game.js',
  '/1945-plane-shooter.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'})).filter((_, i) => i < 18)))
      .catch(() => {})
  );
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
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
