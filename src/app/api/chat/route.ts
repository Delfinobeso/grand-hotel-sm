import { NextRequest, NextResponse } from "next/server";
import { MENUS } from "@/lib/menus";
import { checkRateLimit } from "@/lib/rateLimit";
import { SYSTEM_PROMPT_BASE, TRAILING, FALLBACK_STREAM_ERROR, FALLBACK_FATAL_ERROR } from "@/lib/concierge";

function buildSystemPrompt(): string {
  return SYSTEM_PROMPT_BASE + "\n\n" + MENUS + "\n\n" + TRAILING;
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

/** Logga in modo anonimo la sola domanda dell'ospite (nessuna risposta, nessun IP).
 *  Fire-and-forget: non deve mai rallentare o far fallire la risposta della chat. */
function logQuestionAnonymously(req: NextRequest, question: string) {
  const host = req.headers.get("host") || "unknown";
  const projectId = PROJECT_ID_BY_HOST[host] || host;
  fetch("https://analytics.blasat.com/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project: projectId, event: "chatq", q: question.slice(0, 200) }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const origin = req.headers.get("origin");
    if (origin && !origin.endsWith(".blasat.com") && !origin.endsWith(".vercel.app")) {
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

    const systemPrompt = buildSystemPrompt();

    const lastUserMsg = [...history].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      logQuestionAnonymously(req, lastUserMsg.content);
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: systemPrompt }, ...history],
        temperature: 0.4,
        max_tokens: 500,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("DeepSeek API error:", err);
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
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch {
                  // skip unparseable chunks
                }
              }
            }
          }
          controller.close();
        } catch (e) {
          console.error("Stream error:", e);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: FALLBACK_STREAM_ERROR })}\n\n`,
            ),
          );
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
