/**
 * Blasat Analytics — POST /api/analytics
 * Riceve batch di eventi dal tracker client e li salva in SQLite.
 */
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'analytics.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    db.exec(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project TEXT NOT NULL,
        event TEXT NOT NULL,
        tab TEXT,
        label TEXT,
        value REAL,
        ip_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_analytics_project ON analytics_events(project);
      CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(project, event);
      CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(project, created_at);
    `);
  }
  return db;
}

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

interface AnalyticsEvent {
  project: string;
  event: string;
  tab?: string;
  label?: string;
  value?: number;
  timestamp: number;
}

const VALID_EVENTS = new Set(['pageview', 'click', 'scroll_depth']);

function validateEvent(e: unknown): e is AnalyticsEvent {
  if (!e || typeof e !== 'object') return false;
  const ev = e as Record<string, unknown>;
  return (
    typeof ev.project === 'string' &&
    ev.project.length > 0 &&
    ev.project.length <= 100 &&
    typeof ev.event === 'string' &&
    VALID_EVENTS.has(ev.event) &&
    (ev.tab === undefined || typeof ev.tab === 'string') &&
    (ev.label === undefined || typeof ev.label === 'string') &&
    (ev.value === undefined || typeof ev.value === 'number') &&
    typeof ev.timestamp === 'number'
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Il body deve essere un array di eventi' }, { status: 400 });
    }

    const validEvents = body.filter(validateEvent);
    if (validEvents.length === 0) {
      return NextResponse.json({ received: 0, message: 'Nessun evento valido' });
    }

    const ipHash = hashIp(getClientIp(request));
    const database = getDb();
    const insert = database.prepare(`
      INSERT INTO analytics_events (project, event, tab, label, value, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = database.transaction((events: AnalyticsEvent[]) => {
      for (const e of events) {
        insert.run(e.project, e.event, e.tab ?? null, e.label ?? null, e.value ?? null, ipHash);
      }
    });

    insertMany(validEvents);
    return NextResponse.json({ received: validEvents.length, status: 'ok' });
  } catch (err) {
    console.error('[Analytics POST] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
