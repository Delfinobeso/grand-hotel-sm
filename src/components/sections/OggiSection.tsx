"use client";

import {
  Wifi,
  Coffee,
  DoorOpen,
  Phone,
  Tv,
  Clock,
  LogIn,
  Sparkles,
  UtensilsCrossed,
  BellRing,
  Dumbbell,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL, SERVICE_HOURS } from "@/lib/hotel";
import {
  SectionLabel,
  QuickAnswer,
  CopyField,
  CallButton,
  HoursTable,
  StatusBadge,
} from "@/components/ui";
import type { TabKey } from "@/lib/nav";
import type { ServiceHours } from "@/lib/hours";

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

  return (
    <div className="flex flex-col gap-8">
      {/* ── Hero ── brand moment */}
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
              "linear-gradient(180deg, oklch(0.2 0.05 258 / 0.35) 0%, oklch(0.2 0.05 258 / 0.2) 38%, var(--hero-tint) 100%)",
          }}
        />
        <div className="relative flex min-h-[clamp(320px,56svh,460px)] flex-col justify-end gap-4 px-6 pb-7 pt-[max(2rem,env(safe-area-inset-top))] lg:px-9 lg:pb-9">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/80">
              {h.eyebrow}
            </p>
            <h1 className="mt-1.5 font-display text-[2.25rem] font-semibold leading-[1.05] text-white lg:text-[3rem]">
              {h.titleMain}
              <br />
              {h.titleAccent}
            </h1>
          </div>
          <p className="max-w-md text-[0.95rem] leading-relaxed text-white/85">{h.welcomeBody}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[0.8125rem] font-medium text-white backdrop-blur-sm">
              <LogIn size={14} strokeWidth={2} />
              {h.checkIn.label}: {h.checkIn.value}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[0.8125rem] font-medium text-white backdrop-blur-sm">
              <DoorOpen size={14} strokeWidth={2} />
              {h.checkOut.label}: {h.checkOut.value}
            </span>
          </div>
        </div>
      </section>

      {/* ── Quick answers ── the first-30-seconds needs */}
      <section>
        <SectionLabel>{h.quickLabel}</SectionLabel>
        <div className="flex flex-col gap-2">
          <QuickAnswer icon={Wifi} label={h.quick.wifi.label} preview={h.quick.wifi.value}>
            <CopyField value={h.quick.wifi.value} copiedLabel={h.quick.wifi.copyDone} />
            <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]">
              {h.quick.wifi.note}
            </p>
          </QuickAnswer>

          <QuickAnswer icon={Coffee} label={h.quick.breakfast.label} preview="07:00 – 10:00">
            <p className="text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]">
              {h.quick.breakfast.note}
            </p>
          </QuickAnswer>

          <QuickAnswer icon={DoorOpen} label={h.quick.checkout.label} preview={h.checkOut.value}>
            <p className="text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]">
              {h.quick.checkout.note}
            </p>
          </QuickAnswer>

          <QuickAnswer icon={Phone} label={h.quick.reception.label} preview="24h · 9">
            <p className="mb-3 text-[0.875rem] leading-relaxed text-[var(--color-text-secondary)]">
              {h.quick.reception.note}
            </p>
            <CallButton href={HOTEL.phoneHref} label={t.common.receptionCta} />
          </QuickAnswer>

          <QuickAnswer icon={Tv} label={h.quick.tv.label} preview={h.quick.tv.note}>
            <button
              onClick={() => onNavigate("hotel")}
              className="inline-flex items-center gap-1 text-[0.9375rem] font-semibold text-[var(--color-accent)]"
            >
              {h.quick.tv.cta}
              <ChevronRight size={16} strokeWidth={2.25} />
            </button>
          </QuickAnswer>
        </div>
      </section>

      {/* ── Concierge entry ── */}
      <section>
        <button
          onClick={onOpenChat}
          className="flex w-full items-center gap-4 rounded-2xl bg-[var(--color-accent)] px-5 py-4 text-left transition-[transform,opacity] duration-200 ease-out hover:opacity-95 active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-[var(--color-on-accent)]">
            <Sparkles size={20} strokeWidth={1.75} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-[var(--color-on-accent)]">{h.askLabel}</span>
            <span className="mt-0.5 block text-[0.875rem] leading-snug text-[var(--color-on-accent)]/80">
              {h.askBody}
            </span>
          </span>
          <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-[var(--color-on-accent)]/70" />
        </button>
      </section>

      {/* ── Live status ── */}
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

      {/* ── Full hours ── */}
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
