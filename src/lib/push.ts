/**
 * Client Push Notifications — Blasat PWA
 *
 * Da copiare in ciascuna PWA (es. src/lib/push.ts o src/hooks/usePush.ts).
 * Fornisce funzioni per sottoscrivere e annullare la sottoscrizione alle push notification.
 *
 * Utilizzo:
 *   import { subscribeToPush, unsubscribeFromPush, isSubscribed } from '@/lib/push';
 *
 *   // In un componente React:
 *   useEffect(() => {
 *     subscribeToPush('evento-rossi');
 *   }, []);
 */

const STORAGE_KEY_PREFIX = 'blasat_push_subscribed_';

// La public VAPID key (applicationServerKey) viene esposta dal server
// Deve essere la stessa usata dal backend FastAPI (chiave pubblica)
let cachedVapidPublicKey: string | null = null;

/**
 * Recupera la chiave pubblica VAPID dal backend o dall'env.
 * In produzione, impostare NEXT_PUBLIC_VAPID_PUBLIC_KEY nelle env vars di Vercel.
 */
async function getVapidPublicKey(): Promise<string> {
  if (cachedVapidPublicKey) return cachedVapidPublicKey;

  // Prima prova dall'env (variabile pubblica Next.js)
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    cachedVapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    return cachedVapidPublicKey;
  }

  // Fallback: richiedi al backend
  try {
    const res = await fetch('/api/push/vapid-public-key');
    if (res.ok) {
      const { publicKey } = await res.json();
      cachedVapidPublicKey = publicKey;
      return publicKey;
    }
  } catch (err) {
    console.warn('[Blasat Push] Impossibile recuperare VAPID public key dal backend', err);
  }

  throw new Error('VAPID public key non disponibile');
}

/**
 * Converte una stringa base64 URL-safe in Uint8Array (necessario per pushManager.subscribe).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

/**
 * Verifica se l'utente è già sottoscritto alle push per questo progetto.
 */
export function isSubscribed(projectName: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectName}`) === 'true';
}

/**
 * Sottoscrive il dispositivo alle push notification per un progetto Blasat.
 *
 * @param projectName - Nome del progetto (es. 'evento-rossi')
 * @returns La subscription object, o null se fallita
 */
export async function subscribeToPush(projectName: string): Promise<PushSubscriptionJSON | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[Blasat Push] Service Worker non supportato');
    return null;
  }

  // Evita doppia sottoscrizione
  if (isSubscribed(projectName)) {
    console.log(`[Blasat Push] Già sottoscritto a "${projectName}"`);
    // Verifica comunque che la subscription sia ancora valida
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) return existingSub.toJSON();
    }
    // Subscription non più valida, rimuovi flag
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${projectName}`);
  }

  // 1. Richiedi permesso notifiche (se non già concesso)
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn(`[Blasat Push] Permesso notifiche non concesso: ${permission}`);
    return null;
  }

  try {
    // 2. Registra il Service Worker (se non già registrato)
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('[Blasat Push] Service Worker registrato:', registration.scope);

    // Attendi che il SW sia attivo
    if (registration.installing || registration.waiting) {
      await new Promise<void>((resolve) => {
        const sw = registration.installing || registration.waiting;
        if (!sw) return resolve();
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') resolve();
        });
        // Timeout di sicurezza: 10 secondi
        setTimeout(resolve, 10000);
      });
    }

    // 3. Recupera la chiave pubblica VAPID
    const vapidPublicKey = await getVapidPublicKey();

    // 4. Sottoscrivi alle push notification
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('[Blasat Push] Sottoscrizione creata:', subscription.endpoint);

    // 5. Invia la subscription al backend
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: projectName,
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Backend ha rifiutato la subscription: ${response.status} ${errorBody}`);
    }

    // 6. Salva in localStorage che siamo sottoscritti
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${projectName}`, 'true');
    console.log(`[Blasat Push] Sottoscritto con successo a "${projectName}"`);

    return subscription.toJSON();
  } catch (err) {
    console.error(`[Blasat Push] Errore sottoscrizione a "${projectName}":`, err);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${projectName}`);
    return null;
  }
}

/**
 * Annulla la sottoscrizione alle push notification per un progetto.
 *
 * @param projectName - Nome del progetto
 */
export async function unsubscribeFromPush(projectName: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.warn('[Blasat Push] Nessun Service Worker registrato');
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      console.log('[Blasat Push] Nessuna subscription attiva');
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${projectName}`);
      return true;
    }

    // Annulla sul dispositivo
    const unsubscribed = await subscription.unsubscribe();
    if (!unsubscribed) {
      console.warn('[Blasat Push] unsubscribe() ha restituito false');
    }

    // Notifica il backend
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: projectName,
          endpoint: subscription.endpoint,
        }),
      });
    } catch (err) {
      console.warn('[Blasat Push] Errore notifica unsubscribe al backend:', err);
      // Non bloccare: l'unsubscribe locale ha già funzionato
    }

    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${projectName}`);
    console.log(`[Blasat Push] Sottoscrizione rimossa per "${projectName}"`);
    return true;
  } catch (err) {
    console.error(`[Blasat Push] Errore unsubscribe da "${projectName}":`, err);
    return false;
  }
}
