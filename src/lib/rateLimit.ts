/**
 * Rate limiting in-memory, best-effort per istanza serverless.
 *
 * Finestra scorrevole di 10 minuti, massimo 20 richieste per IP. Non persiste
 * tra istanze/deploy diversi (ogni istanza serverless ha la propria Map): è
 * una protezione contro abusi banali, non una garanzia hard.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minuti
const MAX_REQUESTS = 20;
const MAX_MAP_SIZE = 500;

const requestLog = new Map<string, number[]>();

/** Ritorna true se la richiesta è consentita, false se l'IP ha superato il limite. */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Pruning dell'intera Map se cresce troppo, per limitare la memoria dell'istanza.
  if (requestLog.size > MAX_MAP_SIZE) {
    for (const [key, timestamps] of requestLog) {
      const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
      if (fresh.length === 0) {
        requestLog.delete(key);
      } else {
        requestLog.set(key, fresh);
      }
    }
  }

  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    requestLog.set(ip, timestamps);
    return false;
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return true;
}
