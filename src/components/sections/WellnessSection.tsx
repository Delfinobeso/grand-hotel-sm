"use client";

import { Sparkles, Dumbbell, Bike } from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL, SERVICE_HOURS } from "@/lib/hotel";
import {
  SectionHeader,
  SectionLabel,
  ImageBanner,
  QuoteBlock,
  PriceList,
  StatusBadge,
  FloorBadge,
  CallButton,
} from "@/components/ui";

export function WellnessSection({ t }: { t: HotelContent }) {
  const w = t.wellness;
  const f = t.facility;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title={w.label} intro={w.intro} />

      {/* ── Centro Mességué ── */}
      <section className="space-y-3">
        <ImageBanner src="/images/wellness.webp" alt={w.messegueLabel} />
        <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Sparkles size={16} strokeWidth={1.875} />
            </span>
            <FloorBadge>{t.common.floorThird}</FloorBadge>
          </div>
          <h4 className="font-display text-xl font-semibold leading-snug text-[var(--color-text)]">
            {w.messegueLabel}
          </h4>
          <div className="mt-2 space-y-3 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">
            {w.messegue.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        <QuoteBlock quote={`“${w.messegue.quote}”`} author={w.messegue.quoteAuthor} />

        <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
          <p className="mb-3 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">
            {w.messegue.callNote}
          </p>
          <CallButton href={HOTEL.phoneHref} label={t.common.bookLabel} trackLabel="prenota-spa" />
        </div>
      </section>

      {/* ── Listino ── */}
      <section className="space-y-3">
        <SectionLabel>{w.priceListLabel}</SectionLabel>
        <PriceList items={w.massages} />
        <p className="px-1 text-[0.8125rem] leading-relaxed text-[var(--color-text-muted)]">{w.priceListNote}</p>
      </section>

      {/* ── Palestra & bici ── */}
      <section className="space-y-3">
        <SectionLabel>{f.gymBikeLabel}</SectionLabel>

        <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Dumbbell size={16} strokeWidth={1.875} />
            </span>
            <h4 className="flex-1 font-semibold text-[var(--color-text)]">{f.gymLabel}</h4>
            <StatusBadge hours={SERVICE_HOURS.gym} labels={t.common.status} />
          </div>
          <FloorBadge>{t.common.floorThirdMessegue}</FloorBadge>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">{f.gym.body}</p>
        </div>

        <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Bike size={16} strokeWidth={1.875} />
            </span>
            <h4 className="font-semibold text-[var(--color-text)]">{f.bikeLabel}</h4>
          </div>
          <p className="text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">{f.bike.body}</p>
        </div>
      </section>
    </div>
  );
}
