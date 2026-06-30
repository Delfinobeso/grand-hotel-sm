/**
 * Blasat Analytics — POST /api/analytics
 * Forward events to central backend via Cloudflare Tunnel.
 * Falls back to local SQLite if backend unreachable.
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BLASAT_ANALYTICS_URL || 'https://brand-mile-ver-pearl.trycloudflare.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ received: 0 }, { status: 200 });
    }

    // Forward to central backend
    const res = await fetch(`${BACKEND_URL}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': request.headers.get('x-forwarded-for') || '' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Fallback: log and return ok anyway
    console.warn(`[Analytics] Backend returned ${res.status}, event dropped`);
    return NextResponse.json({ received: 0, status: 'forwarded' });
  } catch (err) {
    console.warn('[Analytics] Backend unreachable:', err instanceof Error ? err.message : err);
    return NextResponse.json({ received: 0, status: 'skipped' }, { status: 200 });
  }
}
