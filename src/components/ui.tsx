"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { ChevronDown, Phone, MapPin, CalendarPlus, type LucideIcon } from "lucide-react";
import type { HoursRow, MassageItem } from "@/lib/content";
import { getServiceStatus, type ServiceHours, type StatusLabels } from "@/lib/hours";
import { buildEventIcsUri, type EventDate } from "@/lib/ics";

export const TRANSITION: Transition = { type: "tween", duration: 0.2, ease: "easeOut" };

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] lg:text-sm">
      {children}
    </h2>
  );
}

export function SectionHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="px-1">
      <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-text)] lg:text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)] lg:text-base">{intro}</p>
    </div>
  );
}

export function IconBadge({ icon: Icon, size = 20 }: { icon: LucideIcon; size?: number }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] lg:h-12 lg:w-12">
      <Icon size={size} strokeWidth={1.75} />
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5 ${className}`}>{children}</div>;
}

export function AccordionItem({
  icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--color-surface)]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[var(--color-surface-muted)] lg:px-5 lg:py-4"
      >
        <IconBadge icon={icon} />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-[var(--color-text)] lg:text-lg">{title}</span>
          {subtitle && <span className="block text-sm text-[var(--color-text-secondary)]">{subtitle}</span>}
          {badge && <span className="mt-1.5 block">{badge}</span>}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={TRANSITION}
          className="shrink-0 text-[var(--color-text-muted)]"
        >
          <ChevronDown size={18} strokeWidth={1.75} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={TRANSITION}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-[68px] text-sm leading-relaxed text-[var(--color-text-secondary)] lg:px-5 lg:pb-5 lg:pl-20 lg:text-base">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HighlightCard({ icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[var(--color-surface)] p-4 lg:p-5">
      <IconBadge icon={icon} />
      <div>
        <p className="text-sm font-semibold text-[var(--color-text)] lg:text-base">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{body}</p>
      </div>
    </div>
  );
}

export function HoursTable({ rows }: { rows: HoursRow[] }) {
  return (
    <div className="flex flex-col rounded-2xl bg-[var(--color-surface)] px-4 lg:px-5">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-center justify-between gap-4 py-3 ${i !== 0 ? "border-t border-[var(--color-border)]" : ""}`}
        >
          <span className="text-sm font-medium text-[var(--color-text)]">{row.label}</span>
          <span className="shrink-0 text-sm text-[var(--color-text-secondary)]">{row.value}</span>
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
          className={`flex items-center justify-between gap-4 py-3 ${i !== 0 ? "border-t border-[var(--color-border)]" : ""}`}
        >
          <span className="text-sm font-medium text-[var(--color-text)]">{item.name}</span>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            {item.variants.map((v, vi) => (
              <span key={vi} className="text-sm text-[var(--color-text-secondary)]">
                {v.label && <span className="text-[var(--color-text-muted)]">{v.label} </span>}
                {v.duration && <span>{v.duration} </span>}
                <span className="font-semibold text-[var(--color-text)]">{v.price}</span>
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
    <span className="rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
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
    <blockquote className="border-l-2 border-[var(--color-accent)] pl-4">
      <p className="font-display text-lg italic leading-snug text-[var(--color-text)] lg:text-xl">&ldquo;{quote}&rdquo;</p>
      <footer className="mt-1 text-sm text-[var(--color-text-muted)]">— {author}</footer>
    </blockquote>
  );
}

/* ── CONCIERGE: floor badge, live status, CTA buttons ── */

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
    return <span className="inline-block h-5 w-20 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />;
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
        isOpen ? "bg-[var(--color-success-soft)] text-[var(--color-success)]" : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${isOpen ? "animate-pulse" : ""}`} />
      {text}
    </span>
  );
}

const ctaBase =
  "inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-[transform,opacity] duration-150 ease-out active:scale-[0.97]";
const ctaSolid = `${ctaBase} bg-[var(--color-accent)] text-[var(--color-on-accent)] hover:opacity-90`;
const ctaOutline = `${ctaBase} bg-[var(--color-surface-muted)] text-[var(--color-text)] hover:bg-[var(--color-border)]`;

export function CallButton({ href, label, variant = "solid" }: { href: string; label: string; variant?: "solid" | "outline" }) {
  return (
    <a href={href} className={variant === "solid" ? ctaSolid : ctaOutline}>
      <Phone size={16} strokeWidth={1.75} />
      {label}
    </a>
  );
}

export function mapsUrl(lat: number, lon: number, name: string): string {
  return `https://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(name)}`;
}

export function NavigateButton({
  lat,
  lon,
  name,
  label,
  variant = "outline",
}: {
  lat: number;
  lon: number;
  name: string;
  label: string;
  variant?: "solid" | "outline";
}) {
  return (
    <a href={mapsUrl(lat, lon, name)} target="_blank" rel="noopener noreferrer" className={variant === "solid" ? ctaSolid : ctaOutline}>
      <MapPin size={16} strokeWidth={1.75} />
      {label}
    </a>
  );
}

/* ── IMMAGINI ── */

export function ImageBanner({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
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
          style={{ aspectRatio: "2.5 / 1" }}
        />
      </picture>
    </div>
  );
}

export function CardImage({ src, alt }: { src: string; alt: string }) {
  const base = src.replace(/\.webp$/, "");
  const sm = `${base}-sm.webp`;
  return (
    <div className="-mx-4 -mt-4 mb-1 overflow-hidden rounded-t-2xl bg-[var(--color-surface-muted)] lg:-mx-5 lg:-mt-5">
      <picture>
        <source srcSet={sm} media="(max-width: 640px)" />
        <img src={src} alt={alt} loading="lazy" className="block aspect-[5/2] w-full object-cover" />
      </picture>
    </div>
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
      <CalendarPlus size={16} strokeWidth={1.75} />
      {label}
    </a>
  );
}
