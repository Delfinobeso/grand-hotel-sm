"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { ConciergeBell, Send, Phone, X, MapPin, CalendarCheck, ExternalLink, type LucideIcon } from "lucide-react";
import { HOTEL } from "@/lib/hotel";
import type { Lang } from "@/lib/content";

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

/** True at the lg breakpoint (1024px), where the concierge becomes a small
 * floating widget instead of a full-screen sheet tracking the visual viewport. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return isDesktop;
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
 *  Handles **bold**, *italic*, and ~~strikethrough~~. */
function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([\s\S]+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~([\s\S]+?)~~/g, "<del>$1</del>");
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
  fr: {
    title: "Concierge",
    fab: "Ouvrir le Concierge",
    greeting: "Je suis le Concierge digital du Grand Hotel. Comment puis-je vous aider ?",
    placeholder: "Écrivez un message…",
    reception: "Réception",
    error: "Pour cette information, je vous invite à contacter la Réception en composant le 9.",
    suggestions: [
      "À quelle heure est le petit-déjeuner ?",
      "Comment fonctionne le Wi-Fi ?",
      "Où se trouve la salle de sport ?",
      "Comment rejoindre le centre historique ?",
    ],
  },
  de: {
    title: "Concierge",
    fab: "Concierge öffnen",
    greeting: "Ich bin der digitale Concierge des Grand Hotel. Wie kann ich Ihnen helfen?",
    placeholder: "Nachricht schreiben…",
    reception: "Rezeption",
    error: "Für diese Information wenden Sie sich bitte an die Rezeption unter Taste 9.",
    suggestions: [
      "Um wie viel Uhr ist Frühstück?",
      "Wie funktioniert das WLAN?",
      "Wo ist der Fitnessraum?",
      "Wie komme ich zur Altstadt?",
    ],
  },
  es: {
    title: "Concierge",
    fab: "Abrir el Concierge",
    greeting: "Soy el Concierge digital del Grand Hotel. ¿En qué puedo ayudarle?",
    placeholder: "Escriba un mensaje…",
    reception: "Recepción",
    error: "Para esta información, le invito a contactar con Recepción marcando el 9.",
    suggestions: [
      "¿A qué hora es el desayuno?",
      "¿Cómo funciona el Wi-Fi?",
      "¿Dónde está el gimnasio?",
      "¿Cómo llego al centro histórico?",
    ],
  },
};

export default function ChatAssistant({
  lang,
  open,
  onOpenChange,
}: {
  lang: Lang;
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
  const isDesktop = useIsDesktop();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Keyboard height from visualViewport — only used for input padding
  const keyboardH = (() => {
    if (!vv || typeof window === "undefined") return 0;
    return Math.max(0, window.innerHeight - vv.height - vv.top);
  })();

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    const history = [...messages, userMsg];
    // Don't add an empty assistant bubble — show typing dots instead
    setMessages(history);
    setInput("");
    setLoading(true);

    let fullReply = "";
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
        setLoading(false);
        setMessages((prev) => [...prev, { role: "assistant", text: c.error }]);
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
              fullReply = parsed.error;
              controller.abort();
              break;
            }
            if (parsed.content) {
              fullReply += parsed.content;
            }
          } catch {
            // skip unparseable chunks
          }
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        fullReply = fullReply || c.error;
      }
    } finally {
      setLoading(false);
      // Reveal the complete message all at once with animation
      if (fullReply) {
        setMessages((prev) => [...prev, { role: "assistant", text: fullReply }]);
      }
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

            {/* Wrapper: positioned to the visual viewport so the keyboard can't push it off-screen.
                Desktop renders a small static floating widget instead, so it must not inherit this sizing. */}
            <div
              className="fixed z-50 lg:static lg:inset-auto"
              style={
                isDesktop
                  ? undefined
                  : {
                      top: vv?.top ?? 0,
                      left: 0,
                      right: 0,
                      height: vv?.height ?? "100dvh",
                    }
              }
            >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={SHEET_IN}
              className="absolute inset-0 flex flex-col bg-[var(--color-bg)] lg:relative lg:inset-auto lg:ml-auto lg:h-[34rem] lg:w-96 lg:overflow-hidden lg:rounded-3xl lg:border lg:border-[var(--color-border)] lg:shadow-2xl"
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
                    <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-md bg-[var(--color-accent)] px-3.5 py-2.5 text-[0.95rem] leading-relaxed text-[var(--color-on-accent)]">
                      {m.text}
                    </div>
                  </div>
                );
              }
              const { clean, actions } = parseActions(m.text);
              const isLast = i === messages.length - 1;
              return (
                <div key={i} className="flex justify-start">
                  <div className={`max-w-[88%] rounded-2xl rounded-tl-md bg-[var(--color-surface)] px-3.5 py-2.5 shadow-sm ${isLast ? "message-reveal" : ""}`}>
                  <div
                    className="whitespace-pre-line text-[0.95rem] leading-relaxed text-[var(--color-text)] [&_strong]:font-semibold [&_em]:italic"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(clean) }}
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

          {/* Input — stays above keyboard via paddingBottom from visualViewport */}
          <div
            className="shrink-0 border-t border-[var(--color-border)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:rounded-b-3xl"
            style={keyboardH > 0 ? { paddingBottom: keyboardH } : undefined}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
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
            <p className="mt-2 text-center text-[0.6875rem] text-[var(--color-text-muted)]">
              Powered by{" "}
              <a
                href="https://blasat.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--color-text-secondary)] underline-offset-2 hover:underline"
              >
                Blasat AI
              </a>
            </p>
          </div>
          </motion.div>
          </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
