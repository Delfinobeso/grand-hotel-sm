/**
 * Service Worker per Push Notifications — Blasat
 *
 * Da copiare nella root public/ della PWA Next.js.
 * Gestisce eventi push in arrivo e click sulle notifiche.
 *
 * Nota: Next.js 16 con App Router — questo file va in public/sw.js
 * e viene registrato dal client con navigator.serviceWorker.register('/sw.js')
 */

/**
 * Versione della cache: cambiarla invalida tutte le cache precedenti
 * (vedi evento 'activate' più sotto).
 */
const CACHE_VERSION = 'blasat-v1';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';
const STATIC_CACHE = CACHE_VERSION + '-static';

/**
 * Evento install: attiva subito il nuovo Service Worker senza aspettare
 * la chiusura delle vecchie tab.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

/**
 * Evento activate: ripulisce le cache di versioni precedenti e prende
 * il controllo delle pagine già aperte.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

/**
 * Evento fetch: strategie di caching differenziate per tipo di risorsa.
 * Offline fallback per la shell di navigazione, cache-first per gli asset
 * hashati di Next, stale-while-revalidate per immagini/font/manifest.
 */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // niente tile mappa/terze parti
  if (url.pathname.startsWith('/api/')) return; // mai cachare le API

  // Shell di navigazione: network-first, fallback cache (offline → ultima shell vista)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return (await caches.match(req)) || (await caches.match('/')) || Response.error();
        }
      })()
    );
    return;
  }

  // Asset hashati Next (immutabili): cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const fresh = await fetch(req);
        if (fresh.ok) (await caches.open(STATIC_CACHE)).put(req, fresh.clone());
        return fresh;
      })()
    );
    return;
  }

  // Immagini, font, manifest: stale-while-revalidate
  if (req.destination === 'image' || req.destination === 'font' || url.pathname === '/manifest.json') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => undefined);
        return cached || (await network) || Response.error();
      })()
    );
  }
});

// Assegna un ID univoco a ogni notifica per evitare duplicati
let notificationId = 0;

/**
 * Evento push: riceve la notifica dal server e la mostra all'utente.
 * Il server invia un payload JSON con { title, body, icon, badge, url, project }
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[Blasat SW] Push ricevuto senza payload, ignorato');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    console.error('[Blasat SW] Payload non valido:', err);
    // Fallback: mostra il testo raw
    payload = { title: 'Blasat', body: event.data.text() };
  }

  const {
    title = 'Blasat',
    body = 'Nuova notifica',
    icon = '/icon-192x192.png',
    badge = '/icon-72x72.png',
    url = '/',
    project = 'blasat',
    tag = `blasat-${project}-${notificationId++}`,
    requireInteraction = false,
  } = payload;

  const options = {
    body,
    icon,
    badge,
    tag,
    requireInteraction,
    vibrate: [200, 100, 200],
    data: {
      url,
      project,
      timestamp: Date.now(),
    },
    // Azioni rapide sulla notifica (opzionale)
    actions: payload.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.error('[Blasat SW] Errore showNotification:', err);
    })
  );
});

/**
 * Evento notificationclick: gestisce il click/tap sulla notifica.
 * Apre l'URL specificato o mette a fuoco la finestra PWA esistente.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { url = '/' } = event.notification.data || {};

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Cerca una finestra già aperta con l'URL target
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Nessuna finestra aperta: aprine una nuova
      if (clients.openWindow) {
        try {
          return clients.openWindow(url);
        } catch (err) {
          console.error('[Blasat SW] Impossibile aprire finestra:', err);
        }
      }
    })
  );
});

/**
 * Evento notificationclose: opzionale, traccia chiusura notifica.
 */
self.addEventListener('notificationclose', (event) => {
  const { project, url } = event.notification.data || {};
  console.log(`[Blasat SW] Notifica chiusa — progetto: ${project}, url: ${url}`);
});

/**
 * Evento pushsubscriptionchange: notifica il server quando la subscription scade o cambia.
 * Il server rinnova la subscription automaticamente.
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  console.warn('[Blasat SW] Subscription scaduta, invio nuova subscription al server');

  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: self.registration.pushManager
          .getSubscription()
          .then((sub) => {
            // Se abbiamo ancora una subscription, usa la stessa key
            if (sub) {
              return sub.options.applicationServerKey;
            }
            throw new Error('Nessuna subscription esistente');
          }),
      })
      .then((newSubscription) => {
        // Invia la nuova subscription al server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: 'blasat', // Fallback, il server userà l'origin per identificare
            subscription: newSubscription.toJSON(),
          }),
        });
      })
      .catch((err) => {
        console.error('[Blasat SW] Errore rinnovo subscription:', err);
      })
  );
});
