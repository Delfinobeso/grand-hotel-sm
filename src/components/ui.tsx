"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import {
  ChevronDown,
  Phone,
  MapPin,
  CalendarPlus,
  Check,
  Copy,
  Quote,
  CalendarCheck,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { HoursRow, MassageItem } from "@/lib/content";
import { getServiceStatus, type ServiceHours, type StatusLabels } from "@/lib/hours";
import { buildEventIcsUri, type EventDate } from "@/lib/ics";

export const EASE_OUT = [0.25, 1, 0.5, 1] as const;
export const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
export const TRANSITION: Transition = { duration: 0.28, ease: EASE_OUT };

/* Motion condiviso — unica fonte di verità per le transizioni ricorrenti.
   Tutte decelerazione pura: nessuna curva con overshoot (vedi nota su
   --ease-spring, deprecato, in globals.css). */

/** Apertura/chiusura in altezza: accordion, righe che si espandono in posto. */
export const REVEAL: Transition = { duration: 0.32, ease: EASE_EXPO };
/** Ingresso di un pannello/sheet che scorre sopra il contenuto. */
export const SHEET: Transition = { duration: 0.4, ease: EASE_EXPO };
/** Uscita dello sheet — leggermente più rapida dell'ingresso, come su iOS. */
export const SHEET_EXIT: Transition = { duration: 0.32, ease: EASE_EXPO };
/** Dissolvenza degli scrim/backdrop dietro sheet e pannelli. */
export const BACKDROP_FADE: Transition = { duration: 0.25, ease: EASE_OUT };

/* ── Headings ── */

export function SectionHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="px-1">
      <h2 className="text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--color-text)] lg:text-[2.125rem]">
        {title}
      </h2>
      {intro && (
        <p className="mt-2 max-w-prose text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)] lg:text-base">
          {intro}
        </p>
      )}
    </div>
  );
}

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3
      className={`mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] ${className}`}
    >
      {children}
    </h3>
  );
}

export function IconBadge({ icon: Icon, size = 19 }: { icon: LucideIcon; size?: number }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
      <Icon size={size} strokeWidth={1.75} />
    </span>
  );
}

/* ── Surfaces ── */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5 ${className}`}>
      {children}
    </div>
  );
}

export function AccordionItem({
  icon,
  title,
  subtitle,
  badge,
  defaultOpen = false,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--color-surface)]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-[var(--color-surface-muted)] active:bg-[var(--color-surface-muted)] lg:px-5 lg:py-4"
      >
        <IconBadge icon={icon} />
        {/* NOTA (audit 2026-08-03): provato a togliere flex-1 su desktop per avvicinare
            il chevron al testo. Sugli screenshot il risultato è peggiore: i chevron
            finiscono a x diverse riga per riga e il bordo destro diventa frastagliato.
            Il chevron resta allineato a destra (pattern disclosure standard); il senso
            di "riga vuota" su desktop dipende dalla larghezza della colonna contenuti,
            non da questo primitivo. */}
        <span className="min-w-0 flex-1">
          <span className="block text-[1.0625rem] font-semibold leading-snug text-[var(--color-text)]">
            {title}
          </span>
          {/* Il subtitle è un'anteprima del contenuto: ad accordion aperto diventa un
              doppione di ciò che si legge subito sotto, quindi collassa con la stessa
              curva/durata del corpo. Nessun testo viene modificato. */}
          <AnimatePresence initial={false}>
            {subtitle && !open && (
              <motion.span
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={REVEAL}
                className="block overflow-hidden"
              >
                <span className="mt-0.5 block text-sm text-[var(--color-text-secondary)]">
                  {subtitle}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
          {badge && <span className="mt-1.5 block">{badge}</span>}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={TRANSITION}
          className="shrink-0 text-[var(--color-text-muted)]"
        >
          <ChevronDown size={18} strokeWidth={2} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={REVEAL}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-[68px] text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)] lg:px-5 lg:pb-5 lg:pl-20">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Quick answer (Home) ── self-managed reveal */

export function QuickAnswer({
  icon: Icon,
  label,
  preview,
  children,
}: {
  icon: LucideIcon;
  label: string;
  preview?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--color-surface)]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-[var(--color-surface-muted)] active:bg-[var(--color-surface-muted)]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Icon size={17} strokeWidth={1.875} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.95rem] font-semibold text-[var(--color-text)]">{label}</span>
          {preview && (
            <span className="mt-0.5 block truncate text-[0.8125rem] text-[var(--color-text-muted)]">
              {preview}
            </span>
          )}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={TRANSITION}
          className="shrink-0 text-[var(--color-text-muted)]"
        >
          <ChevronDown size={17} strokeWidth={2} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={REVEAL}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-[60px]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CopyField({
  value,
  copiedLabel,
  label,
}: {
  value: string;
  copiedLabel: string;
  /** Nome del campo (es. l'etichetta già presente accanto al valore). Serve solo
   *  a dare un nome accessibile stabile al bottone: non produce testo visibile. */
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: value stays visible to read */
    }
  };
  return (
    <button
      onClick={copy}
      aria-label={label ? `${label}: ${value}` : value}
      className="flex w-full items-center justify-between gap-3 rounded-xl bg-[var(--color-surface-muted)] px-3.5 py-2.5 text-left transition-colors duration-200 hover:bg-[var(--color-border)] active:bg-[var(--color-border)]"
    >
      <span className="font-mono text-[0.95rem] font-semibold tracking-wide text-[var(--color-text)]">
        {value}
      </span>
      <span
        aria-live="polite"
        className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-[var(--color-accent)]"
      >
        {copied ? <Check size={16} strokeWidth={2.25} /> : <Copy size={16} strokeWidth={2} />}
        {copied ? copiedLabel : ""}
      </span>
    </button>
  );
}

/* ── Data display ── */

export function HoursTable({ rows }: { rows: HoursRow[] }) {
  return (
    <div className="flex flex-col rounded-2xl bg-[var(--color-surface)] px-4 lg:px-5">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-center justify-between gap-4 py-3.5 ${
            i !== 0 ? "border-t border-[var(--color-border)]" : ""
          }`}
        >
          <span className="text-[0.95rem] font-medium text-[var(--color-text)]">{row.label}</span>
          <span className="shrink-0 text-[0.95rem] tabular-nums text-[var(--color-text-secondary)]">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PriceList({ items }: { items: MassageItem[] }) {
  return (
    <div className="flex flex-col rounded-2xl bg-[var(--color-surface)] px-4 lg:px-5">
      {items.map((item, i) => (
        <div
          key={item.name}
          className={`flex items-start justify-between gap-4 py-3.5 ${
            i !== 0 ? "border-t border-[var(--color-border)]" : ""
          }`}
        >
          <span className="text-[0.95rem] font-medium text-[var(--color-text)]">{item.name}</span>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            {item.variants.map((v, vi) => (
              <span key={vi} className="text-[0.95rem] text-[var(--color-text-secondary)]">
                {v.label && <span className="text-[var(--color-text-muted)]">{v.label} </span>}
                {v.duration && <span className="tabular-nums">{v.duration} </span>}
                <span className="font-semibold tabular-nums text-[var(--color-text)]">{v.price}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-[0.8125rem] font-medium text-[var(--color-text-secondary)]">
      {children}
    </span>
  );
}

export function ChipGrid({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <Chip key={`${item}-${i}`}>{item}</Chip>
      ))}
    </div>
  );
}

export function QuoteBlock({ quote, author }: { quote: string; author: string }) {
  return (
    <figure className="rounded-2xl bg-[var(--color-surface-quote)] px-5 py-5">
      <Quote size={22} strokeWidth={1.5} className="text-[var(--color-accent)]" />
      <blockquote className="mt-2 font-display text-xl italic leading-snug text-[var(--color-text)] lg:text-2xl">
        {quote}
      </blockquote>
      <figcaption className="mt-2 text-sm font-medium text-[var(--color-text-muted)]">
        {author}
      </figcaption>
    </figure>
  );
}

/* ── Badges ── */

export function FloorBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
      <MapPin size={12} strokeWidth={2} />
      {children}
    </span>
  );
}

export function StatusBadge({ hours, labels }: { hours: ServiceHours; labels: StatusLabels }) {
  const [status, setStatus] = useState<ReturnType<typeof getServiceStatus> | null>(null);

  useEffect(() => {
    const update = () => setStatus(getServiceStatus(hours));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [hours]);

  if (!status) {
    return <span className="inline-block h-6 w-24 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />;
  }

  if (status.status === "inactive") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {labels.onRequest}
      </span>
    );
  }

  const isOpen = status.status === "open";
  const text = isOpen
    ? status.time
      ? `${labels.open} · ${labels.closesAt} ${status.time}`
      : labels.open
    : status.time
      ? `${labels.closed} · ${labels.opensAt} ${status.time}`
      : labels.closed;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isOpen
          ? "bg-[var(--color-success-soft)] text-[var(--color-success-text)]"
          : "bg-[var(--color-danger-soft)] text-[var(--color-danger-text)]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${isOpen ? "animate-pulse" : ""}`} />
      {text}
    </span>
  );
}

/* ── Action buttons ── */

const ctaBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[0.9375rem] font-semibold transition-[transform,background-color,opacity] duration-200 ease-out active:scale-[0.97]";
const ctaSolid = `${ctaBase} bg-[var(--color-accent)] text-[var(--color-on-accent)] hover:opacity-90`;
const ctaOutline = `${ctaBase} bg-[var(--color-surface-muted)] text-[var(--color-text)] hover:bg-[var(--color-border)]`;

/** Riga di CTA a larghezza uniforme (Prenota/Apri in Mappe/Chiama...): senza questo
 *  wrapper i bottoni avevano larghezza intrinseca (in base al testo), quindi righe
 *  disomogenee e — quando il numero è dispari — l'ultimo bottone isolato e piccolo
 *  su una riga tutta sua. Griglia 2 colonne uguali; se il conteggio è dispari
 *  l'ultimo bottone occupa l'intera riga invece di restare orfano a metà larghezza.
 *  Children.toArray scarta automaticamente i figli falsy (es. `{cond && <Btn/>}`),
 *  quindi il conteggio riflette sempre i bottoni davvero renderizzati. */
export function CtaRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  const items = Children.toArray(children);
  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {items.map((child, i) => {
        const isLastOdd = i === items.length - 1 && items.length % 2 === 1;
        return (
          <div key={i} className={`[&>a]:w-full [&>button]:w-full ${isLastOdd ? "col-span-2" : ""}`}>
            {child}
          </div>
        );
      })}
    </div>
  );
}

/** "G" ufficiale (Simple Icons, monocromo currentColor) — non l'icona generica Star,
 *  per rendere il bottone recensione riconoscibile a colpo d'occhio come Google. */
function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}

/** Logo ufficiale Tripadvisor (Simple Icons, monocromo currentColor), stesso motivo. */
function TripadvisorIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.972 5.972 0 0 0 4.072 1.598 6 6 0 0 0 6-5.998 5.982 5.982 0 0 0-1.957-4.432L24 6.648h-4.35a13.573 13.573 0 0 0-7.644-2.353zM12 6.255c1.531 0 3.063.303 4.504.903C13.943 8.138 12 10.43 12 13.1c0-2.671-1.942-4.962-4.504-5.942A11.72 11.72 0 0 1 12 6.256zM6.002 9.157a4.059 4.059 0 1 1 0 8.118 4.059 4.059 0 0 1 0-8.118zm11.992.002a4.057 4.057 0 1 1 .003 8.115 4.057 4.057 0 0 1-.003-8.115zm-11.992 1.93a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256zm11.992 0a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256z" />
    </svg>
  );
}

export function CallButton({
  href,
  label,
  variant = "solid",
  trackLabel,
}: {
  href: string;
  label: string;
  variant?: "solid" | "outline";
  trackLabel?: string;
}) {
  return (
    <a href={href} className={variant === "solid" ? ctaSolid : ctaOutline}
      onClick={() => { if (trackLabel) import("@/lib/analytics/tracker").then(m => m.trackClick(trackLabel)); }}>
      <Phone size={16} strokeWidth={1.875} />
      {label}
    </a>
  );
}

export function mapsUrl(lat: number, lon: number, name: string): string {
  // Google Maps universal link — works on iOS (opens app), Android, and desktop.
  // Prima si mandava "nome lat,lon" nello stesso query: non è il formato
  // documentato da Google (che vuole o solo testo o solo "lat,lon") e per nomi
  // comuni tipo "La Terrazza" Maps ignorava le coordinate e mostrava una lista
  // di tutti i locali con quel nome nel mondo (segnalato da Manuel via
  // feedback portale 2026-08-03). "<nome>, San Marino" invece disambigua col
  // solo testo, stesso schema già in uso per i link recensione in hotel.ts.
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, San Marino`)}`;
}

export function NavigateButton({
  lat,
  lon,
  name,
  label,
  variant = "outline",
  trackLabel,
}: {
  lat: number;
  lon: number;
  name: string;
  label: string;
  variant?: "solid" | "outline";
  trackLabel?: string;
}) {
  return (
    <a
      href={mapsUrl(lat, lon, name)}
      target="_blank"
      rel="noopener noreferrer"
      className={variant === "solid" ? ctaSolid : ctaOutline}
      onClick={() => { if (trackLabel) import("@/lib/analytics/tracker").then(m => m.trackClick(trackLabel)); }}
    >
      <MapPin size={16} strokeWidth={1.875} />
      {label}
    </a>
  );
}

export function BookButton({
  href,
  label,
  variant = "solid",
  trackLabel,
}: {
  href: string;
  label: string;
  variant?: "solid" | "outline";
  trackLabel?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={variant === "solid" ? ctaSolid : ctaOutline}
      onClick={() => { if (trackLabel) import("@/lib/analytics/tracker").then(m => m.trackClick(trackLabel)); }}>
      <CalendarCheck size={16} strokeWidth={1.875} />
      {label}
    </a>
  );
}

export function MenuButton({
  href,
  label,
  variant = "outline",
  trackLabel,
}: {
  href: string;
  label: string;
  variant?: "solid" | "outline";
  trackLabel?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={variant === "solid" ? ctaSolid : ctaOutline}
      onClick={() => { if (trackLabel) import("@/lib/analytics/tracker").then(m => m.trackClick(trackLabel)); }}>
      <BookOpen size={16} strokeWidth={1.875} />
      {label}
    </a>
  );
}

/** Bottoni "Lasciaci una recensione" — Google + Tripadvisor, riuso dello stile CTA
 *  outline esistente (CallButton/NavigateButton). Nomi delle piattaforme non tradotti. */
export function ReviewButtons({
  googleUrl,
  tripadvisorUrl,
  googleLabel,
  tripadvisorLabel,
  trackPrefix,
}: {
  googleUrl: string;
  tripadvisorUrl: string;
  googleLabel: string;
  tripadvisorLabel: string;
  trackPrefix: string;
}) {
  return (
    <CtaRow>
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={ctaOutline}
        onClick={() => { import("@/lib/analytics/tracker").then(m => m.trackClick(`${trackPrefix}-google`)); }}
      >
        <GoogleIcon />
        {googleLabel}
      </a>
      <a
        href={tripadvisorUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={ctaOutline}
        onClick={() => { import("@/lib/analytics/tracker").then(m => m.trackClick(`${trackPrefix}-tripadvisor`)); }}
      >
        <TripadvisorIcon />
        {tripadvisorLabel}
      </a>
    </CtaRow>
  );
}

export function AddToCalendarButton({
  title,
  location,
  dates,
  label,
}: {
  title: string;
  location: string;
  dates: EventDate[];
  label: string;
}) {
  const href = buildEventIcsUri(title, location, dates);
  const fileName = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  return (
    <a href={href} download={fileName} className={ctaOutline}>
      <CalendarPlus size={16} strokeWidth={1.875} />
      {label}
    </a>
  );
}

/* ── Images ── */

export function ImageBanner({
  src,
  alt,
  className = "",
  ratio = "2.5 / 1",
}: {
  src: string;
  alt: string;
  className?: string;
  ratio?: string;
}) {
  const base = src.replace(/\.webp$/, "");
  const sm = `${base}-sm.webp`;
  return (
    <div className={`overflow-hidden rounded-2xl bg-[var(--color-surface-muted)] ${className}`}>
      <picture>
        <source srcSet={sm} media="(max-width: 640px)" />
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="block w-full object-cover"
          style={{ aspectRatio: ratio }}
        />
      </picture>
    </div>
  );
}

export function CardImage({ src, alt }: { src: string; alt: string }) {
  const base = src.replace(/\.webp$/, "");
  const sm = `${base}-sm.webp`;
  return (
    <div className="-mx-4 -mt-4 mb-3 overflow-hidden rounded-t-2xl bg-[var(--color-surface-muted)] lg:-mx-5 lg:-mt-5">
      <picture>
        <source srcSet={sm} media="(max-width: 640px)" />
        <img src={src} alt={alt} loading="lazy" className="block aspect-[5/2] w-full object-cover" />
      </picture>
    </div>
  );
}
