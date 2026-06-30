/**
 * POST /api/push/send — Invia notifiche push ai subscriber
 */
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

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
