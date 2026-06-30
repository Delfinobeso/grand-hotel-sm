/**
 * GET /api/push/vapid-public-key — Restituisce la chiave pubblica VAPID
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: 'VAPID non configurato' }, { status: 500 });
  }
  return NextResponse.json({ publicKey });
}
