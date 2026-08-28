/**
 * Rate limiting in-memory, best-effort per istanza serverless.
 *
 * Finestra scorrevole di 10 minuti, massimo 20 richieste per IP. Non persiste
 * tra istanze/deploy diversi (ogni istanza serverless ha la propria Map): è
 * una protezione contro abusi banali, non una garanzia hard.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minuti
// Override via env per il banco di prova concierge-v2 in preview (env preview
// a 200, per non farsi bloccare durante i test): la produzione, senza la env,
// resta al default di 20.
const MAX_REQUESTS = Number(process.env.CHAT_RATE_LIMIT_MAX) || 20;
const MAX_MAP_SIZE = 500;

const requestLog = new Map<string, number[]>();

/**
 * Estrae un identificativo IP il più possibile affidabile dalla richiesta.
 *
 * `x-forwarded-for` è impostato dal client e quindi FALSIFICABILE (basta
 * cambiare header per ottenere una nuova "quota" di rate-limit). Su Vercel gli
 * header `x-vercel-forwarded-for` / `x-real-ip` sono scritti dall'edge della
 * piattaforma DOPO aver scartato quanto inviato dal client, quindi non sono
 * spoofabili: li preferiamo. Si ricade su `x-forwarded-for` (primo hop) solo
 * come ultima risorsa per ambienti non-Vercel.
 */
export function getClientIp(req: {
  headers: { get(name: string): string | null };
}): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return "unknown";
}

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
