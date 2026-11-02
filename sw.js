
const CACHE_NAME = "military-quiz-v2";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json"
];

// 安裝新版 Service Worker
self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// 啟用新版並清除舊快取
self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function(cacheName) {
                        return cacheName.startsWith("military-quiz-") &&
                               cacheName !== CACHE_NAME;
                    })
                    .map(function(cacheName) {
                        return caches.delete(cacheName);
                    })
            );
        })
    );

    self.clients.claim();
});

// 網頁請求：有網路時優先取得最新版本
self.addEventListener("fetch", function(event) {

    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function(networkResponse) {

                if (
                    networkResponse &&
                    networkResponse.status === 200 &&
                    networkResponse.type === "basic"
                ) {
                    const responseToCache = networkResponse.clone();

                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseToCache);
                    });
                }

                return networkResponse;
            })
            .catch(function() {
                return caches.match(event.request).then(function(cachedResponse) {

                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    if (event.request.mode === "navigate") {
                        return caches.match("./index.html");
                    }
                });
            })
    );
});
