"use client";

import { HeartPulse, Dumbbell, Bike, Phone } from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { HOTEL, SERVICE_HOURS } from "@/lib/hotel";
import { SectionHeader, SectionLabel, IconBadge, Card, QuoteBlock, PriceList, FloorBadge, StatusBadge, CallButton, ImageBanner } from "@/components/ui";

export function WellnessSection({ t }: { t: HotelContent }) {
  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      <ImageBanner src="/images/wellness.webp" alt={t.wellness.label} />
      <SectionHeader title={t.wellness.label} intro={t.wellness.intro} />

      {/* ── CENTRO MESSÉGUÉ ── */}
      <section className="flex flex-col gap-2">
        <SectionLabel>{t.wellness.messegueLabel}</SectionLabel>
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <IconBadge icon={HeartPulse} size={18} />
            <div className="flex flex-wrap items-center gap-2">
              <FloorBadge>{t.common.floorThird}</FloorBadge>
              <StatusBadge hours={SERVICE_HOURS.messegue} labels={t.common.status} />
            </div>
          </div>
          {t.wellness.messegue.paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {p}
            </p>
          ))}
          <QuoteBlock quote={t.wellness.messegue.quote} author={t.wellness.messegue.quoteAuthor} />
          <div className="flex items-center gap-2 border-t border-[var(--color-border)] pt-3 text-sm font-medium text-[var(--color-text)]">
            <Phone size={16} strokeWidth={1.75} className="text-[var(--color-accent)]" />
            {t.wellness.messegue.callNote}
          </div>
          <CallButton href={HOTEL.phoneHref} label={t.common.bookLabel} />
        </Card>
      </section>

      {/* ── LISTINO TRATTAMENTI ── */}
      <section className="flex flex-col gap-2">
        <SectionLabel>{t.wellness.priceListLabel}</SectionLabel>
        <p className="-mt-1 mb-1 px-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.wellness.priceListNote}</p>
        <PriceList items={t.wellness.massages} />
      </section>

      {/* ── PALESTRA & BICI ── */}
      <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
        <Card className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <IconBadge icon={Dumbbell} size={18} />
              <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.wellness.gymLabel}</p>
            </div>
            <StatusBadge hours={SERVICE_HOURS.gym} labels={t.common.status} />
          </div>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.wellness.gym.body}</p>
          <FloorBadge>{t.common.floorThirdMessegue}</FloorBadge>
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <IconBadge icon={Bike} size={18} />
            <p className="text-base font-semibold text-[var(--color-text)] lg:text-lg">{t.wellness.bikeLabel}</p>
          </div>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t.wellness.bike.body}</p>
        </Card>
      </section>
    </div>
  );
}
