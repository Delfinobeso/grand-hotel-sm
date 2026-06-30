/**
 * Service Worker per Push Notifications — Blasat
 *
 * Da copiare nella root public/ della PWA Next.js.
 * Gestisce eventi push in arrivo e click sulle notifiche.
 *
 * Nota: Next.js 16 con App Router — questo file va in public/sw.js
 * e viene registrato dal client con navigator.serviceWorker.register('/sw.js')
 */

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
