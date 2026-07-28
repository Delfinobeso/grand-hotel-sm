/**
 * POST /api/push/send — Invia notifiche push ai subscriber
 *
 * Endpoint amministrativo: richiede l'header `x-push-secret` uguale a
 * process.env.PUSH_ADMIN_SECRET. Senza (o con secret errato) → 401.
 * Confronto timing-safe. Fail-closed: se PUSH_ADMIN_SECRET non è configurato
 * l'invio è disabilitato per tutti (nessuno può spammare notifiche col brand
 * dell'hotel finché non viene impostato il secret sul deploy).
 */
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import webpush from 'web-push';

/** Confronto stringhe a tempo costante (evita timing attack sul secret). */
function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** true solo se l'header x-push-secret combacia con PUSH_ADMIN_SECRET. */
function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.PUSH_ADMIN_SECRET;
  if (!expected) return false; // fail-closed: nessun secret configurato ⇒ nessun invio
  const provided = request.headers.get('x-push-secret') || '';
  return secretsMatch(provided, expected);
}

function getVapidKeys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:push@blasat.com';
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys non configurate');
  }
  return { publicKey, privateKey, subject };
}

let initialized = false;
function ensureVapid() {
  if (initialized) return;
  const keys = getVapidKeys();
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  initialized = true;
}

const subscriptionStore: Map<string, any[]> =
  globalThis.__blasatPushSubs || (globalThis.__blasatPushSubs = new Map());

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    ensureVapid();
    const body = await request.json();
    const { project, title, body: msgBody, url, icon } = body;

    if (!project || !title || !msgBody) {
      return NextResponse.json({ error: 'Campi richiesti: project, title, body' }, { status: 400 });
    }

    const subs = subscriptionStore.get(project) || [];
    if (subs.length === 0) {
      return NextResponse.json({ error: `Nessuna subscription per "${project}"` }, { status: 404 });
    }

    const payload = JSON.stringify({
      title,
      body: msgBody,
      icon: icon || '/icon-192x192.png',
      badge: '/icon-72x72.png',
      url: url || '/',
      project,
      tag: `blasat-${project}-${Date.now()}`,
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
          payload
        ).catch(async (err: any) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            const arr = subscriptionStore.get(project) || [];
            subscriptionStore.set(project, arr.filter((s) => s.endpoint !== sub.endpoint));
          }
          throw err;
        })
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ success: true, total: subs.length, succeeded, failed });
  } catch (err: any) {
    console.error('[Push Send] Error:', err);
    return NextResponse.json({ error: err.message || 'Errore invio' }, { status: 500 });
  }
}
