"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Phone, ChevronLeft } from "lucide-react";
import { HOTEL } from "@/lib/hotel";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS_IT = [
  "A che ora è la colazione?",
  "Come funziona il Wi-Fi?",
  "La palestra è inclusa?",
  "Come arrivo al centro storico?",
];

const SUGGESTIONS_EN = [
  "What time is breakfast?",
  "How does the Wi-Fi work?",
  "Is the gym included?",
  "How do I get to the historic center?",
];

export default function ChatAssistant({ lang }: { lang: "it" | "en" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const suggestions = lang === "it" ? SUGGESTIONS_IT : SUGGESTIONS_EN;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      const reply = data.reply ?? "Mi scusi, può contattare la Reception.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Per questa informazione La invito a contattare la Reception al tasto 9." },
      ]);
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

  return (
    <>
      {/* FAB — nascosto quando la chat è aperta */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={lang === "it" ? "Assistente chat" : "Chat assistant"}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-lg transition-all duration-200 ease-out active:scale-95 lg:bottom-6"
        >
          <MessageCircle size={22} strokeWidth={1.75} />
        </button>
      )}

      {/* Chat fullscreen panel — sopra tutto, safe area iPhone 17 Pro */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] lg:inset-auto lg:bottom-20 lg:right-4 lg:w-96 lg:max-h-[34rem] lg:rounded-2xl lg:border lg:border-[var(--color-border)] lg:shadow-2xl">
          {/* Header — dynamic island safe area */}
          <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] -ml-1"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {lang === "it" ? "Assistente" : "Assistant"}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">Grand Hotel San Marino</p>
            </div>
            <a
              href={HOTEL.phoneHref}
              className="flex shrink-0 h-9 items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 text-xs font-semibold text-[var(--color-on-accent)]"
            >
              <Phone size={14} strokeWidth={1.75} />
              <span className="hidden sm:inline">{lang === "it" ? "Reception" : "Reception"}</span>
            </a>
          </div>

          {/* Messages — scroll interno */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {lang === "it"
                    ? "👋 Buongiorno! Sono l'assistente del Grand Hotel. Come posso aiutarla?"
                    : "👋 Hello! I'm the Grand Hotel assistant. How can I help you?"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]"
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
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                      : "bg-[var(--color-surface)] text-[var(--color-text)]"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input — home indicator safe area */}
          <div className="shrink-0 border-t border-[var(--color-border)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={lang === "it" ? "Scrivi un messaggio..." : "Type a message..."}
                className="flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
                autoFocus
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] transition-opacity disabled:opacity-40"
              >
                <Send size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
