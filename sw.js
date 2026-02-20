const CACHE_NAME = "khushaank-v3";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/assets/css/index.css",
  "/assets/js/script.js?v=3",
  "/assets/js/nav-algorithm.js",
  "/manifest.json",
  "/assets/images/favicon.png",
  "/assets/images/hero.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache v3");
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim()); 
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Clearing old cache:", cache);
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
});

self.addEventListener("fetch", (event) => {
  
  const url = new URL(event.request.url);

  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/admin") ||
    url.hostname.includes("supabase")
  ) {
    return;
  }

  
  if (event.request.headers.get("accept").includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        }),
    );
    return;
  }

  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
      );
    }),
  );
});
