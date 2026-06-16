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
  Search,
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
  onOpenChat,
}: {
  t: HotelContent;
  onNavigate: (tab: "services" | "map" | "info", service?: ServiceId) => void;
  onOpenChat: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 md:gap-5 lg:gap-6 xl:gap-8">

      {/* ── HERO + CHAT OVERLAY ── */}
      <section className="relative overflow-hidden rounded-3xl lg:rounded-[2rem]">
        <img
          src="/images/hero.webp"
          alt={HOTEL.name}
          className="h-52 w-full object-cover sm:h-60 md:h-72 lg:h-80"
          loading="eager"
        />
        {/* gradient scrim per leggibilità del search bar */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
        {/* search bar che apre la chat */}
        <button
          onClick={onOpenChat}
          className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-full bg-white/95 px-4 py-3 text-left shadow-lg backdrop-blur-sm sm:inset-x-6 lg:inset-x-5"
        >
          <Search size={16} strokeWidth={1.75} className="shrink-0 text-[var(--color-text-muted)]" />
          <span className="text-sm text-[var(--color-text-muted)]">{t.home.chatPlaceholder}</span>
        </button>
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

      {/* ── AZIONI RAPIDE (scroll orizzontale) ── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>{t.home.highlightsLabel}</SectionLabel>
          <button
            onClick={() => onNavigate("services")}
            className="text-xs font-semibold text-[var(--color-accent)] hover:opacity-75 transition-opacity"
          >
            {t.home.highlightsSeeAll}
          </button>
        </div>
        <div className="-mx-5 sm:-mx-6 lg:mx-0 rounded-2xl bg-[var(--color-surface-muted)] overflow-hidden">
          <div
            className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory px-4 py-3.5 sm:px-5"
            style={{ scrollbarWidth: "none" }}
          >
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const label = action.getLabel(t);
              const tileClass =
                "flex shrink-0 flex-col items-center justify-center gap-2 w-[84px] aspect-square rounded-2xl bg-[var(--color-surface)] snap-start transition-all duration-150 active:scale-[0.93] shadow-sm";
              const inner = (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    <Icon size={20} strokeWidth={1.75} />
                  </span>
                  <span className="w-full px-1 text-center text-[10px] font-semibold leading-tight text-[var(--color-text)]">
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

      {/* ── ORARI DEI SERVIZI ── */}
      <section>
        <SectionLabel>{t.home.hoursLabel}</SectionLabel>
        <HoursTable rows={t.home.hours} />
      </section>
    </div>
  );
}
