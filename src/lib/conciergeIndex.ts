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
 * romperebbe insieme al percorso normale. Quando degrada, route.ts aggiunge
 * una guardia per-turno (GUARDIA_DEGRADO, conciergeBehavior.ts) che rende
 * accettabile passare da ~8KB mirati a ~32KB indifferenziati — vedi il
 * commento su `degradato` in recuperaFonti() qui sotto.
 */

import { buildKbBlock, type KbItem } from "./conciergeKb";
import vettoriPrecalcolatiRaw from "./conciergeVectors.json";

export interface Frammento {
  sezione: string;
  testo: string;
  fonte: "scheda" | "menu" | "link";
}

export interface Indice {
  core: string;
  frammenti: Frammento[];
  /** Hash del contenuto sorgente (base+menus+trailing): chiave delle cache
   *  module-scope qui sotto. Cambia da solo quando il cron riscrive menus.ts
   *  e si ridispiega — non serve invalidazione manuale. È anche la chiave che
   *  fa combaciare (o meno) i vettori precalcolati a build time in
   *  conciergeVectors.json — vedi otteniVettoriFrammenti() più sotto e
   *  scripts/concierge-embed.mjs. */
  hash: string;
}

interface VettoriPrecalcolati {
  hash: string;
  modello: string;
  dim: number;
  vettori: number[][];
}

// Il file è tracciato in git con un segnaposto vuoto (hash: ""): non può mai
// combaciare con un hash reale, quindi finché il prebuild non lo sovrascrive
// il runtime cade da solo nel percorso lazy qui sotto. Il cast esplicito
// evita che TS infili il tipo `never[]` dedotto dal segnaposto.
const vettoriPrecalcolati = vettoriPrecalcolatiRaw as VettoriPrecalcolati;

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
 *  solo tono, lingue supportate e "non inventare". Il ripiego inglese e il
 *  "niente saluto iniziale" che c'erano solo lì sono stati reintrodotti
 *  verbatim nel prompt di comportamento (vedi conciergeBehavior.ts, COME
 *  RISPONDI): oggi è davvero tutto coperto lì, non genericamente "già
 *  presente" come diceva questo commento prima. */
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
 *  frammento interrogabile a sé, ma la riga `## MENÙ ...` finisce nel core
 *  (vedi estraiIntestazioneMenu) perché è l'unico segnale di freschezza. */
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

/** Estrae la riga di intestazione `## MENÙ ...` di MENUS (contiene la data
 *  di aggiornamento del cron: unico segnale di freschezza che l'ospite/il
 *  modello ha a disposizione). Va nel core, non in un frammento: deve essere
 *  sempre visibile, non dipendere dal ranking per pertinenza. */
function estraiIntestazioneMenu(menus: string): string {
  const m = /^## .+$/m.exec(menus);
  return m ? m[0].trim() : "";
}

/** TRAILING = "\n## LINK E AZIONI...\n<corpo>\n---\n\nREGOLE FONDAMENTALI:\n...".
 *  Tutto ciò che precede la riga "---" è il blocco link, e va nel core
 *  VERBATIM: gli URL sono reali, non si riformattano né si toccano. Le
 *  REGOLE FONDAMENTALI dopo "---" si scartano: le sostituisce il prompt di
 *  comportamento (conciergeBehavior.ts), tranne la regola 9 (MENÙ), che è
 *  contenuto per-hotel raffinato su feedback del cliente e va estratta ed
 *  iniettata verbatim — vedi estraiRegolaMenu() qui sotto. */
function estraiBloccoLinkEAzioni(trailing: string): string {
  const idx = trailing.search(/\n-{3,}\s*\n/);
  const blocco = idx === -1 ? trailing : trailing.slice(0, idx);
  return blocco.trim();
}

const REGOLA_MENU_RIPIEGO =
  "Non elencare i prezzi dei menù; allega il link del menù solo del locale richiesto.";

/** Estrae la regola 9 (MENÙ) dal TRAILING di UN hotel: la riga che inizia con
 *  `9. MENÙ:`, contenuto dopo il prefisso numerico e l'etichetta. È testo
 *  raffinato su feedback reali del cliente e differisce per hotel (es.
 *  Titano Suites non ha un ristorante proprio nell'edificio): va iniettata
 *  VERBATIM nel prompt di comportamento (buildBehaviorPrompt), mai
 *  riscritta o parafrasata. Ripiego solo se la riga non c'è (non dovrebbe
 *  succedere: verificato che tutti e 3 i TRAILING attuali la abbiano). */
export function estraiRegolaMenu(trailing: string): string {
  const m = /^9\.\s*MENÙ:\s*(.+)$/m.exec(trailing);
  return m ? m[1].trim() : REGOLA_MENU_RIPIEGO;
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
 *  riga, tenendo ogni pezzo <= soglia.
 *
 *  Overlap di 3 righe fra chunk consecutivi: il testo dei menu estratto da
 *  PDF ha spesso il nome del piatto su una riga e il prezzo su una o più
 *  righe successive (a volte con la traduzione inglese in mezzo). Senza
 *  overlap un taglio a metà di questo gruppetto lascia "€ 8,00" da solo in
 *  testa al chunk successivo, senza il piatto a cui appartiene. Ripetere le
 *  ultime righe del chunk appena chiuso in testa al prossimo ricrea il
 *  contesto anche quando il modello vede solo uno dei due frammenti. */
function dividiDuro(testo: string, soglia: number): string[] {
  const OVERLAP_RIGHE = 3;
  const righe = testo.split("\n");
  const risultato: string[] = [];
  let righeCorrenti: string[] = [];
  let corrente = "";
  for (const r of righe) {
    const candidato = corrente ? `${corrente}\n${r}` : r;
    if (candidato.length <= soglia || !corrente) {
      corrente = candidato;
      righeCorrenti.push(r);
    } else {
      risultato.push(corrente);
      const overlap = righeCorrenti.slice(-OVERLAP_RIGHE);
      righeCorrenti = [...overlap, r];
      corrente = righeCorrenti.join("\n");
    }
  }
  if (corrente) risultato.push(corrente);
  return risultato;
}

/** Spezza un corpo di sezione in chunk <= ~1500 caratteri, provando prima i
 *  sotto-titoli `### `, poi le righe vuote, poi (fallback duro) le righe.
 *
 *  accumulaParagrafi() è applicato SEMPRE quando la sezione va spezzata (non
 *  più solo quando un singolo blocco supera già la soglia): senza, paragrafi
 *  piccoli e adiacenti (es. la legenda di un listino + le sue righe prezzo)
 *  restavano ciascuno un frammento a sé, e un frammento con solo quattro
 *  numeri per riga non ha etichetta senza la legenda che lo precede.
 *
 *  ATTENZIONE alla granularità: quando NON ci sono sotto-titoli `### `, tutta
 *  la sezione è UN'unica lista di paragrafi allo stesso livello (es. legenda
 *  + UOMO + DONNA di un listino) e accumulaParagrafi() va chiamata UNA VOLTA
 *  SOLA su quella lista intera — chiamarla paragrafo per paragrafo (un array
 *  a un solo elemento ogni volta) la rende un no-op silenzioso, perché non ha
 *  mai un vicino con cui accumularsi. Quando invece i sotto-titoli ci sono,
 *  ogni sotto-sezione si accumula per conto proprio: non deve fondersi con
 *  la sotto-sezione seguente (locali/reparti diversi).
 *
 *  Ogni chunk derivato dalla sezione eredita come intestazione il PRIMO
 *  paragrafo della sezione (tranne il primo chunk, che già lo contiene per
 *  costruzione): stessa ragione, un chunk isolato deve restare leggibile da
 *  solo anche quando il ranking lo sceglie senza i vicini. */
function spezzaSeServe(corpo: string, soglia: number = SOGLIA_FRAMMENTO): string[] {
  if (corpo.length <= soglia) return [corpo];

  const primoParagrafo = dividiPerRigheVuote(corpo)[0] ?? "";

  const blocchiPerSottotitolo = dividiPerSottotitoli(corpo);

  const chunkGrezzi =
    blocchiPerSottotitolo.length > 1
      ? blocchiPerSottotitolo.flatMap((blocco) => accumulaParagrafi(dividiPerRigheVuote(blocco), soglia))
      : accumulaParagrafi(dividiPerRigheVuote(corpo), soglia);

  const chunk = chunkGrezzi.flatMap((c) => (c.length > soglia ? dividiDuro(c, soglia) : [c]));

  return chunk.map((c, i) => (i === 0 || c.startsWith(primoParagrafo) ? c : `${primoParagrafo}\n\n${c}`));
}

/* ------------------------------------------------------------------------
 * 3. API pubblica: costruzione core+frammenti, hash, cache indice
 * ---------------------------------------------------------------------- */

// Diversità nel top-N: al massimo questi frammenti con fonte "menu" nella
// selezione finale. Un locale grande (es. Caffè Titano, ~12KB, 10 frammenti
// su 32 totali) satura altrimenti il ranking quando la domanda è anche solo
// vagamente legata al cibo, lasciando fuori sezioni non-menu pertinenti.
const MAX_MENU_NEL_TOP = 2;

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
  const intestazioneMenu = estraiIntestazioneMenu(menus);

  const core = [sezioneHotel?.testoCompleto, sezioneContatti?.testoCompleto, linkEAzioni, intestazioneMenu]
    .filter((s): s is string => !!s && s.trim().length > 0)
    .join("\n\n");

  const frammenti: Frammento[] = [];

  for (const sez of sezioniBase) {
    if (sez.titolo === "HOTEL" || sez.titolo === "CONTATTI") continue; // già nel core
    const chunk = spezzaSeServe(sez.corpo);
    chunk.forEach((testo) => {
      frammenti.push({
        sezione: sez.titolo,
        testo: `[${sez.titolo}]\n${testo}`,
        fonte: "scheda",
      });
    });
  }

  for (const loc of estraiLocaliMenu(menus)) {
    // L'intestazione di ogni locale (descrizione + "Orari: …") è informazione
    // di SCHEDA che vive dentro il menu: "A che ora è la colazione?" trovava la
    // risposta solo in mezzo a un elenco di piatti, che diluisce l'embedding e
    // sconta il tetto sui frammenti-menu. Misurato su Titano: rispondeva "non
    // è nella scheda" mentre menus.ts diceva "Colazione 07:00-10:00". Qui il
    // primo paragrafo diventa un frammento corto e denso, fonte "scheda".
    const intro = loc.corpo.split(/\n\s*\n/)[0]?.trim() ?? "";
    if (intro && intro.length <= 700 && !intro.includes("€")) {
      frammenti.push({
        sezione: `${loc.titolo} – info`,
        testo: `[${loc.titolo} – informazioni e orari]\n${intro}`,
        fonte: "scheda",
      });
    }
    const chunk = spezzaSeServe(loc.corpo);
    chunk.forEach((testo, i) => {
      const suffisso = chunk.length > 1 ? ` (parte ${i + 1}/${chunk.length})` : "";
      frammenti.push({
        sezione: loc.titolo,
        testo: `[MENU – ${loc.titolo}${suffisso}]\n${testo}`,
        fonte: "menu",
      });
    });
  }

  return { core, frammenti };
}

/** Hash non crittografico (FNV-1a a 32 bit): basta per invalidare la cache
 *  quando il contenuto sorgente cambia, non serve altro. Esportato perché
 *  scripts/concierge-embed.mjs (prebuild) deve calcolare ESATTAMENTE lo
 *  stesso hash usato a runtime — sulla stessa formula, mai due
 *  implementazioni che possono divergere. */
export function hashTesto(s: string): string {
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
  const hash = hashTesto(`${base} ${menus} ${trailing}`);
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
// 5 -> 8 il 2026-08-28: misurato su Titano Suites che alla domanda tedesca
// "Um wie viel Uhr gibt es Frühstück?" il frammento giusto (L'Arengo – info,
// "Colazione 07:00-10:00") restava fuori dal top-5: con query brevi in
// un'altra lingua le similarità si affollano fra 0.67 e 0.69 e discriminano
// poco. Il modello ha riempito il buco inventando "7:30 nella sala dedicata".
// Tre frammenti in più costano ~2KB e alzano il richiamo dove serve.
const TOP_N_FRAMMENTI = 8;
// Sopra questa soglia di voci KB si passa dal "allega tutte" al ranking per
// similarità (stessa logica dei frammenti, top-5). Sotto soglia, KB ancora
// piccola (~20 voci a poche righe l'una restano leggere anche allegate per
// intero) e allegarle tutte evita il rischio di escluderne una pertinente.
const SOGLIA_KB_TUTTE = 20;
const TOP_N_KB = 5;
// Limite Mistral: 16384 token/richiesta embeddings. Il corpus di un hotel è
// ~28KB in una chiamata sola (troppo vicino al limite, misurato); qui e nello
// script di prebuild lo si spezza sempre in batch <= questa soglia.
const BATCH_MAX_CHARS = 8000;

/** Chiama l'endpoint embeddings di Mistral su UN batch di stringhe (già
 *  entro il limite di caratteri, vedi chiediEmbeddingsBatch). Mai un throw:
 *  qualunque problema (chiave assente, timeout, rete, formato risposta
 *  inatteso) ritorna null, e il chiamante decide come degradare.
 *
 *  Ordina `data` per `index` prima di mappare gli `embedding`: l'ordine
 *  della risposta non è documentato come garantito, e un riordino silenzioso
 *  abbinerebbe un frammento al vettore sbagliato senza che nulla lo segnali
 *  (nessun errore, nessun `degradato: true` — solo un ranking sbagliato). */
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
    if (!items.every((it: unknown) => typeof (it as { index?: unknown })?.index === "number")) return null;
    const ordinati = [...items].sort(
      (a, b) => (a as { index: number }).index - (b as { index: number }).index,
    );
    const vettori = ordinati.map((it: unknown) => (it as { embedding?: unknown })?.embedding);
    if (!vettori.every((v: unknown): v is number[] => Array.isArray(v))) return null;
    return vettori as number[][];
  } catch {
    return null; // timeout (AbortSignal), chiave assente a monte, rete giù, JSON invalido...
  }
}

/** Raggruppa `testi` in batch consecutivi di al più `maxChars` caratteri
 *  complessivi, senza mai spezzare un singolo testo fra due batch. Un testo
 *  singolarmente più lungo della soglia resta comunque un batch a sé (il
 *  limite Mistral è per token dell'INTERA richiesta, non per singolo input:
 *  un batch di un elemento solo è già minimale). */
function raggruppaInBatch(testi: string[], maxChars: number): string[][] {
  const batch: string[][] = [];
  let corrente: string[] = [];
  let correnteLen = 0;
  for (const t of testi) {
    if (corrente.length > 0 && correnteLen + t.length > maxChars) {
      batch.push(corrente);
      corrente = [];
      correnteLen = 0;
    }
    corrente.push(t);
    correnteLen += t.length;
  }
  if (corrente.length > 0) batch.push(corrente);
  return batch;
}

/** Come chiediEmbeddings, ma spezza `input` in batch <= BATCH_MAX_CHARS
 *  caratteri e li manda IN PARALLELO (Promise.all): un solo batch fallito
 *  degrada l'intero risultato a null, stessa filosofia difensiva del
 *  batch singolo. L'ordine dei vettori nel risultato finale rispecchia
 *  l'ordine di `input` (i batch sono contigui e ciascuno è già ordinato). */
async function chiediEmbeddingsBatch(input: string[]): Promise<number[][] | null> {
  if (input.length === 0) return [];
  const batch = raggruppaInBatch(input, BATCH_MAX_CHARS);
  const risultati = await Promise.all(batch.map((b) => chiediEmbeddings(b)));
  if (risultati.some((r) => r === null)) return null;
  return (risultati as number[][][]).flat();
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

/** Sceglie i migliori `n` frammenti per similarità, con al più `maxMenu`
 *  frammenti a fonte "menu" fra i selezionati: un locale grande da solo può
 *  occupare l'intero top-N quando la domanda tocca anche vagamente il cibo,
 *  escludendo sezioni non-menu più pertinenti alla domanda reale. I posti
 *  negati a un frammento menu oltre il tetto vanno al miglior candidato
 *  successivo (menu o no) che rispetta ancora il tetto. */
function selezionaDiversificato(
  punteggi: { f: Frammento; sim: number }[],
  n: number,
  maxMenu: number,
): Frammento[] {
  const ordinati = [...punteggi].sort((a, b) => b.sim - a.sim);
  const scelti: Frammento[] = [];
  let menuScelti = 0;
  for (const { f } of ordinati) {
    if (scelti.length >= n) break;
    if (f.fonte === "menu") {
      if (menuScelti >= maxMenu) continue;
      menuScelti++;
    }
    scelti.push(f);
  }
  return scelti;
}

// Cache lazy degli embedding dei frammenti: usata SOLO quando i vettori
// precalcolati a build time (conciergeVectors.json) non combaciano con
// l'hash del contenuto corrente — vedi otteniVettoriFrammenti(). Una volta
// popolata al primo uso su un'istanza serverless, evita di richiamare
// Mistral per ogni domanda finché l'istanza resta calda.
const cacheFrammentiVettori = new Map<string, number[][]>();

/** Vettori dei frammenti: preferisce SEMPRE i precalcolati a build time
 *  (conciergeVectors.json, scritti dal prebuild via
 *  scripts/concierge-embed.mjs) quando il loro hash combacia con quello
 *  dell'indice corrente — zero chiamate di rete, zero TTFT extra. Se non
 *  combaciano (es. il cron ha riscritto menus.ts e il prebuild successivo è
 *  fallito, o non è mai girato in locale) si ripiega sul calcolo lazy, a
 *  batch come lo script di prebuild — ma questo va sempre segnalato nei log
 *  Vercel: un deploy che dipende dal percorso lazy in produzione è un
 *  sintomo, non la normalità. */
async function otteniVettoriFrammenti(indice: Indice): Promise<number[][] | null> {
  if (
    vettoriPrecalcolati.hash &&
    vettoriPrecalcolati.hash === indice.hash &&
    vettoriPrecalcolati.vettori.length === indice.frammenti.length
  ) {
    return vettoriPrecalcolati.vettori;
  }

  console.warn(
    `[concierge] vettori precalcolati assenti o non aggiornati per hash=${indice.hash} ` +
      `(precalcolato=${vettoriPrecalcolati.hash || "<vuoto>"}): percorso lazy, chiamata Mistral al volo.`,
  );

  const esistente = cacheFrammentiVettori.get(indice.hash);
  if (esistente) return esistente;
  const vettori = await chiediEmbeddingsBatch(indice.frammenti.map((f) => f.testo));
  if (vettori) cacheFrammentiVettori.set(indice.hash, vettori);
  return vettori;
}

// Stessa idea per la KB, ma SOLO quando la soglia sopra scatta: sotto soglia
// non si calcolano mai embeddings per la KB (si allega tutta), quindi nel
// caso comune (poche voci) questa cache resta vuota e non costa nulla.
const cacheKbVettori = new Map<string, number[][]>();

async function otteniVettoriKb(items: KbItem[]): Promise<number[][] | null> {
  const hash = hashTesto(items.map((i) => i.domanda).join(" "));
  const esistente = cacheKbVettori.get(hash);
  if (esistente) return esistente;
  const vettori = await chiediEmbeddings(items.map((i) => i.domanda));
  if (vettori) cacheKbVettori.set(hash, vettori);
  return vettori;
}

/** Formatta il blocco KB da allegare alle fonti. SINCRONA: i vettori (se
 *  servono) sono già stati calcolati a monte, nello stesso Promise.all degli
 *  altri round-trip di rete (vedi recuperaFonti) — niente più una terza
 *  chiamata in serie dopo le prime due. Riusa buildKbBlock() di
 *  conciergeKb.ts: le voci vanno serializzate JSON dentro
 *  <dati_verificati>...</dati_verificati> con la frase di guardia, non più
 *  come testo grezzo "D: ... / R: ..." (un ospite non poteva "uscire" da
 *  quel formato con una correzione ostile, con questo può). */
function formattaKb(
  items: KbItem[],
  vettoreQuery: number[] | null,
  vettoriKb: number[][] | null,
  giaDegradato: boolean,
): string {
  if (items.length === 0) return "";

  let scelte = items;
  if (items.length > SOGLIA_KB_TUTTE && !giaDegradato && vettoreQuery && vettoriKb && vettoriKb.length === items.length) {
    scelte = items
      .map((it, i) => ({ it, sim: similitudineCoseno(vettoreQuery, vettoriKb[i]) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, TOP_N_KB)
      .map((x) => x.it);
    // Se vettoriKb è null/incompleto, `scelte` resta items (tutte): stessa
    // filosofia di degrado dei frammenti, mai un buco per un errore di rete.
  }

  return buildKbBlock(scelte);
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
 *  di rete/formato ritorna TUTTI i frammenti con `degradato: true`. NON è
 *  equivalente al comportamento pre-v2 (che non aveva alcuna guardia
 *  per-turno, solo GUIDA_FINALE nel prompt statico): route.ts, quando
 *  `degradato` è true, aggiunge GUARDIA_DEGRADO (conciergeBehavior.ts) come
 *  penultimo messaggio — è quella guardia, non l'equivalenza col pre-v2, che
 *  rende accettabile passare da ~8KB mirati a ~32KB indifferenziati. Il
 *  fallback DeepSeek (che non ha embeddings Mistral) continua comunque a
 *  funzionare in entrambi i casi. */
export async function recuperaFonti(
  domanda: string,
  indice: Indice,
  opts: RecuperaFontiOpts = {},
): Promise<{ testo: string; degradato: boolean; scelti: string[] }> {
  const kbItemsPromise = Promise.resolve(opts.kbItems ?? []);

  // I 3 round-trip di rete partono tutti qui, non in serie: il vettore KB
  // dipende dal numero di voci KB (kbItemsPromise), quindi è incatenato SU
  // quella promise invece che atteso prima di iniziare — ma parte comunque
  // in parallelo ai vettori frammenti/query, non dopo che quelli finiscono.
  // Nel raro caso in cui il recupero frammenti/query degradi DOPO che questo
  // round-trip è già partito, il suo risultato resta semplicemente inutilizzato
  // (formattaKb riceve giaDegradato=true e lo ignora): si accetta la chiamata
  // sprecata in quel caso raro in cambio di non serializzare mai il caso comune.
  const vettoriKbPromise = kbItemsPromise.then((items) =>
    items.length > SOGLIA_KB_TUTTE ? otteniVettoriKb(items) : Promise.resolve(null),
  );

  const [vettoriFrammenti, vettoreQuery, kbItems, vettoriKb] = await Promise.all([
    otteniVettoriFrammenti(indice),
    chiediEmbeddings([domanda]).then((v) => v?.[0] ?? null),
    kbItemsPromise,
    vettoriKbPromise,
  ]);

  let frammentiScelti: Frammento[];
  let degradato: boolean;
  // Etichette diagnostiche "sezione(similarità)" dei frammenti scelti: la
  // route le logga solo con CONCIERGE_DEBUG=1 (preview). Senza, un recupero
  // che manca il frammento giusto è indistinguibile da un modello reticente.
  let scelti: string[] = [];

  if (!vettoriFrammenti || !vettoreQuery || vettoriFrammenti.length !== indice.frammenti.length) {
    frammentiScelti = indice.frammenti;
    degradato = true;
    scelti = ["<degradato: tutti i frammenti>"];
  } else {
    const punteggi = indice.frammenti.map((f, i) => ({ f, sim: similitudineCoseno(vettoreQuery, vettoriFrammenti[i]) }));
    frammentiScelti = selezionaDiversificato(punteggi, TOP_N_FRAMMENTI, MAX_MENU_NEL_TOP);
    const simDi = new Map(punteggi.map((p) => [p.f, p.sim]));
    scelti = frammentiScelti.map((f) => `${f.sezione}(${(simDi.get(f) ?? 0).toFixed(2)})`);
    degradato = false;
  }

  const kbTesto = formattaKb(kbItems, vettoreQuery, vettoriKb, degradato);

  const testo =
    "FONTI DISPONIBILI PER QUESTA DOMANDA\n" +
    "(usa SOLO queste informazioni; se la risposta non è qui, non la sai)\n\n" +
    "=== Scheda hotel ===\n" +
    indice.core +
    "\n\n=== Frammenti pertinenti ===\n" +
    frammentiScelti.map((f) => f.testo).join("\n\n") +
    kbTesto;

  return { testo, degradato, scelti };
}
