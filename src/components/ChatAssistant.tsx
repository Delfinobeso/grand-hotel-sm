"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { ConciergeBell, Send, Phone, X, MapPin, CalendarCheck, ExternalLink, MessageCircle, type LucideIcon } from "lucide-react";
import { HOTEL } from "@/lib/hotel";
import type { Lang } from "@/lib/content";
import { EASE_EXPO, SHEET, SHEET_EXIT, BACKDROP_FADE } from "@/components/ui";

/** Desktop: il pannello è un widget ancorato in basso a destra, non uno sheet che
 *  sale — entra con una scala breve dal proprio angolo. Stessa curva (expo, pura
 *  decelerazione) di SHEET/SHEET_EXIT così tutto il motion dell'app è coerente. */
const WIDGET_IN: Transition = { duration: 0.3, ease: EASE_EXPO };
const WIDGET_OUT: Transition = { duration: 0.22, ease: EASE_EXPO };

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

const HISTORY_KEY = "ghsm-chat-history";
const HISTORY_MAX_AGE_MS = 12 * 60 * 60 * 1000;

interface ChatAction {
  label: string;
  url: string;
}

/** La KB (concierge.ts) genera SEMPRE i link con label in italiano; qui li traduciamo
 * per la lingua corrente. Label non presenti in mappa restano nella forma originale. */
const ACTION_LABELS: Record<Lang, Record<string, string>> = {
  it: {},
  en: {
    "Apri in Mappe": "Open in Maps",
    "Chiama la Reception": "Call Reception",
    Chiama: "Call",
    "Scrivi su WhatsApp": "Message on WhatsApp",
    "Prenota La Terrazza": "Book La Terrazza",
    "Visiona il menù": "View the menu",
  },
  fr: {
    "Apri in Mappe": "Ouvrir dans Maps",
    "Chiama la Reception": "Appeler la Réception",
    Chiama: "Appeler",
    "Scrivi su WhatsApp": "Écrire sur WhatsApp",
    "Prenota La Terrazza": "Réserver La Terrazza",
    "Visiona il menù": "Voir le menu",
  },
  de: {
    "Apri in Mappe": "In Karten öffnen",
    "Chiama la Reception": "Rezeption anrufen",
    Chiama: "Anrufen",
    "Scrivi su WhatsApp": "Per WhatsApp schreiben",
    "Prenota La Terrazza": "La Terrazza reservieren",
    "Visiona il menù": "Speisekarte ansehen",
  },
  es: {
    "Apri in Mappe": "Abrir en Maps",
    "Chiama la Reception": "Llamar a Recepción",
    Chiama: "Llamar",
    "Scrivi su WhatsApp": "Escribir por WhatsApp",
    "Prenota La Terrazza": "Reservar La Terrazza",
    "Visiona il menù": "Ver el menú",
  },
};

/** Pull Markdown links out of an assistant reply so they can render as buttons. */
function parseActions(text: string, lang: Lang): { clean: string; actions: ChatAction[] } {
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|tel:[^\s)]+)\)/g;
  const actions: ChatAction[] = [];
  const labels = ACTION_LABELS[lang];
  const clean = text
    .replace(re, (_m, label: string, url: string) => {
      actions.push({ label: labels[label] ?? label, url });
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
  // Ponte WhatsApp verso la Reception (2026-08-31): senza questa riga il
  // bottone prenderebbe l'icona generica "link esterno" e sembrerebbe un
  // rimando qualsiasi, invece di un messaggio da inviare.
  if (url.includes("wa.me")) return MessageCircle;
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
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3.5 py-2 text-[0.8125rem] font-semibold text-[var(--color-on-accent)] transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.97]"
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
    rateLimited: "Ha inviato molte richieste in poco tempo. Attenda qualche minuto e riprovi.",
    typing: "L'assistente sta scrivendo",
    disclosurePrefix: "Le risposte sono generate da un'AI. Non inserire dati sensibili.",
    disclosureLink: "Privacy",
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
    rateLimited: "You've sent many requests in a short time. Please wait a few minutes and try again.",
    typing: "The assistant is typing",
    disclosurePrefix: "Responses are generated by AI. Do not enter sensitive data.",
    disclosureLink: "Privacy",
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
    rateLimited: "Vous avez envoyé de nombreuses demandes en peu de temps. Veuillez patienter quelques minutes et réessayer.",
    typing: "L'assistant est en train d'écrire",
    disclosurePrefix: "Les réponses sont générées par une IA. Ne saisissez pas de données sensibles.",
    disclosureLink: "Confidentialité",
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
    rateLimited: "Sie haben in kurzer Zeit viele Anfragen gesendet. Bitte warten Sie einige Minuten und versuchen Sie es erneut.",
    typing: "Der Assistent schreibt gerade",
    disclosurePrefix: "Die Antworten werden von einer KI erstellt. Geben Sie keine sensiblen Daten ein.",
    disclosureLink: "Datenschutz",
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
    rateLimited: "Ha enviado muchas solicitudes en poco tiempo. Espere unos minutos y vuelva a intentarlo.",
    typing: "El asistente está escribiendo",
    disclosurePrefix: "Las respuestas son generadas por una IA. No introduzca datos sensibles.",
    disclosureLink: "Privacidad",
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
  hideFab = false,
}: {
  lang: Lang;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Il tab mappa non scrolla in verticale: lì l'auto-hide non scatta mai e il
   * FAB coprirebbe stabilmente la CTA "Naviga" del carosello — va nascosto. */
  hideFab?: boolean;
}) {
  const c = COPY[lang];
  const setOpen = onOpenChange;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const vv = useVisualViewport();
  const isDesktop = useIsDesktop();

  /* Il reveal va solo sui messaggi arrivati mentre il pannello è aperto: senza questa
     soglia l'ultima risposta della cronologia ri-animava a ogni riapertura (il sottoalbero
     viene smontato da AnimatePresence). La soglia si fissa in fase di render, non in un
     effetto, perché la bolla è già nel DOM — e quindi già animata — al primo paint. */
  const [revealFrom, setRevealFrom] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setRevealFrom(messages.length);
  }

  // Escape chiude il pannello (atteso da un dialog, su desktop è il gesto naturale).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Focus sull'input solo su desktop: su mobile aprirebbe la tastiera e farebbe
  // saltare il pannello prima ancora che l'ospite abbia letto il saluto.
  useEffect(() => {
    if (open && isDesktop) inputRef.current?.focus();
  }, [open, isDesktop]);

  // Cronologia persistente (solo client, per evitare mismatch di idratazione): ripristina
  // al mount se salvata meno di 12 ore fa, altrimenti la scarta.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { messages: Message[]; ts: number };
      if (Date.now() - parsed.ts < HISTORY_MAX_AGE_MS) {
        setMessages(parsed.messages);
      } else {
        localStorage.removeItem(HISTORY_KEY);
      }
    } catch {
      // storage non disponibile o dati corrotti: ignora
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ messages, ts: Date.now() }));
    } catch {
      // storage non disponibile (quota, privacy mode, ecc.): ignora
    }
  }, [messages]);

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
        const text = res.status === 429 ? c.rateLimited : c.error;
        setMessages((prev) => [...prev, { role: "assistant", text }]);
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
      {/* FAB — sempre visibile durante lo scroll (feedback Manuel/GHSM 2026-08-02): niente più
          auto-hide legato a scrollHidden, resta fisso e cliccabile. Pulsazione lieve e continua
          sull'icona (non sul bottone, per non interferire con l'entrata/uscita framer-motion). */}
      <AnimatePresence>
        {!open && !hideFab && (
          <div className="fixed bottom-[calc(var(--dock-clearance)+0.75rem)] right-4 z-30 lg:bottom-6">
            {/* Anello che si espande e svanisce (sonar) DIETRO il bottone (-z-10, non
                sopra: prima copriva il colore con un flash bianco) — colore del brand
                (--color-accent), non on-accent, così è coerente per ogni hotel.
                Scala contenuta a 1.35x e picco di opacità a 0.25: a 1.7x l'alone
                arrivava sulle card sottostanti (Caffè Titano su Oggi, riga Reception
                su Hotel) e leggeva come una macchia grigia, non come un accento. */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[var(--color-accent)]"
              animate={{ scale: [1, 1.2, 1.35], opacity: [0, 0.25, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.button
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
              onClick={() => setOpen(true)}
              aria-label={c.fab}
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[0_8px_24px_oklch(0.2_0.04_258/0.35)] transition-transform duration-200 active:scale-95"
            >
              <motion.span
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
                className="flex h-full w-full items-center justify-center"
              >
                <ConciergeBell size={22} strokeWidth={1.75} />
              </motion.span>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            {/* Scrim — niente backdrop-blur: a pannello aperto lo sheet copre tutto lo
                schermo, quindi la sfocatura non si vede mai e costa solo GPU. Le durate
                arrivano dalle costanti condivise (ui.tsx) così l'uscita dello scrim non
                finisce più prima dello sheet. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: SHEET_EXIT }}
              transition={BACKDROP_FADE}
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Wrapper: fixed on mobile to the visual viewport so the keyboard can't push it
                off-screen; fixed on desktop too, but anchored as a small bottom-right widget so
                it never joins the page's own flex layout (which would squeeze the app content). */}
            <div
              className="fixed z-50 lg:bottom-6 lg:right-4 lg:top-auto lg:left-auto lg:h-[34rem] lg:w-96"
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
              role="dialog"
              aria-modal={!isDesktop}
              aria-label={c.title}
              {...(isDesktop
                ? {
                    initial: { opacity: 0, scale: 0.95, y: 12 },
                    animate: { opacity: 1, scale: 1, y: 0 },
                    exit: { opacity: 0, scale: 0.95, y: 12, transition: WIDGET_OUT },
                    transition: WIDGET_IN,
                  }
                : {
                    initial: { y: "100%" },
                    animate: { y: 0 },
                    exit: { y: "100%", transition: SHEET_EXIT },
                    transition: SHEET,
                  })}
              className="absolute inset-0 flex origin-bottom-right flex-col bg-[var(--color-bg)] lg:relative lg:h-full lg:w-full lg:overflow-hidden lg:rounded-3xl lg:border lg:border-[var(--color-border)] lg:shadow-2xl"
            >
              {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] px-4 pt-[max(0.875rem,env(safe-area-inset-top))] pb-3.5 lg:rounded-t-3xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)]">
              <ConciergeBell size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.95rem] font-semibold leading-tight text-[var(--color-text)]">{c.title}</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">Grand Hotel San Marino</p>
            </div>
            {/* Pill Reception: stessa resa su mobile e desktop (l'etichetta non è più
                nascosta sotto sm — un'icona telefono da sola non dice cosa chiama).
                h-11 su touch per il target minimo, h-9 da lg dove il puntatore è preciso
                e l'header del widget deve restare compatto. */}
            <a
              href={HOTEL.phoneHref}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text)] transition-[background-color,transform] duration-200 hover:bg-[var(--color-border)] active:scale-[0.97] lg:h-9"
            >
              <Phone size={14} strokeWidth={2} />
              <span>{c.reception}</span>
            </a>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-[background-color,transform] duration-200 hover:bg-[var(--color-surface-muted)] active:scale-[0.97] lg:h-9 lg:w-9"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
            style={{ WebkitOverflowScrolling: "touch" }}
            role="log"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[0.95rem] leading-relaxed text-[var(--color-text)] shadow-sm">
                  {c.greeting}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] px-3 text-[0.8125rem] text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-surface-muted)] active:bg-[var(--color-surface-muted)]"
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
              const { clean, actions } = parseActions(m.text, lang);
              const isLast = i === messages.length - 1;
              const isFromThisSession = i >= revealFrom;
              return (
                <div key={i} className="flex justify-start">
                  <div
                    className={`max-w-[88%] rounded-2xl rounded-tl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 shadow-sm ${
                      isLast && isFromThisSession ? "message-reveal" : ""
                    }`}
                  >
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
              <div className="flex justify-start" role="status" aria-label={c.typing}>
                <div className="flex gap-1 rounded-2xl rounded-tl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-sm">
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
                ref={inputRef}
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-on-accent)] transition-[opacity,transform] duration-200 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
              >
                <Send size={17} strokeWidth={1.875} />
              </button>
            </div>
            <p className="mt-2 text-center text-[0.6875rem] text-[var(--color-text-muted)]">
              {c.disclosurePrefix}{" "}
              {/* Underline sempre visibile: su touch non esiste hover, e senza sottolineatura
                  il link Privacy era indistinguibile dal testo della disclosure. */}
              <a href="/privacy" className="underline underline-offset-2">
                {c.disclosureLink}
              </a>
            </p>
            <p className="mt-1 text-center text-[0.6875rem] text-[var(--color-text-muted)]">
              Powered by{" "}
              <a
                href="https://blasat.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--color-text-secondary)] underline underline-offset-2"
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
