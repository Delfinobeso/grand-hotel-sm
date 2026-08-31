"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { ConciergeBell, Send, Phone, X, MapPin, CalendarCheck, ExternalLink, MessageCircle, AlertTriangle, RotateCcw, type LucideIcon } from "lucide-react";
import { HOTEL } from "@/lib/hotel";
import type { Lang } from "@/lib/content";
import { safeStreamPrefix, renderMarkdown, actionLinkRe } from "@/lib/streamMarkdown";
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

/** Un guasto non è una risposta. Senza questa distinzione offline, limite raggiunto
 *  e timeout del modello uscivano tutti come lo stesso fumetto bianco, nella stessa
 *  posizione e con lo stesso tono di un'informazione vera: l'ospite non capiva di
 *  dover riprovare, e infatti non riprovava. */
type ErrorKind = "offline" | "rate" | "failure";

interface Message {
  role: "user" | "assistant";
  text: string;
  kind?: "reply" | "error";
  errorKind?: ErrorKind;
  /** Risposta già comparsa progressivamente durante lo stream: a fine risposta non
   *  deve ri-animare in blocco, sarebbe un secondo salto su un testo già letto. */
  streamed?: boolean;
}

const HISTORY_KEY = "ghsm-chat-history";
const HISTORY_MAX_AGE_MS = 12 * 60 * 60 * 1000;

/** Ritmo con cui la risposta in arrivo viene versata a schermo. A ogni token il testo
 *  ballerebbe; ~60ms è abbastanza fitto da leggersi come scorrimento continuo e
 *  abbastanza rado da non ridisegnare la bolla decine di volte al secondo. */
const STREAM_FLUSH_MS = 60;
/** Soglie del testo di stato sotto i puntini, quando l'attesa si allunga. */
const WAIT_PHASE_1_MS = 4000;
const WAIT_PHASE_2_MS = 9000;

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
  const re = actionLinkRe();
  const actions: ChatAction[] = [];
  const labels = ACTION_LABELS[lang];
  const clean = text
    .replace(re, (_m, label: string, url: string) => {
      actions.push({ label: labels[label] ?? label, url });
      // Il bottone WhatsApp arriva SEMPRE da solo sulla sua riga (lo compone
      // il server dal marcatore, vedi conciergeWhatsapp.ts), quindi lasciarne
      // l'etichetta nel testo produceva una riga orfana "Scrivi su WhatsApp"
      // sopra il bottone — per giunta in italiano, perche' qui si traduce solo
      // l'etichetta del bottone. Gli altri link il modello li scrive dentro
      // una frase, e li' l'etichetta serve a non lasciare un buco.
      return url.includes("wa.me") ? "" : label;
    })
    .replace(/[ \t]+([.,;:])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
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
    retry: "Riprova",
    callReception: "Chiama la Reception",
    waiting1: "Sto cercando tra le informazioni dell'hotel…",
    waiting2: "Ci sto mettendo più del solito, ma la risposta sta arrivando.",
    errOffline: {
      title: "Nessuna connessione",
      body: "Il dispositivo non è collegato a internet, così non riesco a raggiungere il Concierge. Controlli Wi-Fi o dati e riprovi.",
    },
    errRate: {
      title: "Troppe richieste di fila",
      body: "Ha inviato molte domande in poco tempo. Attenda un minuto e riprovi.",
    },
    errFail: {
      title: "Non riesco in questo momento",
      body: "Il Concierge non è riuscito a rispondere. Può riprovare, oppure parlare subito con la Reception.",
    },
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
    retry: "Try again",
    callReception: "Call Reception",
    waiting1: "Looking through the hotel information…",
    waiting2: "This is taking longer than usual, but the answer is on its way.",
    errOffline: {
      title: "No connection",
      body: "Your device isn't connected to the internet, so I can't reach the Concierge. Check your Wi-Fi or mobile data and try again.",
    },
    errRate: {
      title: "Too many requests",
      body: "You've sent a lot of questions in a short time. Please wait a minute and try again.",
    },
    errFail: {
      title: "I can't manage right now",
      body: "The Concierge couldn't answer. You can try again, or speak to Reception straight away.",
    },
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
    retry: "Réessayer",
    callReception: "Appeler la Réception",
    waiting1: "Je consulte les informations de l'hôtel…",
    waiting2: "Cela prend plus de temps que d'habitude, mais la réponse arrive.",
    errOffline: {
      title: "Aucune connexion",
      body: "Votre appareil n'est pas connecté à internet, je ne peux donc pas joindre le Concierge. Vérifiez le Wi-Fi ou les données et réessayez.",
    },
    errRate: {
      title: "Trop de demandes",
      body: "Vous avez envoyé beaucoup de questions en peu de temps. Patientez une minute et réessayez.",
    },
    errFail: {
      title: "Je n'y arrive pas pour le moment",
      body: "Le Concierge n'a pas pu répondre. Vous pouvez réessayer, ou parler tout de suite à la Réception.",
    },
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
    retry: "Erneut versuchen",
    callReception: "Rezeption anrufen",
    waiting1: "Ich sehe die Hotelinformationen durch…",
    waiting2: "Es dauert länger als gewöhnlich, die Antwort kommt aber gleich.",
    errOffline: {
      title: "Keine Verbindung",
      body: "Ihr Gerät ist nicht mit dem Internet verbunden, daher erreiche ich den Concierge nicht. Prüfen Sie WLAN oder mobile Daten und versuchen Sie es erneut.",
    },
    errRate: {
      title: "Zu viele Anfragen",
      body: "Sie haben in kurzer Zeit viele Fragen gesendet. Warten Sie eine Minute und versuchen Sie es erneut.",
    },
    errFail: {
      title: "Im Moment nicht möglich",
      body: "Der Concierge konnte nicht antworten. Sie können es erneut versuchen oder direkt mit der Rezeption sprechen.",
    },
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
    retry: "Reintentar",
    callReception: "Llamar a Recepción",
    waiting1: "Estoy consultando la información del hotel…",
    waiting2: "Está tardando más de lo habitual, pero la respuesta está llegando.",
    errOffline: {
      title: "Sin conexión",
      body: "Su dispositivo no está conectado a internet, así que no puedo llegar al Concierge. Revise el Wi-Fi o los datos y vuelva a intentarlo.",
    },
    errRate: {
      title: "Demasiadas solicitudes",
      body: "Ha enviado muchas preguntas en poco tiempo. Espere un minuto y vuelva a intentarlo.",
    },
    errFail: {
      title: "No puedo en este momento",
      body: "El Concierge no ha podido responder. Puede reintentarlo o hablar directamente con Recepción.",
    },
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

/** L'errore ha un aspetto suo: bordo e icona d'avviso in ambra (--color-warning, già
 *  nel tema, chiaro e scuro), non il rosso da cruscotto — è un albergo, e nella quasi
 *  totalità dei casi basta ritoccare "Riprova". Il testo nomina la causa invece di
 *  girarci attorno, e i due bottoni danno sempre una via d'uscita: rimandare la stessa
 *  domanda, oppure parlare con una persona. */
function ErrorBubble({
  kind,
  c,
  onRetry,
  busy,
}: {
  kind: ErrorKind;
  c: (typeof COPY)[Lang];
  onRetry: () => void;
  busy: boolean;
}) {
  const t = kind === "offline" ? c.errOffline : kind === "rate" ? c.errRate : c.errFail;
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-[var(--color-warning)] bg-[var(--color-warning-soft)] px-3.5 py-3">
        <div className="flex items-start gap-2">
          <AlertTriangle
            size={17}
            strokeWidth={2.25}
            aria-hidden
            className="mt-px shrink-0 text-[var(--color-warning)]"
          />
          <div className="min-w-0">
            <p className="text-[0.9375rem] font-semibold leading-snug text-[var(--color-text)]">{t.title}</p>
            <p className="mt-1 text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]">{t.body}</p>
          </div>
        </div>
        {/* Entrambi da 44pt: sono i bottoni che si toccano quando qualcosa è già
            andato storto, non è il punto in cui risparmiare millimetri. */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={onRetry}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3.5 py-2 text-[0.8125rem] font-semibold text-[var(--color-on-accent)] transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100"
          >
            <RotateCcw size={14} strokeWidth={2} />
            {c.retry}
          </button>
          <a
            href={HOTEL.phoneHref}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-[0.8125rem] font-semibold text-[var(--color-text)] transition-[background-color,transform] duration-200 hover:bg-[var(--color-surface-muted)] active:scale-[0.97]"
          >
            <Phone size={14} strokeWidth={2} />
            {c.callReception}
          </a>
        </div>
      </div>
    </div>
  );
}

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
  /** Testo della risposta mentre arriva, già ritagliato a Markdown chiuso. Sta fuori
   *  da `messages` apposta: la cronologia registra solo risposte finite, così né il
   *  salvataggio né l'animazione di comparsa vedono mai uno stato intermedio. */
  const [streamText, setStreamText] = useState("");
  const streamBufRef = useRef("");
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 0 = nessun testo di stato, 1 = attesa lunga, 2 = attesa molto lunga. */
  const [waitPhase, setWaitPhase] = useState(0);
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
    // I fumetti d'errore non si salvano: un "Riprova" ripescato sei ore dopo
    // rimanderebbe una domanda che l'ospite non sta più facendo, e riaprendo l'app
    // si vedrebbe un guasto già passato.
    const keep = messages.filter((m) => m.kind !== "error");
    if (keep.length === 0) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ messages: keep, ts: Date.now() }));
    } catch {
      // storage non disponibile (quota, privacy mode, ecc.): ignora
    }
  }, [messages]);

  // Anche `streamText` fra le dipendenze: mentre la risposta cresce la vista deve
  // seguirla, altrimenti il testo nuovo finisce sotto il bordo del pannello.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streamText]);

  // Attesa lunga: dopo qualche secondo di puntini identici l'ospite non sa più se
  // sta succedendo qualcosa. Le due soglie non dicono "sto pensando", dicono cosa
  // sta accadendo davvero.
  // Nessun reset qui: azzerare la fase all'uscita da `loading` sarebbe un setState
  // dentro un effetto (render a cascata). Ci pensa runChat all'inizio di ogni
  // domanda, e nel frattempo la fase non è comunque visibile.
  useEffect(() => {
    if (!loading) return;
    const t1 = setTimeout(() => setWaitPhase(1), WAIT_PHASE_1_MS);
    const t2 = setTimeout(() => setWaitPhase(2), WAIT_PHASE_2_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  // Keyboard height from visualViewport — only used for input padding
  const keyboardH = (() => {
    if (!vv || typeof window === "undefined") return 0;
    return Math.max(0, window.innerHeight - vv.height - vv.top);
  })();

  const cancelFlush = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      // Solo la parte con il Markdown chiuso: mai un link a metà, mai un ** aperto.
      setStreamText(safeStreamPrefix(streamBufRef.current));
    }, STREAM_FLUSH_MS);
  }, []);

  useEffect(() => cancelFlush, [cancelFlush]);

  /** Esegue la domanda che sta già in coda a `history`. Separata da `send` perché il
   *  "Riprova" del fumetto d'errore rimanda la stessa domanda senza riscriverla in
   *  cronologia — altrimenti comparirebbe due volte. */
  const runChat = useCallback(
    async (history: Message[], question: string) => {
      setLoading(true);
      setWaitPhase(0);
      streamBufRef.current = "";
      setStreamText("");

      const settle = () => {
        cancelFlush();
        streamBufRef.current = "";
        setStreamText("");
        setLoading(false);
      };

      const failWith = (errorKind: ErrorKind) => {
        settle();
        setMessages((prev) => [...prev, { role: "assistant", text: "", kind: "error", errorKind }]);
        // La domanda non si perde: torna nel campo, pronta da rimandare anche senza
        // toccare "Riprova". Prima il campo veniva svuotato e la domanda spariva.
        setInput(question);
      };

      // Che il telefono sia offline si sa già: inutile far aspettare all'ospite il
      // timeout della rete per dirgli una cosa che si può dire subito, con la causa
      // giusta invece che con un generico "contatti la Reception".
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        failWith("offline");
        return;
      }

      const controller = new AbortController();
      let serverFailed = false;

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
          failWith(res.status === 429 ? "rate" : "failure");
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          failWith("failure");
          return;
        }
        const decoder = new TextDecoder();
        let buffer = "";
        let ended = false;

        while (!ended) {
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
                // Il server dice che la risposta non si può completare. Prima il suo
                // testo finiva a schermo come se fosse una risposta vera: è proprio
                // l'errore gentile che l'ospite non riconosceva come guasto.
                serverFailed = true;
                controller.abort();
                ended = true;
                break;
              }
              if (parsed.content) {
                streamBufRef.current += parsed.content;
                scheduleFlush();
              }
            } catch {
              // skip unparseable chunks
            }
          }
        }
      } catch (e: unknown) {
        if ((e as Error).name !== "AbortError") {
          failWith(
            typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "failure",
          );
          return;
        }
      }

      if (serverFailed) {
        failWith("failure");
        return;
      }
      const reply = streamBufRef.current.trim();
      if (!reply) {
        // Stream chiuso senza una riga di testo: è un guasto, non una risposta vuota.
        failWith("failure");
        return;
      }
      settle();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: reply, kind: "reply", streamed: true },
      ]);
    },
    [cancelFlush, scheduleFlush],
  );

  const send = (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    const history: Message[] = [...messages, { role: "user", text: question }];
    setMessages(history);
    setInput("");
    void runChat(history, question);
  };

  /** Riprova: toglie il fumetto d'errore e rimanda la stessa domanda. La cronologia
   *  troncata finisce già con il messaggio dell'ospite, quindi non va riscritto. */
  const retry = (errorIndex: number) => {
    if (loading) return;
    const history = messages.slice(0, errorIndex);
    const last = history[history.length - 1];
    if (!last || last.role !== "user") return;
    setMessages(history);
    setInput("");
    void runChat(history, last.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  // I bottoni-azione si estraggono anche dal testo in arrivo: safeStreamPrefix
  // garantisce che qui arrivino solo link completi, quindi un bottone o compare
  // intero o non compare ancora — mai a metà.
  const streaming = streamText ? parseActions(streamText, lang) : null;

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
              if (m.kind === "error") {
                return (
                  <ErrorBubble
                    key={i}
                    kind={m.errorKind ?? "failure"}
                    c={c}
                    busy={loading}
                    onRetry={() => retry(i)}
                  />
                );
              }
              const { clean, actions } = parseActions(m.text, lang);
              const isLast = i === messages.length - 1;
              const isFromThisSession = i >= revealFrom;
              return (
                <div key={i} className="flex justify-start">
                  <div
                    className={`max-w-[88%] rounded-2xl rounded-tl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 shadow-sm ${
                      isLast && isFromThisSession && !m.streamed ? "message-reveal" : ""
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

            {/* Risposta in arrivo: si vede crescere, invece di comparire tutta insieme
                dopo 4-12 secondi di puntini fermi. Il testo passa da safeStreamPrefix,
                quindi non contiene mai un costrutto Markdown aperto. Il cursore che
                pulsa (.streaming-cursor) era rimasto orfano in globals.css da quando lo
                streaming a schermo fu tolto nel giugno 2026: torna al suo posto. */}
            {streaming && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 shadow-sm">
                  <div
                    className="whitespace-pre-line text-[0.95rem] leading-relaxed text-[var(--color-text)] [&_strong]:font-semibold [&_em]:italic"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(streaming.clean) + '<span class="streaming-cursor">\u258C</span>',
                    }}
                  />
                  <ChatActions actions={streaming.actions} />
                </div>
              </div>
            )}

            {loading && !streamText && (
              <div className="flex flex-col items-start gap-1.5" role="status" aria-label={c.typing}>
                <div className="flex gap-1 rounded-2xl rounded-tl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)]"
                      style={{ animation: `typing-bounce 1.2s ${i * 0.18}s infinite var(--ease-out)` }}
                    />
                  ))}
                </div>
                {/* Quando l'attesa si allunga, dire cosa sta succedendo: i puntini da
                    soli non distinguono "ci sto lavorando" da "si è piantato", e
                    l'ospite chiude il pannello prima che la risposta arrivi. */}
                {waitPhase > 0 && (
                  <p className="px-1 text-[0.8125rem] leading-snug text-[var(--color-text-muted)]">
                    {waitPhase === 1 ? c.waiting1 : c.waiting2}
                  </p>
                )}
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
