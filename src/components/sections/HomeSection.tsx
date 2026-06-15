"use client";

import { BedDouble, Users, HeartPulse, UtensilsCrossed, Clock } from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { SectionLabel, HighlightCard, HoursTable } from "@/components/ui";

const HIGHLIGHT_ICONS = [BedDouble, Users, HeartPulse, UtensilsCrossed];

export function HomeSection({ t }: { t: HotelContent }) {
  return (
    <div className="flex flex-col gap-7 md:gap-5 lg:gap-6 xl:gap-8">
      {/* ── STAY CARD ── */}
      <section className="rounded-3xl bg-[var(--color-accent)] px-5 py-5 text-[var(--color-on-accent)] lg:px-6 lg:py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">{t.home.stayLabel}</p>
        <h1 className="mt-2 text-xl font-bold leading-snug lg:text-2xl">{t.home.welcomeTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed opacity-90 lg:text-base">{t.home.welcomeBody}</p>
        <div className="mt-4 flex flex-col gap-2 border-t border-white/15 pt-4 text-sm opacity-90 sm:flex-row sm:items-center sm:gap-6">
          <span className="flex items-center gap-2">
            <Clock size={16} strokeWidth={1.75} />
            {t.home.checkIn.label}: {t.home.checkIn.value}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={16} strokeWidth={1.75} />
            {t.home.checkOut.label}: {t.home.checkOut.value}
          </span>
        </div>
        <p className="mt-2 text-xs opacity-70">{t.home.lateCheckout}</p>
      </section>

      {/* ── IN BREVE ── */}
      <section>
        <SectionLabel>{t.home.highlightsLabel}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3">
          {t.home.highlights.map((highlight, i) => (
            <HighlightCard key={highlight.title} icon={HIGHLIGHT_ICONS[i]} title={highlight.title} body={highlight.body} />
          ))}
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
