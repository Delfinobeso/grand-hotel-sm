/**
 * Blasat Analytics — GET /api/analytics/[project]
 * Restituisce metriche aggregate per un progetto.
 */
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { project } = await params;
    const database = getDb();

    const pageviewsByTab = database
      .prepare(`SELECT tab, COUNT(*) as count FROM analytics_events WHERE project = ? AND event = 'pageview' GROUP BY tab ORDER BY count DESC LIMIT 20`)
      .all(project) as { tab: string | null; count: number }[];

    const clickTotal = database
      .prepare(`SELECT COUNT(*) as total FROM analytics_events WHERE project = ? AND event = 'click'`)
      .get(project) as { total: number };

    const topLabels = database
      .prepare(`SELECT label, COUNT(*) as count FROM analytics_events WHERE project = ? AND event = 'click' AND label IS NOT NULL GROUP BY label ORDER BY count DESC LIMIT 10`)
      .all(project) as { label: string; count: number }[];

    const uniqueUsers = database
      .prepare(`SELECT COUNT(DISTINCT ip_hash) as total FROM analytics_events WHERE project = ?`)
      .get(project) as { total: number };

    const scrollDepth = database
      .prepare(`SELECT AVG(value) as avg_depth, MAX(value) as max_depth FROM analytics_events WHERE project = ? AND event = 'scroll_depth'`)
      .get(project) as { avg_depth: number | null; max_depth: number | null };

    const timeline = database
      .prepare(`SELECT DATE(created_at) as day, event, COUNT(*) as count FROM analytics_events WHERE project = ? AND created_at >= datetime('now', '-30 days') GROUP BY DATE(created_at), event ORDER BY day ASC`)
      .all(project) as { day: string; event: string; count: number }[];

    const totalEvents = database
      .prepare(`SELECT COUNT(*) as total FROM analytics_events WHERE project = ?`)
      .get(project) as { total: number };

    return NextResponse.json({
      project,
      total_events: totalEvents.total,
      pageviews_by_tab: pageviewsByTab.map((r) => ({ tab: r.tab ?? 'unknown', count: r.count })),
      clicks: { total: clickTotal.total, top_labels: topLabels.map((r) => ({ label: r.label, count: r.count })) },
      unique_users_estimate: uniqueUsers.total,
      scroll_depth: { average: scrollDepth.avg_depth ?? 0, max: scrollDepth.max_depth ?? 0 },
      timeline,
    });
  } catch (err) {
    console.error('[Analytics GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
