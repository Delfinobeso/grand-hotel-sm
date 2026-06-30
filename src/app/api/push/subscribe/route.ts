/**
 * POST /api/push/subscribe — Registra una sottoscrizione push
 */
import { NextRequest, NextResponse } from 'next/server';

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: PushSubscriptionKeys;
}

// Storage in-memory per istanza Vercel
declare global {
  var __blasatPushSubs: Map<string, PushSubscriptionJSON[]> | undefined;
}

const subscriptionStore: Map<string, PushSubscriptionJSON[]> =
  globalThis.__blasatPushSubs || (globalThis.__blasatPushSubs = new Map());

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, subscription } = body;

    if (!project || !subscription?.endpoint) {
      return NextResponse.json({ error: 'Campi richiesti: project, subscription.endpoint' }, { status: 400 });
    }

    const subs = subscriptionStore.get(project) || [];
    const idx = subs.findIndex((s) => s.endpoint === subscription.endpoint);
    if (idx >= 0) {
      subs[idx] = subscription;
    } else {
      subs.push(subscription);
    }
    subscriptionStore.set(project, subs);

    console.log(`[Push] Nuova subscription per "${project}": ${subscription.endpoint.slice(0, 60)}... (tot: ${subs.length})`);
    return NextResponse.json({ success: true, subscriptionCount: subs.length });
  } catch (err) {
    console.error('[Push Subscribe] Error:', err);
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }
}
