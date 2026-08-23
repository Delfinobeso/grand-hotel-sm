const ENDPOINT = 'https://analytics.blasat.com/api/track';

// Chiavi di storage lato client (prefisso bl_ = Blasat, per non collidere con
// lo storage dell'app ospite).
const SRC_KEY = 'bl_src';           // sessionStorage: fonte della visita corrente
const PWA_SEEN_KEY = 'bl_pwa_seen'; // localStorage: "YYYY-MM" dell'ultimo mese
                                    // in cui questo dispositivo è stato visto in
                                    // modalità app (dedup della stima installati)
const OPT_OUT_KEY = 'bl_notrack';   // localStorage: '1' = dispositivo escluso per
                                    // sempre dalle statistiche (vedi escluso())

// Valori accettati dal parametro ?src= sui supporti fisici. 'direct' non è in
// whitelist perché non arriva mai dall'URL: è il fallback quando il parametro
// manca (bookmark, icona in home, link diretto).
const SRC_FROM_URL = ['qr', 'nfc'];

// --- Chi NON deve finire nelle statistiche del cliente -----------------------
// ENDPOINT è assoluto: senza questo filtro anche una pagina aperta su un dev
// server locale scrive nei dati veri che vede l'albergatore. È già successo il
// 2026-08-22, quando circa 90 run Playwright hanno portato il Grand Hotel da
// ~13 a 98 "aperture app" in giornata, sporcando anche i contatori cumulativi
// (che non essendo datati non si possono più separare: si stimano soltanto).
//
// Il risultato è calcolato una volta sola e messo in cache: la decisione non può
// cambiare a metà visita, e push() la interroga a ogni evento.
let _escluso: boolean | null = null;

// Ambienti che non sono l'app pubblicata: dev server, rete locale, preview.
function ambienteDiLavoro(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
    || host.endsWith('.local')
    || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)  // IP di LAN: telefono sul dev server
    || host.endsWith('.vercel.app');           // deploy di preview
}

// Browser pilotato da un'automazione. navigator.webdriver è imposto dallo
// standard e Playwright NON lo maschera: resta true anche quando lo user agent
// è quello di un iPhone vero, che è esattamente come giravano i nostri test.
// Lo user agent da solo non basterebbe proprio per quel motivo.
function automazione(nav: Navigator & { webdriver?: boolean }): boolean {
  if (nav.webdriver === true) return true;
  return /headless|electron|phantom|puppeteer|playwright|selenium|lighthouse|bot|crawler|spider/i
    .test(nav.userAgent);
}

// Opt-out permanente del dispositivo, per chi lavora sull'app: una visita con
// ?bl_track=off e quel browser non conta più; ?bl_track=on lo riattiva.
// Il parametro viene tolto dall'URL subito dopo, come si fa con ?src: un link
// copiato e girato a un ospite non deve zittire anche le sue visite.
// Va fatto una volta per browser: su iOS l'app aggiunta alla Home ha uno
// storage separato da Safari, quindi lì l'opt-out va ripetuto dentro l'app.
function dispositivoEscluso(): boolean {
  try {
    const scelta = new URLSearchParams(window.location.search).get('bl_track');
    if (scelta === 'off') window.localStorage.setItem(OPT_OUT_KEY, '1');
    else if (scelta === 'on') window.localStorage.removeItem(OPT_OUT_KEY);
    if (scelta !== null) stripParamFromUrl('bl_track');
    return window.localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    // Storage bloccato (navigazione privata): non è un motivo per escludere,
    // è un ospite qualunque con Safari in incognito.
    return false;
  }
}

function escluso(): boolean {
  if (_escluso !== null) return _escluso;
  if (typeof window === 'undefined') return true; // SSR: nessun evento
  const nav = window.navigator as Navigator & { webdriver?: boolean };
  _escluso = ambienteDiLavoro(window.location.hostname)
    || automazione(nav)
    || dispositivoEscluso();
  if (_escluso) {
    // Unico modo per verificare dal telefono che l'opt-out ha preso, senza
    // aggiungere interfaccia visibile agli ospiti.
    console.info('[blasat] visita esclusa dalle statistiche');
  }
  return _escluso;
}

let _project = '';
let _tab = '';
let _batch: object[] = [];
let _timer: ReturnType<typeof setInterval> | null = null;
let _onAppInstalled: (() => void) | null = null;

function flush() {
  if (escluso() || !_batch.length) return;
  const payload = JSON.stringify(_batch);
  _batch = [];
  navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }));
}

// Unico punto di scrittura: il filtro sta qui e non solo in initTracker perché
// setTab() e trackClick() sono importati dinamicamente dai componenti e possono
// partire per conto loro, senza passare da initTracker().
function push(event: object) {
  if (escluso()) return;
  _batch.push(event);
  if (_batch.length >= 10) flush();
}

// Rimuove un parametro dall'URL senza toccare gli altri né la history entry.
// Serve a evitare che un ospite condivida un link con addosso il parametro di
// qualcun altro: per ?src l'attribuzione vale per chi ha inquadrato il QR /
// avvicinato il tag, per ?bl_track l'esclusione vale per chi l'ha chiesta.
function stripParamFromUrl(nome: string) {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(nome)) return;
    url.searchParams.delete(nome);
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
  if (fromUrl !== null) stripParamFromUrl('src');

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
  // Escluso: non si registra nulla, nemmeno il timer o i listener. Va valutato
  // qui e non solo in push() per non lasciare in giro un intervallo inutile.
  if (escluso()) return;

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
