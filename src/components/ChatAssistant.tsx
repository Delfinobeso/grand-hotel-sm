"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, Phone, ChevronLeft, ConciergeBell } from "lucide-react";
import { HOTEL } from "@/lib/hotel";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS_IT = [
  "A che ora è la colazione?",
  "Come mi connetto al Wi-Fi?",
  "Che canali ci sono in TV?",
  "Come arrivo al centro storico?",
];

const SUGGESTIONS_EN = [
  "What time is breakfast?",
  "How do I connect to Wi-Fi?",
  "What TV channels are available?",
  "How do I get to the historic center?",
];

/**
 * Tracks visualViewport.height — shrinks when the on-screen keyboard appears.
 * Initialized to window.innerHeight so the panel is full-screen on first render
 * without waiting for the effect to fire.
 */
function useVVHeight() {
  const [h, setH] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 0,
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const sync = () => setH(vv.height);
    sync();
    vv.addEventListener("resize", sync);
    return () => vv.removeEventListener("resize", sync);
  }, []);
  return h;
}

const PANEL_SPRING = { type: "spring", stiffness: 340, damping: 30 } as const;
const MSG_SPRING   = { type: "spring", stiffness: 400, damping: 32 } as const;

export default function ChatAssistant({
  lang,
  open,
  onOpenChange,
}: {
  lang: "it" | "en";
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const vvHeight  = useVVHeight();

  // Delay focus so keyboard appears after panel animation, not during it.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestions = lang === "it" ? SUGGESTIONS_IT : SUGGESTIONS_EN;

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: text.trim() };
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
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", text: "Per questa informazione La invito a contattare la Reception al tasto 9." },
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

  // ── Shared panel content ────────────────────────────────────────────────────
  const panelInner = (
    <>
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <button
          onClick={() => onOpenChange(false)}
          className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
              <ConciergeBell size={16} strokeWidth={1.75} className="text-[var(--color-accent)]" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-[var(--color-bg)] bg-emerald-500" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-[var(--color-text)]">
              {lang === "it" ? "Concierge digitale" : "Digital Concierge"}
            </p>
            <p className="text-[10px] font-medium text-emerald-500">
              {lang === "it" ? "Disponibile ora" : "Available now"}
            </p>
          </div>
        </div>

        <a
          href={HOTEL.phoneHref}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3 text-xs font-semibold text-[var(--color-on-accent)] transition-opacity hover:opacity-90"
        >
          <Phone size={14} strokeWidth={1.75} />
          <span className="hidden sm:inline">Reception</span>
        </a>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        style={{ touchAction: "pan-y" }}
      >
        {messages.length === 0 && (
          <div className="space-y-4">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.3 }}
              className="text-sm leading-relaxed text-[var(--color-text-secondary)]"
            >
              {lang === "it"
                ? "Buongiorno! Sono il suo Concierge digitale. Come posso aiutarla?"
                : "Good day! I'm your digital Concierge. How may I assist you?"}
            </motion.p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.14 + i * 0.07, type: "spring", stiffness: 340, damping: 26 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => send(s)}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-muted)]"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: m.role === "user" ? 16 : -16, y: 6 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={MSG_SPRING}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-2xl rounded-br-sm bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                      : "rounded-2xl rounded-bl-sm bg-[var(--color-surface)] text-[var(--color-text)]"
                  }`}
                >
                  {m.text}
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, x: -12, y: 6 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={MSG_SPRING}
                className="flex justify-start"
              >
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[var(--color-surface)] px-4 py-3.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)]"
                      animate={{ opacity: [0.35, 1, 0.35], scale: [0.75, 1.2, 0.75] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-[var(--color-border)] px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 350);
            }}
            placeholder={lang === "it" ? "Scrivi un messaggio..." : "Type a message..."}
            className="flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-accent)]"
          />
          <motion.button
            whileTap={{ scale: 0.82, rotate: 12 }}
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] transition-opacity disabled:opacity-35"
          >
            <Send size={16} strokeWidth={1.75} />
          </motion.button>
        </div>
        <p className="mt-1.5 text-center text-[9px] tracking-wide text-[var(--color-text-muted)] opacity-50">
          powered by <span className="font-semibold tracking-wider">Blasat</span>
        </p>
      </div>
    </>
  );
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── FAB ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            onClick={() => onOpenChange(true)}
            aria-label={lang === "it" ? "Apri Concierge" : "Open Concierge"}
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-lg lg:bottom-6"
          >
            <MessageCircle size={22} strokeWidth={1.75} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── SCRIM (mobile only) ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => onOpenChange(false)}
          />
        )}
      </AnimatePresence>

      {/* ── MOBILE PANEL ──────────────────────────────────────────────────────
          Shell: fixed inset-0 with bg color — always covers the full screen so
          no page content ever bleeds through, even between panel bottom and keyboard.
          motion.div height = vvHeight (visualViewport.height), which is keyboard-aware:
          it starts at window.innerHeight and shrinks when the keyboard appears.
          Using explicit px height avoids any CSS percentage/padding-box ambiguity. */}
      <AnimatePresence>
        {open && (
          <div
            key="mobile-shell"
            className="fixed inset-0 z-50 bg-[var(--color-bg)] lg:hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 28 }}
              transition={PANEL_SPRING}
              className="flex flex-col bg-[var(--color-bg)]"
              style={{ height: vvHeight || "100%" }}
            >
              {panelInner}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DESKTOP PANEL ─────────────────────────────────────────────────────
          Floating widget, completely separate from mobile so no shared CSS
          breakpoint tricks can interfere with the mobile keyboard handling. */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="desktop-panel"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={PANEL_SPRING}
            className="fixed bottom-20 right-4 z-50 hidden max-h-[34rem] w-96 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl lg:flex"
          >
            {panelInner}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
