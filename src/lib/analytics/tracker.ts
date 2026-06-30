/**
 * Blasat Analytics Tracker — Client Script
 * =========================================
 * Copia questo file nella tua PWA (es. /lib/analytics/tracker.ts)
 * e importalo nel layout principale (_app.tsx o layout.tsx).
 *
 * Caratteristiche:
 *  - Eventi: pageview (con tab), click (elemento + label), scroll_depth (25/50/75/100%)
 *  - Invio asincrono via navigator.sendBeacon (non blocca il rendering)
 *  - Batch: accumula eventi e li invia ogni 30s o al raggiungimento di 20 eventi
 *  - Anonimizzato: solo project_name + event_type + metadata (NO dati personali)
 *  - Formato evento: { project, event, tab?, label?, value?, timestamp }
 *
 * Per attivarlo, chiama initBlasatTracker({ project: 'nome-progetto' })
 * nel useEffect / onMount del layout principale.
 */

/** Singolo evento analytics */
interface AnalyticsEvent {
  project: string;
  event: 'pageview' | 'click' | 'scroll_depth';
  tab?: string;
  label?: string;
  value?: number;
  timestamp: number;
}

/** Configurazione del tracker */
interface TrackerConfig {
  /** Nome del progetto (obbligatorio) */
  project: string;
  /** URL dell'endpoint di raccolta (default: /api/analytics) */
  endpoint?: string;
  /** Intervallo di flush in ms (default: 30_000) */
  flushInterval?: number;
  /** Dimensione massima del batch prima del flush (default: 20) */
  maxBatchSize?: number;
  /** Callback chiamata a ogni errore di invio */
  onError?: (err: Error) => void;
}

// ── Stato interno ──────────────────────────────────────────────
let config: Required<TrackerConfig> = {
  project: '',
  endpoint: '/api/analytics',
  flushInterval: 30_000,
  maxBatchSize: 20,
  onError: () => {},
};

let batch: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let currentTab: string | null = null;
let scrollMilestones = new Set<number>();

// ── Helpers ────────────────────────────────────────────────────

/** Crea un evento base */
function createEvent(
  event: AnalyticsEvent['event'],
  extras?: Partial<Pick<AnalyticsEvent, 'tab' | 'label' | 'value'>>
): AnalyticsEvent {
  return {
    project: config.project,
    event,
    tab: extras?.tab ?? currentTab ?? undefined,
    label: extras?.label,
    value: extras?.value,
    timestamp: Date.now(),
  };
}

/** Aggiunge un evento al batch; forza il flush se si supera maxBatchSize */
function track(event: AnalyticsEvent): void {
  batch.push(event);
  if (batch.length >= config.maxBatchSize) {
    flush();
  }
}

/** Invia il batch corrente e lo svuota */
function flush(): void {
  if (batch.length === 0) return;

  const payload = [...batch];
  batch = [];

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const sent = navigator.sendBeacon(config.endpoint, blob);
    if (!sent) {
      config.onError(new Error('sendBeacon returned false — buffer full?'));
    }
  } catch (err) {
    config.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

// ── Tracciamento automatico ────────────────────────────────────

/** Traccia pageview ogni volta che cambia la tab visibile */
function setupPageviewTracking(): void {
  // Rileva la tab corrente dall'attributo data-tab o da document.title
  const detectTab = (): string => {
    // Cerca un elemento attivo con data-tab (pattern PWA tipico)
    const activeEl = document.querySelector('[data-tab].active, [data-tab][aria-current="page"]');
    if (activeEl) return activeEl.getAttribute('data-tab')!;

    // Fallback: titolo della pagina
    return document.title || 'unknown';
  };

  // MutationObserver per rilevare cambi di tab
  const observer = new MutationObserver(() => {
    const newTab = detectTab();
    if (newTab !== currentTab) {
      currentTab = newTab;
      track(createEvent('pageview', { tab: currentTab }));
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'aria-current', 'data-active'],
  });

  // Pageview iniziale
  currentTab = detectTab();
  track(createEvent('pageview', { tab: currentTab }));

  // Anche su visibilitychange (rientro da background)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      currentTab = detectTab();
      track(createEvent('pageview', { tab: currentTab }));
    }
  });
}

/** Traccia click su elementi con data-blasat-track */
function setupClickTracking(): void {
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement;
      // Cerca l'elemento cliccabile più vicino con data-blasat-track
      const tracked = target.closest<HTMLElement>('[data-blasat-track]');
      if (!tracked) return;

      const element = tracked.tagName.toLowerCase();
      const label =
        tracked.getAttribute('data-blasat-label') ??
        tracked.textContent?.trim().slice(0, 80) ??
        element;

      track(createEvent('click', { label, tab: currentTab ?? undefined }));
    },
    { passive: true }
  );
}

/** Traccia la profondità di scroll (25/50/75/100%) */
function setupScrollTracking(): void {
  const milestones = [25, 50, 75, 100];

  const handler = (): void => {
    const scrollTop = window.scrollY + window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    if (docHeight === 0) return;

    const pct = Math.round((scrollTop / docHeight) * 100);
    for (const m of milestones) {
      if (pct >= m && !scrollMilestones.has(m)) {
        scrollMilestones.add(m);
        track(createEvent('scroll_depth', { value: m, tab: currentTab ?? undefined }));
      }
    }
  };

  window.addEventListener('scroll', handler, { passive: true });

  // Verifica iniziale (pagina già scrollata)
  handler();
}

/** Pulisce le risorse del tracker (da chiamare in cleanup) */
function destroy(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  flush(); // invia ciò che resta
}

// ── API pubblica ───────────────────────────────────────────────

/**
 * Inizializza il tracker Blasat Analytics.
 * Chiama questa funzione nel layout principale della PWA.
 *
 * @example
 *   useEffect(() => {
 *     initBlasatTracker({ project: 'hotel-roma' });
 *     return () => destroyBlasatTracker();
 *   }, []);
 */
export function initBlasatTracker(cfg: TrackerConfig): void {
  config = { ...config, ...cfg };

  // Registra pageview iniziale immediatamente
  currentTab = document.title || 'unknown';
  track(createEvent('pageview', { tab: currentTab }));

  // Setup tracking automatico
  setupPageviewTracking();
  setupClickTracking();
  setupScrollTracking();

  // Flush periodico
  flushTimer = setInterval(flush, config.flushInterval);

  // Flush prima di uscire dalla pagina
  window.addEventListener('beforeunload', flush);
  // Anche su pagehide per mobile Safari
  window.addEventListener('pagehide', flush);

  console.log(
    `[Blasat Analytics] Tracker attivo per il progetto "${config.project}"`
  );
}

/**
 * Distrugge il tracker e invia gli eventi residui.
 * Chiama questa funzione nella cleanup di useEffect.
 */
export function destroyBlasatTracker(): void {
  destroy();
  console.log('[Blasat Analytics] Tracker spento');
}

/**
 * Tracciamento manuale di un evento personalizzato.
 * Utile per eventi specifici dell'app (es. form submit, video play).
 *
 * @example
 *   trackBlasatEvent('conversion', { label: 'prenotazione', value: 150 });
 */
export function trackBlasatEvent(
  event: string,
  extras?: { label?: string; value?: number; tab?: string }
): void {
  track({
    project: config.project,
    event: event as AnalyticsEvent['event'],
    tab: extras?.tab ?? currentTab ?? undefined,
    label: extras?.label,
    value: extras?.value,
    timestamp: Date.now(),
  });
}

/**
 * Forza l'invio immediato di tutti gli eventi in coda.
 */
export function flushBlasatTracker(): void {
  flush();
}
