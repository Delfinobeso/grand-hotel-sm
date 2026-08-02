const ENDPOINT = 'https://analytics.blasat.com/api/track';

// Chiavi di storage lato client (prefisso bl_ = Blasat, per non collidere con
// lo storage dell'app ospite).
const SRC_KEY = 'bl_src';           // sessionStorage: fonte della visita corrente
const PWA_SEEN_KEY = 'bl_pwa_seen'; // localStorage: "YYYY-MM" dell'ultimo mese
                                    // in cui questo dispositivo è stato visto in
                                    // modalità app (dedup della stima installati)

// Valori accettati dal parametro ?src= sui supporti fisici. 'direct' non è in
// whitelist perché non arriva mai dall'URL: è il fallback quando il parametro
// manca (bookmark, icona in home, link diretto).
const SRC_FROM_URL = ['qr', 'nfc'];

let _project = '';
let _tab = '';
let _batch: object[] = [];
let _timer: ReturnType<typeof setInterval> | null = null;
let _onAppInstalled: (() => void) | null = null;

function flush() {
  if (!_batch.length) return;
  const payload = JSON.stringify(_batch);
  _batch = [];
  navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }));
}

function push(event: object) {
  _batch.push(event);
  if (_batch.length >= 10) flush();
}

// Rimuove ?src dall'URL senza toccare gli altri parametri né la history entry.
// Serve a evitare che un ospite condivida un link col src di qualcun altro
// attaccato: l'attribuzione vale per chi ha inquadrato il QR / avvicinato il tag.
function stripSrcFromUrl() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('src')) return;
    url.searchParams.delete('src');
    const qs = url.searchParams.toString();
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${qs ? `?${qs}` : ''}${url.hash}`,
    );
  } catch {
    /* history bloccata (iframe sandbox, ecc.): l'URL resta sporco, il dato è comunque preso */
  }
}

// Fonte di acquisizione della visita. Catturata una sola volta e persistita in
// sessionStorage: un reload durante la stessa visita NON degrada l'attribuzione
// a 'direct'. Una nuova scansione (?src presente) sovrascrive il valore salvato.
function resolveSrc(): 'qr' | 'nfc' | 'direct' {
  if (typeof window === 'undefined') return 'direct';

  let fromUrl: string | null = null;
  try {
    fromUrl = new URLSearchParams(window.location.search).get('src');
  } catch {
    /* URL malformato: si prosegue col valore in sessione */
  }
  if (fromUrl !== null) stripSrcFromUrl();

  if (fromUrl && SRC_FROM_URL.includes(fromUrl)) {
    try {
      window.sessionStorage.setItem(SRC_KEY, fromUrl);
    } catch {
      /* Safari in navigazione privata / storage disabilitato */
    }
    return fromUrl as 'qr' | 'nfc';
  }

  try {
    const stored = window.sessionStorage.getItem(SRC_KEY);
    if (stored && SRC_FROM_URL.includes(stored)) return stored as 'qr' | 'nfc';
  } catch {
    /* storage non leggibile: fallback 'direct' */
  }

  return 'direct';
}

// Stesso rilevamento già usato da InstallOnboarding.tsx: matchMedia standard +
// navigator.standalone (Safari iOS). È l'unico segnale disponibile su iOS, dove
// l'evento 'appinstalled' non esiste proprio.
function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  try {
    return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
  } catch {
    return nav.standalone === true;
  }
}

// Marca il dispositivo come "già contato" per il mese corrente e dice se era la
// prima volta. Alimenta m:{mese}:pwa:dev lato server, cioè la STIMA di quanti
// dispositivi distinti usano l'app installata nel mese — non un conteggio di
// installazioni nuove. Mese in UTC per allinearsi al mese calcolato dal server.
function isFirstStandaloneOfMonth(): boolean {
  if (typeof window === 'undefined') return false;
  const month = new Date().toISOString().slice(0, 7);
  try {
    if (window.localStorage.getItem(PWA_SEEN_KEY) === month) return false;
    window.localStorage.setItem(PWA_SEEN_KEY, month);
    return true;
  } catch {
    // Senza localStorage non c'è dedup possibile: meglio non contare che gonfiare.
    return false;
  }
}

export function initTracker(project: string) {
  _project = project;

  const standalone = isStandaloneDisplay();
  // Un solo evento 'session' per apertura reale dell'app — separato dai cambi
  // di sezione (event: 'pageview'), altrimenti ogni tab visitata gonfia il
  // conteggio "aperture app". L'ora locale alimenta la fascia oraria d'uso.
  // src/standalone/pwaNew sono additivi: il backend li ignora se assenti.
  const session: Record<string, unknown> = {
    project,
    event: 'session',
    hour: new Date().getHours(),
    timestamp: Date.now(),
    src: resolveSrc(),
    standalone,
  };
  if (standalone && isFirstStandaloneOfMonth()) session.pwaNew = true;
  push(session);

  _timer = setInterval(flush, 15_000);
  window.addEventListener('pagehide', flush);

  // 'appinstalled' esiste solo su Android/Chrome. iOS Safari non emette alcun
  // evento quando l'utente fa "Aggiungi a Home": le installazioni iOS restano
  // non misurabili by design, per quelle vale solo la stima standalone/pwaNew.
  _onAppInstalled = () => {
    push({ project: _project, event: 'install', platform: 'android', timestamp: Date.now() });
    flush(); // evento raro e prezioso: non aspetta il batch
  };
  window.addEventListener('appinstalled', _onAppInstalled);
}

export function setTab(tab: string) {
  if (tab === _tab) return;
  _tab = tab;
  push({ project: _project, event: 'pageview', tab, timestamp: Date.now() });
}

export function trackClick(label: string) {
  push({ project: _project, event: 'click', label, timestamp: Date.now() });
}

export function destroyTracker() {
  if (_timer) clearInterval(_timer);
  _timer = null;
  window.removeEventListener('pagehide', flush);
  if (_onAppInstalled) {
    window.removeEventListener('appinstalled', _onAppInstalled);
    _onAppInstalled = null;
  }
  flush();
}
