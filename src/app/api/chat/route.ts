import { NextRequest, NextResponse } from "next/server";
import { MENUS } from "@/lib/menus";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { SYSTEM_PROMPT_BASE, TRAILING, FALLBACK_STREAM_ERROR, FALLBACK_FATAL_ERROR } from "@/lib/concierge";
import { getVerifiedAnswers } from "@/lib/conciergeKb";
import { promemoriaLingua } from "@/lib/languageDetect";
import { getIndice, recuperaFonti, estraiRegolaMenu } from "@/lib/conciergeIndex";
import { buildBehaviorPrompt, GUARDIA_DEGRADO } from "@/lib/conciergeBehavior";
import { numeroWhatsappReception, strutturaWhatsappReception, creaTrasformatoreWa, rimuoviLinkWa } from "@/lib/conciergeWhatsapp";
import { HOTEL } from "@/lib/hotel";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

/** Query per il recupero fonti: gli ultimi 2 messaggi utente concatenati. Un
 *  solo messaggio spesso non basta (i follow-up tipo "e si pagano al
 *  check-out?" non hanno parole chiave da soli), 2 è il compromesso — oltre
 *  rischia di trascinare dentro il contesto sbagliato da una domanda precedente. */
function ultimiMessaggiUtente(storia: ChatMsg[], n: number): string {
  return storia
    .filter((m) => m.role === "user")
    .slice(-n)
    .map((m) => m.content)
    .join("\n");
}

// Mappa host -> projectId per l'analytics first-party (fleet-wide, dato non sensibile).
const PROJECT_ID_BY_HOST: Record<string, string> = {
  "grandhotelsanmarino.blasat.com": "grand-hotel-sm",
  "hoteltitano.blasat.com": "hotel-titano",
  "titanosuites.blasat.com": "titano-suites",
};

/** Token consumati da UNO scambio, come li dichiara il provider. */
interface UsoToken {
  /** prompt_tokens: prompt di comportamento + fonti + storia + domanda. */
  in: number;
  /** completion_tokens: la risposta generata. */
  out: number;
}

/** Estrae `usage` da un chunk SSE gia' deserializzato.
 *
 *  ⚠️ QUESTA FUNZIONE NON DEVE MAI LANCIARE. Sta sul percorso di ogni singolo
 *  chunk diretto all'ospite: un throw qui finirebbe nel catch dello stream e
 *  trasformerebbe una risposta perfettamente valida in FALLBACK_STREAM_ERROR.
 *  Contare i token è un di più; rispondere all'ospite è il lavoro. In ogni
 *  caso dubbio si ritorna null e si tira dritto — l'analytics non incrementa
 *  nulla e la dashboard mostra lo scambio come "senza misura".
 *
 *  Ritorna null (mai un oggetto a zero) quando il chunk non porta usage: è
 *  così che il chiamante distingue "il provider non l'ha mandato" da "l'ha
 *  mandato e vale zero". */
function leggiUsage(parsed: unknown): UsoToken | null {
  try {
    const u = (parsed as { usage?: unknown } | null)?.usage as
      | { prompt_tokens?: unknown; completion_tokens?: unknown }
      | null
      | undefined;
    if (!u || typeof u !== "object") return null;
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
    };
    // Almeno uno dei due campi dev'essere un numero valido, altrimenti è un
    // oggetto `usage` che non ci dice niente e vale come assente.
    const okIn = Number.isFinite(Number(u.prompt_tokens));
    const okOut = Number.isFinite(Number(u.completion_tokens));
    if (!okIn && !okOut) return null;
    return { in: num(u.prompt_tokens), out: num(u.completion_tokens) };
  } catch {
    return null;
  }
}

/** Errore di apertura stream che si porta dietro lo stato HTTP, quando c'e'.
 *  Serve SOLO a distinguere un rifiuto della richiesta (400: il corpo non
 *  piace) da un guasto del provider (5xx, timeout, rete) — vedi
 *  apriStreamConRipiego(). */
class ErroreProvider extends Error {
  status: number;
  constructor(messaggio: string, status = 0) {
    super(messaggio);
    this.name = "ErroreProvider";
    this.status = status;
  }
}

/** Perché un provider non ha risposto. Lista corta e stabile: serve a
 *  DECIDERE (il primario cede perché è lento, o perché sbaglia?), non a fare
 *  diagnosi fine — quella resta nei log della funzione. Sapere quante volte si
 *  ripiega senza sapere perché non fa cambiare idea a nessuno. */
type MotivoGuasto = "timeout" | "http" | "vuoto" | "altro";

/** Un provider che ha fallito, e perché. Zero, uno o due per scambio. */
interface Guasto {
  m: string;
  r: MotivoGuasto;
}

/** ⚠️ NON DEVE MAI LANCIARE: gira dentro il catch del ciclo provider, e un
 *  throw qui trasformerebbe "il primario è lento, provo il secondo" in una
 *  chat morta. Nel dubbio: "altro". */
function motivoDi(e: unknown): MotivoGuasto {
  try {
    // Il nostro AbortController ha tagliato l'attesa del primo token: è
    // ESATTAMENTE il caso che fa scattare il ripiego, e va tenuto separato da
    // un errore del fornitore — le due cose si curano in modo opposto (alzare
    // la soglia, oppure cambiare modello).
    const nome = (e as { name?: unknown } | null)?.name;
    if (nome === "AbortError" || nome === "TimeoutError") return "timeout";
    if (e instanceof ErroreProvider) {
      if (e.status > 0) return "http";
      // 200 seguito da zero contenuto: il fornitore ha detto sì e non ha
      // scritto niente. Non è un errore HTTP e non è una lentezza.
      if (e.message.includes("nessun contenuto")) return "vuoto";
    }
    return "altro";
  } catch {
    return "altro";
  }
}

/** Tempi di UNO scambio, in millisecondi interi.
 *  ttft = quanto ha aspettato l'OSPITE prima di vedere il primo carattere.
 *  Misurato dall'ingresso nella route, quindi comprende anche il recupero
 *  fonti e gli eventuali tentativi falliti: è una misura dell'attesa vissuta,
 *  non della velocità pura del modello. È la domanda giusta — "quanto aspetta
 *  un ospite?" — e la risposta cambia se a rispondere è stato il ripiego.
 *  tot  = fino a stream chiuso (poco prima di controller.close()). */
interface Tempi {
  ttft: number | null;
  tot: number;
}

/** Logga in modo anonimo lo scambio completo domanda+risposta (nessun IP).
 *  UN solo record per scambio, scritto a stream chiuso: "questa risposta a
 *  questa domanda" senza id di correlazione fragili. `ok` distingue gli esiti
 *  (ok | stream_error | upstream_error | fatal) così una risposta parziale o
 *  assente è misurabile invece che invisibile.
 *  Mai un throw: non deve mai rallentare o far fallire la chat. */
function projectIdDi(req: NextRequest): string {
  const host = req.headers.get("host") || "unknown";
  return PROJECT_ID_BY_HOST[host] || host;
}

function logExchange(
  req: NextRequest,
  question: string,
  answer: string,
  ok: string,
  prov: string,
  deg: boolean,
  uso: UsoToken | null,
  tempi: Tempi,
  guasti: Guasto[],
): Promise<void> {
  const projectId = projectIdDi(req);
  return fetch("https://analytics.blasat.com/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project: projectId,
      event: "chatq",
      q: question.slice(0, 200),
      a: answer.slice(0, 700),
      ok,
      // Consumo di token dichiarato dal provider (campi additivi v3). Assenti
      // quando il provider non ha mandato il blocco `usage`: l'analytics in quel
      // caso non incrementa nulla, e la card della dashboard lo dice invece di
      // stimare. Un numero inventato sarebbe peggio di nessun numero, perché
      // l'unica cosa che quella card deve saper fare è mostrare un'impennata.
      // Il modello NON viaggia qui: è già `prov` qui sotto, ed è la stessa
      // stringa con cui l'analytics separa i contatori (i prezzi per milione
      // di token di medium, small e deepseek sono diversi fra loro).
      ...(uso ? { tin: uso.in, tout: uso.out } : {}),
      // Quale modello ha risposto: senza questo un fallback silenzioso su
      // DeepSeek sarebbe invisibile e non sapremmo mai che Mistral sta cedendo.
      prov,
      // Campo additivo (v2): il recupero fonti è degradato a "tutti i
      // frammenti" per un errore embeddings (timeout, chiave, rete). Serve a
      // distinguere "poco pertinente per scelta" da "poco pertinente perché
      // il recupero non ha funzionato". L'analytics lo ignora se non lo conosce.
      deg,
      // Tempi e ripieghi (campi additivi v4). Come per i token: se manca il
      // dato non si manda niente e l'analytics non incrementa nulla, invece di
      // scrivere uno zero che poi si legge come "risposta istantanea".
      // ttft assente = nessun primo token è mai uscito (tutti i provider giù):
      // quello scambio conta come tempo TOTALE ma non come attesa percepita,
      // perché l'ospite non ha visto niente da cui contare.
      ...(tempi.ttft !== null ? { ttft: tempi.ttft } : {}),
      tot: tempi.tot,
      // Chi ha fallito prima di quello che ha risposto. Vuoto nel caso normale
      // (il primario ce l'ha fatta), e allora non si manda proprio: il payload
      // dello scambio buono resta identico a prima.
      ...(guasti.length ? { guasti: guasti.slice(0, 4) } : {}),
    }),
    // Tetto duro: questa POST viene attesa prima di chiudere lo stream, quindi
    // un analytics lento terrebbe acceso l'indicatore "sto scrivendo". Meglio
    // perdere un record che far sembrare la chat impallata.
    signal: AbortSignal.timeout(800),
  })
    .then(() => {})
    .catch(() => {});
}

/** Verifica che la richiesta provenga da un contesto browser autorizzato.
 *  Questo endpoint è chiamato SOLO via fetch dal client della PWA, che invia
 *  sempre l'header Origin sulle POST. Un valore host è consentito se termina
 *  con un dominio della flotta (.blasat.com) o un preview Vercel (.vercel.app).
 *  - Origin presente → deve combaciare, altrimenti 403.
 *  - Origin assente → si ripiega sul Referer (alcuni browser lo inviano al
 *    posto dell'Origin): consentito solo se l'host del Referer combacia.
 *  - Nessuno dei due (tipico di curl/bot server-to-server) → 403.
 *  In questo modo i browser legittimi passano sempre, mentre le richieste
 *  automatizzate "nude" vengono trattate come sospette. */
function isAllowedCaller(req: NextRequest): boolean {
  const ok = (host: string) =>
    host.endsWith(".blasat.com") ||
    host === "blasat.com" ||
    host.endsWith(".vercel.app");

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      return ok(new URL(origin).hostname);
    } catch {
      return false;
    }
  }
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return ok(new URL(referer).hostname);
    } catch {
      return false;
    }
  }
  return false; // né Origin né Referer: richiesta non-browser → sospetta
}

/* ---- Provider LLM -------------------------------------------------------
 * Misurato il 2026-08-27 su 90 scambi per modello (15 domande d'ospite, 5
 * lingue, 6 passate) con QUESTO system prompt da ~35k caratteri:
 *
 *   modello              lingua corretta   TTFT mediana   TTFT p99
 *   deepseek-v4-flash          90.0%           3.1s        12.7s
 *   mistral-small-4            95.6%           0.6s         4.5s
 *   mistral-medium-3.5        100.0%           2.5s         3.2s
 *
 * Da qui la scelta: Mistral Medium primario, Mistral Small come ripiego.
 * DeepSeek e' USCITO dalla catena normale il 2026-08-27: sbagliava lingua una
 * volta su dieci (rispondeva in italiano a tedeschi e inglesi) ed era l'unico
 * pezzo che mandava i dati degli ospiti fuori dall'UE. Resta raggiungibile solo
 * come uscita di emergenza esplicita — vedi catenaProvider(). */
interface Provider {
  nome: string;
  url: string;
  model: string;
  chiave: () => string | undefined;
  /** Campi extra specifici del provider (es. la cache key di Mistral). */
  extra?: (projectId: string) => Record<string, unknown>;
}

const MISTRAL: Provider = {
  nome: "mistral-medium",
  url: "https://api.mistral.ai/v1/chat/completions",
  model: process.env.CHAT_MODEL_MISTRAL || "mistral-medium-latest",
  chiave: () => process.env.MISTRAL_API_KEY,
  // Su Mistral la cache del prefisso NON e' automatica come su DeepSeek: senza
  // questa chiave anche il poco che e' cacheable si pagherebbe pieno a ogni
  // domanda. Con il concierge v2 il prefisso cacheable e' SOLO il prompt di
  // comportamento (~2KB, conciergeBehavior.ts): le fonti e la storia, che
  // cambiano a ogni turno, non sono in cima ai messages e quindi non
  // beneficiano comunque della cache. La chiave resta impostata perche'
  // innocua (per hotel: i tre prompt sono diversi, non devono condividere
  // cache), non perche' copra ancora i ~11k token del vecchio prompt v1.
  extra: (projectId) => ({ prompt_cache_key: projectId }),
};

/** Ripiego: stesso fornitore, stessa giurisdizione, modello piu' piccolo.
 *  Copre il sovraccarico o un guasto del singolo modello, NON un blackout
 *  dell'intera piattaforma Mistral — scelta deliberata, vedi catenaProvider(). */
const MISTRAL_SMALL: Provider = {
  nome: "mistral-small",
  url: "https://api.mistral.ai/v1/chat/completions",
  model: "mistral-small-latest",
  chiave: () => process.env.MISTRAL_API_KEY,
  extra: (projectId) => ({ prompt_cache_key: projectId }),
};

const DEEPSEEK: Provider = {
  nome: "deepseek",
  url: "https://api.deepseek.com/v1/chat/completions",
  model: process.env.CHAT_MODEL_DEEPSEEK || "deepseek-v4-flash",
  chiave: () => process.env.DEEPSEEK_API_KEY,
};

/** Provider da provare in ordine, saltando quelli senza chiave configurata.
 *
 *  La catena normale resta DENTRO Mistral (Francia, UE): medium, poi small come
 *  ripiego. Scelta presa il 2026-08-27 insieme all'informativa privacy, che
 *  nomina Mistral come unico destinatario dei messaggi degli ospiti.
 *
 *  ⚠️ CHAT_PROVIDER=deepseek e' un'uscita di EMERGENZA, non una configurazione
 *  normale: manda i messaggi degli ospiti fuori dall'UE (Cina) e rende
 *  l'informativa privacy INESATTA finche' resta attiva. Se la usi, aggiorna
 *  anche privacyContent.ts o spegnila appena possibile.
 *
 *  Il ripiego non copre un blackout totale di Mistral: a ~67 scambi/mese
 *  l'assicurazione valeva meno della storia GDPR verso gli hotel. In quel caso
 *  l'ospite vede FALLBACK_FATAL_ERROR, che lo manda in Reception. */
function catenaProvider(): Provider[] {
  if (process.env.CHAT_PROVIDER === "deepseek") {
    return [DEEPSEEK].filter((p) => p.chiave());
  }
  return [MISTRAL, MISTRAL_SMALL].filter((p) => p.chiave());
}

/** Quanto si aspetta il PRIMO token prima di dichiarare morto un provider.
 *  6s e' ben sopra il massimo misurato su Mistral Medium (3.2s) e sotto la
 *  soglia in cui l'ospite pensa che la chat sia rotta. Troppo basso sarebbe
 *  dannoso: si ripiegherebbe su DeepSeek, che e' il modello peggiore. */
const TTFT_TIMEOUT_MS = Number(process.env.CHAT_TTFT_TIMEOUT_MS) || 6000;

// GUARDIA_FINALE (il presidio "non agire, non inventare/dedurre" misurato il
// 2026-08-27/28 su Mistral e DeepSeek) è stato sostituito dal prompt di
// comportamento in conciergeBehavior.ts, che copre la stessa cosa in modo
// permanente invece che come rinforzo per-turno. Storia e misure delle
// correzioni restano nel git log di questo file (vedi commit e314423,
// 47f3eb0) per chi deve ricostruire il perché di una singola frase.

interface AperturaStream {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  decoder: TextDecoder;
  /** Resto del buffer SSE non ancora consumato da apriStream(). */
  buffer: string;
  /** Token gia' letti per decidere il provider: vanno emessi per primi. */
  primi: string[];
  /** `usage` gia' incontrato durante la lettura di apertura. Normalmente null
   *  (il blocco arriva in fondo allo stream), ma se la risposta e' cortissima
   *  puo' capitare nello stesso pezzo dei primi token: senza questo campo
   *  andrebbe perso, perche' quelle righe il ciclo principale non le rilegge. */
  uso: UsoToken | null;
  /** false se il provider ha rifiutato `stream_options` e siamo ripartiti
   *  senza: nessun `usage` arrivera', e va detto invece che dato per zero. */
  contaToken: boolean;
}

/** Apre lo stream su un provider e ritorna SOLO quando e' arrivato il primo
 *  token di contenuto. E' questo che rende possibile il fallback: finche' non
 *  e' uscito un carattere verso l'ospite si puo' ancora cambiare modello, dopo
 *  no (mezza frase e' gia' sullo schermo e non si puo' ritirare). Ogni errore
 *  e' un throw: il chiamante prova il provider successivo. */
async function apriStream(
  p: Provider,
  messages: Array<{ role: string; content: string }>,
  projectId: string,
  contaToken: boolean,
): Promise<AperturaStream> {
  const ctrl = new AbortController();
  // L'abort copre anche la lettura del corpo, non solo la connessione: e'
  // proprio il caso "risponde 200 e poi non dice niente" che vogliamo tagliare.
  const sveglia = setTimeout(() => ctrl.abort(), TTFT_TIMEOUT_MS);
  try {
    const res = await fetch(p.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${p.chiave()}`,
      },
      body: JSON.stringify({
        model: p.model,
        messages,
        temperature: 0.4,
        max_tokens: 1500,
        stream: true,
        // Chiede al provider di chiudere lo stream con un chunk `usage`
        // (prompt_tokens/completion_tokens). Campo dell'API compatibile
        // OpenAI, supportato sia da Mistral sia da DeepSeek. Se un provider
        // dovesse rifiutarlo con un 400, apriStreamConRipiego() riprova subito
        // senza: contare i token non puo' far cadere la chat.
        ...(contaToken ? { stream_options: { include_usage: true } } : {}),
        ...(p.extra?.(projectId) ?? {}),
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      throw new ErroreProvider(
        `${p.nome} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`,
        res.status,
      );
    }
    const reader = res.body?.getReader();
    if (!reader) throw new ErroreProvider(`${p.nome}: stream non disponibile`);

    const decoder = new TextDecoder();
    let buffer = "";
    const primi: string[] = [];
    let uso: UsoToken | null = null;
    let finito = false;

    while (primi.length === 0 && !finito) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const righe = buffer.split("\n");
      buffer = righe.pop() ?? "";
      for (const riga of righe) {
        if (!riga.startsWith("data: ")) continue;
        const data = riga.slice(6);
        if (data === "[DONE]") { finito = true; continue; }
        try {
          const parsed = JSON.parse(data);
          const c = parsed.choices?.[0]?.delta?.content;
          if (c) primi.push(c);
          // Il chunk di usage ha `choices` vuoto, quindi non interferisce con
          // la scelta del provider: si limita a farsi registrare se passa di qui.
          const u = leggiUsage(parsed);
          if (u) uso = u;
        } catch {
          // chunk non parsabile: ignorato come nel ciclo principale
        }
      }
    }

    // 200 seguito da zero contenuto e' un guasto quanto un 500: se lo lasciassimo
    // passare l'ospite vedrebbe una risposta vuota invece del fallback.
    if (primi.length === 0) throw new ErroreProvider(`${p.nome}: nessun contenuto`);

    clearTimeout(sveglia);
    return { reader, decoder, buffer, primi, uso, contaToken };
  } catch (e) {
    clearTimeout(sveglia);
    ctrl.abort();
    throw e;
  }
}

/** apriStream + rete di sicurezza sul conteggio token.
 *
 *  ⚠️ Il perché di questa funzione, per chi la trovasse "un giro inutile".
 *  Il 2026-08-31 una modifica allo storico dei messaggi ha rotto la chat su
 *  tre hotel per ore: un campo del corpo che Mistral non accettava faceva
 *  rifiutare l'INTERA richiesta con HTTP 400, e siccome medium e small
 *  mandano lo stesso corpo, fallivano tutti e due — nessun ripiego, chat morta
 *  per tutta la conversazione. `stream_options` è esattamente un altro campo
 *  nuovo nello stesso corpo, aggiunto per una funzione ACCESSORIA (contare i
 *  soldi). Non deve poter ripetere quella storia.
 *
 *  Quindi: su un 400 — l'unico stato che significa "il corpo non mi piace" —
 *  si riprova UNA volta lo stesso provider senza `stream_options`. L'ospite
 *  riceve la sua risposta, e a perdersi è solo il conteggio dei token, che è
 *  il sacrificio giusto.
 *
 *  Il ritentativo è ristretto al 400 di proposito: su timeout, 5xx o errore di
 *  rete il provider è genuinamente giù e riprovarlo raddoppierebbe l'attesa
 *  prima del ripiego su mistral-small (6s → 12s), che l'ospite pagherebbe in
 *  schermo bianco. Lì si fallisce subito, come prima. */
async function apriStreamConRipiego(
  p: Provider,
  messages: Array<{ role: string; content: string }>,
  projectId: string,
): Promise<AperturaStream> {
  try {
    return await apriStream(p, messages, projectId, true);
  } catch (e) {
    if (e instanceof ErroreProvider && e.status === 400) {
      console.error(
        `[uso-token] ${p.nome} ha rifiutato la richiesta con 400: riprovo senza stream_options (i token di questo scambio non verranno contati)`,
        e.message,
      );
      return await apriStream(p, messages, projectId, false);
    }
    throw e;
  }
}

export async function POST(req: NextRequest) {
  // Primo istante utile dentro la route: da qui si contano sia l'attesa
  // percepita dall'ospite sia la durata totale. Date.now() e una sottrazione,
  // niente che possa lanciare.
  const t0 = Date.now();
  // Millisecondi fino al PRIMO carattere davvero uscito verso l'ospite.
  // Resta null finché non esce niente: null significa "non misurato", zero
  // significherebbe "istantaneo", e confonderli falserebbe ogni media.
  let ttft: number | null = null;
  // Provider che hanno fallito PRIMA di quello che ha risposto (o tutti,
  // se non ha risposto nessuno).
  const guasti: Guasto[] = [];
  // Dichiarati FUORI dal try: il catch fatale deve poter loggare lo scambio
  // (question/risposta parziale) anche quando l'errore scoppia a metà.
  let question = "";
  let answerAcc = "";
  // Quale provider ha davvero risposto: finishLog lo legge al momento della
  // chiamata, quindi vale anche se il fallback e' scattato dopo la sua creazione.
  let providerUsato = "nessuno";
  // Token dichiarati dal provider per QUESTO scambio. Resta null finché il
  // chunk `usage` non arriva (è l'ultimo dello stream), e null resta se non
  // arriva affatto: finishLog lo legge al momento della chiamata, quindi vale
  // anche per i rami che terminano prima della fine del ciclo.
  let usoToken: UsoToken | null = null;
  // Copia GREZZA del blocco `usage` come lo ha scritto il provider, popolata
  // solo con CONCIERGE_DEBUG=1. Serve a una cosa sola: poter confrontare, su
  // una preview, quello che il modello DICHIARA con quello che noi
  // REGISTRIAMO, senza doversi fidare della funzione che sta in mezzo.
  let usoGrezzo: unknown = null;
  let finishLog: ((answer: string, ok: string) => Promise<void>) | null = null;

  try {
    const ip = getClientIp(req);

    if (!isAllowedCaller(req)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Accept either a multi-turn `messages` history or a single `message` (back-compat).
    let history: ChatMsg[] = [];
    if (Array.isArray(body?.messages)) {
      history = body.messages
        .filter((m: unknown): m is ChatMsg =>
          !!m &&
          typeof (m as ChatMsg).content === "string" &&
          ((m as ChatMsg).role === "user" || (m as ChatMsg).role === "assistant"),
        )
        .slice(-10);
    } else if (typeof body?.message === "string") {
      history = [{ role: "user", content: body.message }];
    }

    if (history.length === 0) {
      return NextResponse.json({ error: "Messaggio non valido" }, { status: 400 });
    }

    if (history[history.length - 1].content.length > 1000) {
      return NextResponse.json({ error: "Messaggio troppo lungo" }, { status: 400 });
    }
    history = history.map((m) => ({ ...m, content: m.content.slice(0, 1000) }));

    // I bottoni WhatsApp generati nei turni precedenti NON tornano al modello.
    // Il client rimanda tutta la conversazione, link inclusi: lasciandoglieli
    // vedere il modello li ricopia accanto al marcatore nuovo (due bottoni
    // gemelli, visto in browser il 2026-08-31) o peggio ripropone un link
    // VECCHIO, con dentro la camera o la richiesta di prima. Il link lo
    // costruisce il server dal marcatore, quindi nello storico non serve.
    history = history.map((m) => {
      if (m.role !== "assistant") return m;
      const ripulito = rimuoviLinkWa(m.content);
      // ⚠️ GUASTO IN PRODUZIONE 2026-08-31, 3 conversazioni rotte sul Grand Hotel.
      // Quando la risposta del concierge conteneva SOLO il bottone WhatsApp, qui
      // restava una stringa vuota — e Mistral rifiuta l'INTERA richiesta con
      //   HTTP 400 "Assistant message must have either content or tool_calls".
      // Fallivano cosi' sia mistral-medium sia il ripiego mistral-small (stesso
      // corpo, stesso errore), quindi `prov=nessuno` e la chat restava rotta per
      // tutto il resto della conversazione, non per un messaggio solo.
      // Si rimpiazza invece di togliere il messaggio: eliminarlo lascerebbe due
      // turni utente di fila, che e' un secondo modo di far arrabbiare l'API.
      return { ...m, content: ripulito || "…" };
    });

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    if (catenaProvider().length === 0) {
      return NextResponse.json({ error: "API key non configurata" }, { status: 500 });
    }

    const lastUserMsg = [...history].reverse().find((m) => m.role === "user");
    question = lastUserMsg ? lastUserMsg.content : "";

    // Recupero fonti (v2, embeddings) e KB verificata partono IN PARALLELO,
    // non in serie: kbPromise è passata dentro opts.kbItems e recuperaFonti
    // la attende internamente, ma la fetch verso l'endpoint KB è già in volo
    // da subito. Mai un throw da questo blocco: recuperaFonti degrada da sola
    // a "tutti i frammenti" su qualunque errore (vedi conciergeIndex.ts), e
    // getVerifiedAnswers() non lancia mai (vedi conciergeKb.ts).
    const indice = getIndice(SYSTEM_PROMPT_BASE, MENUS, TRAILING);
    const domandaQuery = ultimiMessaggiUtente(history, 2);
    const kbPromise = getVerifiedAnswers();
    const fontiPromise = recuperaFonti(domandaQuery, indice, { kbItems: kbPromise });
    const [, fonti] = await Promise.all([kbPromise, fontiPromise]);
    const degradato = fonti.degradato;
    if (process.env.CONCIERGE_DEBUG === "1") {
      // Solo in preview: quali frammenti ha scelto il recupero e con che
      // similarità. È il dato che serve per distinguere "recupero sbagliato"
      // da "modello reticente" quando una risposta nota viene negata.
      console.log(`[concierge-debug] q="${domandaQuery.slice(0, 80)}" -> ${fonti.scelti.join(" | ")}`);
    }

    // Il log si ATTENDE prima di chiudere lo stream. Verificato sul campo
    // (preview Vercel, 2026-08-06): con after() di Next la POST non parte
    // mai su una risposta streaming — la funzione viene congelata alla
    // chiusura dello stream e il lavoro differito si perde in SILENZIO.
    // Costo reale di questa scelta: ~100-300ms in cui l'indicatore "sto
    // scrivendo" resta acceso DOPO che il testo è già tutto a schermo (il
    // client chiude su close(), non su [DONE]). Impercettibile, e in cambio
    // il log è deterministico. finishLog è one-shot: ogni ramo terminale lo
    // chiama, il primo vince.
    finishLog = (answer: string, ok: string) => {
      finishLog = null; // one-shot: i chiamanti usano finishLog?.()
      // I tempi si leggono ADESSO, non alla creazione della chiusura: `tot` è
      // la durata fino a questo preciso momento, che è l'ultimo istante utile
      // prima che lo stream si chiuda.
      return logExchange(
        req, question, answer, ok, providerUsato, degradato, usoToken,
        { ttft, tot: Date.now() - t0 },
        guasti,
      );
    };

    const regolaMenu = estraiRegolaMenu(TRAILING);

    // Ponte WhatsApp verso la Reception (2026-08-31). Null quando
    // RECEPTION_WHATSAPP non è configurata — oggi: solo il Grand Hotel ce
    // l'ha. In quel caso il blocco non entra nel prompt e il trasformatore
    // sotto è un passante: comportamento identico a prima, senza rami
    // condizionali sparsi. Vedi conciergeWhatsapp.ts.
    const whatsappReception = numeroWhatsappReception();
    // Nome della struttura nel messaggio precompilato: serve solo dove due
    // hotel condividono lo stesso numero di Reception (Titano e Suites).
    const strutturaWhatsapp = strutturaWhatsappReception();

    const messages = [
      // Prompt di comportamento (v2): sostituisce sia il vecchio preambolo di
      // SYSTEM_PROMPT_BASE sia GUARDIA_FINALE. Corto apposta, e con la regola
      // MENÙ per-hotel iniettata verbatim dal TRAILING — vedi
      // conciergeBehavior.ts per il perché.
      { role: "system", content: buildBehaviorPrompt({ hotel: HOTEL.name, telefonoReception: HOTEL.phone, regolaMenu, whatsappReception, strutturaWhatsapp }) },
      // Blocco FONTI: subito dopo il prompt di comportamento, PRIMA della
      // storia. Misurato il 2026-08-27/28: con le fonti in coda alla storia
      // (ordine precedente) l'aderenza linguistica scendeva (12/15 contro
      // 15/15) perché la massa di testo italiano finiva accanto alla domanda
      // dell'ospite; inoltre al turno 2 la storia salvata conteneva risposte
      // generate con frammenti diversi da quelli allegati in QUESTO turno,
      // ed averle adiacenti confondeva il modello su quali fossero validi.
      // Vedi conciergeIndex.ts per come si compone.
      { role: "system", content: fonti.testo },
      ...history,
      // Guardia aggiunta SOLO quando il recupero fonti è degradato (tutti i
      // frammenti allegati, ~32KB indifferenziati invece di ~8KB mirati):
      // penultima posizione, subito prima del promemoria lingua — è la
      // posizione misurata che regge quando la massa di contesto è grande.
      // Vedi conciergeBehavior.ts (GUARDIA_DEGRADO) per il perché non è un
      // semplice ripristino del comportamento pre-v2.
      ...(degradato ? [{ role: "system", content: GUARDIA_DEGRADO }] : []),
      // Il promemoria lingua va DOPO la storia E dopo le fonti, mai dentro un
      // prompt statico: è per-turno (non deve finire nello storico salvato
      // dal client) e la sua posizione in coda ai messages è ciò che lo rende
      // efficace — verificato che un rinforzo identico messo altrove (per
      // quanto in cima o ripetuto) non basta: ~20% di aderenza contro il
      // 100% misurato con questo stesso testo in coda ai messages.
      // Verificato il 2026-08-27 che Mistral accetta questo system finale
      // esattamente come DeepSeek: nessun errore, 90 scambi su 90 in lingua.
      // ORDINE NON CASUALE, INVARIATO dal v1: DEVE restare l'ULTIMO elemento
      // dell'array, ANCHE quando la guardia di degrado sopra è presente.
      // Provato l'ordine opposto il 2026-08-27 e misurato: spostandolo via
      // dall'ultima posizione l'aderenza linguistica scendeva (14/15, un
      // tedesco tornato in italiano) perché il promemoria perdeva la
      // posizione finale da cui deriva tutta la sua efficacia.
      { role: "system", content: promemoriaLingua(question) },
    ];

    // Si scorre la catena finché un provider non produce il primo token.
    const projectId = projectIdDi(req);
    let apertura: AperturaStream | null = null;
    for (const p of catenaProvider()) {
      try {
        apertura = await apriStreamConRipiego(p, messages, projectId);
        providerUsato = p.nome;
        // Un usage arrivato gia' in apertura (risposta cortissima) non deve
        // perdersi: il ciclo principale non rilegge quelle righe.
        usoToken = apertura.uso;
        break;
      } catch (e) {
        // Un provider che non parte non è fatale: si prova il successivo. Il
        // log resta visibile nei log della funzione, e `prov` nell'analytics
        // dice quale ha risposto davvero.
        console.error(`Provider ${p.nome} non disponibile:`, e);
        // Registrato anche nell'analytics, col motivo: è l'unico modo per
        // sapere se il primario cede per lentezza (timeout) o per guasto
        // (http), che è la differenza fra "alza la soglia" e "cambia modello".
        // motivoDi() non lancia mai; il push su un array locale nemmeno.
        guasti.push({ m: p.nome, r: motivoDi(e) });
      }
    }

    if (!apertura) {
      await finishLog?.("", "upstream_error");
      return NextResponse.json({ error: "Errore del servizio" }, { status: 502 });
    }

    const { reader, decoder, primi, contaToken } = apertura;
    let buffer = apertura.buffer;

    const encoder = new TextEncoder();

    // Ogni carattere diretto all'ospite passa di qui: il trasformatore
    // converte il marcatore [[WA: …]] nel link Markdown che la chat rende come
    // bottone, e trattiene sul confine fra due chunk la coda che potrebbe
    // essere l'inizio di un marcatore. Senza questo passaggio il marcatore
    // grezzo comparirebbe a schermo ogni volta che lo streaming lo taglia in
    // mezzo: raro quanto basta per non vedersi in prova, e garantito in
    // produzione. `answerAcc` accumula la versione per il LOG, in cui il
    // bottone è ridotto alla sua etichetta senza URL — vedi conciergeWhatsapp.ts.
    // Al trasformatore serve anche ciò che l'ospite ha scritto: è così che
    // riconosce un numero di camera inventato dal modello e scarta il bottone
    // invece di mandare la richiesta alla porta sbagliata.
    const wa = creaTrasformatoreWa(whatsappReception, ultimiMessaggiUtente(history, 10));
    const emetti = (controller: ReadableStreamDefaultController, pezzo: string) => {
      const { out, log } = wa.push(pezzo);
      answerAcc += log;
      if (out) {
        // Il cronometro dell'attesa si ferma qui e non prima: `pezzo` può
        // essere trattenuto dal trasformatore WhatsApp (marcatore a cavallo di
        // due chunk), e in quel caso l'ospite non ha ancora visto NIENTE.
        // Fermarlo all'arrivo del token dal modello darebbe un numero più
        // bello e sbagliato.
        if (ttft === null) ttft = Date.now() - t0;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: out })}\n\n`));
      }
    };
    const chiudiWa = (controller: ReadableStreamDefaultController) => {
      const { out, log } = wa.flush();
      answerAcc += log;
      if (out) {
        // Anche questa è una via da cui può uscire il PRIMO carattere: una
        // risposta cortissima può restare tutta nel trasformatore fino al
        // flush. Senza questa riga quello scambio risulterebbe "mai risposto".
        if (ttft === null) ttft = Date.now() - t0;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: out })}\n\n`));
      }
    };

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // I token già consumati da apriStream() per scegliere il provider:
          // vanno emessi per primi, altrimenti l'inizio della risposta sparisce.
          if (process.env.CONCIERGE_DEBUG === "1") {
            // Solo preview: i frammenti scelti viaggiano nello stream come
            // evento a sé. Il client legge solo `content`/`error` e lo ignora;
            // il banco di prova lo registra. Sostituisce i log runtime, che
            // per le preview non risultano consultabili.
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ debug: fonti.scelti })}\n\n`));
          }
          for (const c of primi) {
            emetti(controller, c);
          }
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            // Process complete SSE lines
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  // Flush PRIMA del [DONE]: il trasformatore può ancora
                  // trattenere una coda ambigua, e quel pezzetto deve uscire
                  // mentre lo stream è aperto. flush() è idempotente, quindi
                  // la chiamata gemella dopo il ciclo non fa danni.
                  chiudiWa(controller);
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    emetti(controller, content); // accumula per il log e converte il marcatore
                  }
                  // Consumo di token: ULTIMO chunk dello stream, `choices`
                  // vuoto e `usage` valorizzato. Non viene emesso verso
                  // l'ospite — è contabilità, non testo. leggiUsage() non
                  // lancia mai per costruzione: se il blocco è assente,
                  // malformato o incomprensibile ritorna null, si resta senza
                  // misura e la risposta prosegue identica a prima.
                  const u = leggiUsage(parsed);
                  if (u) {
                    usoToken = u;
                    if (process.env.CONCIERGE_DEBUG === "1") usoGrezzo = parsed.usage;
                  }
                } catch {
                  // skip unparseable chunks
                }
              }
            }
          }
          chiudiWa(controller);
          // Risposta finita a ZERO caratteri visibili. Succede quando il
          // modello scrive SOLO il marcatore e il marcatore viene scartato
          // (numero di camera non attendibile): resta una nuvoletta vuota in
          // chat, che per l'ospite e' un guasto muto. Raro — 0 su 12 turni in
          // riproduzione — ma la via esiste, e una risposta vuota qui e' anche
          // il messaggio vuoto che al turno dopo farebbe rifiutare la
          // richiesta dall'API (vedi il guasto delle 13:05 del 2026-08-31,
          // curato con `ripulito || "…"` piu' sopra: quello e' il rimedio a
          // valle, questo e' il rimedio a monte). Meglio la frase che manda in
          // Reception: e' esattamente la via che l'ospite deve prendere.
          if (answerAcc.trim() === "") {
            console.error("[whatsapp] risposta vuota dopo il filtro del marcatore: uso il fallback");
            answerAcc = FALLBACK_STREAM_ERROR;
            // Anche il ripiego è testo che l'ospite legge: l'attesa l'ha
            // vissuta comunque, e va contata.
            if (ttft === null) ttft = Date.now() - t0;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: FALLBACK_STREAM_ERROR })}\n\n`),
            );
          }
          if (process.env.CONCIERGE_DEBUG === "1") {
            // Solo preview: i token dichiarati dal provider viaggiano nello
            // stream come evento a sé, esattamente come i frammenti scelti.
            // È così che si verifica che il numero REGISTRATO nell'analytics
            // coincida con quello DICHIARATO dal modello, invece di doversi
            // fidare. Il client legge solo `content`/`error` e lo ignora.
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ uso: usoToken, usoGrezzo, prov: providerUsato, conta: contaToken, ttft, tot: Date.now() - t0, guasti })}\n\n`,
              ),
            );
          }
          await finishLog?.(answerAcc, "ok");
          controller.close();
        } catch (e) {
          console.error("Stream error:", e);
          // Anche qui: quel che resta nel buffer va emesso, tranne un
          // marcatore rimasto aperto, che flush() scarta invece di mostrare.
          try { chiudiWa(controller); } catch { /* controller già chiuso */ }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: FALLBACK_STREAM_ERROR })}\n\n`,
            ),
          );
          await finishLog?.(answerAcc, "stream_error");
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    await finishLog?.(answerAcc, "fatal");
    // Il client legge SOLO lo stream SSE (mai il body JSON diretto): rispondere qui con
    // NextResponse.json lascerebbe l'utente senza alcun messaggio. Emettiamo quindi lo
    // stesso formato SSE del ramo di streaming (già gestito dal client, vedi c.error).
    const encoder = new TextEncoder();
    const fatalStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: FALLBACK_FATAL_ERROR })}\n\n`),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(fatalStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }
}
