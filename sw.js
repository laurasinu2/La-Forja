const CACHE = "forja-narrador-v291-history-marker-unlocks";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=2.9.1",
  "./app.js?v=2.9.1",
  "./history.js?v=2.9.1",
  "./atlas.js?v=2.9.1",
  "./dungeon.js?v=2.9.1",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/statues/gladiador.png",
  "./assets/statues/poseidon.png",
  "./assets/statues/afrodita.png",
  "./assets/statues/bailarina.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
