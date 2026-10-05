const CACHE_NAME = "military-quiz-v1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json"
];

// 安裝 Service Worker
self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// 啟用新的 Service Worker
self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function(cacheName) {
                        return cacheName !== CACHE_NAME;
                    })
                    .map(function(cacheName) {
                        return caches.delete(cacheName);
                    })
            );
        })
    );

    self.clients.claim();
});

// 處理網頁請求
self.addEventListener("fetch", function(event) {
    event.respondWith(
        caches.match(event.request).then(function(cachedResponse) {

            // 有快取就直接使用
            if (cachedResponse) {
                return cachedResponse;
            }

            // 沒有快取就嘗試從網路取得
            return fetch(event.request)
                .then(function(networkResponse) {

                    // 將取得的內容加入快取
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
                    // 沒網路時，如果是網頁就回到首頁
                    if (event.request.mode === "navigate") {
                        return caches.match("./index.html");
                    }
                });
        })
    );
});