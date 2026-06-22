"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Phone, X } from "lucide-react";
import { HOTEL } from "@/lib/hotel";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const COPY = {
  it: {
    title: "Concierge",
    fab: "Apri il Concierge",
    greeting: "Buongiorno. Sono il Concierge digitale del Grand Hotel. Come posso aiutarla?",
    placeholder: "Scrivi un messaggio…",
    reception: "Reception",
    error: "Per questa informazione La invito a contattare la Reception al tasto 9.",
    suggestions: [
      "A che ora è la colazione?",
      "Come funziona il Wi-Fi?",
      "Dov'è la palestra?",
      "Come arrivo al centro storico?",
    ],
  },
  en: {
    title: "Concierge",
    fab: "Open the Concierge",
    greeting: "Hello. I'm the Grand Hotel digital Concierge. How may I help you?",
    placeholder: "Type a message…",
    reception: "Reception",
    error: "For this information, please contact Reception by dialling 9.",
    suggestions: [
      "What time is breakfast?",
      "How does the Wi-Fi work?",
      "Where is the gym?",
      "How do I reach the old town?",
    ],
  },
};

/** Pin the panel to the real visualViewport (not the layout viewport) for the iOS keyboard. */
function useVisualViewport() {
  const [rect, setRect] = useState({ top: 0, height: 0 });
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const sync = () => setRect({ top: vv.offsetTop, height: vv.height });
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);
  return rect;
}

export default function ChatAssistant({
  lang,
  open,
  onOpenChange,
}: {
  lang: "it" | "en";
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const c = COPY[lang];
  const setOpen = onOpenChange;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const vv = useVisualViewport();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply ?? c.error }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: c.error }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const panelStyle: React.CSSProperties = vv.height
    ? { position: "fixed", top: vv.top, left: 0, right: 0, height: vv.height, zIndex: 50 }
    : {};

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={c.fab}
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[0_8px_24px_oklch(0.2_0.04_258/0.35)] transition-transform duration-200 ease-out hover:scale-105 active:scale-95 lg:bottom-6"
          style={{ transitionTimingFunction: "var(--ease-spring)" }}
        >
          <Sparkles size={22} strokeWidth={1.75} />
        </button>
      )}

      {/* Scrim */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      {open && (
        <div
          className="flex flex-col bg-[var(--color-bg)] lg:fixed lg:inset-auto lg:bottom-6 lg:right-4 lg:z-50 lg:h-[34rem] lg:w-96 lg:rounded-3xl lg:border lg:border-[var(--color-border)] lg:shadow-2xl"
          style={panelStyle}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] px-4 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5 lg:rounded-t-3xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)]">
              <Sparkles size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.95rem] font-semibold leading-tight text-[var(--color-text)]">{c.title}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Grand Hotel San Marino</p>
            </div>
            <a
              href={HOTEL.phoneHref}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)]"
            >
              <Phone size={14} strokeWidth={2} />
              <span className="hidden sm:inline">{c.reception}</span>
            </a>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)]"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" style={{ WebkitOverflowScrolling: "touch" }}>
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-[var(--color-surface)] px-3.5 py-2.5 text-[0.95rem] leading-relaxed text-[var(--color-text)]">
                  {c.greeting}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[0.8125rem] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line px-3.5 py-2.5 text-[0.95rem] leading-relaxed ${
                    m.role === "user"
                      ? "rounded-2xl rounded-tr-md bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                      : "rounded-2xl rounded-tl-md bg-[var(--color-surface)] text-[var(--color-text)]"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-tl-md bg-[var(--color-surface)] px-4 py-3.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)]"
                      style={{ animation: `typing-bounce 1.2s ${i * 0.18}s infinite var(--ease-out)` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-[var(--color-border)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:rounded-b-3xl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 350)}
                placeholder={c.placeholder}
                className="h-11 flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[0.95rem] text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
                autoFocus
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] transition-opacity disabled:opacity-40"
              >
                <Send size={17} strokeWidth={1.875} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
