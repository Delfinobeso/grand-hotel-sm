"use client";

import { useState, type FormEvent } from "react";
import { Bug, Lightbulb, Send, Check, AlertTriangle } from "lucide-react";

type SubmissionType = "bug" | "feature";

const LABELS: Record<SubmissionType, { icon: typeof Bug; title: string; desc: string }> = {
  bug: {
    icon: Bug,
    title: "Bug",
    desc: "Qualcosa non funziona come dovrebbe",
  },
  feature: {
    icon: Lightbulb,
    title: "Feature",
    desc: "Un'idea per migliorare l'app",
  },
};

export default function FeedbackPage() {
  const [type, setType] = useState<SubmissionType>("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [where, setWhere] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title: title.trim(), description: description.trim(), where: where.trim() }),
      });
      if (!res.ok) throw new Error("Invio fallito");
      setStatus("success");
      setTitle("");
      setDescription("");
      setWhere("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Riprova tra qualche minuto");
    }
  }

  const ActiveIcon = LABELS[type].icon;

  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
        padding: "max(24px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom))",
        maxWidth: "480px",
        margin: "0 auto",
        gap: "28px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--color-text)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Segnala o proponi
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
          Aiutaci a migliorare l&apos;app. Ogni segnalazione arriva direttamente al team.
        </p>
      </div>

      {/* Success state */}
      {status === "success" ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "16px",
            padding: "48px 16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "var(--color-success-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={26} strokeWidth={2.5} color="var(--color-success)" />
          </div>
          <div>
            <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text)", margin: "0 0 4px" }}>
              Ricevuto, grazie
            </p>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Abbiamo preso in carico la tua segnalazione.
            </p>
          </div>
          <button
            onClick={() => setStatus("idle")}
            style={{
              marginTop: "8px",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--color-accent)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: "10px",
              transition: "background 150ms var(--ease-out)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-accent-soft)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            Invia un&apos;altra segnalazione
          </button>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Type selector — segmented control */}
          <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
            <legend
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Tipo
            </legend>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0",
                backgroundColor: "var(--color-surface-muted)",
                borderRadius: "12px",
                padding: "3px",
              }}
            >
              {(Object.keys(LABELS) as SubmissionType[]).map((t) => {
                const L = LABELS[t];
                const Icon = L.icon;
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      padding: "14px 8px",
                      borderRadius: "10px",
                      border: "none",
                      background: active ? "var(--color-surface)" : "transparent",
                      boxShadow: active ? "0 1px 3px oklch(0 0 0 / 0.06)" : "none",
                      cursor: "pointer",
                      transition: "background 150ms var(--ease-out), box-shadow 150ms var(--ease-out)",
                      color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
                    }}
                  >
                    <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                    <span style={{ fontSize: "13px", fontWeight: active ? 700 : 500 }}>
                      {L.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Title */}
          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {type === "bug" ? "Cosa non funziona?" : "Come si chiama l'idea?"}
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={type === "bug" ? "Es. La mappa non si apre su iPhone" : "Es. Prenotazione spa online"}
              style={{
                fontSize: "15px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
                outline: "none",
                transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)",
                fontFamily: "var(--font-sans)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--color-accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--color-accent-soft)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--color-border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>

          {/* Description */}
          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Descrivi meglio
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder={
                type === "bug"
                  ? "Cosa stavi facendo? Cosa ti aspettavi? Cosa è successo invece?"
                  : "Come funzionerebbe? Perché sarebbe utile?"
              }
              style={{
                fontSize: "15px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
                outline: "none",
                resize: "vertical",
                minHeight: "100px",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.5,
                transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--color-accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--color-accent-soft)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--color-border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>

          {/* Where */}
          <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Dove nell&apos;app
              <span style={{ fontWeight: 400, textTransform: "none", color: "var(--color-text-muted)", marginLeft: "4px" }}>
                (opzionale)
              </span>
            </span>
            <input
              type="text"
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              placeholder="Es. Sezione Ristorante, tab Benessere…"
              style={{
                fontSize: "15px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
                outline: "none",
                fontFamily: "var(--font-sans)",
                transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--color-accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--color-accent-soft)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--color-border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </label>

          {/* Error */}
          {status === "error" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 14px",
                borderRadius: "10px",
                backgroundColor: "var(--color-danger-soft)",
                color: "var(--color-danger)",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              <AlertTriangle size={16} strokeWidth={2} />
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "sending" || !title.trim() || !description.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-on-accent)",
              fontSize: "15px",
              fontWeight: 700,
              cursor: status === "sending" ? "wait" : "pointer",
              opacity: status === "sending" || !title.trim() || !description.trim() ? 0.5 : 1,
              transition: "opacity 150ms var(--ease-out), transform 100ms var(--ease-out)",
              fontFamily: "var(--font-sans)",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {status === "sending" ? (
              <>Invio in corso…</>
            ) : (
              <>
                <Send size={16} strokeWidth={2.5} />
                Invia segnalazione
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
