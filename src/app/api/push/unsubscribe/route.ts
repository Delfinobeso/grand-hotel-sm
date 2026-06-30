/**
 * DELETE /api/push/unsubscribe — Rimuove una sottoscrizione push
 */
import { NextRequest, NextResponse } from 'next/server';

const subscriptionStore: Map<string, any[]> =
  globalThis.__blasatPushSubs || (globalThis.__blasatPushSubs = new Map());

export async function DELETE(request: NextRequest) {
  try {
    const { project, endpoint } = await request.json();
    if (!project || !endpoint) {
      return NextResponse.json({ error: 'Campi richiesti: project, endpoint' }, { status: 400 });
    }

    const subs = subscriptionStore.get(project) || [];
    const filtered = subs.filter((s) => s.endpoint !== endpoint);
    if (filtered.length === subs.length) {
      return NextResponse.json({ error: 'Subscription non trovata' }, { status: 404 });
    }

    subscriptionStore.set(project, filtered);
    return NextResponse.json({ success: true, subscriptionCount: filtered.length });
  } catch (err) {
    console.error('[Push Unsubscribe] Error:', err);
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }
}
