/**
 * Blasat Analytics — GET /api/analytics/[project]
 * Proxy to central backend via Cloudflare Tunnel.
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BLASAT_ANALYTICS_URL || 'https://brand-mile-ver-pearl.trycloudflare.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { project } = await params;
    const res = await fetch(`${BACKEND_URL}/analytics/${project}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }
}
