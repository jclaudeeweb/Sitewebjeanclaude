
const CACHE_NAME = "dialogue-v3";

// INSTALLATION
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll([
        "./",
        "./index.html",
        "./manifest.json"
      ])
    )
  );

  self.skipWaiting();
});

// ACTIVATION
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key =>
          key.startsWith("dialogue-") &&
          key !== CACHE_NAME
        ).map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// OFFLINE / CACHE
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      return await caches.match(event.request) ||
        new Response("Internet connection required", {
          status: 503
        });
    })
  );
});

// PUSH NOTIFICATION
self.addEventListener("push", event => {

  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: "Dialogue",
      body: "Vous avez reçu un nouveau message."
    };
  }

  const title = data.title || "Dialogue";

  const options = {
    body: data.body || "Vous avez un nouveau message.",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: data.tag || "dialogue-message",
    renotify: true,
    data: {
      url: data.url || "./index.html"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// CLICK NOTIFICATION
self.addEventListener("notificationclick", event => {

  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "./index.html",
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(clients => {

      for (const client of clients) {
        if (client.url.startsWith(self.location.origin)) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});
