// Bump the version whenever shipping changed files; cache URLs stay inside the repo scope.
const CACHE = "penalty-v11";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./libs/three.module.js",
  "./js/main.js",
  "./js/club.js",
  "./js/nationality.js",
  "./js/pack-opening.js",
  "./js/progression.js",
  "./js/player-career.js",
  "./js/player-career-ui.js",
  "./js/shop-guide.js",
  "./js/config.js",
  "./js/pitch.js",
  "./js/ball.js",
  "./js/player.js",
  "./js/appearance.js",
  "./js/player-head.js",
  "./js/team.js",
  "./js/ai.js",
  "./js/goalkeeper.js",
  "./js/rules.js",
  "./js/input.js",
  "./js/camera.js",
  "./js/hud.js",
  "./js/audio.js",
  "./js/state.js",
];
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(FILES))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("penalty-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (e) => {
  if (
    e.request.method !== "GET" ||
    !e.request.url.startsWith(self.registration.scope)
  )
    return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
