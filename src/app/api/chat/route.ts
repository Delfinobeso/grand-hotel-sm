import { NextRequest, NextResponse } from "next/server";
import { MENUS } from "@/lib/menus";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { SYSTEM_PROMPT_BASE, TRAILING, FALLBACK_STREAM_ERROR, FALLBACK_FATAL_ERROR } from "@/lib/concierge";
import { getVerifiedAnswers, buildKbBlock, type KbItem } from "@/lib/conciergeKb";

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
function logExchange(req: NextRequest, question: string, answer: string, ok: string): Promise<void> {
  const host = req.headers.get("host") || "unknown";
  const projectId = PROJECT_ID_BY_HOST[host] || host;
  return fetch("https://analytics.blasat.com/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project: projectId,
      event: "chatq",
      q: question.slice(0, 200),
      a: answer.slice(0, 700),
      ok,
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

export async function POST(req: NextRequest) {
  // Dichiarati FUORI dal try: il catch fatale deve poter loggare lo scambio
  // (question/risposta parziale) anche quando l'errore scoppia a metà.
  let question = "";
  let answerAcc = "";
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

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
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
      return logExchange(req, question, answer, ok);
    };

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [{ role: "system", content: systemPrompt }, ...history],
        temperature: 0.4,
        max_tokens: 1500,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("DeepSeek API error:", err);
      await finishLog?.("", "upstream_error");
      return NextResponse.json({ error: "Errore del servizio" }, { status: 502 });
    }

    // Stream SSE chunks back to the client
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "Stream non disponibile" }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        let buffer = "";
        try {
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
