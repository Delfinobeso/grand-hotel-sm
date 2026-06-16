"use client";

import {
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
import { HoursTable } from "@/components/ui";
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
      <section className="relative overflow-hidden rounded-3xl shadow-md lg:rounded-[2rem]">
        <img
          src="/images/hero.webp"
          alt={HOTEL.name}
          className="h-52 w-full object-cover sm:h-60 md:h-72 lg:h-80"
          loading="eager"
        />

        {/* Blue wave gradient */}
        <div className="absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: 88 }}>
          {/* Base gradient: transparent → deep blue */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1d3a]/85 via-[#1a3a6b]/45 to-transparent" />

          {/* SVG wave 1 — lenta */}
          <svg
            aria-hidden="true"
            viewBox="0 0 2880 40"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-10"
            style={{
              width: "200%",
              height: 40,
              animation: "wave-shift 7s linear infinite",
              opacity: 0.45,
            }}
          >
            <path
              d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 C1680,40 1920,0 2160,20 C2400,40 2640,0 2880,20 L2880,40 L0,40 Z"
              fill="#1e40af"
            />
          </svg>

          {/* SVG wave 2 — veloce, direzione inversa */}
          <svg
            aria-hidden="true"
            viewBox="0 0 2880 32"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute bottom-7"
            style={{
              width: "200%",
              height: 32,
              animation: "wave-shift 4.5s linear infinite reverse",
              animationDelay: "-1.5s",
              opacity: 0.3,
            }}
          >
            <path
              d="M0,16 C240,32 480,0 720,16 C960,32 1200,0 1440,16 C1680,32 1920,0 2160,16 C2400,32 2640,0 2880,16 L2880,32 L0,32 Z"
              fill="#3b82f6"
            />
          </svg>
        </div>

        {/* Search bar — apre il Concierge digitale */}
        <button
          onClick={onOpenChat}
          className="absolute inset-x-4 bottom-3 z-10 flex items-center gap-3 rounded-full bg-white/95 px-4 py-3 text-left shadow-lg backdrop-blur-sm sm:inset-x-5"
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
      </section>

      {/* ── AZIONI RAPIDE ── */}
      <section>
        {/* Header con "Vedi tutto" */}
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] lg:text-sm">
            {t.home.highlightsLabel}
          </h2>
          <button
            onClick={() => onNavigate("services")}
            className="text-xs font-semibold text-[var(--color-accent)] transition-opacity hover:opacity-70"
          >
            {t.home.highlightsSeeAll}
          </button>
        </div>

        {/* Strip con sfondo chiaro — edge-to-edge su mobile */}
        <div className="-mx-5 sm:-mx-6 lg:mx-0 bg-[var(--color-surface)]">
          {/* scroll-pl-5: dice allo snap di rispettare il padding sx */}
          <div
            className="overflow-x-auto snap-x snap-mandatory scroll-pl-5 sm:scroll-pl-6 lg:scroll-pl-2"
            style={{ scrollbarWidth: "none" }}
          >
            {/* w-max: il flex container è largo quanto il suo contenuto + padding,
                così px-5 funziona correttamente come spazio scrollabile */}
            <div className="flex w-max gap-2.5 py-3.5 px-5 sm:px-6 lg:px-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const label = action.getLabel(t);
              const tileClass =
                "flex shrink-0 flex-col items-center justify-center gap-2 w-[84px] aspect-square rounded-2xl bg-[var(--color-surface-muted)] snap-start transition-all duration-150 active:scale-[0.93] shadow-sm";
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
        </div>
      </section>

      {/* ── ORARI DEI SERVIZI ── */}
      <section>
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)] lg:text-sm">
          {t.home.hoursLabel}
        </h2>
        <HoursTable rows={t.home.hours} />
      </section>
    </div>
  );
}
