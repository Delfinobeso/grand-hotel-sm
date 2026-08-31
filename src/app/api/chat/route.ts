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
      // Quale modello ha risposto: senza questo un fallback silenzioso su
      // DeepSeek sarebbe invisibile e non sapremmo mai che Mistral sta cedendo.
      prov,
      // Campo additivo (v2): il recupero fonti è degradato a "tutti i
      // frammenti" per un errore embeddings (timeout, chiave, rete). Serve a
      // distinguere "poco pertinente per scelta" da "poco pertinente perché
      // il recupero non ha funzionato". L'analytics lo ignora se non lo conosce.
      deg,
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
        ...(p.extra?.(projectId) ?? {}),
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      throw new Error(`${p.nome} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error(`${p.nome}: stream non disponibile`);

    const decoder = new TextDecoder();
    let buffer = "";
    const primi: string[] = [];
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
          const c = JSON.parse(data).choices?.[0]?.delta?.content;
          if (c) primi.push(c);
        } catch {
          // chunk non parsabile: ignorato come nel ciclo principale
        }
      }
    }

    // 200 seguito da zero contenuto e' un guasto quanto un 500: se lo lasciassimo
    // passare l'ospite vedrebbe una risposta vuota invece del fallback.
    if (primi.length === 0) throw new Error(`${p.nome}: nessun contenuto`);

    clearTimeout(sveglia);
    return { reader, decoder, buffer, primi };
  } catch (e) {
    clearTimeout(sveglia);
    ctrl.abort();
    throw e;
  }
}

export async function POST(req: NextRequest) {
  // Dichiarati FUORI dal try: il catch fatale deve poter loggare lo scambio
  // (question/risposta parziale) anche quando l'errore scoppia a metà.
  let question = "";
  let answerAcc = "";
  // Quale provider ha davvero risposto: finishLog lo legge al momento della
  // chiamata, quindi vale anche se il fallback e' scattato dopo la sua creazione.
  let providerUsato = "nessuno";
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
      return logExchange(req, question, answer, ok, providerUsato, degradato);
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
        apertura = await apriStream(p, messages, projectId);
        providerUsato = p.nome;
        break;
      } catch (e) {
        // Un provider che non parte non è fatale: si prova il successivo. Il
        // log resta visibile nei log della funzione, e `prov` nell'analytics
        // dice quale ha risposto davvero.
        console.error(`Provider ${p.nome} non disponibile:`, e);
      }
    }

    if (!apertura) {
      await finishLog?.("", "upstream_error");
      return NextResponse.json({ error: "Errore del servizio" }, { status: 502 });
    }

    const { reader, decoder, primi } = apertura;
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
      if (out) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: out })}\n\n`));
    };
    const chiudiWa = (controller: ReadableStreamDefaultController) => {
      const { out, log } = wa.flush();
      answerAcc += log;
      if (out) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: out })}\n\n`));
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
                } catch {
                  // skip unparseable chunks
                }
              }
            }
          }
          chiudiWa(controller);
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
