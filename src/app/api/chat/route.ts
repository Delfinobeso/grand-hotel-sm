import { NextRequest, NextResponse } from "next/server";
import { MENUS } from "@/lib/menus";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { SYSTEM_PROMPT_BASE, TRAILING, FALLBACK_STREAM_ERROR, FALLBACK_FATAL_ERROR } from "@/lib/concierge";
import { getVerifiedAnswers, buildKbBlock, type KbItem } from "@/lib/conciergeKb";
import { promemoriaLingua } from "@/lib/languageDetect";

// Il blocco KB va IN CODA: la recency dà priorità reale alle risposte
// verificate e mette le regole di guardia anti-injection come ultima parola.
function buildSystemPrompt(kbItems: KbItem[]): string {
  return SYSTEM_PROMPT_BASE + "\n\n" + MENUS + "\n\n" + TRAILING + buildKbBlock(kbItems);
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
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

function logExchange(req: NextRequest, question: string, answer: string, ok: string, prov: string): Promise<void> {
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
  // questa chiave i ~11k token di system prompt si pagano pieni a ogni domanda.
  // La chiave e' per hotel: i tre prompt sono diversi, non devono condividere cache.
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

/** Presidio finale contro i due modi in cui il concierge fa danno:
 *  dichiarare di aver agito, e riempire un buco con un dato inventato.
 *
 *  ⚠️ Sta QUI, in coda ai messages, e non dentro il system prompt, per la
 *  stessa ragione del promemoria lingua: le regole 2, 3 e 4 del prompt gia'
 *  dicono "non inventare" e vengono ignorate lo stesso — dentro 35k caratteri
 *  un'istruzione ripetuta non regge, la posizione conta piu' del testo.
 *  Misurato il 2026-08-27 sul percorso di produzione: senza questo presidio
 *  Mistral inventava una tassa di soggiorno inesistente ("€2,00 a persona,
 *  dai 14 anni") e prometteva di avvisare la cucina di un'allergia alle
 *  arachidi; DeepSeek prometteva di far recapitare asciugamani in camera.
 *  Entrambi i modelli sbagliavano: e' un buco del prompt, non del fornitore.
 *
 *  Volutamente CORTO: un presidio lungo si diluisce come le regole di sopra. Tetto
 *  duro: due vincoli, mai di piu'. I fatti nuovi vanno nella scheda o nella KB, mai qui.
 *
 *  Due correzioni dopo l'audit del 2026-08-28:
 *  - NON cablare qui il canale di contatto. La prima versione diceva "tasto 9 dal
 *    telefono in camera": e' un fatto del solo Grand Hotel, ma questo file e' condiviso
 *    dai 3 hotel — su Titano e Titano Suites il canale e' +39 0549 991007. Un dato
 *    specifico in un file condiviso diventa un errore sugli altri due. Ora rimanda
 *    genericamente al canale "previsto dalla scheda", che ogni hotel ha per conto suo
 *    (e che per alcuni servizi non e' la Reception: il Centro Messegue' ha il tasto 471).
 *  - Vietate anche le affermazioni IMPERSONALI. La prima versione vietava solo i
 *    performativi in prima persona, quindi "the kitchen has been informed" passava:
 *    stessa bugia, stesso danno, verbo non vietato.
 *
 *  Terza correzione, 2026-08-28: il divieto di INVENTARE non copriva il DEDURRE.
 *  Misurato: a "sono allergico alla frutta a guscio, i cappellacci sono sicuri?" il
 *  modello leggeva gli ingredienti dal menu e rispondeva "non contengono frutta a
 *  guscio". Non inventava nulla — ragionava su dati veri e presentava l'inferenza come
 *  garanzia, su una domanda di sicurezza alimentare. E' rimasto dentro il vincolo 2
 *  invece di diventarne un terzo: il tetto di due vincoli e' esso stesso il presidio. */
const GUARDIA_FINALE =
  "Due vincoli assoluti, prima di rispondere.\n" +
  "1) NON PUOI COMPIERE AZIONI. Non invii oggetti, non avvisi il personale, non prenoti, " +
  "non trasmetti messaggi alla cucina o alla Reception. Non dire MAI di aver fatto, di fare " +
  "o che farai qualcosa (\"provvedo\", \"ho avvisato\", \"I will inform\", \"I'll have it sent\"), " +
  "NÉ che qualcosa sia già stato fatto, sia noto al personale o verrà fatto da altri " +
  "(\"è stato segnalato\", \"the kitchen has been informed\", \"they will bring them shortly\"). " +
  "Per ogni richiesta operativa indica il canale di contatto previsto dalla scheda qui sopra " +
  "per quel servizio, e di\' che va rivolta lì.\n" +
  "2) NON INVENTARE NÉ DEDURRE DATI. Se un prezzo, una tassa, un orario o un servizio non è " +
  "scritto sopra, dì apertamente che non risulta fra le informazioni disponibili e rimanda al " +
  "contatto della scheda. Meglio ammettere di non saperlo che dare un numero plausibile. " +
  "In particolare non giudicare MAI se un piatto sia adatto a un'allergia o intolleranza, " +
  "nemmeno leggendo gli ingredienti: di\' che va verificato col ristorante prima di ordinare.";

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

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    if (catenaProvider().length === 0) {
      return NextResponse.json({ error: "API key non configurata" }, { status: 500 });
    }

    // KB verificata: la fetch parte qui (si sovrappone al lavoro già fatto)
    // e si risolve da cache nella quasi totalità dei casi. Mai un throw.
    const kbItems = await getVerifiedAnswers();
    const systemPrompt = buildSystemPrompt(kbItems);

    const lastUserMsg = [...history].reverse().find((m) => m.role === "user");
    question = lastUserMsg ? lastUserMsg.content : "";

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
      return logExchange(req, question, answer, ok, providerUsato);
    };

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      // Il promemoria lingua va DOPO la storia, mai dentro systemPrompt: è
      // per-turno (non deve finire nello storico salvato dal client) e la
      // sua posizione in coda ai messages è ciò che lo rende efficace —
      // verificato che un rinforzo identico messo dentro il system prompt
      // (per quanto in cima o ripetuto) non basta: ~20% di aderenza contro
      // il 100% misurato con questo stesso testo in coda ai messages.
      // Verificato il 2026-08-27 che Mistral accetta questo system finale
      // esattamente come DeepSeek: nessun errore, 90 scambi su 90 in lingua.
      // ORDINE NON CASUALE: il presidio PRIMA, il promemoria lingua ULTIMO.
      // Provato l'ordine opposto il 2026-08-27 e misurato: mettendo il presidio
      // per ultimo l'aderenza linguistica scendeva (14/15, un tedesco tornato
      // in italiano) perche' il promemoria perdeva la posizione finale da cui
      // deriva tutta la sua efficacia. L'ultima riga letta dal modello deve
      // restare quella sulla lingua.
      { role: "system", content: GUARDIA_FINALE },
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
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // I token già consumati da apriStream() per scegliere il provider:
          // vanno emessi per primi, altrimenti l'inizio della risposta sparisce.
          for (const c of primi) {
            answerAcc += c;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: c })}\n\n`));
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
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    answerAcc += content; // accumulo per il log, stesso parse dell'enqueue
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch {
                  // skip unparseable chunks
                }
              }
            }
          }
          await finishLog?.(answerAcc, "ok");
          controller.close();
        } catch (e) {
          console.error("Stream error:", e);
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
