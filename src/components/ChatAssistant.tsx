"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { ConciergeBell, Send, Phone, X, MapPin, CalendarCheck, ExternalLink, type LucideIcon } from "lucide-react";
import { HOTEL } from "@/lib/hotel";

const EASE_IOS = [0.2, 0, 0, 1] as const;
const SHEET_IN: Transition = { duration: 0.42, ease: EASE_IOS };

/** Size the mobile panel to the visual viewport so the header stays fixed and the
 * keyboard pushes only the message area up (iOS-reliable; resizes-content is ignored in PWAs). */
function useVisualViewport() {
  const [rect, setRect] = useState<{ top: number; height: number } | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
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

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface ChatAction {
  label: string;
  url: string;
}

/** Pull Markdown links out of an assistant reply so they can render as buttons. */
function parseActions(text: string): { clean: string; actions: ChatAction[] } {
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|tel:[^\s)]+)\)/g;
  const actions: ChatAction[] = [];
  const clean = text
    .replace(re, (_m, label: string, url: string) => {
      actions.push({ label, url });
      return label;
    })
    .replace(/[ \t]+([.,;:])/g, "$1")
    .trim();
  return { clean, actions };
}

function actionIcon(url: string): LucideIcon {
  if (url.startsWith("tel:")) return Phone;
  if (url.includes("thefork")) return CalendarCheck;
  if (url.includes("maps")) return MapPin;
  return ExternalLink;
}

/** Convert basic markdown formatting to HTML for chat rendering.
 *  Handles **bold**, *italic*, and ~~strikethrough~~.
 *  Appends a pulsing cursor when streaming is true and there's content. */
function renderMarkdown(text: string, streaming?: boolean): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([\s\S]+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~([\s\S]+?)~~/g, "<del>$1</del>");
  if (streaming && text.length > 0) {
    html += ' <span class="streaming-cursor">▌</span>';
  }
  return html;
}

function ChatActions({ actions }: { actions: ChatAction[] }) {
  if (actions.length === 0) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {actions.map((a, i) => {
        const Icon = actionIcon(a.url);
        const external = a.url.startsWith("http");
        return (
          <a
            key={i}
            href={a.url}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3.5 py-2 text-[0.8125rem] font-semibold text-[var(--color-on-accent)] transition-opacity duration-200 hover:opacity-90 active:scale-[0.97]"
          >
            <Icon size={14} strokeWidth={2} />
            {a.label}
          </a>
        );
      })}
    </div>
  );
}

const COPY = {
  it: {
    title: "Concierge",
    fab: "Apri il Concierge",
    greeting: "Sono il Concierge digitale del Grand Hotel. Come posso aiutarla?",
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
    greeting: "I'm the Grand Hotel digital Concierge. How may I help you?",
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
  const [mobile, setMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef("");
  const releaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vv = useVisualViewport();

  // Clean up release timer on unmount
  useEffect(() => {
    return () => {
      if (releaseTimerRef.current) clearInterval(releaseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const u = () => setMobile(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Typewriter: release buffered characters at a steady, relaxed pace ──
  const RELEASE_MS = 28; // ~35 chars/sec — lazy, elegant

  const startRelease = useCallback(() => {
    if (releaseTimerRef.current) return;
    releaseTimerRef.current = setInterval(() => {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (!last || last.role !== "assistant") return prev;
        if (pendingRef.current.length === 0) {
          // Buffer empty but stream might still be running — keep timer alive
          return prev;
        }
        // Release one character at a time
        const ch = pendingRef.current[0];
        pendingRef.current = pendingRef.current.slice(1);
        copy[copy.length - 1] = { ...last, text: last.text + ch };
        return copy;
      });
    }, RELEASE_MS);
  }, []);

  const stopRelease = useCallback(() => {
    if (releaseTimerRef.current) {
      clearInterval(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
  }, []);

  const flushPending = useCallback(() => {
    if (pendingRef.current.length === 0) return;
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (!last || last.role !== "assistant") return prev;
      copy[copy.length - 1] = { ...last, text: last.text + pendingRef.current };
      return copy;
    });
    pendingRef.current = "";
  }, []);

  // Keep the panel full-screen and opaque; only lift the content above the keyboard via
  // bottom padding (= keyboard height). Avoids the background flashing while iOS resizes.
  const keyboard =
    mobile && vv && typeof window !== "undefined" ? Math.max(0, window.innerHeight - vv.height - vv.top) : 0;
  const panelStyle: React.CSSProperties | undefined = keyboard ? { paddingBottom: keyboard } : undefined;

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", text: "" }]);
    setInput("");
    setLoading(true);
    pendingRef.current = "";
    stopRelease();
    startRelease();

    const controller = new AbortController();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.text })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        stopRelease();
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", text: c.error };
          return copy;
        });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              stopRelease();
              pendingRef.current = "";
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", text: parsed.error };
                return copy;
              });
              controller.abort();
              return;
            }
            if (parsed.content) {
              pendingRef.current += parsed.content;
            }
          } catch {
            // skip unparseable chunks
          }
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        stopRelease();
        pendingRef.current = "";
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.text === "") {
            copy[copy.length - 1] = { role: "assistant", text: c.error };
          }
          return copy;
        });
      }
    } finally {
      setLoading(false);
      // Let the release timer drain remaining chars, then stop
      const drain = setInterval(() => {
        if (pendingRef.current.length === 0) {
          clearInterval(drain);
          flushPending();
          stopRelease();
        }
      }, RELEASE_MS * 2);
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
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            onClick={() => setOpen(true)}
            aria-label={c.fab}
            className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[0_8px_24px_oklch(0.2_0.04_258/0.35)] active:scale-95 lg:bottom-6"
          >
            <ConciergeBell size={22} strokeWidth={1.75} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            {/* Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Panel — full-screen on mobile (keyboard handled by interactive-widget) */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={SHEET_IN}
              style={panelStyle}
              className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] lg:inset-auto lg:bottom-6 lg:right-4 lg:h-[34rem] lg:w-96 lg:overflow-hidden lg:rounded-3xl lg:border lg:border-[var(--color-border)] lg:shadow-2xl"
            >
              {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] px-4 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5 lg:rounded-t-3xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)]">
              <ConciergeBell size={18} strokeWidth={1.75} />
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
          <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" style={{ WebkitOverflowScrolling: "touch" }}>
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

            {messages.map((m, i) => {
              if (m.role === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="chat-bubble max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-md bg-[var(--color-accent)] px-3.5 py-2.5 text-[0.95rem] leading-relaxed text-[var(--color-on-accent)]">
                      {m.text}
                    </div>
                  </div>
                );
              }
              const { clean, actions } = parseActions(m.text);
              const isStreaming = loading && i === messages.length - 1;
              return (
                <div key={i} className="flex justify-start">
                  <div className={`chat-bubble max-w-[88%] rounded-2xl rounded-tl-md bg-[var(--color-surface)] px-3.5 py-2.5 shadow-sm transition-all duration-300 ease-out ${isStreaming && clean.length === 0 ? "chat-bubble-entering" : ""}`}>
                  <div
                    className="whitespace-pre-line text-[0.95rem] leading-relaxed text-[var(--color-text)] [&_strong]:font-semibold [&_em]:italic"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(clean, isStreaming) }}
                  />
                    <ChatActions actions={actions} />
                  </div>
                </div>
              );
            })}

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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
