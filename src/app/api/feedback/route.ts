import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "136111777";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, title, description, where } = body;

    if (!title || !description || !["bug", "feature"].includes(type)) {
      return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
    }

    const label = type === "bug" ? "Bug" : "Feature";
    const badge = type === "bug" ? "🔴 Bug" : "🟡 Feature";

    const text = [
      `${badge} — <b>${label} su Grand Hotel SM</b>`,
      "",
      `<b>${title.replace(/[<>]/g, "")}</b>`,
      "",
      description.replace(/[<>]/g, ""),
      where ? `\n📍 <i>${where.replace(/[<>]/g, "")}</i>` : "",
      "",
      `<i>Inviato dall'app feedback clienti</i>`,
    ].join("\n");

    if (TELEGRAM_BOT_TOKEN) {
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Feedback API error:", err);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
