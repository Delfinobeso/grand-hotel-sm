"use client";

import { UtensilsCrossed } from "lucide-react";
import type { HotelContent } from "@/lib/content";
import { GHSM_VENUES, SERVICE_HOURS, HOTEL } from "@/lib/hotel";
import {
  SectionHeader,
  SectionLabel,
  HoursTable,
  StatusBadge,
  CardImage,
  CallButton,
  NavigateButton,
} from "@/components/ui";

const VENUE_IMG: Record<string, string> = {
  laTerrazza: "/images/venue-laterrazza.webp",
  caffeTitano: "/images/venue-caffetitano.webp",
  cremeria: "/images/venue-cremeria.webp",
};

export function DiningSection({ t }: { t: HotelContent }) {
  const d = t.dining;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title={d.arengoLabel} intro={d.intro} />

      {/* ── L'Arengo ── */}
      <section className="space-y-3">
        <div className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
          <CardImage src="/images/dining.webp" alt={d.arengoLabel} />
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <UtensilsCrossed size={16} strokeWidth={1.875} />
            </span>
            <StatusBadge hours={SERVICE_HOURS.arengo} labels={t.common.status} />
          </div>
          <div className="space-y-3 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">
            {d.arengo.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="font-medium text-[var(--color-text)]">{d.arengo.reservation}</p>
          </div>
        </div>

        <HoursTable rows={d.arengo.hours} />

        <CallButton href={HOTEL.phoneHref} label={t.common.bookLabel} />
      </section>

      {/* ── GHSM Group venues ── */}
      <section className="space-y-3">
        <SectionLabel>{d.groupLabel}</SectionLabel>
        <p className="px-1 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">{d.groupIntro}</p>

        {d.venues.map((v) => {
          const pin = GHSM_VENUES.find((p) => p.id === v.id);
          return (
            <div key={v.id} className="rounded-2xl bg-[var(--color-surface)] px-4 py-4 lg:px-5 lg:py-5">
              {VENUE_IMG[v.id] && <CardImage src={VENUE_IMG[v.id]} alt={v.name} />}
              <h4 className="font-display text-xl font-semibold text-[var(--color-text)]">{v.name}</h4>
              {pin?.walkMinutes && (
                <p className="mt-0.5 text-[0.8125rem] text-[var(--color-text-muted)]">
                  {pin.walkMinutes} {t.common.minWalk}
                </p>
              )}
              <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--color-text-secondary)]">{v.body}</p>
              {pin && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <NavigateButton lat={pin.lat} lon={pin.lon} name={v.name} label={t.common.openInMapsLabel} />
                  {pin.phoneHref && (
                    <CallButton href={pin.phoneHref} label={t.common.callLabel} variant="outline" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
