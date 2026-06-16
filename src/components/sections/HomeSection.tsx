"use client";

import {
  Clock,
  Phone,
  Wifi,
  HandPlatter,
  UtensilsCrossed,
  Sparkles,
  ConciergeBell,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { SectionLabel, HoursTable } from "@/components/ui";
import { HOTEL } from "@/lib/hotel";
import type { ServiceId } from "./DirectorySection";

type NavTarget =
  | { kind: "link"; href: string }
  | { kind: "tab"; tab: "services" | "map" | "info"; service?: ServiceId };

interface QuickAction {
  icon: LucideIcon;
  getLabel: (t: HotelContent) => string;
  target: NavTarget;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: Phone,           getLabel: (t) => t.home.highlights[1].title, target: { kind: "link", href: HOTEL.phoneHref } },
  { icon: HandPlatter,     getLabel: (t) => t.room.roomServiceLabel,    target: { kind: "tab", tab: "services", service: "room" } },
  { icon: Wifi,            getLabel: (t) => t.room.wifiLabel,           target: { kind: "tab", tab: "services", service: "room" } },
  { icon: UtensilsCrossed, getLabel: (t) => t.dining.label,            target: { kind: "tab", tab: "services", service: "dining" } },
  { icon: Sparkles,        getLabel: (t) => t.wellness.label,           target: { kind: "tab", tab: "services", service: "wellness" } },
  { icon: ConciergeBell,   getLabel: (t) => t.facility.label,          target: { kind: "tab", tab: "services", service: "facility" } },
  { icon: MapPin,          getLabel: (t) => t.nav.map,                  target: { kind: "tab", tab: "map" } },
];

export function HomeSection({
  t,
  onNavigate,
}: {
  t: HotelContent;
  onNavigate: (tab: "services" | "map" | "info", service?: ServiceId) => void;
}) {
  return (
    <div className="flex flex-col gap-6 md:gap-5 lg:gap-6 xl:gap-8">
      {/* ── HERO (immagine pulita, nessun testo) ── */}
      <section className="overflow-hidden rounded-3xl lg:rounded-[2rem]">
        <img
          src="/images/hero.webp"
          alt={HOTEL.name}
          className="h-52 w-full object-cover sm:h-60 md:h-72 lg:h-80"
          loading="eager"
        />
      </section>

      {/* ── AZIONI RAPIDE (scroll orizzontale) ── */}
      <section>
        <SectionLabel>{t.home.highlightsLabel}</SectionLabel>
        <div
          className="overflow-x-auto -mx-5 sm:-mx-6 lg:mx-0"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex gap-3 px-5 pb-2 sm:px-6 lg:px-0">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const label = action.getLabel(t);
              const tileClass =
                "flex flex-col items-center gap-2.5 rounded-2xl bg-[var(--color-surface)] px-3 py-3.5 min-w-[76px] transition-all duration-150 hover:bg-[var(--color-surface-muted)] active:scale-[0.95]";
              const inner = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="w-full text-center text-[11px] font-medium leading-tight text-[var(--color-text)]">
                    {label}
                  </span>
                </>
              );

              if (action.target.kind === "link") {
                return (
                  <a key={label} href={action.target.href} className={tileClass}>
                    {inner}
                  </a>
                );
              }
              const { tab, service } = action.target;
              return (
                <button key={label} onClick={() => onNavigate(tab, service)} className={tileClass}>
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BENVENUTO ── */}
      <section className="px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {t.home.stayLabel}
        </p>
        <p className="mt-1.5 text-xl font-bold leading-snug text-[var(--color-text)] lg:text-2xl">
          {t.home.welcomeTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)] lg:text-base">
          {t.home.welcomeBody}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-text-secondary)]">
          <span className="flex items-center gap-2">
            <Clock size={14} strokeWidth={1.75} className="shrink-0 text-[var(--color-accent)]" />
            {t.home.checkIn.label}:&nbsp;
            <strong className="font-semibold text-[var(--color-text)]">{t.home.checkIn.value}</strong>
          </span>
          <span className="flex items-center gap-2">
            <Clock size={14} strokeWidth={1.75} className="shrink-0 text-[var(--color-accent)]" />
            {t.home.checkOut.label}:&nbsp;
            <strong className="font-semibold text-[var(--color-text)]">{t.home.checkOut.value}</strong>
          </span>
        </div>
        <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">{t.home.lateCheckout}</p>
      </section>

      {/* ── ORARI DEI SERVIZI ── */}
      <section>
        <SectionLabel>{t.home.hoursLabel}</SectionLabel>
        <HoursTable rows={t.home.hours} />
      </section>
    </div>
  );
}
