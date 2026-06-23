"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  Coffee,
  Phone,
  Tv,
  Clock,
  LogIn,
  DoorOpen,
  Sparkles,
  ConciergeBell,
  UtensilsCrossed,
  BellRing,
  Dumbbell,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL, SERVICE_HOURS } from "@/lib/hotel";
import { SectionLabel, CopyField, CallButton, HoursTable, StatusBadge, EASE_EXPO } from "@/components/ui";
import type { TabKey } from "@/lib/nav";
import type { ServiceHours } from "@/lib/hours";

/* ── GHSM Group strip ── */
const GROUP: { name: string; sub: string; img: string; tab: TabKey }[] = [
  { name: "Centro Mességué", sub: "Benessere", img: "/images/wellness.webp", tab: "wellness" },
  { name: "Ristorante La Terrazza", sub: "Ristorante", img: "/images/venue-laterrazza.webp", tab: "dining" },
  { name: "Caffè Titano", sub: "Caffè", img: "/images/venue-caffetitano.webp", tab: "dining" },
  { name: "La Cremeria del Titano", sub: "Gelateria", img: "/images/venue-cremeria.webp", tab: "dining" },
  { name: "Titano Suites", sub: "Suites", img: "/images/suite.webp", tab: "explore" },
];

function LiveRow({
  icon: Icon,
  label,
  hours,
  status,
}: {
  icon: LucideIcon;
  label: string;
  hours: ServiceHours;
  status: HotelContent["common"]["status"];
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <Icon size={15} strokeWidth={1.875} />
      </span>
      <span className="flex-1 text-[0.95rem] font-medium text-[var(--color-text)]">{label}</span>
      <StatusBadge hours={hours} labels={status} />
    </div>
  );
}

export function OggiSection({
  t,
  onOpenChat,
  onNavigate,
}: {
  t: HotelContent;
  onOpenChat: () => void;
  onNavigate: (tab: TabKey) => void;
}) {
  const h = t.home;
  const [active, setActive] = useState<string | null>(null);

  const quick: { id: string; icon: LucideIcon; label: string; detail: React.ReactNode }[] = [
    {
      id: "wifi",
      icon: Wifi,
      label: h.quick.wifi.label,
      detail: (
        <>
          <CopyField value={h.quick.wifi.value} copiedLabel={h.quick.wifi.copyDone} />
          <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]">{h.quick.wifi.note}</p>
        </>
      ),
    },
    {
      id: "breakfast",
      icon: Coffee,
      label: h.quick.breakfast.label,
      detail: <p className="text-[0.9rem] leading-relaxed text-[var(--color-text-secondary)]">{h.quick.breakfast.note}</p>,
    },
    {
      id: "reception",
      icon: Phone,
      label: h.quick.reception.label,
      detail: (
        <>
          <p className="mb-3 text-[0.9rem] leading-relaxed text-[var(--color-text-secondary)]">{h.quick.reception.note}</p>
          <CallButton href={HOTEL.phoneHref} label={t.common.receptionCta} />
        </>
      ),
    },
    {
      id: "tv",
      icon: Tv,
      label: h.quick.tv.label,
      detail: (
        <>
          <p className="mb-3 text-[0.9rem] leading-relaxed text-[var(--color-text-secondary)]">{h.quick.tv.note}</p>
          <button
            onClick={() => onNavigate("hotel")}
            className="inline-flex items-center gap-1 text-[0.9375rem] font-semibold text-[var(--color-accent)]"
          >
            {h.quick.tv.cta}
            <ChevronRight size={16} strokeWidth={2.25} />
          </button>
        </>
      ),
    },
  ];
  const activeDetail = quick.find((q) => q.id === active)?.detail;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Hero ── */}
      <section className="relative -mx-5 -mt-5 overflow-hidden md:-mx-6 md:-mt-6 lg:mx-0 lg:mt-0 lg:rounded-3xl">
        <picture>
          <source srcSet="/images/hero-sm.webp" media="(max-width: 640px)" />
          <img
            src="/images/hero.webp"
            alt=""
            aria-hidden
            className="animate-hero-zoom absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, oklch(0% 0 0 / 0.22) 0%, transparent 26%, transparent 52%, oklch(0% 0 0 / 0.55) 100%)",
          }}
        />
        <div className="relative flex min-h-[clamp(280px,48svh,420px)] flex-col items-center justify-end gap-1.5 px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))] text-center lg:px-9 lg:pb-10">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/85">{h.eyebrow}</p>
          <h2 className="font-display text-[2.25rem] font-semibold leading-[1.04] text-white lg:text-[3rem]">
            {h.titleMain}
            <br />
            {h.titleAccent}
          </h2>
        </div>
      </section>

      {/* ── GHSM Group strip ── */}
      <section>
        <SectionLabel>{h.groupLabel}</SectionLabel>
        <div className="-mx-5 overflow-x-auto scroll-pl-5 md:-mx-6 md:scroll-pl-6 lg:mx-0 lg:scroll-pl-0">
          <ul className="flex w-max gap-3 px-5 md:px-6 lg:px-0">
            {GROUP.map((g) => (
              <li key={g.name} className="w-40 shrink-0">
                <button
                  onClick={() => onNavigate(g.tab)}
                  className="group block w-full text-left"
                >
                  <div className="overflow-hidden rounded-2xl bg-[var(--color-surface-muted)]">
                    <img
                      src={g.img}
                      alt={g.name}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-2 text-[0.9rem] font-semibold leading-snug text-[var(--color-text)]">{g.name}</p>
                  <p className="text-[0.8rem] text-[var(--color-text-muted)]">{g.sub}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Il vostro soggiorno ── */}
      <section>
        <SectionLabel>{h.stayLabel}</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <LogIn size={17} strokeWidth={1.875} />
            </span>
            <p className="mt-2.5 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              {h.checkIn.label}
            </p>
            <p className="text-[0.95rem] font-semibold text-[var(--color-text)]">{h.checkIn.value}</p>
          </div>
          <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <DoorOpen size={17} strokeWidth={1.875} />
            </span>
            <p className="mt-2.5 text-[0.8125rem] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              {h.checkOut.label}
            </p>
            <p className="text-[0.95rem] font-semibold text-[var(--color-text)]">{h.checkOut.value}</p>
          </div>
        </div>
        <p className="mt-2 px-1 text-[0.8125rem] text-[var(--color-text-muted)]">{h.lateCheckout}</p>
      </section>

      {/* ── Azioni rapide (circular + inline detail) ── */}
      <section>
        <SectionLabel>{h.quickLabel}</SectionLabel>
        <div className="grid grid-cols-4 gap-2">
          {quick.map((q) => {
            const on = active === q.id;
            const Icon = q.icon;
            return (
              <button
                key={q.id}
                onClick={() => setActive(on ? null : q.id)}
                aria-expanded={on}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={`flex items-center justify-center rounded-full transition-colors duration-200 ${
                    on
                      ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
                      : "bg-[var(--color-surface)] text-[var(--color-accent)]"
                  }`}
                  style={{ height: "3.5rem", width: "3.5rem" }}
                >
                  <Icon size={22} strokeWidth={1.875} />
                </span>
                <span className="text-center text-[0.75rem] font-medium leading-tight text-[var(--color-text-secondary)]">
                  {q.label}
                </span>
              </button>
            );
          })}
        </div>
        <AnimatePresence initial={false}>
          {activeDetail && (
            <motion.div
              key={active}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_EXPO }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">{activeDetail}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Concierge ── */}
      <section>
        <button
          onClick={onOpenChat}
          className="flex w-full items-center gap-4 rounded-2xl bg-[var(--color-accent)] px-5 py-4 text-left transition-[transform,opacity] duration-200 ease-out hover:opacity-95 active:scale-[0.99]"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-[var(--color-on-accent)]">
            <ConciergeBell size={21} strokeWidth={1.75} />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-success)]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-[var(--color-on-accent)]">{h.askLabel}</span>
            <span className="mt-0.5 block text-[0.875rem] leading-snug text-[var(--color-on-accent)]/80">{h.askBody}</span>
          </span>
          <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-[var(--color-on-accent)]/70" />
        </button>
      </section>

      {/* ── In questo momento ── */}
      <section>
        <SectionLabel>{h.nowLabel}</SectionLabel>
        <div className="rounded-2xl bg-[var(--color-surface)] px-4 lg:px-5">
          <div className="divide-y divide-[var(--color-border)]">
            <LiveRow icon={Phone} label="Reception" hours={SERVICE_HOURS.reception} status={t.common.status} />
            <LiveRow icon={UtensilsCrossed} label={t.dining.arengoLabel} hours={SERVICE_HOURS.arengo} status={t.common.status} />
            <LiveRow icon={BellRing} label={t.room.roomServiceLabel} hours={SERVICE_HOURS.roomService} status={t.common.status} />
            <LiveRow icon={Sparkles} label={t.wellness.messegueLabel} hours={SERVICE_HOURS.messegue} status={t.common.status} />
            <LiveRow icon={Dumbbell} label={t.facility.gymLabel} hours={SERVICE_HOURS.gym} status={t.common.status} />
          </div>
        </div>
      </section>

      {/* ── Orari ── */}
      <section>
        <div className="mb-3 flex items-center gap-2 px-1">
          <Clock size={15} strokeWidth={2} className="text-[var(--color-text-muted)]" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            {h.hoursLabel}
          </h3>
        </div>
        <HoursTable rows={h.hours} />
      </section>
    </div>
  );
}
