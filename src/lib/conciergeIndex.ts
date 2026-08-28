/**
 * Frammentazione + recupero (RAG leggero) per il concierge v2.
 *
 * Perché esiste: il vecchio system prompt monolitico (~35KB, di cui ~18KB di
 * soli menu) annegava le regole di comportamento nella massa di fatti — il
 * modello riempiva i buchi inventando (prezzi, tasse) o promettendo azioni
 * che non può fare. La cura: un prompt di comportamento CORTO (vedi
 * conciergeBehavior.ts) + SOLO i frammenti di conoscenza pertinenti alla
 * domanda, scelti con embeddings. Il modello vede ~8KB invece di 35.
 *
 * Codice DIFENSIVO per costruzione: qualunque errore nel recupero (rete,
 * chiave assente, formato di risposta inatteso) deve degradare a "tutti i
 * frammenti", mai propagare un throw verso la route — altrimenti il
 * fallback su DeepSeek (che non ha embeddings Mistral, vedi route.ts) si
 * romperebbe insieme al percorso normale.
 */

import type { KbItem } from "./conciergeKb";

export interface Frammento {
  id: string;
  sezione: string;
  testo: string;
  fonte: "scheda" | "menu" | "link";
}

export interface Indice {
  core: string;
  frammenti: Frammento[];
  /** Hash del contenuto sorgente (base+menus+trailing): chiave delle cache
   *  module-scope qui sotto. Cambia da solo quando il cron riscrive menus.ts
   *  e si ridispiega — non serve invalidazione manuale. */
  hash: string;
}

// Sopra questa soglia una sezione/locale viene spezzato in più frammenti.
// Scelta empirica: abbastanza piccola da tenere ogni frammento leggibile in
// un colpo solo dal modello, abbastanza grande da non spezzare frasi corte.
const SOGLIA_FRAMMENTO = 1500;

/* ------------------------------------------------------------------------
 * 1. Parsing di SYSTEM_PROMPT_BASE / MENUS / TRAILING in sezioni "grezze"
 * ---------------------------------------------------------------------- */

interface SezioneGrezza {
  titolo: string;
  /** Corpo della sezione, senza la riga di titolo. */
  corpo: string;
  /** Titolo + corpo, slice il più possibile verbatim del testo originale
   *  (usato per il core, dove niente va riformattato). */
  testoCompleto: string;
}

/** Spezza SYSTEM_PROMPT_BASE sulle intestazioni `## `. Tutto quello che sta
 *  PRIMA della prima intestazione (identità + regole generiche) viene
 *  scartato qui: lo copre il prompt di comportamento. Verificato a mano nei
 *  3 hotel che quel preambolo non contiene fatti (prezzi, orari, numeri) —
 *  solo tono, lingue supportate e "non inventare", tutte cose già presenti
 *  in conciergeBehavior.ts. */
function estraiSezioniBase(base: string): SezioneGrezza[] {
  const righe = base.split("\n");
  const sezioni: SezioneGrezza[] = [];
  let titolo: string | null = null;
  let titoloRiga = "";
  let corpoRighe: string[] = [];

  const chiudi = () => {
    if (titolo === null) return;
    const corpo = corpoRighe.join("\n").trim();
    const testoCompleto = `${titoloRiga}\n${corpoRighe.join("\n")}`.trim();
    sezioni.push({ titolo, corpo, testoCompleto });
  };

  for (const riga of righe) {
    const m = /^## (.+)$/.exec(riga);
    if (m) {
      chiudi();
      titolo = m[1].trim();
      titoloRiga = riga;
      corpoRighe = [];
    } else if (titolo !== null) {
      corpoRighe.push(riga);
    }
  }
  chiudi();
  return sezioni;
}

/** Spezza MENUS sulle intestazioni `### ` (un locale per intestazione). La
 *  riga `## MENÙ RISTORANTI E BAR` e l'eventuale testo prima del primo `###`
 *  sono meta-informazione (fonte, data aggiornamento): non generano un
 *  frammento interrogabile a sé. */
function estraiLocaliMenu(menus: string): SezioneGrezza[] {
  const righe = menus.split("\n");
  const locali: SezioneGrezza[] = [];
  let titolo: string | null = null;
  let corpoRighe: string[] = [];

  const chiudi = () => {
    if (titolo === null) return;
    const corpo = corpoRighe.join("\n").trim();
    locali.push({ titolo, corpo, testoCompleto: corpo });
  };

  for (const riga of righe) {
    const m = /^### (.+)$/.exec(riga);
    if (m) {
      chiudi();
      titolo = m[1].trim();
      corpoRighe = [];
    } else if (titolo !== null) {
      corpoRighe.push(riga);
    }
  }
  chiudi();
  return locali;
}

/** TRAILING = "\n## LINK E AZIONI...\n<corpo>\n---\n\nREGOLE FONDAMENTALI:\n...".
 *  Tutto ciò che precede la riga "---" è il blocco link, e va nel core
 *  VERBATIM: gli URL sono reali, non si riformattano né si toccano. Le
 *  REGOLE FONDAMENTALI dopo "---" si scartano: le sostituisce il prompt di
 *  comportamento (conciergeBehavior.ts). */
function estraiBloccoLinkEAzioni(trailing: string): string {
  const idx = trailing.search(/\n-{3,}\s*\n/);
  const blocco = idx === -1 ? trailing : trailing.slice(0, idx);
  return blocco.trim();
}

/* ------------------------------------------------------------------------
 * 2. Suddivisione di una sezione troppo lunga in più frammenti
 * ---------------------------------------------------------------------- */

function dividiPerSottotitoli(testo: string): string[] {
  if (!/^### /m.test(testo)) return [testo];
  return testo
    .split(/(?=^### )/m)
    .map((p) => p.trim())
    .filter(Boolean);
}

function dividiPerRigheVuote(testo: string): string[] {
  return testo
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Accumula paragrafi consecutivi in blocchi <= soglia, senza mai spezzare
 *  un paragrafo a metà. Se un paragrafo da solo supera già la soglia (tipico
 *  del testo di menu estratto da PDF, quasi senza righe vuote), resta un
 *  blocco unico: lo spezza dopo dividiDuro(), come ultima risorsa. */
function accumulaParagrafi(paragrafi: string[], soglia: number): string[] {
  const risultato: string[] = [];
  let corrente = "";
  for (const p of paragrafi) {
    const candidato = corrente ? `${corrente}\n\n${p}` : p;
    if (candidato.length <= soglia || !corrente) {
      corrente = candidato;
    } else {
      risultato.push(corrente);
      corrente = p;
    }
  }
  if (corrente) risultato.push(corrente);
  return risultato;
}

/** Ultima risorsa quando un blocco non ha righe vuote utili al suo interno
 *  (es. testo di menu incollato da un PDF): spezza per righe, mai a metà
 *  riga, tenendo ogni pezzo <= soglia. */
function dividiDuro(testo: string, soglia: number): string[] {
  const righe = testo.split("\n");
  const risultato: string[] = [];
  let corrente = "";
  for (const r of righe) {
    const candidato = corrente ? `${corrente}\n${r}` : r;
    if (candidato.length <= soglia || !corrente) {
      corrente = candidato;
    } else {
      risultato.push(corrente);
      corrente = r;
    }
  }
  if (corrente) risultato.push(corrente);
  return risultato;
}

/** Spezza un corpo di sezione in chunk <= ~1500 caratteri, provando prima i
 *  sotto-titoli `### `, poi le righe vuote, poi (fallback duro) le righe. */
function spezzaSeServe(corpo: string, soglia: number = SOGLIA_FRAMMENTO): string[] {
  if (corpo.length <= soglia) return [corpo];

  const blocchiPerSottotitolo = dividiPerSottotitoli(corpo);
  const blocchiIniziali = blocchiPerSottotitolo.length > 1 ? blocchiPerSottotitolo : dividiPerRigheVuote(corpo);

  const chunkPerBlocco = blocchiIniziali.flatMap((blocco) =>
    blocco.length <= soglia ? [blocco] : accumulaParagrafi(dividiPerRigheVuote(blocco), soglia),
  );

  return chunkPerBlocco.flatMap((c) => (c.length > soglia ? dividiDuro(c, soglia) : [c]));
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

/* ------------------------------------------------------------------------
 * 3. API pubblica: costruzione core+frammenti, hash, cache indice
 * ---------------------------------------------------------------------- */

/** Costruisce il core (sempre allegato) e i frammenti (recuperati per
 *  pertinenza) a partire dalle 3 stringhe per-hotel. Pura: nessuna rete,
 *  nessuna cache — la cache la fa getIndice() qui sotto. */
export function costruisciFrammenti(
  base: string,
  menus: string,
  trailing: string,
): { core: string; frammenti: Frammento[] } {
  const sezioniBase = estraiSezioniBase(base);
  const sezioneHotel = sezioniBase.find((s) => s.titolo === "HOTEL");
  const sezioneContatti = sezioniBase.find((s) => s.titolo === "CONTATTI");
  const linkEAzioni = estraiBloccoLinkEAzioni(trailing);

  const core = [sezioneHotel?.testoCompleto, sezioneContatti?.testoCompleto, linkEAzioni]
    .filter((s): s is string => !!s && s.trim().length > 0)
    .join("\n\n");

  const frammenti: Frammento[] = [];

  for (const sez of sezioniBase) {
    if (sez.titolo === "HOTEL" || sez.titolo === "CONTATTI") continue; // già nel core
    const chunk = spezzaSeServe(sez.corpo);
    chunk.forEach((testo, i) => {
      frammenti.push({
        id: `scheda-${slug(sez.titolo)}${chunk.length > 1 ? `-${i + 1}` : ""}`,
        sezione: sez.titolo,
        testo: `[${sez.titolo}]\n${testo}`,
        fonte: "scheda",
      });
    });
  }

  for (const loc of estraiLocaliMenu(menus)) {
    const chunk = spezzaSeServe(loc.corpo);
    chunk.forEach((testo, i) => {
      const suffisso = chunk.length > 1 ? ` (parte ${i + 1}/${chunk.length})` : "";
      frammenti.push({
        id: `menu-${slug(loc.titolo)}${chunk.length > 1 ? `-${i + 1}` : ""}`,
        sezione: loc.titolo,
        testo: `[MENU – ${loc.titolo}${suffisso}]\n${testo}`,
        fonte: "menu",
      });
    });
  }

  return { core, frammenti };
}

/** Hash non crittografico (FNV-1a a 32 bit): basta per invalidare la cache
 *  quando il contenuto sorgente cambia, non serve altro. */
function hashTesto(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

const cacheIndici = new Map<string, Indice>();

/** Costruisce (o ritorna dalla cache) l'indice frammenti per questo hotel.
 *  In produzione ogni istanza serverless serve UN solo hotel, quindi in
 *  pratica la Map ha sempre al più 1 voce — la teniamo keyed da hash (non
 *  uno slot singolo) per sicurezza in dev/hot-reload, dove più contenuti
 *  potrebbero convivere nello stesso processo. */
export function getIndice(base: string, menus: string, trailing: string): Indice {
  const hash = hashTesto(`${base} ${menus} ${trailing}`);
  const esistente = cacheIndici.get(hash);
  if (esistente) return esistente;
  const { core, frammenti } = costruisciFrammenti(base, menus, trailing);
  const indice: Indice = { core, frammenti, hash };
  cacheIndici.set(hash, indice);
  return indice;
}

/* ------------------------------------------------------------------------
 * 4. Embeddings Mistral + similarità coseno
 * ---------------------------------------------------------------------- */

const MISTRAL_EMBED_URL = "https://api.mistral.ai/v1/embeddings";
const EMBED_MODEL = "mistral-embed";
// Timeout duro: sopra questa soglia si degrada a "tutti i frammenti"
// piuttosto che far aspettare l'ospite. Vale per OGNI chiamata embeddings
// (frammenti e query), ciascuna per conto suo.
const EMBED_TIMEOUT_MS = 1500;
const TOP_N_FRAMMENTI = 5;
// Sopra questa soglia di voci KB si passa dal "allega tutte" al ranking per
// similarità (stessa logica dei frammenti, top-5). Sotto soglia, KB ancora
// piccola (~20 voci a poche righe l'una restano leggere anche allegate per
// intero) e allegarle tutte evita il rischio di escluderne una pertinente.
const SOGLIA_KB_TUTTE = 20;
const TOP_N_KB = 5;

/** Chiama l'endpoint embeddings di Mistral su un batch di stringhe. Mai un
 *  throw: qualunque problema (chiave assente, timeout, rete, formato
 *  risposta inatteso) ritorna null, e il chiamante decide come degradare. */
async function chiediEmbeddings(input: string[]): Promise<number[][] | null> {
  const chiave = process.env.MISTRAL_API_KEY;
  if (!chiave || input.length === 0) return null;
  try {
    const res = await fetch(MISTRAL_EMBED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${chiave}` },
      body: JSON.stringify({ model: EMBED_MODEL, input }),
      signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = data?.data;
    if (!Array.isArray(items) || items.length !== input.length) return null;
    const vettori = items.map((it: unknown) => (it as { embedding?: unknown })?.embedding);
    if (!vettori.every((v: unknown): v is number[] => Array.isArray(v))) return null;
    return vettori as number[][];
  } catch {
    return null; // timeout (AbortSignal), chiave assente a monte, rete giù, JSON invalido...
  }
}

function similitudineCoseno(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Cache lazy degli embedding dei frammenti: UNA chiamata batch al primo uso
// per ciascun indice (hash), poi riusata da tutte le richieste successive
// finché l'istanza serverless resta calda. Se il cron riscrive menus.ts, il
// prossimo deploy cambia l'hash e la cache si invalida da sola (vedi getIndice).
const cacheFrammentiVettori = new Map<string, number[][]>();

async function otteniVettoriFrammenti(indice: Indice): Promise<number[][] | null> {
  const esistente = cacheFrammentiVettori.get(indice.hash);
  if (esistente) return esistente;
  const vettori = await chiediEmbeddings(indice.frammenti.map((f) => f.testo));
  if (vettori) cacheFrammentiVettori.set(indice.hash, vettori);
  return vettori;
}

// Stessa idea per la KB, ma SOLO quando la soglia sopra scatta: sotto soglia
// non si calcolano mai embeddings per la KB (si allega tutta), quindi nel
// caso comune (poche voci) questa cache resta vuota e non costa nulla.
const cacheKbVettori = new Map<string, number[][]>();

async function otteniVettoriKb(items: KbItem[]): Promise<number[][] | null> {
  const hash = hashTesto(items.map((i) => i.domanda).join(" "));
  const esistente = cacheKbVettori.get(hash);
  if (esistente) return esistente;
  const vettori = await chiediEmbeddings(items.map((i) => i.domanda));
  if (vettori) cacheKbVettori.set(hash, vettori);
  return vettori;
}

async function formattaKb(
  items: KbItem[],
  vettoreQuery: number[] | null,
  giaDegradato: boolean,
): Promise<string> {
  if (items.length === 0) return "";

  let scelte = items;
  if (items.length > SOGLIA_KB_TUTTE && !giaDegradato && vettoreQuery) {
    const vettoriKb = await otteniVettoriKb(items);
    if (vettoriKb && vettoriKb.length === items.length) {
      scelte = items
        .map((it, i) => ({ it, sim: similitudineCoseno(vettoreQuery, vettoriKb[i]) }))
        .sort((a, b) => b.sim - a.sim)
        .slice(0, TOP_N_KB)
        .map((x) => x.it);
    }
    // Se il calcolo fallisce, `scelte` resta items (tutte): stessa filosofia
    // di degrado dei frammenti, mai un buco per un errore di rete.
  }

  return scelte.map((it) => `D: ${it.domanda}\nR: ${it.risposta}`).join("\n\n");
}

export interface RecuperaFontiOpts {
  /** Voci KB verificate da includere nel blocco finale (sotto soglia tutte,
   *  sopra soglia solo le top-5 per similarità). Può essere una Promise: la
   *  fetch di getVerifiedAnswers() parte insieme a recuperaFonti() nella
   *  route (Promise.all), non prima — questa funzione la attende
   *  internamente, senza serializzare le due chiamate di rete. */
  kbItems?: KbItem[] | Promise<KbItem[]>;
}

/** Recupera le fonti pertinenti a `domanda` (tipicamente gli ultimi 2
 *  messaggi utente concatenati dal chiamante: i follow-up brevi come "e si
 *  pagano al check-out?" non hanno parole chiave da soli) e compone il
 *  blocco unico da allegare ai messages. Mai un throw: su qualunque errore
 *  di rete/formato ritorna TUTTI i frammenti con `degradato: true`, così il
 *  comportamento resta equivalente a quello pre-v2 (e il fallback DeepSeek,
 *  che non ha embeddings Mistral, continua a funzionare). */
export async function recuperaFonti(
  domanda: string,
  indice: Indice,
  opts: RecuperaFontiOpts = {},
): Promise<{ testo: string; degradato: boolean }> {
  const kbItemsPromise = Promise.resolve(opts.kbItems ?? []);

  const [vettoriFrammenti, vettoreQuery] = await Promise.all([
    otteniVettoriFrammenti(indice),
    chiediEmbeddings([domanda]).then((v) => v?.[0] ?? null),
  ]);

  let frammentiScelti: Frammento[];
  let degradato: boolean;

  if (!vettoriFrammenti || !vettoreQuery || vettoriFrammenti.length !== indice.frammenti.length) {
    frammentiScelti = indice.frammenti;
    degradato = true;
  } else {
    frammentiScelti = indice.frammenti
      .map((f, i) => ({ f, sim: similitudineCoseno(vettoreQuery, vettoriFrammenti[i]) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, TOP_N_FRAMMENTI)
      .map((x) => x.f);
    degradato = false;
  }

  const kbItems = await kbItemsPromise;
  const kbTesto = await formattaKb(kbItems, vettoreQuery, degradato);

  const testo =
    "FONTI DISPONIBILI PER QUESTA DOMANDA\n" +
    "(usa SOLO queste informazioni; se la risposta non è qui, non la sai)\n\n" +
    "=== Scheda hotel ===\n" +
    indice.core +
    "\n\n=== Frammenti pertinenti ===\n" +
    frammentiScelti.map((f) => f.testo).join("\n\n") +
    (kbTesto ? "\n\n=== Risposte ufficiali verificate (precedenza assoluta) ===\n" + kbTesto : "");

  return { testo, degradato };
}
